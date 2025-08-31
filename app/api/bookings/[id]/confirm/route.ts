import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendBookingConfirmationEmail } from '@/lib/gmail'
import { updateCalendarEventWithBookingTotals, createCalendarEvent } from '@/lib/calendar'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params

    // Obtener la reserva con todos los detalles
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        event: true,
        tickets: true,
        customer: true,
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Verificar si ya se envió el email
    if (booking.confirmationSent) {
      return NextResponse.json({
        message: 'Confirmation already sent',
        emailSent: false,
        calendarUpdated: false
      })
    }

    let emailSent = false
    let calendarUpdated = false

    // 1. Actualizar estado del pago
    await db.booking.update({
      where: { id: bookingId },
      data: {
        paymentStatus: 'completed',
      },
    })

    // 2. Actualizar tickets disponibles del evento
    await db.event.update({
      where: { id: booking.event.id },
      data: {
        availableTickets: { decrement: booking.quantity },
      },
    })
    console.log(`✅ Tickets actualizados: -${booking.quantity} para evento ${booking.event.title}`)

    // 3. Actualizar estadísticas del cliente
    await db.customer.update({
      where: { id: booking.customer.id },
      data: {
        totalBookings: { increment: 1 },
        totalSpent: { increment: booking.totalAmount },
      },
    })

    // 4. Enviar email de confirmación
    try {
      console.log('Enviando email de confirmación a:', booking.customerEmail)
      emailSent = await sendBookingConfirmationEmail(booking)
      
      if (emailSent) {
        await db.booking.update({
          where: { id: bookingId },
          data: { confirmationSent: true },
        })
        console.log('✅ Email de confirmación enviado')
      }
    } catch (error) {
      console.error('Error enviando email:', error)
    }

    // 5. Crear/actualizar evento en calendario
    try {
      if (booking.event.calendarEventId) {
        // Si el evento ya existe, actualizar con totales
        // Obtener el evento actualizado con los nuevos totales
        const updatedEvent = await db.event.findUnique({
          where: { id: booking.eventId },
        })
        
        if (updatedEvent) {
          const totalTicketsSold = updatedEvent.capacity - updatedEvent.availableTickets
          await updateCalendarEventWithBookingTotals(
            booking.event.calendarEventId,
            {
              title: booking.event.title,
              totalTicketsSold,
              availableTickets: updatedEvent.availableTickets,
              capacity: updatedEvent.capacity,
              attendeeEmail: booking.customerEmail,
              attendeeName: booking.customerName,
            }
          )
          calendarUpdated = true
          console.log('✅ Calendario actualizado con totales')
        }
      } else {
        // Crear nuevo evento en calendario si no existe
        // Construir fecha y hora del evento
        const eventDate = new Date(booking.event.date)
        const [hours, minutes] = booking.event.time.split(':').map(Number)
        
        // Establecer hora en UTC correctamente
        const year = eventDate.getFullYear()
        const month = eventDate.getMonth()
        const day = eventDate.getDate()
        
        const startDateTime = new Date(year, month, day, hours, minutes, 0)
        const endDateTime = new Date(startDateTime)
        endDateTime.setMinutes(endDateTime.getMinutes() + (booking.event.duration || 120)) // duración en minutos
        
        // Primera reserva del evento, crear con totales iniciales
        const updatedEvent = await db.event.findUnique({
          where: { id: booking.eventId },
        })
        
        const totalTicketsSold = updatedEvent ? updatedEvent.capacity - updatedEvent.availableTickets : booking.quantity
        const calendarEvent = await createCalendarEvent({
          eventId: booking.event.id,
          title: `${booking.event.title} - ${totalTicketsSold}/${booking.event.capacity} tickets vendidos`,
          description: `📊 Tickets vendidos: ${totalTicketsSold}/${booking.event.capacity} | Disponibles: ${updatedEvent?.availableTickets || booking.event.availableTickets}\n\n${booking.event.description || ''}\nUbicación: ${booking.event.location}`,
          location: booking.event.location,
          startDateTime: startDateTime.toISOString(),
          endDateTime: endDateTime.toISOString(),
          attendees: [booking.customerEmail]
        })
        
        if (calendarEvent?.success && calendarEvent.calendarEventId) {
          await db.event.update({
            where: { id: booking.event.id },
            data: { calendarEventId: calendarEvent.calendarEventId },
          })
          calendarUpdated = true
          console.log('✅ Evento creado en calendario:', calendarEvent.calendarEventId)
        }
      }
    } catch (error) {
      console.error('Error con calendario:', error)
    }

    return NextResponse.json({
      success: true,
      message: 'Booking confirmed successfully',
      emailSent,
      calendarUpdated,
      booking: {
        bookingCode: booking.bookingCode,
        customerEmail: booking.customerEmail,
      }
    })

  } catch (error) {
    console.error('Error confirming booking:', error)
    return NextResponse.json(
      { error: 'Error processing confirmation' },
      { status: 500 }
    )
  }
}