import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// API UNIFICADA - Combina stats, events, bookings en 1 sola llamada (USANDO DATOS REALES)
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

    let dashboardData

    try {
      console.log('🔄 Fetching REAL data from SQLite...')
      
      // PASO 1: Datos básicos y obligatorios
      const [
        totalEvents,
        totalBookings,
        activeEvents,
        revenueData,
        monthlyData,
        recentEventsRaw,
        recentBookingsRaw
      ] = await Promise.all([
        db.event.count(),
        db.booking.count({ where: { paymentStatus: { in: ['completed', 'paid'] } } }),
        db.event.count({ where: { status: 'active' } }),
        db.booking.aggregate({
          where: { paymentStatus: { in: ['completed', 'paid'] } },
          _sum: { totalAmount: true }
        }),
        db.booking.count({
          where: {
            paymentStatus: { in: ['completed', 'paid'] },
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        }),
        db.event.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            title: true,
            date: true,
            status: true,
            capacity: true,
            _count: {
              select: { bookings: true }
            }
          }
        }),
        db.booking.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
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
            tickets: true,
          }
        })
      ])

      // PASO 2: Datos opcionales (pueden fallar)
      let totalCustomers = 0
      let recentVouchersRaw = []
      let vouchersStats = { _count: { id: 0 }, _sum: { originalAmount: 0 } }
      
      try {
        totalCustomers = await db.customer.count()
        console.log('✅ Customer count loaded:', totalCustomers)
      } catch (error) {
        console.log('⚠️ Customer table not available:', error.message)
      }
      
      try {
        [recentVouchersRaw, vouchersStats] = await Promise.all([
          db.giftVoucher.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
              id: true,
              code: true,
              purchaserName: true,
              originalAmount: true,
              status: true,
              createdAt: true
            }
          }),
          db.giftVoucher.aggregate({
            _count: { id: true },
            _sum: { originalAmount: true },
            where: { status: 'active' }
          })
        ])
        console.log('✅ Vouchers loaded:', vouchersStats._count.id)
      } catch (error) {
        console.log('⚠️ Voucher table not available:', error.message)
      }

      // PASO 3: Procesar datos
      const recentEvents = recentEventsRaw.map(event => ({
        id: event.id,
        title: event.title,
        date: event.date,
        status: event.status,
        bookedTickets: event._count?.bookings || 0,
        capacity: event.capacity
      }))

      const recentBookings = recentBookingsRaw.map(booking => ({
        id: booking.id,
        bookingCode: booking.bookingCode,
        customerName: booking.customerName,
        eventTitle: booking.event.title,
        totalAmount: booking.totalAmount,
        createdAt: booking.createdAt
      }))

      dashboardData = {
        // Stats principales (REALES)
        totalEvents,
        totalBookings,
        totalRevenue: revenueData._sum.totalAmount || 0,
        activeEvents,
        monthlyBookings: monthlyData,
        totalCustomers,
        
        // Vouchers stats
        totalVouchers: vouchersStats._count.id || 0,
        totalVoucherValue: vouchersStats._sum.originalAmount || 0,
        activeVouchers: vouchersStats._count.id || 0,
        
        // Datos recientes
        recentEvents,
        recentBookings,
        recentVouchers: recentVouchersRaw,
        
        // Metadata
        fetchedAt: new Date().toISOString(),
        apiVersion: '2.0-real',
        source: 'sqlite-database'
      }

      console.log('✅ Real dashboard data loaded:', {
        totalEvents,
        totalBookings,
        totalRevenue: revenueData._sum.totalAmount || 0,
        source: 'sqlite-database'
      })
      
    } catch (dbError) {
      console.error('❌ Database error:', dbError)
      
      // Fallback: usar APIs individuales como antes
      console.log('🔄 Falling back to individual APIs...')
      
      try {
        const [statsRes, eventsRes, bookingsRes] = await Promise.all([
          fetch(new URL('/api/admin/stats', request.url), { cache: 'no-store' }),
          fetch(new URL('/api/events?limit=5', request.url), { cache: 'no-store' }),
          fetch(new URL('/api/admin/bookings?limit=5', request.url), { cache: 'no-store' })
        ])

        const [adminStats, eventsData, bookingsData] = await Promise.all([
          statsRes.ok ? statsRes.json() : {},
          eventsRes.ok ? eventsRes.json() : { events: [] },
          bookingsRes.ok ? bookingsRes.json() : { bookings: [] }
        ])

        dashboardData = {
          totalEvents: adminStats.totalEvents || 0,
          activeEvents: adminStats.activeEvents || 0,
          totalBookings: adminStats.totalBookings || 0,
          totalCustomers: adminStats.totalCustomers || 0,
          totalRevenue: adminStats.totalRevenue || 0,
          totalVouchers: 0,
          totalVoucherValue: 0,
          activeVouchers: 0,
          recentEvents: eventsData.events?.slice(0, 5) || [],
          recentBookings: bookingsData.bookings?.slice(0, 5) || [],
          recentVouchers: [],
          fetchedAt: new Date().toISOString(),
          apiVersion: '2.0-fallback',
          source: 'fallback-apis'
        }

        console.log('⚠️ Using fallback APIs data')
        
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError)
        throw fallbackError
      }
    }

    return NextResponse.json(dashboardData, {
      headers: {
        'Cache-Control': 'max-age=30, stale-while-revalidate=300',
        'X-API-Version': '2.0',
        'X-Data-Source': dashboardData.source || 'unknown'
      }
    })

  } catch (error) {
    console.error('❌ Complete dashboard API failure:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}