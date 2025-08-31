'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Search, 
  Filter, 
  Calendar, 
  MapPin, 
  Users,
  Star,
  SlidersHorizontal,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatPrice, formatDate } from '@/lib/utils'
import EventImage from '@/components/public/event-image'

interface Event {
  id: string
  title: string
  description: string
  category: string
  imageUrl?: string
  date: string
  time: string
  location: string
  capacity: number
  availableTickets: number
  price: number
}

interface EventsResponse {
  events: Event[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const categoryLabels = {
  murder: 'Murder Mystery',
  escape: 'Escape Room',
  detective: 'Detective',
  horror: 'Terror/Horror',
}

const categoryIcons = {
  murder: '🕵️',
  escape: '🗝️',
  detective: '🔍',
  horror: '👻',
}

export default function EventsPage() {
  const [eventsData, setEventsData] = useState<EventsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    sortBy: 'date',
    page: 1,
  })

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.search) params.set('search', filters.search)
      if (filters.category) params.set('category', filters.category)
      params.set('page', filters.page.toString())
      params.set('limit', '12')
      params.set('status', 'active') // Solo eventos activos para el público

      const response = await fetch(`/api/events?${params}`)
      if (response.ok) {
        const data = await response.json()
        setEventsData(data)
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [filters])

  useEffect(() => {
    // Sincronizar con URL params
    const params = new URLSearchParams()
    if (filters.search) params.set('search', filters.search)
    if (filters.category) params.set('category', filters.category)
    
    const newUrl = params.toString() ? `/events?${params}` : '/events'
    window.history.replaceState({}, '', newUrl)
  }, [filters.search, filters.category])

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset page when filters change
    }))
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      sortBy: 'date',
      page: 1,
    })
  }

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const activeFiltersCount = [filters.search, filters.category].filter(Boolean).length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Todos los Eventos
            </h1>
            <p className="text-xl md:text-2xl text-purple-100 max-w-3xl mx-auto">
              Descubre experiencias únicas de misterio, escape rooms y aventuras de detective
            </p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar eventos..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <div className="w-full lg:w-64">
              <Select 
                value={filters.category} 
                onValueChange={(value) => handleFilterChange('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas las categorías</SelectItem>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <span>{categoryIcons[key as keyof typeof categoryIcons]}</span>
                        {label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <div className="w-full lg:w-48">
              <Select 
                value={filters.sortBy} 
                onValueChange={(value) => handleFilterChange('sortBy', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Fecha</SelectItem>
                  <SelectItem value="price">Precio</SelectItem>
                  <SelectItem value="popularity">Popularidad</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            {activeFiltersCount > 0 && (
              <Button variant="outline" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Limpiar ({activeFiltersCount})
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Results Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {loading ? 'Cargando...' : `${eventsData?.pagination.total || 0} eventos encontrados`}
              </h2>
              {activeFiltersCount > 0 && (
                <p className="text-gray-600 mt-1">
                  Filtros aplicados: {activeFiltersCount}
                </p>
              )}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(12)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="h-48 bg-gray-200 animate-pulse"></div>
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded animate-pulse mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4 mb-3"></div>
                    <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : eventsData?.events && eventsData.events.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {eventsData.events.map((event) => (
                  <Link key={event.id} href={`/events/${event.id}`} className="group">
                    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1">
                      <div className="h-48 relative">
                        <EventImage
                          src={event.imageUrl}
                          alt={event.title}
                          category={event.category}
                          className="h-full w-full group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full">
                            {categoryLabels[event.category as keyof typeof categoryLabels]}
                          </span>
                          <div className="flex items-center text-yellow-500">
                            <Star className="h-3 w-3 fill-current" />
                            <span className="text-xs text-gray-600 ml-1">4.8</span>
                          </div>
                        </div>
                        
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors line-clamp-2">
                          {event.title}
                        </h3>

                        <div className="space-y-1 text-xs text-gray-500 mb-3">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                            <span>{formatDate(new Date(event.date))}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                            <span className="truncate">{event.location}</span>
                          </div>
                          <div className="flex items-center">
                            <Users className="h-3 w-3 mr-1 flex-shrink-0" />
                            <span>{event.availableTickets} disponibles</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-lg font-bold text-gray-900">
                              {formatPrice(event.price)}
                            </span>
                          </div>
                          <Button size="sm" className="group-hover:bg-purple-700">
                            Reservar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {eventsData.pagination.totalPages > 1 && (
                <div className="flex justify-center mt-12">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(filters.page - 1)}
                      disabled={filters.page <= 1}
                    >
                      Anterior
                    </Button>
                    
                    {[...Array(eventsData.pagination.totalPages)].map((_, i) => {
                      const page = i + 1
                      if (
                        page === 1 ||
                        page === eventsData.pagination.totalPages ||
                        (page >= filters.page - 2 && page <= filters.page + 2)
                      ) {
                        return (
                          <Button
                            key={page}
                            variant={filters.page === page ? "default" : "outline"}
                            onClick={() => handlePageChange(page)}
                            className="w-10"
                          >
                            {page}
                          </Button>
                        )
                      } else if (
                        page === filters.page - 3 ||
                        page === filters.page + 3
                      ) {
                        return <span key={page} className="px-2">...</span>
                      }
                      return null
                    })}

                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(filters.page + 1)}
                      disabled={filters.page >= eventsData.pagination.totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <div className="text-gray-400 mb-4">
                <Search className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                No encontramos eventos
              </h3>
              <p className="text-gray-600 mb-6">
                {activeFiltersCount > 0 
                  ? 'Prueba a cambiar los filtros o buscar algo diferente'
                  : 'No hay eventos disponibles en este momento'
                }
              </p>
              {activeFiltersCount > 0 && (
                <Button onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}