'use client'

export const dynamic = 'force-dynamic'
export const dynamicParams = true
export const revalidate = 0

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  CheckCircle, 
  Calendar, 
  Clock, 
  MapPin, 
  Mail,
  Download,
  Share2,
  ArrowRight,
  Home,
  Ticket
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatPrice, formatDate } from '@/lib/utils'

interface Event {
  id: string
  title: string
  date: string
  time: string
  duration: number
  location: string
  price: number
}

function BookingConfirmationContent() {
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const bookingCode = searchParams.get('code')
  const eventId = searchParams.get('event')

  useEffect(() => {
    if (!bookingCode || !eventId) {
      router.push('/events')
      return
    }

    const fetchEvent = async () => {
      try {
        const response = await fetch(`/api/events/${eventId}`)
        if (response.ok) {
          const eventData = await response.json()
          setEvent(eventData)
        }
      } catch (error) {
        console.error('Error fetching event:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
  }, [bookingCode, eventId, router])

  const handleShare = async () => {
    const shareData = {
      title: '¡Reservé mi lugar en Mystery Events!',
      text: `Acabo de reservar mi ticket para "${event?.title}". ¡Únete a la aventura!`,
      url: window.location.origin,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      navigator.clipboard.writeText(shareData.url)
    }
  }

  const downloadTickets = () => {
    // En una implementación real, esto generaría y descargaría un PDF
    alert('Función de descarga en desarrollo. Los tickets llegarán por email.')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!bookingCode || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Reserva no encontrada</h1>
          <Link href="/events">
            <Button>Volver a eventos</Button>
          </Link>
        </div>
      </div>
    )
  }

  const eventDate = new Date(event.date)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            ¡Reserva Confirmada!
          </h1>
          <p className="text-lg text-gray-600">
            Tu aventura de misterio está asegurada
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Booking Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Ticket className="h-5 w-5 mr-2" />
                  Detalles de tu Reserva
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="text-center">
                    <p className="text-sm text-purple-600 font-medium">Código de Reserva</p>
                    <p className="text-2xl font-bold text-purple-900 font-mono">{bookingCode}</p>
                    <p className="text-xs text-purple-600 mt-1">
                      Guarda este código para futuras consultas
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Estado del Pago</p>
                    <p className="font-semibold text-green-600">✓ Completado</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Método de Pago</p>
                    <p className="font-semibold">Tarjeta •••• 4242</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Pagado</p>
                    <p className="font-semibold">{formatPrice(event.price)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Fecha de Reserva</p>
                    <p className="font-semibold">{new Date().toLocaleDateString('es-ES')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Event Details */}
            <Card>
              <CardHeader>
                <CardTitle>Detalles del Evento</CardTitle>
              </CardHeader>
              <CardContent>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{event.title}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-purple-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Fecha</p>
                      <p className="font-medium">{formatDate(eventDate)}</p>
                    </div>
                  </div>

                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <Clock className="h-5 w-5 text-purple-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Hora</p>
                      <p className="font-medium">{event.time} ({event.duration}min)</p>
                    </div>
                  </div>

                  <div className="flex items-center p-3 bg-gray-50 rounded-lg md:col-span-2">
                    <MapPin className="h-5 w-5 text-purple-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Ubicación</p>
                      <p className="font-medium">{event.location}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* What's Next */}
            <Card>
              <CardHeader>
                <CardTitle>¿Qué sigue ahora?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-purple-600 font-semibold text-sm">1</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Confirmación por Email</h4>
                      <p className="text-sm text-gray-600">
                        Recibirás un email con todos los detalles y tu ticket digital en los próximos minutos.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-purple-600 font-semibold text-sm">2</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Recordatorio 24h Antes</h4>
                      <p className="text-sm text-gray-600">
                        Te enviaremos un recordatorio con instrucciones específicas del evento.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-purple-600 font-semibold text-sm">3</span>
                    </div>
                    <div>
                      <h4 className="font-medium">¡Llega 15 minutos antes!</h4>
                      <p className="text-sm text-gray-600">
                        Presenta tu ticket digital y una identificación en el lugar del evento.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={downloadTickets} className="w-full" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Descargar Tickets
                </Button>

                <Button onClick={handleShare} className="w-full" variant="outline">
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartir Experiencia
                </Button>

                <Link href="/booking/status">
                  <Button className="w-full" variant="outline">
                    <Mail className="h-4 w-4 mr-2" />
                    Consultar Reserva
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Contact Support */}
            <Card>
              <CardHeader>
                <CardTitle>¿Necesitas Ayuda?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  Si tienes alguna pregunta sobre tu reserva:
                </p>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium">Email:</span><br />
                    <a href="mailto:soporte@mysteryevents.com" className="text-purple-600 hover:underline">
                      soporte@mysteryevents.com
                    </a>
                  </p>
                  <p>
                    <span className="font-medium">Teléfono:</span><br />
                    <a href="tel:+34900123456" className="text-purple-600 hover:underline">
                      +34 900 123 456
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <Card>
              <CardContent className="pt-6 space-y-3">
                <Link href="/events">
                  <Button className="w-full">
                    <Calendar className="h-4 w-4 mr-2" />
                    Ver Más Eventos
                  </Button>
                </Link>

                <Link href="/">
                  <Button className="w-full" variant="outline">
                    <Home className="h-4 w-4 mr-2" />
                    Ir al Inicio
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Success Message */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-4">
              ¡Prepárate para una experiencia inolvidable! 🎭
            </h2>
            <p className="text-purple-100 mb-6">
              Has dado el primer paso hacia una aventura llena de misterio, suspense y diversión. 
              Nuestro equipo está emocionado de recibirte.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/events">
                <Button variant="secondary">
                  Explorar Más Eventos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BookingConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    }>
      <BookingConfirmationContent />
    </Suspense>
  )
}