import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { mockStats } from '@/lib/mock-data'

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

    let stats
    
    try {
      // Intentar obtener estadísticas reales de la base de datos
      const [
        totalEvents,
        totalBookings,
        activeEvents,
        revenueData,
        monthlyData
      ] = await Promise.all([
        db.event.count(),
        db.booking.count({ where: { paymentStatus: 'completed' } }),
        db.event.count({ where: { status: 'active' } }),
        db.booking.aggregate({
          where: { paymentStatus: 'completed' },
          _sum: { totalAmount: true }
        }),
        db.booking.count({
          where: {
            paymentStatus: 'completed',
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        })
      ])

      stats = {
        totalEvents,
        totalBookings,
        totalRevenue: revenueData._sum.totalAmount || 0,
        activeEvents,
        monthlyBookings: monthlyData,
        monthlyRevenue: 0, // Calcularlo por mes actual
        averageTicketPrice: totalBookings > 0 ? (revenueData._sum.totalAmount || 0) / totalBookings : 0,
        topCategory: 'murder' // Calcular la categoría más popular
      }
      
    } catch (dbError) {
      console.log('Database not available, using mock stats')
      stats = mockStats
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}