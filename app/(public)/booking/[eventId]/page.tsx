'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users,
  Mail,
  Phone,
  User,
  ArrowLeft,
  Lock,
  Shield,
  CreditCard
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { formatPrice, formatDate } from '@/lib/utils'
import { VoucherValidator, useVoucherValidator } from '@/components/public/voucher-validator'
import DynamicFormFields from '@/components/public/dynamic-form-fields'
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
  params: Promise<{ eventId: string }>
}

const createBookingSchema = (minTickets: number = 2, maxTickets: number = 10) => {
  return z.object({
    customerName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    customerEmail: z.string().email('Email inválido'),
    customerPhone: z.string().min(9, 'Teléfono inválido').optional().or(z.literal('')),
    quantity: z.number()
      .min(minTickets, `Mínimo ${minTickets} ticket${minTickets > 1 ? 's' : ''}`)
      .max(maxTickets, `Máximo ${maxTickets} tickets`),
    notes: z.string().optional(),
    acceptTerms: z.boolean().refine(val => val === true, 'Debes aceptar los términos'),
    acceptMarketing: z.boolean().optional(),
  })
}

type BookingFormData = z.infer<ReturnType<typeof createBookingSchema>>

export default function BookingPage({ params }: PageProps) {
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [eventId, setEventId] = useState<string>('')
  const [customFormData, setCustomFormData] = useState<Record<string, any>>({})
  const [customFormErrors, setCustomFormErrors] = useState<Record<string, string>>({})
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTickets = Number(searchParams.get('tickets')) || 2

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(
      createBookingSchema(
        event?.minTickets || 2,
        event?.maxTickets || 10
      )
    ),
    defaultValues: {
      quantity: Math.max(initialTickets, event?.minTickets || 2),
      acceptTerms: false,
      acceptMarketing: false,
    },
  })

  const watchQuantity = watch('quantity')
  
  // Hook para manejar vales regalo
  const {
    voucherData,
    isVoucherApplied,
    handleVoucherValidated,
    handleVoucherRemoved,
    getPaymentBreakdown
  } = useVoucherValidator()

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setEventId(resolvedParams.eventId)
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
          // Establecer la cantidad mínima como valor por defecto
          const minQty = eventData.minTickets || 2
          const currentQty = watch('quantity')
          if (currentQty < minQty) {
            setValue('quantity', minQty)
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
  }, [eventId, router])

  const onSubmit = async (data: BookingFormData) => {
    if (!event) return
    
    // Validar campos personalizados si existen
    const hasCustomErrors = Object.keys(customFormErrors).some(key => customFormErrors[key])
    if (hasCustomErrors) {
      toast.error('Por favor completa todos los campos obligatorios')
      return
    }
    
    setSubmitting(true)
    
    try {
      // Preparar datos de la reserva incluyendo información del vale y campos personalizados
      const bookingData = {
        eventId: event.id,
        ...data,
        // Añadir información del vale si está aplicado
        voucherCode: isVoucherApplied ? voucherData?.voucher?.code : undefined,
        paymentBreakdown: isVoucherApplied ? paymentBreakdown : undefined,
        // Añadir campos personalizados
        customFormData: customFormData
      }

      // Elegir endpoint según si hay vale aplicado o no
      const endpoint = isVoucherApplied 
        ? '/api/checkout/voucher' 
        : '/api/stripe/checkout'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al crear la sesión de pago')
      }

      const result = await response.json()
      
      // Manejar respuesta del nuevo endpoint de vouchers
      if (isVoucherApplied && result.paymentCompleted === true) {
        // Pago completamente con vale - redirigir directamente a éxito
        window.location.href = result.redirectUrl || `/booking/success?booking_id=${result.bookingId}`
      } else if (result.checkoutUrl) {
        // Pago mixto o sin vale - redirigir a Stripe
        window.location.href = result.checkoutUrl
      } else {
        throw new Error('Respuesta inválida del servidor')
      }
      
    } catch (error) {
      console.error('Error creating booking:', error)
      toast.error(error instanceof Error ? error.message : 'Error al procesar la reserva')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!event) {
    return null
  }

  const isAvailable = event.availableTickets >= watchQuantity && event.status === 'active'
  const totalPrice = event.price * watchQuantity
  const eventDate = new Date(event.date)
  
  // Calcular desglose de pago con vale
  const paymentBreakdown = getPaymentBreakdown(event?.id, totalPrice)

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
          Volver al evento
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Detalles de la Reserva
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Personal Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Información Personal</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="customerName">Nombre completo *</Label>
                        <div className="relative mt-1">
                          <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="customerName"
                            {...register('customerName')}
                            placeholder="Juan Pérez"
                            className="pl-10"
                          />
                        </div>
                        {errors.customerName && (
                          <p className="text-red-500 text-sm mt-1">{errors.customerName.message}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="customerEmail">Email *</Label>
                        <div className="relative mt-1">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="customerEmail"
                            type="email"
                            {...register('customerEmail')}
                            placeholder="juan@email.com"
                            className="pl-10"
                          />
                        </div>
                        {errors.customerEmail && (
                          <p className="text-red-500 text-sm mt-1">{errors.customerEmail.message}</p>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <Label htmlFor="customerPhone">Teléfono (opcional)</Label>
                        <div className="relative mt-1">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="customerPhone"
                            type="tel"
                            {...register('customerPhone')}
                            placeholder="+34 600 123 456"
                            className="pl-10"
                          />
                        </div>
                        {errors.customerPhone && (
                          <p className="text-red-500 text-sm mt-1">{errors.customerPhone.message}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Detalles de la Reserva</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="quantity">
                          Número de tickets * 
                          <span className="text-sm text-gray-500 ml-2">
                            (Mínimo: {event.minTickets || 2}, Máximo: {event.maxTickets || 10})
                          </span>
                        </Label>
                        <select
                          {...register('quantity', { valueAsNumber: true })}
                          className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                        {errors.quantity && (
                          <p className="text-red-500 text-sm mt-1">{errors.quantity.message}</p>
                        )}
                        {event.minTickets > 1 && (
                          <p className="text-sm text-gray-600 mt-1">
                            Este evento requiere una compra mínima de {event.minTickets} tickets.
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="notes">Notas adicionales (opcional)</Label>
                        <Textarea
                          id="notes"
                          {...register('notes')}
                          placeholder="Alergias, necesidades especiales, preguntas..."
                          rows={3}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Custom Form Fields */}
                  <DynamicFormFields
                    eventId={event.id}
                    values={customFormData}
                    errors={customFormErrors}
                    onChange={(fieldName, value) => {
                      setCustomFormData(prev => ({ ...prev, [fieldName]: value }))
                      // Clear error when field is filled
                      if (value) {
                        setCustomFormErrors(prev => {
                          const { [fieldName]: _, ...rest } = prev
                          return rest
                        })
                      }
                    }}
                  />

                  {/* Voucher Validator */}
                  <VoucherValidator
                    eventId={event.id}
                    amount={totalPrice}
                    onValidated={handleVoucherValidated}
                    onRemoved={handleVoucherRemoved}
                    showTitle={true}
                  />

                  {/* Terms and Conditions */}
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('acceptTerms')}
                        className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <label className="text-sm text-gray-700">
                        Acepto los{' '}
                        <span className="text-purple-600">
                          términos y condiciones
                        </span>{' '}
                        y la{' '}
                        <span className="text-purple-600">
                          política de privacidad
                        </span>
                        *
                      </label>
                    </div>
                    {errors.acceptTerms && (
                      <p className="text-red-500 text-sm">{errors.acceptTerms.message}</p>
                    )}

                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        {...register('acceptMarketing')}
                        className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <label className="text-sm text-gray-700">
                        Quiero recibir información sobre futuros eventos y ofertas especiales
                      </label>
                    </div>
                  </div>

                  {/* Payment Security Notice */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <Shield className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900 mb-1">Pago Seguro</h4>
                        <p className="text-blue-800 text-sm">
                          Tu pago será procesado de forma segura por Stripe. 
                          No almacenamos tu información de tarjeta de crédito.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={!isAvailable || submitting}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-lg py-3"
                    size="lg"
                  >
                    <Lock className="h-5 w-5 mr-2" />
                    {submitting ? 'Procesando...' : 
                      paymentBreakdown.stripeAmount > 0 
                        ? `Proceder al Pago - ${formatPrice(paymentBreakdown.stripeAmount)}`
                        : 'Confirmar Reserva - Gratis con Vale'
                    }
                  </Button>

                  {!isAvailable && (
                    <p className="text-red-600 text-center text-sm">
                      No hay suficientes tickets disponibles para esta cantidad
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <Card>
              <CardHeader>
                <CardTitle>Resumen del Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Event Details */}
                <div>
                  {event.imageUrl && (
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                  )}
                  <h3 className="font-semibold text-lg mb-2">{event.title}</h3>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formatDate(eventDate)} a las {event.time}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      Duración: {event.duration} minutos
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      {event.location}
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      {watchQuantity} {watchQuantity === 1 ? 'persona' : 'personas'}
                    </div>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Precio por ticket:</span>
                    <span>{formatPrice(event.price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cantidad:</span>
                    <span>{watchQuantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatPrice(event.price * watchQuantity)}</span>
                  </div>
                  
                  {/* Voucher applied */}
                  {isVoucherApplied && paymentBreakdown.voucherAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Vale regalo:</span>
                      <span>-{formatPrice(paymentBreakdown.voucherAmount)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span>Gastos de gestión:</span>
                    <span>Incluidos</span>
                  </div>
                  
                  {isVoucherApplied && paymentBreakdown.stripeAmount > 0 ? (
                    <>
                      <div className="border-t border-gray-200 pt-2">
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total:</span>
                          <span className="text-purple-600">{formatPrice(totalPrice)}</span>
                        </div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3 mt-2">
                        <div className="flex justify-between text-sm">
                          <span>Pagado con vale:</span>
                          <span className="text-green-600 font-medium">
                            {formatPrice(paymentBreakdown.voucherAmount)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm font-bold">
                          <span>A pagar con tarjeta:</span>
                          <span className="text-purple-600">
                            {formatPrice(paymentBreakdown.stripeAmount)}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : isVoucherApplied ? (
                    <>
                      <div className="border-t border-gray-200 pt-2">
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total:</span>
                          <span className="text-purple-600">{formatPrice(totalPrice)}</span>
                        </div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3 mt-2">
                        <div className="text-center text-sm font-bold text-green-700">
                          ✅ Cubierto completamente con vale regalo
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="border-t border-gray-200 pt-2">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span className="text-purple-600">{formatPrice(totalPrice)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Cancellation Policy */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-medium mb-2">Política de Cancelación</h4>
                  <p className="text-xs text-gray-600">
                    Cancelación gratuita hasta 24 horas antes del evento. 
                    Reembolso del 50% entre 24-12 horas antes.
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