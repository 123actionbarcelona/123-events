import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/db'
import { generateBookingCode, generateTicketCode } from '@/lib/utils'

const checkoutSchema = z.object({
  eventId: z.string(),
  customerName: z.string().min(2),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
  quantity: z.number().min(1).max(8),
  notes: z.string().optional(),
  customFormData: z.record(z.any()).optional(),
})

export async function POST(request: NextRequest) {
  // Check if Stripe is configured
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe is not configured' },
      { status: 503 }
    )
  }

  try {
    const body = await request.json()
    console.log('Checkout request body:', body)
    
    // Validar manualmente si hay problemas con Zod
    let validatedData
    try {
      validatedData = checkoutSchema.parse(body)
    } catch (zodError) {
      console.error('Zod validation error:', zodError)
      // Validación manual de fallback
      if (!body.eventId || !body.customerName || !body.customerEmail || !body.quantity) {
        return NextResponse.json(
          { error: 'Datos de reserva incompletos' },
          { status: 400 }
        )
      }
      validatedData = {
        eventId: body.eventId,
        customerName: body.customerName,
        customerEmail: body.customerEmail,
        customerPhone: body.customerPhone || '',
        quantity: Number(body.quantity),
        notes: body.notes || '',
        customFormData: body.customFormData || {}
      }
    }

    // Verificar que el evento existe y está disponible
    const event = await db.event.findUnique({
      where: { id: validatedData.eventId },
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      )
    }

    if (event.status !== 'active') {
      return NextResponse.json(
        { error: 'Evento no disponible' },
        { status: 400 }
      )
    }

    if (event.availableTickets < validatedData.quantity) {
      return NextResponse.json(
        { error: 'No hay suficientes tickets disponibles' },
        { status: 400 }
      )
    }

    // Crear o encontrar el cliente
    let customer = await db.customer.findUnique({
      where: { email: validatedData.customerEmail },
    })

    if (!customer) {
      customer = await db.customer.create({
        data: {
          email: validatedData.customerEmail,
          name: validatedData.customerName,
          phone: validatedData.customerPhone || null,
        },
      })
    } else {
      // Actualizar información del cliente si es necesario
      await db.customer.update({
        where: { id: customer.id },
        data: {
          name: validatedData.customerName,
          phone: validatedData.customerPhone || customer.phone,
        },
      })
    }

    // Generar código de reserva único
    const bookingCode = generateBookingCode()

    // Crear reserva pendiente
    const booking = await db.booking.create({
      data: {
        bookingCode,
        eventId: validatedData.eventId,
        customerName: validatedData.customerName,
        customerEmail: validatedData.customerEmail,
        customerPhone: validatedData.customerPhone || null,
        quantity: validatedData.quantity,
        totalAmount: event.price * validatedData.quantity,
        paymentStatus: 'pending',
      },
    })

    // Crear tickets pendientes
    const tickets = []
    for (let i = 0; i < validatedData.quantity; i++) {
      const ticketCode = generateTicketCode(bookingCode, i)
      const ticket = await db.ticket.create({
        data: {
          ticketCode,
          bookingId: booking.id,
          status: 'valid',
        },
      })
      tickets.push(ticket)
    }

    // Guardar respuestas del formulario personalizado si existen
    if (validatedData.customFormData && Object.keys(validatedData.customFormData).length > 0) {
      // Obtener los campos del formulario para este evento
      const formFields = await db.eventFormField.findMany({
        where: {
          eventId: validatedData.eventId,
          active: true,
        },
      })

      // Guardar cada respuesta
      for (const field of formFields) {
        const value = validatedData.customFormData[field.fieldName]
        if (value !== undefined && value !== null && value !== '') {
          await db.formFieldResponse.create({
            data: {
              bookingId: booking.id,
              fieldId: field.id,
              value: Array.isArray(value) ? JSON.stringify(value) : String(value),
            },
          })
        }
      }
    }

    // Actualizar tickets disponibles temporalmente
    await db.event.update({
      where: { id: validatedData.eventId },
      data: {
        availableTickets: {
          decrement: validatedData.quantity,
        },
      },
    })

    // Crear sesión de Stripe Checkout
    // Construir URL completa para la imagen
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
    const imageUrl = event.imageUrl 
      ? event.imageUrl.startsWith('http') 
        ? event.imageUrl 
        : `${baseUrl}${event.imageUrl}`
      : null
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: event.title,
              description: `${validatedData.quantity} ticket(s) para ${event.title}`,
              images: imageUrl ? [imageUrl] : [],
              metadata: {
                eventId: event.id,
                bookingId: booking.id,
              },
            },
            unit_amount: Math.round(event.price * 100), // Stripe usa centavos
          },
          quantity: validatedData.quantity,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/booking/success?session_id={CHECKOUT_SESSION_ID}&booking_id=${booking.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/events/${event.id}?canceled=true`,
      customer_email: validatedData.customerEmail,
      metadata: {
        eventId: event.id,
        bookingId: booking.id,
        bookingCode: booking.bookingCode,
      },
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutos
      automatic_tax: {
        enabled: false,
      },
    })

    // Actualizar reserva con session ID
    await db.booking.update({
      where: { id: booking.id },
      data: {
        stripeSessionId: session.id,
      },
    })

    return NextResponse.json({
      sessionId: session.id,
      checkoutUrl: session.url,
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
    })

  } catch (error) {
    console.error('Error creating Stripe checkout session:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}