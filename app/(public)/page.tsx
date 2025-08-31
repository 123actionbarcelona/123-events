'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowRight, 
  Calendar, 
  MapPin, 
  Clock,
  Users,
  Star,
  Search,
  Filter
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatPrice, formatDate } from '@/lib/utils'

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

export default function HomePage() {
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFeaturedEvents = async () => {
      try {
        const response = await fetch('/api/events?limit=3&status=active')
        if (response.ok) {
          const data = await response.json()
          setFeaturedEvents(data.events || [])
        }
      } catch (error) {
        console.error('Error fetching featured events:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedEvents()
  }, [])

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-900 via-blue-900 to-black overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Vive el
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent"> Misterio</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Experimenta eventos únicos de murder mystery, escape rooms y aventuras de detective 
              que desafiarán tu mente y te mantendrán al borde de tu asiento.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/events">
                <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-lg px-8 py-3">
                  Explorar Eventos
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-black text-lg px-8 py-3">
                Ver Trailer
              </Button>
            </div>
          </div>
        </div>
        
        {/* Floating elements */}
        <div className="absolute top-20 left-10 text-6xl animate-pulse opacity-20">🕵️</div>
        <div className="absolute top-40 right-20 text-4xl animate-bounce opacity-20">🗝️</div>
        <div className="absolute bottom-20 left-20 text-5xl animate-pulse opacity-20">🔍</div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Tipos de Experiencias
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Desde misterios de asesinatos hasta escape rooms terroríficos, 
              tenemos la aventura perfecta para ti.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {Object.entries(categoryLabels).map(([key, label]) => (
              <Link
                key={key}
                href={`/events?category=${key}`}
                className="group"
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1">
                  <CardContent className="p-6 text-center">
                    <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">
                      {categoryIcons[key as keyof typeof categoryIcons]}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{label}</h3>
                    <p className="text-gray-600 text-sm mb-4">
                      {key === 'murder' && 'Resuelve crímenes fascinantes'}
                      {key === 'escape' && 'Escapa antes de que se acabe el tiempo'}
                      {key === 'detective' && 'Conviértete en un detective privado'}
                      {key === 'horror' && 'Vive experiencias de terror'}
                    </p>
                    <div className="flex items-center justify-center text-purple-600 font-medium">
                      Explorar
                      <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Eventos Destacados
              </h2>
              <p className="text-lg text-gray-600">
                Los eventos más populares y próximos
              </p>
            </div>
            <Link href="/events">
              <Button variant="outline">
                Ver Todos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="h-48 bg-gray-200 animate-pulse"></div>
                  <CardContent className="p-6">
                    <div className="h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : featuredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredEvents.map((event) => (
                <Link key={event.id} href={`/events/${event.id}`} className="group">
                  <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1">
                    {event.imageUrl && (
                      <div className="h-48 bg-gray-200 overflow-hidden">
                        <img
                          src={event.imageUrl}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full">
                          {categoryLabels[event.category as keyof typeof categoryLabels]}
                        </span>
                        <div className="flex items-center text-yellow-500">
                          <Star className="h-4 w-4 fill-current" />
                          <span className="text-sm text-gray-600 ml-1">4.8</span>
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                        {event.title}
                      </h3>
                      
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {event.description}
                      </p>

                      <div className="space-y-2 text-sm text-gray-500 mb-4">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span>{formatDate(new Date(event.date))} a las {event.time}</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span>{event.availableTickets} plazas disponibles</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-2xl font-bold text-gray-900">
                            {formatPrice(event.price)}
                          </span>
                          <span className="text-gray-500 text-sm ml-1">por persona</span>
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
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Próximamente</h3>
              <p className="text-gray-600">
                Estamos preparando eventos increíbles para ti. ¡Vuelve pronto!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-white mb-2">500+</div>
              <div className="text-purple-200">Eventos Realizados</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">10K+</div>
              <div className="text-purple-200">Clientes Satisfechos</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">4.9</div>
              <div className="text-purple-200">Rating Promedio</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">15</div>
              <div className="text-purple-200">Ciudades</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            ¿Listo para tu próxima aventura?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Únete a miles de aventureros que ya han vivido experiencias únicas con nosotros.
          </p>
          <Link href="/events">
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-lg px-8 py-3">
              Explorar Todos los Eventos
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}