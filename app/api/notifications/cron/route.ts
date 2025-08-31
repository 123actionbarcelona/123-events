import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendBookingReminderEmail } from '@/lib/gmail'

export async function POST(request: NextRequest) {
  try {
    // Verificar que es una llamada de cron autorizada
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    console.log('Ejecutando notificaciones programadas...')

    // Obtener reservas que necesitan recordatorio (24 horas antes del evento)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const dayAfterTomorrow = new Date(tomorrow)
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1)

    const bookingsForReminder = await db.booking.findMany({
      where: {
        paymentStatus: 'completed',
        event: {
          date: {
            gte: tomorrow,
            lt: dayAfterTomorrow,
          },
        },
        reminderSent: false,
      },
      include: {
        event: true,
        customer: true,
        tickets: true,
      },
    })

    console.log(`Encontradas ${bookingsForReminder.length} reservas para recordatorio`)

    let remindersSent = 0
    let remindersFailed = 0

    // Enviar recordatorios
    for (const booking of bookingsForReminder) {
      try {
        const success = await sendBookingReminderEmail(booking)
        
        if (success) {
          // Marcar como enviado
          await db.booking.update({
            where: { id: booking.id },
            data: { reminderSent: true },
          })
          remindersSent++
          console.log(`Recordatorio enviado para reserva ${booking.bookingCode}`)
        } else {
          remindersFailed++
          console.error(`Error enviando recordatorio para reserva ${booking.bookingCode}`)
        }
      } catch (error) {
        remindersFailed++
        console.error(`Error procesando recordatorio para reserva ${booking.bookingCode}:`, error)
      }
    }

    // Obtener eventos que necesitan recordatorio de bajo inventario
    const lowInventoryEvents = await db.event.findMany({
      where: {
        status: 'active',
        date: {
          gte: new Date(), // Solo eventos futuros
        },
      },
      include: {
        _count: {
          select: { bookings: true }
        }
      }
    })

    let lowInventoryAlerts = 0

    for (const event of lowInventoryEvents) {
      const bookedTickets = await db.booking.aggregate({
        where: {
          eventId: event.id,
          paymentStatus: 'completed',
        },
        _sum: {
          quantity: true,
        },
      })

      const totalBooked = bookedTickets._sum.quantity || 0
      const availableTickets = event.capacity - totalBooked
      const occupancyPercentage = (totalBooked / event.capacity) * 100

      // Alertar si quedan menos del 20% de tickets o menos de 5 tickets
      if (occupancyPercentage >= 80 || availableTickets <= 5) {
        try {
          // Obtener emails de administradores
          const admins = await db.adminUser.findMany({
            where: { active: true },
            select: { email: true },
          })

          // Enviar alerta de bajo inventario (implementar según necesidad)
          console.log(`Alerta: Evento "${event.title}" tiene solo ${availableTickets} tickets disponibles`)
          lowInventoryAlerts++
        } catch (error) {
          console.error(`Error enviando alerta de inventario para evento ${event.id}:`, error)
        }
      }
    }

    return NextResponse.json({
      success: true,
      remindersSent,
      remindersFailed,
      lowInventoryAlerts,
      message: `Procesadas ${bookingsForReminder.length} reservas. Enviados ${remindersSent} recordatorios, ${remindersFailed} fallos, ${lowInventoryAlerts} alertas de inventario.`,
    })

  } catch (error) {
    console.error('Error in cron notifications:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// GET para verificar el estado del cron job
export async function GET() {
  try {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const dayAfterTomorrow = new Date(tomorrow)
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1)

    // Contar reservas pendientes de recordatorio
    const pendingReminders = await db.booking.count({
      where: {
        paymentStatus: 'completed',
        event: {
          date: {
            gte: tomorrow,
            lt: dayAfterTomorrow,
          },
        },
        reminderSent: false,
      },
    })

    // Contar eventos próximos
    const upcomingEvents = await db.event.count({
      where: {
        status: 'active',
        date: {
          gte: new Date(),
        },
      },
    })

    return NextResponse.json({
      status: 'healthy',
      pendingReminders,
      upcomingEvents,
      lastCheck: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Error checking cron status:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}