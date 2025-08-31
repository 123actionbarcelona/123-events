import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { syncEventToCalendar, addAttendeeToCalendarEvent } from '@/lib/calendar'
import { db } from '@/lib/db'
import { z } from 'zod'

const syncEventSchema = z.object({
  eventId: z.string(),
  action: z.enum(['sync', 'add_attendee']),
  attendeeEmail: z.string().email().optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { eventId, action, attendeeEmail } = syncEventSchema.parse(body)

    // Obtener evento de la base de datos
    const event = await db.event.findUnique({
      where: { id: eventId },
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      )
    }

    if (action === 'sync') {
      // Sincronizar evento con Google Calendar
      const result = await syncEventToCalendar(event)

      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        )
      }

      // Actualizar evento con ID de calendar si se creó uno nuevo
      if (result.calendarEventId && !event.calendarEventId) {
        await db.event.update({
          where: { id: eventId },
          data: { calendarEventId: result.calendarEventId },
        })
      }

      return NextResponse.json({
        success: true,
        calendarEventId: result.calendarEventId,
        message: 'Evento sincronizado con Google Calendar',
      })
    }

    if (action === 'add_attendee') {
      if (!attendeeEmail) {
        return NextResponse.json(
          { error: 'Email del asistente requerido' },
          { status: 400 }
        )
      }

      if (!event.calendarEventId) {
        return NextResponse.json(
          { error: 'El evento no está sincronizado con Google Calendar' },
          { status: 400 }
        )
      }

      const success = await addAttendeeToCalendarEvent(
        event.calendarEventId,
        attendeeEmail
      )

      return NextResponse.json({
        success,
        message: success 
          ? 'Asistente agregado al evento de calendario'
          : 'Error al agregar asistente al calendario',
      })
    }

  } catch (error) {
    console.error('Error in calendar sync:', error)
    
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

    // Obtener eventos que necesitan sincronización
    const eventsToSync = await db.event.findMany({
      where: {
        OR: [
          { calendarEventId: null },
          { calendarEventId: '' },
        ],
        date: {
          gte: new Date(), // Solo eventos futuros
        },
      },
      select: {
        id: true,
        title: true,
        date: true,
        time: true,
        calendarEventId: true,
      },
    })

    return NextResponse.json({
      success: true,
      eventsToSync: eventsToSync.length,
      events: eventsToSync,
    })

  } catch (error) {
    console.error('Error fetching events to sync:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}