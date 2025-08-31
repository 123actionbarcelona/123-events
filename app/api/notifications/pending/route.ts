import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener fecha de mañana para recordatorios
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const dayAfterTomorrow = new Date(tomorrow)
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1)

    // Reservas pendientes de recordatorio
    const pendingReminders = await db.booking.findMany({
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
        event: {
          select: {
            id: true,
            title: true,
            date: true,
            time: true,
          },
        },
        customer: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        event: {
          date: 'asc',
        },
      },
    })

    // Reservas de confirmación pendientes (últimas 24 horas sin email)
    const dayAgo = new Date()
    dayAgo.setDate(dayAgo.getDate() - 1)

    const pendingConfirmations = await db.booking.findMany({
      where: {
        paymentStatus: 'completed',
        confirmationSent: false,
        createdAt: {
          gte: dayAgo,
        },
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            date: true,
            time: true,
          },
        },
        customer: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Eventos con bajo inventario
    const events = await db.event.findMany({
      where: {
        status: 'active',
        date: {
          gte: new Date(),
        },
      },
      include: {
        _count: {
          select: { bookings: true }
        }
      }
    })

    const lowInventoryEvents = []
    
    for (const event of events) {
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

      // Incluir si quedan menos del 20% o menos de 5 tickets
      if (occupancyPercentage >= 80 || availableTickets <= 5) {
        lowInventoryEvents.push({
          id: event.id,
          title: event.title,
          date: event.date,
          time: event.time,
          capacity: event.capacity,
          totalBooked,
          availableTickets,
          occupancyPercentage: Math.round(occupancyPercentage),
        })
      }
    }

    return NextResponse.json({
      pendingReminders: {
        count: pendingReminders.length,
        bookings: pendingReminders,
      },
      pendingConfirmations: {
        count: pendingConfirmations.length,
        bookings: pendingConfirmations,
      },
      lowInventoryEvents: {
        count: lowInventoryEvents.length,
        events: lowInventoryEvents,
      },
      summary: {
        totalPendingNotifications: pendingReminders.length + pendingConfirmations.length,
        criticalAlerts: lowInventoryEvents.length,
      },
    })

  } catch (error) {
    console.error('Error fetching pending notifications:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}