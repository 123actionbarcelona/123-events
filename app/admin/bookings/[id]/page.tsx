'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, Clock, MapPin, User, Mail, Phone, Ticket, CreditCard, Gift, Download } from 'lucide-react'
import { formatPrice, safeFormatDate, safeFormatDateTime, safeFormatDateTimeShort } from '@/lib/utils'

interface BookingDetail {
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
    id: string
    title: string
    description: string
    date: string
    time: string
    location: string
    price: number
  }
  customer: {
    name: string
    email: string
    phone?: string
  }
  tickets: Array<{
    id: string
    ticketCode: string
    status: string
    usedAt?: string
  }>
  formResponses?: Array<{
    id: string
    value: string
    field: {
      label: string
      fieldName: string
      fieldType: string
    }
  }>
}

export default function BookingDetailPage() {
  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const params = useParams()
  const bookingId = params.id as string

  useEffect(() => {
    const fetchBookingDetail = async () => {
      try {
        const response = await fetch(`/api/admin/bookings/${bookingId}`, { 
          cache: 'no-store' 
        })
        
        if (response.ok) {
          const data = await response.json()
          setBooking(data.booking)
        } else {
          console.error('Error fetching booking details:', response.statusText)
        }
      } catch (error) {
        console.error('Error fetching booking details:', error)
      } finally {
        setLoading(false)
      }
    }

    if (bookingId) {
      fetchBookingDetail()
    }
  }, [bookingId])

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

  const getPaymentMethodBadge = (method: string | undefined) => {
    if (!method) return null
    
    const variants = {
      card: 'bg-blue-100 text-blue-800',
      voucher: 'bg-purple-100 text-purple-800',
      mixed: 'bg-orange-100 text-orange-800'
    }
    
    const labels = {
      card: 'Tarjeta',
      voucher: 'Vale Regalo',
      mixed: 'Pago Mixto'
    }

    return (
      <Badge className={variants[method] || 'bg-gray-100 text-gray-800'}>
        {labels[method] || method}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Reserva no encontrada</h2>
            <p className="text-gray-600">La reserva que buscas no existe o ha sido eliminada.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Reserva {booking.bookingCode}
            </h1>
            <p className="text-gray-600">Detalles completos de la reserva</p>
          </div>
        </div>
        <div className="flex gap-2">
          {getStatusBadge(booking.paymentStatus)}
          {getPaymentMethodBadge(booking.paymentMethod)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información del Cliente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Nombre</label>
              <p className="text-sm font-semibold">{booking.customerName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="text-sm flex items-center">
                <Mail className="h-4 w-4 mr-1" />
                {booking.customerEmail}
              </p>
            </div>
            {booking.customerPhone && (
              <div>
                <label className="text-sm font-medium text-gray-500">Teléfono</label>
                <p className="text-sm flex items-center">
                  <Phone className="h-4 w-4 mr-1" />
                  {booking.customerPhone}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Información del Evento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Evento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Título</label>
              <p className="text-sm font-semibold">{booking.event.title}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Fecha y Hora</label>
              <p className="text-sm flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {safeFormatDateTime(booking.event.date, booking.event.time)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Ubicación</label>
              <p className="text-sm flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {booking.event.location}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Precio por ticket</label>
              <p className="text-sm font-semibold">{formatPrice(booking.event.price)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Información de Pago */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Pago
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Total</label>
              <p className="text-lg font-bold text-green-600">{formatPrice(booking.totalAmount)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Cantidad</label>
              <p className="text-sm">{booking.quantity} tickets</p>
            </div>
            
            {booking.paymentMethod === 'voucher' && booking.voucherAmount && (
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="flex items-center mb-2">
                  <Gift className="h-4 w-4 mr-2 text-purple-600" />
                  <label className="text-sm font-medium text-purple-800">Pagado con Vale</label>
                </div>
                <p className="text-sm font-semibold text-purple-600">
                  {formatPrice(booking.voucherAmount)}
                </p>
              </div>
            )}

            {booking.paymentMethod === 'mixed' && (
              <div className="bg-orange-50 p-3 rounded-lg space-y-2">
                <div className="flex items-center">
                  <Gift className="h-4 w-4 mr-2 text-orange-600" />
                  <label className="text-sm font-medium text-orange-800">Pago Mixto</label>
                </div>
                {booking.voucherAmount && (
                  <div className="flex justify-between text-sm">
                    <span>Vale regalo:</span>
                    <span className="font-semibold">{formatPrice(booking.voucherAmount)}</span>
                  </div>
                )}
                {booking.stripeAmount && (
                  <div className="flex justify-between text-sm">
                    <span>Tarjeta:</span>
                    <span className="font-semibold">{formatPrice(booking.stripeAmount)}</span>
                  </div>
                )}
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium text-gray-500">Estado</label>
              <div className="mt-1">
                {getStatusBadge(booking.paymentStatus)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tickets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Ticket className="h-5 w-5 mr-2" />
            Tickets ({booking.tickets.length})
          </CardTitle>
          <CardDescription>
            Lista de tickets generados para esta reserva
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {booking.tickets.map((ticket) => (
              <div key={ticket.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm font-semibold">{ticket.ticketCode}</span>
                  <Badge variant={ticket.status === 'valid' ? 'default' : 'secondary'}>
                    {ticket.status === 'valid' ? 'Válido' : ticket.status}
                  </Badge>
                </div>
                {ticket.usedAt && (
                  <p className="text-xs text-gray-600">
                    Usado: {safeFormatDateTimeShort(ticket.usedAt)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Respuestas del Formulario Personalizado */}
      {booking.formResponses && booking.formResponses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Información Adicional del Cliente</CardTitle>
            <CardDescription>
              Respuestas del formulario personalizado del evento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {booking.formResponses.map((response) => (
                <div key={response.id}>
                  <label className="text-sm font-medium text-gray-500">
                    {response.field.label}
                  </label>
                  <p className="text-sm mt-1">
                    {response.field.fieldType === 'checkbox' || response.field.fieldType === 'multiselect'
                      ? (() => {
                          try {
                            const parsed = JSON.parse(response.value)
                            return Array.isArray(parsed) ? parsed.join(', ') : response.value
                          } catch {
                            return response.value
                          }
                        })()
                      : response.value || '-'}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Información Adicional */}
      <Card>
        <CardHeader>
          <CardTitle>Información de la Reserva</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500">Fecha de creación</label>
              <p className="text-sm">{safeFormatDateTimeShort(booking.createdAt)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Última actualización</label>
              <p className="text-sm">{safeFormatDateTimeShort(booking.updatedAt)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">ID de reserva</label>
              <p className="text-sm font-mono">{booking.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Código de reserva</label>
              <p className="text-sm font-mono font-semibold">{booking.bookingCode}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}