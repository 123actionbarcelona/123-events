import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación admin
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'

    try {
      console.log('🔄 Fetching bookings from database...')
      
      // Construir filtros de búsqueda
      const whereClause: any = {}
      
      if (search) {
        whereClause.OR = [
          { bookingCode: { contains: search } },
          { customerName: { contains: search } },
          { customerEmail: { contains: search } },
          { event: { title: { contains: search } } }
        ]
      }
      
      if (status !== 'all') {
        whereClause.paymentStatus = status
      }

      // Query optimizada con datos relacionados
      const [bookings, total] = await Promise.all([
        db.booking.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            event: {
              select: {
                title: true,
                date: true,
                time: true,
              }
            },
            customer: {
              select: {
                name: true,
                email: true,
              }
            },
            tickets: {
              select: {
                id: true,
                ticketCode: true,
                status: true
              }
            },
          }
        }),
        db.booking.count({ where: whereClause })
      ])

      const response = {
        bookings,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        filters: {
          search,
          status
        }
      }

      console.log('✅ Bookings loaded:', {
        count: bookings.length,
        total,
        filters: { search, status }
      })

      return NextResponse.json(response, {
        headers: {
          'Cache-Control': 'max-age=30, stale-while-revalidate=300'
        }
      })

    } catch (dbError) {
      console.error('❌ Database error:', dbError)
      
      // Fallback simple sin mock data
      return NextResponse.json({
        bookings: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0
        },
        error: 'Database temporarily unavailable'
      })
    }

  } catch (error) {
    console.error('❌ Complete bookings API failure:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}