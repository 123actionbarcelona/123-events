'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users,
  Star,
  Share2,
  Heart,
  ArrowLeft,
  CheckCircle,
  Info,
  Ticket
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatPrice, formatDate } from '@/lib/utils'
import EventImage from '@/components/public/event-image'
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
  price: number
  minTickets: number
  maxTickets: number
  status: string
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

const categoryDescriptions = {
  murder: 'Sumérgete en un misterioso caso de asesinato y usa tus habilidades detectivescas para resolver el crimen.',
  escape: 'Trabaja en equipo para resolver acertijos y escapar antes de que se acabe el tiempo.',
  detective: 'Conviértete en un detective privado y resuelve casos complejos usando pistas y evidencias.',
  horror: 'Vive una experiencia de terror inmersiva que pondrá a prueba tus nervios.',
}

export default function EventDetailPage({ params }: PageProps) {
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTickets, setSelectedTickets] = useState(2)
  const [isFavorite, setIsFavorite] = useState(false)
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
        // Añadir timestamp para evitar caché
        const response = await fetch(`/api/events/${eventId}?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          }
        })
        if (response.ok) {
          const eventData = await response.json()
          setEvent(eventData)
          // Establecer la cantidad mínima de tickets
          if (eventData.minTickets && eventData.minTickets > 1) {
            setSelectedTickets(eventData.minTickets)
          }
        } else {
          toast.error('Evento no encontrado')
          router.push('/events')
        }
      } catch (error) {
        console.error('Error fetching event:', error)
        toast.error('Error al cargar el evento')
        router.push('/events')
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
    
    // Auto-refresh cada 30 segundos para actualizar disponibilidad
    const interval = setInterval(fetchEvent, 30000)
    
    return () => clearInterval(interval)
  }, [eventId, router])

  const handleBooking = () => {
    if (!event) return
    
    // Redirigir al proceso de reserva
    router.push(`/booking/${event.id}?tickets=${selectedTickets}`)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event?.title,
          text: event?.description,
          url: window.location.href,
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      toast.success('Enlace copiado al portapapeles')
    }
  }

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite)
    toast.success(isFavorite ? 'Eliminado de favoritos' : 'Añadido a favoritos')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-32 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="h-96 bg-gray-200 rounded-lg mb-6"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
              <div className="h-96 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!event) {
    return null
  }

  const isAvailable = event.availableTickets > 0 && event.status === 'active'
  const eventDate = new Date(event.date)
  const isEventPast = eventDate < new Date()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a eventos
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Event Image */}
            <div className="h-96 rounded-lg overflow-hidden mb-6 relative">
              <EventImage
                src={event.imageUrl}
                alt={event.title}
                category={event.category}
                className="w-full h-full"
              />
            </div>

            {/* Event Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-3">
                  <span className="bg-purple-100 text-purple-800 text-sm font-medium px-3 py-1 rounded-full">
                    {categoryLabels[event.category as keyof typeof categoryLabels]}
                  </span>
                  <div className="flex items-center text-yellow-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm text-gray-600 ml-1">4.8 (124 reseñas)</span>
                  </div>
                </div>
                
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  {event.title}
                </h1>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleFavorite}
                  className={isFavorite ? 'text-red-500 border-red-500' : ''}
                >
                  <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                </Button>
                <Button variant="outline" size="icon" onClick={handleShare}>
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Event Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="flex items-center p-4 bg-white rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Fecha</p>
                  <p className="font-medium">{formatDate(eventDate)}</p>
                </div>
              </div>

              <div className="flex items-center p-4 bg-white rounded-lg">
                <Clock className="h-5 w-5 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Hora</p>
                  <p className="font-medium">{event.time} ({event.duration}min)</p>
                </div>
              </div>

              <div className="flex items-center p-4 bg-white rounded-lg">
                <MapPin className="h-5 w-5 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Ubicación</p>
                  <p className="font-medium text-sm">{event.location}</p>
                </div>
              </div>

              <div className="flex items-center p-4 bg-white rounded-lg">
                <Users className="h-5 w-5 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Capacidad</p>
                  <p className="font-medium">{event.capacity - event.availableTickets}/{event.capacity}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Descripción del Evento</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-4">
                  {event.description}
                </p>
                
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 text-purple-600 mr-3 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-purple-900 mb-2">
                        Sobre {categoryLabels[event.category as keyof typeof categoryLabels]}
                      </h4>
                      <p className="text-purple-800 text-sm">
                        {categoryDescriptions[event.category as keyof typeof categoryDescriptions]}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* What to Expect */}
            <Card>
              <CardHeader>
                <CardTitle>Qué Incluye</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>Experiencia completa de {event.duration} minutos</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>Actor profesional como guía</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>Todas las pistas y materiales</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>Certificado de participación</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>Fotografías del evento</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>Soporte durante toda la experiencia</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <Card>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {formatPrice(event.price)}
                  </div>
                  <p className="text-gray-500">por persona</p>
                </div>

                {isEventPast ? (
                  <div className="text-center p-4 bg-gray-100 rounded-lg">
                    <p className="text-gray-600 font-medium">Este evento ya ha terminado</p>
                  </div>
                ) : !isAvailable ? (
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-red-600 font-medium">
                      {event.status === 'soldout' ? 'Entradas agotadas' : 'Evento no disponible'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Ticket Selector */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Número de tickets
                        {event.minTickets > 1 && (
                          <span className="text-xs text-gray-500 ml-2">
                            (Mínimo: {event.minTickets})
                          </span>
                        )}
                      </label>
                      <select
                        value={selectedTickets}
                        onChange={(e) => setSelectedTickets(Number(e.target.value))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        {(() => {
                          const min = event.minTickets || 2
                          const max = Math.min(event.availableTickets, event.maxTickets || 10)
                          const options = []
                          for (let i = min; i <= max; i++) {
                            options.push(
                              <option key={i} value={i}>
                                {i} {i === 1 ? 'ticket' : 'tickets'}
                              </option>
                            )
                          }
                          return options
                        })()}
                      </select>
                    </div>

                    {/* Total */}
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <span className="font-medium">Total:</span>
                      <span className="text-xl font-bold">
                        {formatPrice(event.price * selectedTickets)}
                      </span>
                    </div>

                    {/* Book Button */}
                    <Button 
                      onClick={handleBooking}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-lg py-3"
                      size="lg"
                    >
                      <Ticket className="h-5 w-5 mr-2" />
                      Reservar Ahora
                    </Button>

                    <p className="text-xs text-gray-500 text-center">
                      Pago seguro con Stripe. Confirmación instantánea.
                    </p>
                  </div>
                )}

                {/* Availability Info */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Disponibilidad:</span>
                    <span className={`font-medium ${
                      event.availableTickets > 5 ? 'text-green-600' : 
                      event.availableTickets > 0 ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      {event.availableTickets > 0 
                        ? `${event.availableTickets} plazas disponibles`
                        : 'Agotado'
                      }
                    </span>
                  </div>
                  
                  {event.availableTickets > 0 && event.availableTickets <= 5 && (
                    <p className="text-orange-600 text-xs mt-2">
                      ¡Solo quedan {event.availableTickets} plazas!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card className="mt-6">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">¿Necesitas ayuda?</h3>
                <div className="space-y-3 text-sm">
                  <p>
                    <span className="text-gray-500">Email:</span><br />
                    <a href="mailto:info@mysteryevents.com" className="text-purple-600 hover:underline">
                      info@mysteryevents.com
                    </a>
                  </p>
                  <p>
                    <span className="text-gray-500">Teléfono:</span><br />
                    <a href="tel:+34900123456" className="text-purple-600 hover:underline">
                      +34 900 123 456
                    </a>
                  </p>
                  <p className="text-xs text-gray-400">
                    Horario: Lunes a Viernes, 9:00 - 18:00
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}