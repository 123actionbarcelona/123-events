import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { eventSchema, eventStatusSchema } from '@/lib/validations'
import { syncEventToCalendar, deleteCalendarEvent } from '@/lib/calendar'
import { getMockEventById } from '@/lib/mock-data'
import { z } from 'zod'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/events/[id] - Obtener evento específico
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)
    const isAdmin = !!session?.user

    // Await params in Next.js 15
    const { id } = await params
    let event
    
    try {
      event = await db.event.findUnique({
        where: { id },
        include: {
          // Siempre incluir bookings para calcular disponibilidad
          bookings: isAdmin ? {
            include: {
              tickets: true,
              customer: true,
            },
            orderBy: { createdAt: 'desc' },
          } : {
            select: {
              quantity: true,
              paymentStatus: true,
            }
          },
          _count: isAdmin ? {
            select: { bookings: true }
          } : undefined
        },
      })
    } catch (dbError) {
      console.log('Database not available, using mock data')
      event = getMockEventById(id)
    }

    if (!event) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      )
    }

    // Si no es admin y el evento no está activo, no mostrar
    if (!isAdmin && event.status !== 'active') {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      )
    }

    // Usar el campo availableTickets directamente de la DB
    // Ya que se actualiza correctamente cuando se hacen reservas
    const bookedTickets = event.capacity - event.availableTickets

    const eventWithAvailability = {
      ...event,
      availableTickets: event.availableTickets, // Usar el valor de la DB directamente
      bookedTickets,
    }

    // Desactivar caché para obtener datos frescos siempre
    return NextResponse.json(eventWithAvailability, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })

  } catch (error) {
    console.error('Error fetching event:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/events/[id] - Actualizar evento (solo admin)
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Await params in Next.js 15
    const { id } = await params

    // Verificar que el evento existe
    const existingEvent = await db.event.findUnique({
      where: { id },
    })

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      )
    }

    // Parsear y validar datos
    const body = await request.json()
    const validatedData = eventSchema.parse(body)

    // Actualizar evento
    const updatedEvent = await db.event.update({
      where: { id },
      data: {
        ...validatedData,
        date: new Date(validatedData.date),
        // Mantener availableTickets si no se cambió la capacidad
        availableTickets: validatedData.capacity !== existingEvent.capacity 
          ? validatedData.capacity 
          : existingEvent.availableTickets,
      },
    })

    // Sincronizar cambios con Google Calendar si el evento ya está sincronizado
    try {
      if (existingEvent.calendarEventId) {
        await syncEventToCalendar(updatedEvent)
      }
    } catch (calendarError) {
      console.error('Error syncing updated event with calendar:', calendarError)
      // No fallar la actualización si el calendario falla
    }

    return NextResponse.json(updatedEvent)

  } catch (error) {
    console.error('Error updating event:', error)
    
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

// PATCH /api/events/[id] - Actualizar estado del evento (solo admin)
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Await params in Next.js 15
    const { id } = await params

    // Parsear y validar datos
    const body = await request.json()
    const { status } = eventStatusSchema.parse(body)

    // Verificar que el evento existe
    const existingEvent = await db.event.findUnique({
      where: { id },
    })

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      )
    }

    // Actualizar solo el estado
    const updatedEvent = await db.event.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json(updatedEvent)

  } catch (error) {
    console.error('Error updating event status:', error)
    
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

// DELETE /api/events/[id] - Eliminar evento (solo admin)
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Await params in Next.js 15
    const { id } = await params

    // Verificar que el evento existe
    const existingEvent = await db.event.findUnique({
      where: { id },
      include: {
        _count: {
          select: { bookings: true }
        }
      }
    })

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      )
    }

    // No permitir eliminar si tiene reservas
    if (existingEvent._count.bookings > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un evento con reservas. Cancélalo en su lugar.' },
        { status: 400 }
      )
    }

    // Eliminar evento de Google Calendar si está sincronizado
    try {
      if (existingEvent.calendarEventId) {
        await deleteCalendarEvent(existingEvent.calendarEventId)
      }
    } catch (calendarError) {
      console.error('Error deleting event from calendar:', calendarError)
      // Continuar con la eliminación aunque falle el calendario
    }

    // Eliminar evento
    await db.event.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Evento eliminado correctamente' })

  } catch (error) {
    console.error('Error deleting event:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}