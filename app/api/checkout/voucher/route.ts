import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/db'
import { generateBookingCode, generateTicketCode } from '@/lib/utils'

const voucherCheckoutSchema = z.object({
  eventId: z.string(),
  customerName: z.string().min(2),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
  quantity: z.number().min(1).max(8),
  notes: z.string().optional(),
  voucherCode: z.string().min(1),
  customFormData: z.record(z.any()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = voucherCheckoutSchema.parse(body)

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

    // Verificar el vale regalo
    const voucher = await db.giftVoucher.findUnique({
      where: { code: validatedData.voucherCode },
    })

    if (!voucher) {
      return NextResponse.json(
        { error: 'Código de vale inválido' },
        { status: 400 }
      )
    }

    if (voucher.status !== 'active') {
      return NextResponse.json(
        { error: 'El vale no está activo' },
        { status: 400 }
      )
    }

    if (voucher.expiryDate && new Date() > voucher.expiryDate) {
      return NextResponse.json(
        { error: 'El vale ha expirado' },
        { status: 400 }
      )
    }

    if (voucher.currentBalance <= 0) {
      return NextResponse.json(
        { error: 'El vale no tiene saldo disponible' },
        { status: 400 }
      )
    }

    const totalAmount = event.price * validatedData.quantity
    const voucherAmount = Math.min(voucher.currentBalance, totalAmount)
    const remainingAmount = totalAmount - voucherAmount

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
    }

    // Generar código de reserva único
    const bookingCode = generateBookingCode()

    // Si el vale cubre todo el importe, completar directamente
    if (remainingAmount <= 0) {
      // Crear reserva confirmada
      const booking = await db.booking.create({
        data: {
          bookingCode,
          eventId: validatedData.eventId,
          customerName: validatedData.customerName,
          customerEmail: validatedData.customerEmail,
          customerPhone: validatedData.customerPhone || null,
          quantity: validatedData.quantity,
          totalAmount,
          voucherAmount,
          stripeAmount: 0,
          paymentStatus: 'paid',
          paymentMethod: 'voucher',
        },
      })

      // Crear tickets confirmados
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
        const formFields = await db.eventFormField.findMany({
          where: {
            eventId: validatedData.eventId,
            active: true,
          },
        })

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

      // Actualizar tickets disponibles
      await db.event.update({
        where: { id: validatedData.eventId },
        data: {
          availableTickets: {
            decrement: validatedData.quantity,
          },
        },
      })

      // Crear redención del vale
      await db.voucherRedemption.create({
        data: {
          voucherId: voucher.id,
          bookingId: booking.id,
          amountUsed: voucherAmount,
          redeemedAt: new Date(),
        },
      })

      // Actualizar balance del vale
      await db.giftVoucher.update({
        where: { id: voucher.id },
        data: {
          currentBalance: voucher.currentBalance - voucherAmount,
          status: voucher.currentBalance - voucherAmount <= 0 ? 'redeemed' : 'active',
        },
      })

      // Actualizar estadísticas del cliente
      await db.customer.update({
        where: { id: customer.id },
        data: {
          totalBookings: {
            increment: 1,
          },
          totalSpent: {
            increment: totalAmount,
          },
        },
      })

      // Verificar si el evento está agotado
      const remainingTickets = await db.event.findUnique({
        where: { id: validatedData.eventId },
        select: { availableTickets: true },
      })

      if (remainingTickets && remainingTickets.availableTickets <= 0) {
        await db.event.update({
          where: { id: validatedData.eventId },
          data: { status: 'soldout' },
        })
      }

      // IMPORTANTE: Enviar email de confirmación y crear evento en calendario
      // Obtener la reserva completa con todos los datos necesarios
      const fullBooking = await db.booking.findUnique({
        where: { id: booking.id },
        include: {
          event: true,
          tickets: true,
          customer: true,
        },
      })

      if (fullBooking) {
        // Enviar email de confirmación
        try {
          const { sendBookingConfirmationEmail } = await import('@/lib/gmail')
          const emailSent = await sendBookingConfirmationEmail(fullBooking)
          if (emailSent) {
            await db.booking.update({
              where: { id: booking.id },
              data: { confirmationSent: true },
            })
            console.log('✅ Email de confirmación enviado (pago con voucher)')
          }
        } catch (emailError) {
          console.error('Error enviando email:', emailError)
        }

        // Crear evento en calendario
        try {
          const { createCalendarEvent, updateCalendarEventWithBookingTotals } = await import('@/lib/calendar')
          
          if (fullBooking.event.calendarEventId) {
            // Si el evento ya existe, actualizar con totales
            const totalTicketsSold = fullBooking.event.capacity - fullBooking.event.availableTickets
            await updateCalendarEventWithBookingTotals(
              fullBooking.event.calendarEventId,
              {
                title: fullBooking.event.title,
                totalTicketsSold,
                availableTickets: fullBooking.event.availableTickets,
                capacity: fullBooking.event.capacity,
                attendeeEmail: fullBooking.customerEmail,
                attendeeName: fullBooking.customerName,
              }
            )
            console.log('✅ Calendario actualizado con totales (pago con voucher)')
          } else {
            // Crear nuevo evento en calendario si no existe
            const eventDate = new Date(fullBooking.event.date)
            const [hours, minutes] = fullBooking.event.time.split(':').map(Number)
            const year = eventDate.getFullYear()
            const month = eventDate.getMonth()
            const day = eventDate.getDate()
            
            const startDateTime = new Date(year, month, day, hours, minutes, 0)
            const endDateTime = new Date(startDateTime)
            endDateTime.setMinutes(endDateTime.getMinutes() + (fullBooking.event.duration || 120))
            
            const totalTicketsSold = fullBooking.event.capacity - fullBooking.event.availableTickets
            const calendarEvent = await createCalendarEvent({
              eventId: fullBooking.event.id,
              title: `${fullBooking.event.title} - ${totalTicketsSold}/${fullBooking.event.capacity} tickets vendidos`,
              description: `📊 Tickets vendidos: ${totalTicketsSold}/${fullBooking.event.capacity} | Disponibles: ${fullBooking.event.availableTickets}\n\n${fullBooking.event.description || ''}\nUbicación: ${fullBooking.event.location}`,
              location: fullBooking.event.location,
              startDateTime: startDateTime.toISOString(),
              endDateTime: endDateTime.toISOString(),
              attendees: [fullBooking.customerEmail]
            })
            
            if (calendarEvent?.success && calendarEvent.calendarEventId) {
              await db.event.update({
                where: { id: fullBooking.event.id },
                data: { calendarEventId: calendarEvent.calendarEventId },
              })
              console.log('✅ Evento creado en calendario (pago con voucher)')
            }
          }
        } catch (calendarError) {
          console.error('Error con calendario:', calendarError)
        }
      }

      return NextResponse.json({
        success: true,
        bookingId: booking.id,
        bookingCode: booking.bookingCode,
        voucherUsed: voucherAmount,
        remainingVoucherBalance: voucher.currentBalance - voucherAmount,
        paymentCompleted: true,
        redirectUrl: `/booking/success?booking_id=${booking.id}`,
      })
    } else {
      // Pago mixto: vale + tarjeta
      if (!stripe) {
        return NextResponse.json(
          { error: 'Stripe no configurado para pagos mixtos' },
          { status: 503 }
        )
      }

      // Crear reserva pendiente
      const booking = await db.booking.create({
        data: {
          bookingCode,
          eventId: validatedData.eventId,
          customerName: validatedData.customerName,
          customerEmail: validatedData.customerEmail,
          customerPhone: validatedData.customerPhone || null,
          quantity: validatedData.quantity,
          totalAmount,
          voucherAmount: 0, // Se actualizará después del pago
          stripeAmount: 0, // Se actualizará después del pago
          paymentStatus: 'pending',
          paymentMethod: 'mixed',
        },
      })

      // Crear tickets pendientes
      for (let i = 0; i < validatedData.quantity; i++) {
        const ticketCode = generateTicketCode(bookingCode, i)
        await db.ticket.create({
          data: {
            ticketCode,
            bookingId: booking.id,
            status: 'valid',
          },
        })
      }

      // Guardar respuestas del formulario personalizado si existen  
      if (validatedData.customFormData && Object.keys(validatedData.customFormData).length > 0) {
        const formFields = await db.eventFormField.findMany({
          where: {
            eventId: validatedData.eventId,
            active: true,
          },
        })

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

      // Reservar tickets temporalmente
      await db.event.update({
        where: { id: validatedData.eventId },
        data: {
          availableTickets: {
            decrement: validatedData.quantity,
          },
        },
      })

      // Crear sesión de Stripe solo por el monto restante
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: `${event.title} (Pago parcial)`,
                description: `${validatedData.quantity} ticket(s). Vale aplicado: €${voucherAmount.toFixed(2)}`,
              },
              unit_amount: Math.round(remainingAmount * 100),
            },
            quantity: 1,
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
          voucherId: voucher.id,
          voucherCode: voucher.code,
          voucherAmount: voucherAmount.toString(),
        },
        expires_at: Math.floor(Date.now() / 1000) + (30 * 60),
      })

      // Actualizar reserva con session ID
      await db.booking.update({
        where: { id: booking.id },
        data: {
          stripeSessionId: session.id,
        },
      })

      return NextResponse.json({
        success: true,
        bookingId: booking.id,
        bookingCode: booking.bookingCode,
        voucherUsed: voucherAmount,
        remainingAmount,
        sessionId: session.id,
        checkoutUrl: session.url,
        paymentCompleted: false,
      })
    }

  } catch (error) {
    console.error('Error processing voucher checkout:', error)
    
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