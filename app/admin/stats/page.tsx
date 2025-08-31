'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Euro,
  Ticket,
  Gift,
  RefreshCw,
  Activity
} from 'lucide-react'
import { formatPrice, safeFormatDate } from '@/lib/utils'

interface StatsData {
  totalEvents: number
  totalBookings: number
  totalRevenue: number
  activeEvents: number
  monthlyBookings: number
  monthlyRevenue: number
  averageTicketPrice: number
  topCategory: string
}

interface Event {
  id: string
  title: string
  date: string
  capacity: number
  price: number
  status: string
}

interface Booking {
  id: string
  eventId: string
  totalAmount: number
  paymentStatus: string
  createdAt: string
}

interface Voucher {
  id: string
  originalAmount: number
  status: string
  createdAt: string
}

export default function AdminStatsPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [statsData, setStatsData] = useState<StatsData | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [vouchers, setVouchers] = useState<Voucher[]>([])

  const fetchAllData = async () => {
    setRefreshing(true)
    try {
      console.time('⚡ Stats Page - Full Data Load')
      
      const [statsRes, dashboardRes, eventsRes, bookingsRes] = await Promise.all([
        fetch('/api/admin/stats', { credentials: 'include' }),
        fetch('/api/admin/dashboard', { credentials: 'include' }),
        fetch('/api/events', { credentials: 'include' }),
        fetch('/api/admin/bookings?limit=100', { credentials: 'include' })
      ])
      
      const [statsData, dashboardData, eventsData, bookingsData] = await Promise.all([
        statsRes.ok ? statsRes.json() : {},
        dashboardRes.ok ? dashboardRes.json() : {},
        eventsRes.ok ? eventsRes.json() : { events: [] },
        bookingsRes.ok ? bookingsRes.json() : { bookings: [] }
      ])
      
      console.timeEnd('⚡ Stats Page - Full Data Load')
      
      setStatsData(statsData)
      setEvents(eventsData.events || [])
      setBookings(bookingsData.bookings || [])
      setVouchers(dashboardData.recentVouchers || [])
      
    } catch (error) {
      console.error('❌ Error loading stats data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAllData()
  }, [])

  // Calculate top events by revenue from real data
  const topEvents = useMemo(() => {
    if (!events.length || !bookings.length) return []
    
    return events
      .map(event => {
        const eventBookings = bookings.filter(booking => 
          booking.eventId === event.id && booking.paymentStatus === 'completed'
        )
        const totalBookings = eventBookings.length
        const totalRevenue = eventBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0)
        const fillRate = event.capacity > 0 ? Math.round((totalBookings / event.capacity) * 100) : 0
        
        return {
          title: event.title,
          bookings: totalBookings,
          revenue: totalRevenue,
          fillRate: Math.min(fillRate, 100)
        }
      })
      .filter(event => event.bookings > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
  }, [events, bookings])

  // Calculate monthly trends from real data
  const monthlyTrend = useMemo(() => {
    if (!bookings.length) return { percentage: 0, isPositive: true }
    
    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    
    const currentMonthBookings = bookings.filter(booking => 
      new Date(booking.createdAt) >= currentMonth && booking.paymentStatus === 'completed'
    ).length
    
    const lastMonthBookings = bookings.filter(booking => {
      const bookingDate = new Date(booking.createdAt)
      return bookingDate >= lastMonth && bookingDate < currentMonth && booking.paymentStatus === 'completed'
    }).length
    
    if (lastMonthBookings === 0) return { percentage: 100, isPositive: true }
    
    const percentage = Math.round(((currentMonthBookings - lastMonthBookings) / lastMonthBookings) * 100)
    return { percentage: Math.abs(percentage), isPositive: percentage >= 0 }
  }, [bookings])

  // Calculate revenue trend
  const revenueTrend = useMemo(() => {
    if (!bookings.length) return { percentage: 0, isPositive: true }
    
    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    
    const currentMonthRevenue = bookings
      .filter(booking => new Date(booking.createdAt) >= currentMonth && booking.paymentStatus === 'completed')
      .reduce((sum, booking) => sum + (booking.totalAmount || 0), 0)
    
    const lastMonthRevenue = bookings
      .filter(booking => {
        const bookingDate = new Date(booking.createdAt)
        return bookingDate >= lastMonth && bookingDate < currentMonth && booking.paymentStatus === 'completed'
      })
      .reduce((sum, booking) => sum + (booking.totalAmount || 0), 0)
    
    if (lastMonthRevenue === 0) return { percentage: 100, isPositive: true }
    
    const percentage = Math.round(((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
    return { percentage: Math.abs(percentage), isPositive: percentage >= 0 }
  }, [bookings])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Estadísticas</h1>
            <p className="text-gray-600">Análisis detallado de rendimiento</p>
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Estadísticas</h1>
          <p className="text-gray-600">Análisis detallado de rendimiento</p>
        </div>
        <Button 
          onClick={fetchAllData}
          variant="outline"
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Actualizando...' : 'Actualizar'}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                <p className="text-3xl font-bold text-green-600">
                  {formatPrice(statsData?.totalRevenue || 0)}
                </p>
                <div className="flex items-center mt-1">
                  {revenueTrend.isPositive ? (
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-xs ${revenueTrend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {revenueTrend.percentage}% vs mes anterior
                  </span>
                </div>
              </div>
              <Euro className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        {/* Total Bookings */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Reservas</p>
                <p className="text-3xl font-bold text-blue-600">{statsData?.totalBookings || 0}</p>
                <div className="flex items-center mt-1">
                  {monthlyTrend.isPositive ? (
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-xs ${monthlyTrend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {monthlyTrend.percentage}% este mes
                  </span>
                </div>
              </div>
              <Ticket className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        {/* Average Ticket Price */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Precio Promedio</p>
                <p className="text-3xl font-bold text-purple-600">
                  {formatPrice(statsData?.averageTicketPrice || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Por ticket</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        {/* Active Events */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Eventos Activos</p>
                <p className="text-3xl font-bold text-orange-600">{statsData?.activeEvents || 0}</p>
                <p className="text-xs text-gray-500 mt-1">
                  de {statsData?.totalEvents || 0} totales
                </p>
              </div>
              <Calendar className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Tendencia de Ingresos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {formatPrice(statsData?.monthlyRevenue || 0)}
                </p>
                <p className="text-sm text-gray-500">Este mes</p>
              </div>
              
              {/* Simple trend visualization */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Mes Actual</span>
                  <span className="font-medium">{formatPrice(statsData?.monthlyRevenue || 0)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-green-500 h-3 rounded-full transition-all duration-1000"
                    style={{ 
                      width: `${Math.min((statsData?.monthlyRevenue || 0) / (statsData?.totalRevenue || 1) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Events Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Top Eventos por Ingresos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topEvents.length > 0 ? (
                topEvents.map((event, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 truncate">{event.title}</h4>
                      <p className="text-sm text-gray-500">{event.bookings} reservas</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-medium text-green-600">{formatPrice(event.revenue)}</p>
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${event.fillRate}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500 w-8">{event.fillRate}%</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No hay datos de eventos disponibles</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Monthly Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rendimiento Mensual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{statsData?.monthlyBookings || 0}</p>
              <p className="text-sm text-gray-500">Reservas este mes</p>
              <div className="mt-4">
                <div className="flex items-center justify-center">
                  {monthlyTrend.isPositive ? (
                    <TrendingUp className="w-5 h-5 text-green-500 mr-2" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-500 mr-2" />
                  )}
                  <span className={`text-lg font-medium ${monthlyTrend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {monthlyTrend.percentage}%
                  </span>
                </div>
                <p className="text-xs text-gray-400">vs mes anterior</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Occupancy Rate */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tasa de Ocupación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              {(() => {
                const totalCapacity = events.reduce((sum, event) => sum + (event.capacity || 0), 0)
                const totalSold = bookings.filter(b => b.paymentStatus === 'completed').length
                const occupancyRate = totalCapacity > 0 ? Math.round((totalSold / totalCapacity) * 100) : 0
                
                return (
                  <>
                    <p className="text-3xl font-bold text-orange-600">{occupancyRate}%</p>
                    <p className="text-sm text-gray-500">Promedio general</p>
                    <div className="mt-4">
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div 
                          className="bg-orange-500 h-4 rounded-full transition-all duration-1000"
                          style={{ width: `${occupancyRate}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        {totalSold} de {totalCapacity} plazas vendidas
                      </p>
                    </div>
                  </>
                )
              })()}
            </div>
          </CardContent>
        </Card>

        {/* Gift Vouchers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Gift className="w-4 h-4 mr-2" />
              Vales Regalo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-3xl font-bold text-pink-600">{vouchers.length}</p>
              <p className="text-sm text-gray-500">Vales emitidos</p>
              <div className="mt-4">
                <p className="text-lg font-medium text-green-600">
                  {formatPrice(vouchers.reduce((sum, voucher) => sum + (voucher.originalAmount || 0), 0))}
                </p>
                <p className="text-xs text-gray-400">Valor total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}