'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDebounce } from '@/lib/hooks'
import { VirtualList, useVirtualScrolling } from '@/components/ui/virtual-list'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, Filter, Download, Eye, RefreshCw } from 'lucide-react'
import { formatPrice, safeFormatDate, safeFormatDateTime, safeFormatDateTimeShort } from '@/lib/utils'

interface Booking {
  id: string
  bookingCode: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  quantity: number
  totalAmount: number
  paymentStatus: 'pending' | 'paid' | 'completed' | 'failed' | 'refunded'
  paymentMethod?: 'card' | 'voucher' | 'mixed'
  voucherAmount?: number
  stripeAmount?: number
  createdAt: string
  updatedAt: string
  event: {
    title: string
    date: string
    time: string
  }
  customer: {
    name: string
    email: string
  }
  tickets: Array<{
    id: string
    ticketCode: string
    status: string
  }>
}


export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()

  // HELPER FUNCTIONS - Moved here to fix hoisting issue
  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'bg-green-100 text-green-800',
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800', 
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    }
    
    const labels = {
      completed: 'Completado',
      paid: 'Pagado',
      pending: 'Pendiente',
      failed: 'Fallido',
      refunded: 'Reembolsado'
    }

    return (
      <Badge className={variants[status] || variants.pending}>
        {labels[status] || status}
      </Badge>
    )
  }

  const getPaymentMethodBadge = (method: string | undefined, voucherAmount?: number, stripeAmount?: number) => {
    if (!method) return null
    
    const variants = {
      card: 'bg-blue-100 text-blue-800',
      voucher: 'bg-purple-100 text-purple-800',
      mixed: 'bg-orange-100 text-orange-800'
    }
    
    const labels = {
      card: 'Tarjeta',
      voucher: 'Vale',
      mixed: 'Mixto'
    }

    return (
      <Badge className={variants[method] || 'bg-gray-100 text-gray-800'}>
        {labels[method] || method}
        {method === 'mixed' && voucherAmount && stripeAmount && (
          <span className="ml-1 text-xs">
            (€{voucherAmount.toFixed(0)}+€{stripeAmount.toFixed(0)})
          </span>
        )}
      </Badge>
    )
  }

  // OPTIMIZACIÓN: useCallback para evitar re-renders innecesarios
  const fetchBookings = useCallback(async () => {
    setRefreshing(true)
    try {
      console.time('⚡ Bookings API Call')
      
      const params = new URLSearchParams()
      if (debouncedSearchTerm) params.set('search', debouncedSearchTerm)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      params.set('limit', '100')
      
      const response = await fetch(`/api/admin/bookings?${params}`, { 
        cache: 'no-store' 
      })
      
      console.timeEnd('⚡ Bookings API Call')
      
      if (response.ok) {
        const data = await response.json()
        setBookings(data.bookings || [])
        console.log('📊 Bookings loaded:', data.bookings?.length)
      } else {
        console.error('Error fetching bookings:', response.statusText)
        setBookings([])
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
      setBookings([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [debouncedSearchTerm, statusFilter])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  // OPTIMIZACIÓN: Filtrado ahora se hace en servidor, solo memoizamos los datos
  const filteredBookings = useMemo(() => {
    // El filtrado se hace en el servidor, pero mantenemos capacidad local para casos edge
    return bookings
  }, [bookings])
  
  // OPTIMIZACIÓN: Memoizar estadísticas calculadas
  const bookingStats = useMemo(() => {
    const totalBookings = bookings.length
    const paidBookings = bookings.filter(b => b.paymentStatus === 'completed' || b.paymentStatus === 'paid').length
    const pendingBookings = bookings.filter(b => b.paymentStatus === 'pending').length
    const totalRevenue = bookings.reduce((sum, b) => 
      sum + ((b.paymentStatus === 'completed' || b.paymentStatus === 'paid') ? b.totalAmount : 0), 0
    )
    
    return { totalBookings, paidBookings, pendingBookings, totalRevenue }
  }, [bookings])

  // OPTIMIZACIÓN FASE 2: Virtual scrolling para listas largas
  const { shouldUseVirtualScrolling, itemCount } = useVirtualScrolling(filteredBookings, 50)
  
  // Componente para renderizar cada booking (memoizado)
  const renderBookingItem = useMemo(() => (booking: Booking, index: number) => (
    <div key={booking.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors mx-4 my-2">
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
              {booking.bookingCode}
            </span>
            {getStatusBadge(booking.paymentStatus)}
            {getPaymentMethodBadge(booking.paymentMethod, booking.voucherAmount, booking.stripeAmount)}
          </div>
          
          <div>
            <h4 className="font-semibold">{booking.customerName}</h4>
            <p className="text-sm text-gray-600">{booking.customerEmail}</p>
            {booking.customerPhone && (
              <p className="text-sm text-gray-600">{booking.customerPhone}</p>
            )}
          </div>
          
          <div>
            <p className="font-medium">{booking.event.title}</p>
            <p className="text-sm text-gray-600">
              {safeFormatDateTime(booking.event.date, booking.event.time)}
            </p>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
            <span>{booking.quantity} tickets</span>
            <span className="font-semibold">{formatPrice(booking.totalAmount)}</span>
            {booking.paymentMethod === 'voucher' && booking.voucherAmount && (
              <span className="text-purple-600">Vale: €{booking.voucherAmount.toFixed(2)}</span>
            )}
            {booking.paymentMethod === 'mixed' && (
              <span className="text-orange-600">
                Vale: €{booking.voucherAmount?.toFixed(2) || 0} + Tarjeta: €{booking.stripeAmount?.toFixed(2) || 0}
              </span>
            )}
            <span>Creada: {safeFormatDateTimeShort(booking.createdAt)}</span>
          </div>

          {booking.tickets && booking.tickets.length > 0 && (
            <div className="text-xs text-gray-500 mt-2">
              Tickets: {booking.tickets.map(t => t.ticketCode).join(', ')}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push(`/admin/bookings/${booking.id}`)}
          >
            <Eye className="h-4 w-4" />
            Ver detalles
          </Button>
        </div>
      </div>
    </div>
  ), [router, getStatusBadge, getPaymentMethodBadge])

  // Funciones de formateo movidas a @/lib/utils

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Reservas</h1>
        </div>
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reservas</h1>
          <p className="text-gray-600">Gestiona todas las reservas de eventos</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={fetchBookings}
            variant="outline"
            disabled={refreshing}
            className="text-gray-700 hover:text-gray-900"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Actualizando...' : 'Actualizar'}
          </Button>
          <Button className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por código, cliente, email o evento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">Todos los estados</option>
                <option value="paid">Pagado</option>
                <option value="completed">Completado</option>
                <option value="pending">Pendiente</option>
                <option value="failed">Fallido</option>
                <option value="refunded">Reembolsado</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats rápidas - OPTIMIZADAS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{bookingStats.totalBookings}</div>
            <p className="text-sm text-gray-600">Total reservas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{bookingStats.paidBookings}</div>
            <p className="text-sm text-gray-600">Pagadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{bookingStats.pendingBookings}</div>
            <p className="text-sm text-gray-600">Pendientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{formatPrice(bookingStats.totalRevenue)}</div>
            <p className="text-sm text-gray-600">Ingresos</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de reservas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Reservas ({filteredBookings.length})
            {shouldUseVirtualScrolling && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                ⚡ Optimizado
              </span>
            )}
          </CardTitle>
          <CardDescription>
            {shouldUseVirtualScrolling ? (
              <span>
                Lista optimizada con virtual scrolling • 
                Renderizando solo elementos visibles para mejor rendimiento
              </span>
            ) : (
              'Lista completa de reservas con filtros aplicados'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className={shouldUseVirtualScrolling ? 'p-0' : 'p-6'}>
          {filteredBookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500 p-6">
              No se encontraron reservas con los filtros aplicados
            </div>
          ) : shouldUseVirtualScrolling ? (
            // VIRTUAL SCROLLING para listas largas (>50 items)
            <div className="p-4">
              <div className="text-sm text-gray-600 mb-4 flex items-center gap-2">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                  ⚡ Virtual Scrolling
                </span>
                <span>Renderizando {Math.min(20, filteredBookings.length)} de {filteredBookings.length} reservas</span>
              </div>
              <VirtualList
                items={filteredBookings}
                height={600} // 600px de altura
                itemHeight={120} // ~120px por booking
                renderItem={renderBookingItem}
                className="border rounded-lg"
                overscan={5}
              />
            </div>
          ) : (
            // RENDERIZADO NORMAL para listas pequeñas (<50 items)
            <div className="space-y-4">
              {filteredBookings.map((booking) => renderBookingItem(booking, 0))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}