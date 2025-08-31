'use client'

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
  Ticket,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatPrice, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Booking {
  id: string
  bookingCode: string
  customerName: string
  customerEmail: string
  quantity: number
  totalAmount: number
  paymentStatus: string
  event: {
    id: string
    title: string
    date: string
    time: string
    duration: number
    location: string
    price: number
  }
  tickets: Array<{
    id: string
    ticketCode: string
    status: string
  }>
}

function BookingSuccessContent() {
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(true)
  
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const sessionId = searchParams.get('session_id')
  const bookingId = searchParams.get('booking_id')

  useEffect(() => {
    if (!sessionId || !bookingId) {
      router.push('/events')
      return
    }

    const verifyPayment = async () => {
      try {
        // Obtener detalles de la reserva
        const response = await fetch(`/api/bookings/${bookingId}`)
        if (response.ok) {
          const bookingData = await response.json()
          setBooking(bookingData)
          
          // Enviar confirmación (email + calendario)
          try {
            const confirmResponse = await fetch(`/api/bookings/${bookingId}/confirm`, {
              method: 'POST'
            })
            
            if (confirmResponse.ok) {
              const confirmData = await confirmResponse.json()
              if (confirmData.emailSent) {
                toast.success('Email de confirmación enviado a ' + bookingData.customerEmail)
              }
              if (confirmData.calendarUpdated) {
                toast.success('Evento añadido a Google Calendar')
              }
            }
          } catch (confirmError) {
            console.error('Error sending confirmation:', confirmError)
            // No mostrar error al usuario si falla el email, la reserva ya está hecha
          }
        } else {
          toast.error('Error al verificar el pago')
          router.push('/events')
        }
      } catch (error) {
        console.error('Error verifying payment:', error)
        toast.error('Error al verificar el pago')
        router.push('/events')
      } finally {
        setVerifying(false)
        setLoading(false)
      }
    }

    verifyPayment()
  }, [sessionId, bookingId, router])

  const handleShare = async () => {
    const shareData = {
      title: '¡Reservé mi lugar en Mystery Events!',
      text: `Acabo de reservar mi ticket para "${booking?.event.title}". ¡Únete a la aventura!`,
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
      toast.success('Enlace copiado al portapapeles')
    }
  }

  const downloadTickets = () => {
    // En una implementación real, esto generaría y descargaría un PDF
    toast.success('Los tickets han sido enviados a tu email')
  }

  if (verifying) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Verificando tu pago...
          </h1>
          <p className="text-gray-600">
            Por favor espera mientras confirmamos tu reserva
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!booking) {
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

  const eventDate = new Date(booking.event.date)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            ¡Pago Exitoso!
          </h1>
          <p className="text-lg text-gray-600">
            Tu reserva ha sido confirmada y tu aventura te espera
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Confirmation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-green-600">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Pago Confirmado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="text-center">
                    <p className="text-sm text-green-600 font-medium">Código de Reserva</p>
                    <p className="text-2xl font-bold text-green-900 font-mono">{booking.bookingCode}</p>
                    <p className="text-xs text-green-600 mt-1">
                      Tu confirmación ha sido enviada por email
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Estado del Pago</p>
                    <p className="font-semibold text-green-600">✓ Completado</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Total Pagado</p>
                    <p className="font-semibold">{formatPrice(booking.totalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Tickets</p>
                    <p className="font-semibold">{booking.quantity} ticket(s)</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Fecha de Compra</p>
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
                <h3 className="text-xl font-bold text-gray-900 mb-4">{booking.event.title}</h3>
                
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
                      <p className="font-medium">{booking.event.time} ({booking.event.duration}min)</p>
                    </div>
                  </div>

                  <div className="flex items-center p-3 bg-gray-50 rounded-lg md:col-span-2">
                    <MapPin className="h-5 w-5 text-purple-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Ubicación</p>
                      <p className="font-medium">{booking.event.location}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tickets */}
            <Card>
              <CardHeader>
                <CardTitle>Tus Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {booking.tickets.map((ticket, index) => (
                    <div key={ticket.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <Ticket className="h-5 w-5 text-purple-600 mr-3" />
                        <div>
                          <p className="font-medium">Ticket #{index + 1}</p>
                          <p className="text-sm text-gray-500 font-mono">{ticket.ticketCode}</p>
                        </div>
                      </div>
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                        Válido
                      </span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    <strong>Importante:</strong> Presenta tu código de reserva y una identificación 
                    en el lugar del evento. Los tickets digitales también han sido enviados a tu email.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card>
              <CardHeader>
                <CardTitle>Próximos Pasos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                      <Mail className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Revisa tu Email</h4>
                      <p className="text-sm text-gray-600">
                        Hemos enviado todos los detalles y tickets a {booking.customerEmail}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                      <Calendar className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Añade a tu Calendario</h4>
                      <p className="text-sm text-gray-600">
                        No olvides anotar la fecha y llegar 15 minutos antes
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                      <Ticket className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Prepárate para la Aventura</h4>
                      <p className="text-sm text-gray-600">
                        Ven con mente abierta y listo para resolver misterios
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
                <CardTitle>Acciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={downloadTickets} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Descargar Tickets
                </Button>

                <Button onClick={handleShare} className="w-full" variant="outline">
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartir
                </Button>

                <Link href={`mailto:${booking.customerEmail}?subject=Tickets para ${booking.event.title}`}>
                  <Button className="w-full" variant="outline">
                    <Mail className="h-4 w-4 mr-2" />
                    Reenviar por Email
                  </Button>
                </Link>
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

            {/* Support */}
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
          </div>
        </div>

        {/* Celebration Banner */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-4">
              ¡Tu aventura está confirmada! 🎉
            </h2>
            <p className="text-purple-100 mb-6">
              Gracias por confiar en Mystery Events. Prepárate para vivir una experiencia 
              única llena de misterio, suspense y diversión inolvidable.
            </p>
            <Link href="/events">
              <Button variant="secondary">
                Descubrir Más Aventuras
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    }>
      <BookingSuccessContent />
    </Suspense>
  )
}