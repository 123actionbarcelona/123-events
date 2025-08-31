'use client'

import { useState, useEffect, useMemo, useCallback, memo, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { 
  StatsLoadingSkeleton, 
  RecentEventsLoadingSkeleton,
  RecentBookingsLoadingSkeleton,
  RecentVouchersLoadingSkeleton
} from '@/components/ui/suspense-wrappers'
import { 
  Calendar, 
  Users, 
  Euro, 
  Ticket, 
  TrendingUp, 
  Clock,
  Plus,
  ArrowRight,
  Gift,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatPrice, safeFormatDate, safeFormatDateTimeShort } from '@/lib/utils'

interface DashboardStats {
  totalEvents: number
  activeEvents: number
  totalBookings: number
  totalCustomers: number
  totalRevenue: number
  // Nuevos campos para vales regalo
  totalVouchers?: number
  totalVoucherValue?: number
  activeVouchers?: number
  recentEvents: Array<{
    id: string
    title: string
    date: string
    status: string
    bookedTickets: number
    capacity: number
  }>
  recentBookings: Array<{
    id: string
    bookingCode: string
    customerName: string
    eventTitle: string
    totalAmount: number
    createdAt: string
  }>
  // Nuevos vales recientes
  recentVouchers?: Array<{
    id: string
    code: string
    purchaserName: string
    originalAmount: number
    status: string
    createdAt: string
  }>
  // Metadata de la API unificada
  fetchedAt?: string
  apiVersion?: string
  cacheHint?: string
}

// Componente optimizado para estadísticas
const StatCard = memo(({ title, value, subtitle, icon: Icon, color }: {
  title: string
  value: string | number
  subtitle: string
  icon: any
  color: string
}) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        </div>
        <Icon className={`w-8 h-8 ${color}`} />
      </div>
    </CardContent>
  </Card>
))

// Componente optimizado para eventos recientes
const RecentEventCard = memo(({ event }: {
  event: any
}) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
    <div className="flex-1">
      <h4 className="font-medium text-gray-900">{event.title}</h4>
      <p className="text-sm text-gray-500">{safeFormatDate(event.date)}</p>
    </div>
    <div className="text-right">
      <p className="text-sm font-medium">{event.bookedTickets || 0}/{event.capacity}</p>
      <span className={`inline-block px-2 py-1 rounded-full text-xs ${
        event.status === 'active' ? 'bg-green-100 text-green-800' :
        event.status === 'draft' ? 'bg-gray-100 text-gray-800' :
        event.status === 'soldout' ? 'bg-orange-100 text-orange-800' :
        'bg-red-100 text-red-800'
      }`}>
        {event.status === 'active' ? 'Activo' :
         event.status === 'draft' ? 'Borrador' :
         event.status === 'soldout' ? 'Agotado' : 'Cancelado'}
      </span>
    </div>
  </div>
))

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()

  // Memoizar datos computados
  const memoizedRecentBookings = useMemo(() => stats?.recentBookings || [], [stats?.recentBookings])
  const memoizedRecentEvents = useMemo(() => stats?.recentEvents || [], [stats?.recentEvents])
  const memoizedRecentVouchers = useMemo(() => stats?.recentVouchers || [], [stats?.recentVouchers])

  const fetchDashboardData = useCallback(async () => {
    setRefreshing(true)
    try {
      console.time('⚡ Unified Dashboard API Call')
      
      // OPTIMIZACIÓN FASE 2: Una sola llamada en lugar de 4
      const response = await fetch('/api/admin/dashboard', { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'max-age=30, stale-while-revalidate=300'
        }
      })
      
      console.timeEnd('⚡ Unified Dashboard API Call')
      
      if (response.ok) {
        const dashboardData = await response.json()
        console.log('📊 Dashboard data loaded:', {
          apiVersion: dashboardData.apiVersion,
          totalEvents: dashboardData.totalEvents,
          fetchedAt: dashboardData.fetchedAt
        })
        
        // Los datos ya vienen en el formato correcto
        setStats(dashboardData)
      } else {
        throw new Error(`API Error: ${response.status}`)
      }
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {

    fetchDashboardData()
  }, [])

  // OPTIMIZACIÓN FASE 2: Loading states más granulares con Suspense
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Dashboard de Administración
            </h1>
            <p className="text-gray-600">Resumen de tu plataforma de eventos</p>
          </div>
          <div className="flex space-x-3">
            <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        
        <Suspense fallback={<StatsLoadingSkeleton />}>
          <StatsLoadingSkeleton />
        </Suspense>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Suspense fallback={<RecentEventsLoadingSkeleton />}>
            <RecentEventsLoadingSkeleton />
          </Suspense>
          <Suspense fallback={<RecentBookingsLoadingSkeleton />}>
            <RecentBookingsLoadingSkeleton />
          </Suspense>
          <Suspense fallback={<RecentVouchersLoadingSkeleton />}>
            <RecentVouchersLoadingSkeleton />
          </Suspense>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard de Administración
          </h1>
          <p className="text-gray-600">Resumen de tu plataforma de eventos</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            onClick={fetchDashboardData}
            variant="outline"
            disabled={refreshing}
            className="text-gray-700 hover:text-gray-900"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Actualizando...' : 'Actualizar'}
          </Button>
          <Button onClick={() => router.push('/admin/events/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Evento
          </Button>
        </div>
      </div>
      
      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard 
          title="Total Eventos" 
          value={stats?.totalEvents || 0}
          subtitle={`${stats?.activeEvents || 0} activos`}
          icon={Calendar}
          color="text-blue-600"
        />
        <StatCard 
          title="Reservas" 
          value={stats?.totalBookings || 0}
          subtitle="Este mes"
          icon={Ticket}
          color="text-green-600"
        />
        <StatCard 
          title="Clientes" 
          value={stats?.totalCustomers || 0}
          subtitle="Únicos registrados"
          icon={Users}
          color="text-purple-600"
        />
        <StatCard 
          title="Ingresos" 
          value={formatPrice(stats?.totalRevenue || 0)}
          subtitle="Total generado"
          icon={Euro}
          color="text-orange-600"
        />
        <StatCard 
          title="Vales Regalo" 
          value={stats?.activeVouchers || 0}
          subtitle={`${formatPrice(stats?.totalVoucherValue || 0)} vendidos`}
          icon={Gift}
          color="text-pink-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Eventos recientes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">Eventos Recientes</CardTitle>
            <Button variant="outline" size="sm" onClick={() => router.push('/admin/events')}>
              Ver todos
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardHeader>
          <CardContent>
            {memoizedRecentEvents.length > 0 ? (
              <div className="space-y-4">
                {memoizedRecentEvents.map((event) => (
                  <RecentEventCard 
                    key={event.id} 
                    event={event}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay eventos</h3>
                <p className="text-gray-600 mb-4">Crea tu primer evento para empezar</p>
                <Button onClick={() => router.push('/admin/events/new')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Evento
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reservas recientes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">Reservas Recientes</CardTitle>
            <Button variant="outline" size="sm" onClick={() => router.push('/admin/bookings')}>
              Ver todas
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardHeader>
          <CardContent>
            {stats?.recentBookings && stats.recentBookings.length > 0 ? (
              <div className="space-y-4">
                {stats.recentBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{booking.customerName}</h4>
                      <p className="text-sm text-gray-500">{booking.eventTitle}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatPrice(booking.totalAmount)}</p>
                      <p className="text-xs text-gray-500">
                        {safeFormatDateTimeShort(booking.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Sin reservas</h3>
                <p className="text-gray-600">
                  Las reservas aparecerán aquí cuando los clientes compren tickets
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vales regalo recientes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">Vales Regalo Recientes</CardTitle>
            <Button variant="outline" size="sm" onClick={() => router.push('/admin/vouchers')}>
              Ver todos
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardHeader>
          <CardContent>
            {stats?.recentVouchers && stats.recentVouchers.length > 0 ? (
              <div className="space-y-4">
                {stats.recentVouchers.map((voucher) => (
                  <div key={voucher.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{voucher.purchaserName}</h4>
                      <p className="text-sm text-gray-500 font-mono">{voucher.code}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatPrice(voucher.originalAmount)}</p>
                      <p className="text-xs text-gray-500">
                        {safeFormatDateTimeShort(voucher.createdAt)}
                      </p>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                        voucher.status === 'active' ? 'bg-green-100 text-green-800' :
                        voucher.status === 'used' ? 'bg-blue-100 text-blue-800' :
                        voucher.status === 'expired' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {voucher.status === 'active' ? 'Activo' :
                         voucher.status === 'used' ? 'Usado' :
                         voucher.status === 'expired' ? 'Expirado' : 'Cancelado'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Gift className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Sin vales regalo</h3>
                <p className="text-gray-600">
                  Los vales aparecerán aquí cuando se creen
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Accesos rápidos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Accesos Rápidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" onClick={() => router.push('/admin/events/new')}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Evento
            </Button>
            <Button variant="outline" onClick={() => router.push('/admin/events')}>
              <Calendar className="w-4 h-4 mr-2" />
              Ver Eventos
            </Button>
            <Button variant="outline" onClick={() => router.push('/admin/bookings')}>
              <Ticket className="w-4 h-4 mr-2" />
              Reservas
            </Button>
            <Button variant="outline" onClick={() => router.push('/admin/customers')}>
              <Users className="w-4 h-4 mr-2" />
              Clientes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}