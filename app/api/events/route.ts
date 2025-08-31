import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { eventSchema, eventFiltersSchema } from '@/lib/validations'
import { syncEventToCalendar } from '@/lib/calendar'
import { getMockEvents } from '@/lib/mock-data'
import { z } from 'zod'

// GET /api/events - Listar eventos (público y admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Obtener sesión para determinar si es admin
    const session = await getServerSession(authOptions)
    const isAdmin = !!session?.user

    // Validar parámetros de consulta
    const filters = eventFiltersSchema.parse({
      status: searchParams.get('status') || undefined,
      category: searchParams.get('category') || undefined,
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10,
    })

    // Construir condiciones de búsqueda
    const where: any = {}

    // Si no es admin, solo mostrar eventos activos
    if (!isAdmin) {
      where.status = 'active'
    } else if (filters.status) {
      where.status = filters.status
    }

    if (filters.category) {
      where.category = filters.category
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search } },
        { description: { contains: filters.search } },
        { location: { contains: filters.search } },
      ]
    }

    // Calcular paginación
    const skip = (filters.page - 1) * filters.limit

    // Intentar obtener eventos de la base de datos, si falla usar mock data
    let events, total
    
    try {
      [events, total] = await Promise.all([
        db.event.findMany({
          where,
          orderBy: { date: 'asc' },
          skip,
          take: filters.limit,
          include: {
            // Siempre incluir bookings para calcular disponibilidad
            bookings: isAdmin ? {
              include: {
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
            } : undefined,
          },
        }),
        db.event.count({ where }),
      ])
    } catch (dbError) {
      console.log('Database not available, using mock data')
      
      // Usar datos mock si la BD no está disponible
      const mockResult = getMockEvents({
        category: filters.category,
        limit: filters.limit,
        page: filters.page,
        status: filters.status
      })
      
      events = mockResult.events
      total = mockResult.pagination.total
    }

    // Usar availableTickets directamente de la DB (ya se actualiza correctamente)
    const eventsWithAvailability = events.map(event => {
      // El campo availableTickets ya viene actualizado de la DB
      const bookedTickets = event.capacity - event.availableTickets

      return {
        ...event,
        availableTickets: event.availableTickets, // Usar valor de DB directamente
        bookedTickets, // Incluir para debugging
      }
    })

    return NextResponse.json({
      events: eventsWithAvailability,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      }
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })

  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/events - Crear evento (solo admin)
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

    // Parsear y validar datos
    const body = await request.json()
    const validatedData = eventSchema.parse(body)

    // Intentar crear evento en la base de datos, si falla devolver error
    try {
      const event = await db.event.create({
        data: {
          ...validatedData,
          date: new Date(validatedData.date),
          availableTickets: validatedData.capacity, // Inicialmente todos disponibles
        },
      })

      // Sincronizar automáticamente con Google Calendar
      try {
        const calendarResult = await syncEventToCalendar(event)
        if (calendarResult.success && calendarResult.calendarEventId) {
          await db.event.update({
            where: { id: event.id },
            data: { calendarEventId: calendarResult.calendarEventId },
          })
        }
      } catch (calendarError) {
        console.error('Error syncing with calendar:', calendarError)
        // No fallar la creación del evento si el calendario falla
      }

      return NextResponse.json(event, { status: 201 })
      
    } catch (dbError) {
      console.error('Database not available for event creation:', dbError)
      return NextResponse.json(
        { error: 'Base de datos no disponible. Configura DATABASE_URL para crear eventos.' },
        { status: 503 }
      )
    }

  } catch (error) {
    console.error('Error creating event:', error)
    
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