'use client'

import { useState, useEffect, useMemo, memo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDebounce } from '@/lib/hooks'
import { Plus, Search, Filter, Edit, Trash2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatPrice, formatDate } from '@/lib/utils'

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
  price: number
  status: string
  createdAt: string
  _count?: {
    bookings: number
  }
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

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  
  // Debounce para optimizar búsquedas
  const debouncedSearch = useDebounce(search, 300)
  const router = useRouter()

  const fetchEvents = async () => {
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (statusFilter) params.set('status', statusFilter)
      if (categoryFilter) params.set('category', categoryFilter)
      // Añadir timestamp para evitar caché
      params.set('t', Date.now().toString())

      const response = await fetch(`/api/events?${params}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        }
      })
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events)
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
    
    // Auto-refresh cada 15 segundos para ver cambios en tiempo real
    const interval = setInterval(fetchEvents, 15000)
    
    return () => clearInterval(interval)
  }, [debouncedSearch, statusFilter, categoryFilter])

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este evento?')) {
      return
    }

    try {
      const response = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setEvents(events.filter(event => event.id !== id))
      } else {
        const error = await response.json()
        alert(error.error || 'Error al eliminar el evento')
      }
    } catch (error) {
      console.error('Error deleting event:', error)
      alert('Error al eliminar el evento')
    }
  }, [events])

  const handleStatusChange = useCallback(async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/events/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        const updatedEvent = await response.json()
        setEvents(events.map(event => 
          event.id === id ? { ...event, status: updatedEvent.status } : event
        ))
      }
    } catch (error) {
      console.error('Error updating event status:', error)
    }
  }, [events])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Eventos</h1>
          <p className="text-gray-600">Crea y gestiona todos tus eventos de misterio</p>
        </div>
        <Button
          onClick={() => router.push('/admin/events/new')}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nuevo Evento
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar eventos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los estados</SelectItem>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas las categorías</SelectItem>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => {
              setSearch('')
              setStatusFilter('')
              setCategoryFilter('')
            }}>
              <Filter className="w-4 h-4 mr-2" />
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de eventos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {events.map((event) => (
          <Card key={event.id} className="overflow-hidden">
            {event.imageUrl && (
              <div className="h-48 bg-gray-200">
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg line-clamp-2">{event.title}</CardTitle>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[event.status as keyof typeof statusColors]}`}>
                  {statusLabels[event.status as keyof typeof statusLabels]}
                </span>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600 line-clamp-2">{event.description}</p>
              
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Fecha:</span>
                  <span>{formatDate(new Date(event.date))} a las {event.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Categoría:</span>
                  <span>{categoryLabels[event.category as keyof typeof categoryLabels]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Capacidad:</span>
                  <span>{event.availableTickets}/{event.capacity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Precio:</span>
                  <span className="font-semibold">{formatPrice(event.price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Reservas:</span>
                  <span>{event._count?.bookings || 0}</span>
                </div>
              </div>

              <div className="pt-3 border-t space-y-2">
                <Select onValueChange={(value) => handleStatusChange(event.id, value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Cambiar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <SelectItem 
                        key={value} 
                        value={value}
                        disabled={value === event.status}
                      >
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => router.push(`/admin/events/${event.id}/edit`)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/admin/events/${event.id}`)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(event.id)}
                    disabled={event._count?.bookings && event._count.bookings > 0}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {events.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Plus className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay eventos</h3>
          <p className="text-gray-600 mb-4">
            {search || statusFilter || categoryFilter 
              ? 'No se encontraron eventos con los filtros aplicados'
              : 'Crea tu primer evento para empezar'
            }
          </p>
          <Button onClick={() => router.push('/admin/events/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Crear Primer Evento
          </Button>
        </div>
      )}
    </div>
  )
}