'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Euro, 
  Tag, 
  Edit, 
  Trash2,
  Mail,
  Ticket,
  TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatPrice, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Event {
  id: string
  title: string
  description: string
  category: string
  imageUrl?: string
  date: string
  time: string
  duration: number
  location: string
  capacity: number
  availableTickets: number
  bookedTickets: number
  price: number
  status: string
  createdAt: string
  bookings?: any[]
}

interface PageProps {
  params: Promise<{ id: string }>
}

const categoryLabels = {
  murder: 'Murder Mystery',
  escape: 'Escape Room',
  detective: 'Detective',
  horror: 'Terror/Horror',
}

const statusLabels = {
  draft: 'Borrador',
  active: 'Activo',
  soldout: 'Agotado',
  cancelled: 'Cancelado',
}

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  active: 'bg-green-100 text-green-800',
  soldout: 'bg-orange-100 text-orange-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function EventDetailPage({ params }: PageProps) {
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [eventId, setEventId] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setEventId(resolvedParams.id)
    }
    getParams()
  }, [params])

  useEffect(() => {
    if (!eventId) return
    
    const fetchEvent = async () => {
      try {
        const response = await fetch(`/api/events/${eventId}`)
        if (response.ok) {
          const eventData = await response.json()
          setEvent(eventData)
        } else {
          toast.error('Evento no encontrado')
          router.push('/admin/events')
        }
      } catch (error) {
        console.error('Error fetching event:', error)
        toast.error('Error al cargar el evento')
        router.push('/admin/events')
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
  }, [eventId, router])

  const handleDelete = async () => {
    if (!event) return
    
    if (!confirm('¿Estás seguro de que quieres eliminar este evento?')) {
      return
    }

    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Evento eliminado exitosamente')
        router.push('/admin/events')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al eliminar el evento')
      }
    } catch (error) {
      console.error('Error deleting event:', error)
      toast.error('Error al eliminar el evento')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!event) {
    return null
  }

  const occupancyPercentage = (event.bookedTickets / event.capacity) * 100
  const totalRevenue = event.bookings?.reduce((total, booking) => {
    return total + (booking.paymentStatus === 'completed' ? booking.totalAmount : 0)
  }, 0) || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[event.status as keyof typeof statusColors]}`}>
              {statusLabels[event.status as keyof typeof statusLabels]}
            </span>
            <span className="text-gray-500">
              {categoryLabels[event.category as keyof typeof categoryLabels]}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/events/${event.id}/edit`)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={event.bookings && event.bookings.length > 0}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Eliminar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Imagen y descripción */}
          <Card>
            <CardContent className="pt-6">
              {event.imageUrl && (
                <div className="mb-6">
                  <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold mb-3">Descripción</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Detalles del evento */}
          <Card>
            <CardHeader>
              <CardTitle>Detalles del Evento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{formatDate(new Date(event.date))}</p>
                    <p className="text-sm text-gray-500">Fecha del evento</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{event.time} ({event.duration} min)</p>
                    <p className="text-sm text-gray-500">Hora y duración</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{event.location}</p>
                    <p className="text-sm text-gray-500">Ubicación</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Euro className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{formatPrice(event.price)}</p>
                    <p className="text-sm text-gray-500">Precio por ticket</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Estadísticas */}
        <div className="space-y-6">
          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{event.bookedTickets}</p>
                <p className="text-sm text-gray-500">Tickets vendidos</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <Ticket className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{event.availableTickets}</p>
                <p className="text-sm text-gray-500">Disponibles</p>
              </CardContent>
            </Card>
          </div>

          {/* Ocupación */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ocupación</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Progreso</span>
                  <span>{occupancyPercentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(occupancyPercentage, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{event.bookedTickets} / {event.capacity}</span>
                  <span>Capacidad total</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ingresos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ingresos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span className="text-2xl font-bold">{formatPrice(totalRevenue)}</span>
                </div>
                <p className="text-sm text-gray-500">Total generado</p>
                <p className="text-xs text-gray-400 mt-1">
                  Potencial: {formatPrice(event.capacity * event.price)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Acciones rápidas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" variant="outline">
                <Mail className="w-4 h-4 mr-2" />
                Enviar Recordatorio
              </Button>
              <Button className="w-full" variant="outline">
                <Calendar className="w-4 h-4 mr-2" />
                Sincronizar Calendar
              </Button>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => router.push(`/admin/bookings?event=${event.id}`)}
              >
                <Ticket className="w-4 h-4 mr-2" />
                Ver Reservas
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}