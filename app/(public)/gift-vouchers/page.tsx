'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  Gift, 
  Calendar, 
  CreditCard,
  Mail,
  User,
  MessageSquare,
  Palette,
  Lock,
  Shield,
  Star,
  Heart,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { formatPrice, safeFormatDate } from '@/lib/utils'
import { 
  CreateVoucherFormSchema, 
  CreateVoucherFormData,
  VOUCHER_PACKS,
  VoucherTemplate 
} from '@/types/vouchers'
import toast from 'react-hot-toast'

interface Event {
  id: string
  title: string
  date: string
  price: number
  category: string
  status: string
}

const PREDEFINED_AMOUNTS = [50, 100, 150, 200, 250]

const TEMPLATE_INFO = {
  elegant: {
    name: 'Elegante',
    description: 'Diseño sofisticado con tonos morados',
    icon: <Sparkles className="h-4 w-4" />,
    color: 'bg-purple-100 border-purple-300'
  },
  christmas: {
    name: 'Navidad',
    description: 'Temática navideña con colores festivos',
    icon: <Star className="h-4 w-4" />,
    color: 'bg-red-100 border-red-300'
  },
  mystery: {
    name: 'Misterio',
    description: 'Diseño oscuro y misterioso',
    icon: <Gift className="h-4 w-4" />,
    color: 'bg-gray-100 border-gray-400'
  },
  fun: {
    name: 'Divertido',
    description: 'Colores vibrantes y diseño alegre',
    icon: <Heart className="h-4 w-4" />,
    color: 'bg-green-100 border-green-300'
  }
} as const

export default function GiftVouchersPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showDeliveryDate, setShowDeliveryDate] = useState(false)
  
  const router = useRouter()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateVoucherFormData>({
    resolver: zodResolver(CreateVoucherFormSchema),
    defaultValues: {
      type: 'amount',
      amount: 100,
      template: 'elegant',
      acceptTerms: false,
      acceptMarketing: false,
    },
  })

  const watchType = watch('type')
  const watchAmount = watch('amount')
  const watchEventId = watch('eventId')
  const watchTemplate = watch('template')
  const watchTicketQuantity = watch('ticketQuantity')

  // Cargar eventos disponibles
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/events?status=active')
        if (response.ok) {
          const eventsData = await response.json()
          setEvents(eventsData.events || [])
        }
      } catch (error) {
        console.error('Error fetching events:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  const selectedEvent = events.find(e => e.id === watchEventId)
  
  // Calcular precio según tipo
  const calculatePrice = () => {
    switch (watchType) {
      case 'event':
        const eventPrice = selectedEvent?.price || 0
        const quantity = watchTicketQuantity || 2
        return eventPrice * quantity
      case 'pack':
        return VOUCHER_PACKS['mystery-lover']?.price || 150
      default:
        return watchAmount || 100
    }
  }

  const totalPrice = calculatePrice()

  const onSubmit = async (data: CreateVoucherFormData) => {
    setSubmitting(true)
    
    try {
      // Preparar datos según tipo
      const voucherData = {
        ...data,
        amount: watchType === 'amount' ? data.amount : undefined,
        eventId: watchType === 'event' ? data.eventId : undefined,
        ticketQuantity: watchType === 'event' ? (data.ticketQuantity || 2) : undefined,
      }

      // Crear vale regalo
      const response = await fetch('/api/vouchers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(voucherData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al crear el vale regalo')
      }

      const { voucher, checkoutUrl } = await response.json()
      
      // Redirigir a Stripe Checkout
      window.location.href = checkoutUrl
      
    } catch (error) {
      console.error('Error creating voucher:', error)
      toast.error(error instanceof Error ? error.message : 'Error al procesar el vale regalo')
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <Gift className="h-16 w-16 text-purple-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Vales Regalo Mystery Events
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Regala una experiencia única de misterio. El regalo perfecto para los amantes de la aventura y el suspense.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Voucher Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Crear Vale Regalo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Tipo de Vale */}
                  <div>
                    <Label className="text-base font-medium mb-4 block">
                      Tipo de Vale Regalo
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <input
                          type="radio"
                          value="amount"
                          {...register('type')}
                          id="type-amount"
                          className="sr-only peer"
                        />
                        <label
                          htmlFor="type-amount"
                          className="flex flex-col p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 peer-checked:border-purple-500 peer-checked:bg-purple-50"
                        >
                          <CreditCard className="h-6 w-6 text-purple-600 mb-2" />
                          <span className="font-medium">Por Importe</span>
                          <span className="text-sm text-gray-600">
                            Elige la cantidad que desees regalar
                          </span>
                        </label>
                      </div>

                      <div>
                        <input
                          type="radio"
                          value="event"
                          {...register('type')}
                          id="type-event"
                          className="sr-only peer"
                        />
                        <label
                          htmlFor="type-event"
                          className="flex flex-col p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 peer-checked:border-purple-500 peer-checked:bg-purple-50"
                        >
                          <Calendar className="h-6 w-6 text-purple-600 mb-2" />
                          <span className="font-medium">Para Evento</span>
                          <span className="text-sm text-gray-600">
                            Vale para un evento específico
                          </span>
                        </label>
                      </div>

                      <div>
                        <input
                          type="radio"
                          value="pack"
                          {...register('type')}
                          id="type-pack"
                          className="sr-only peer"
                        />
                        <label
                          htmlFor="type-pack"
                          className="flex flex-col p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 peer-checked:border-purple-500 peer-checked:bg-purple-50"
                        >
                          <Gift className="h-6 w-6 text-purple-600 mb-2" />
                          <span className="font-medium">Pack Premium</span>
                          <span className="text-sm text-gray-600">
                            Múltiples experiencias con descuento
                          </span>
                        </label>
                      </div>
                    </div>
                    {errors.type && (
                      <p className="text-red-500 text-sm mt-2">{errors.type.message}</p>
                    )}
                  </div>

                  {/* Configuración según tipo */}
                  {watchType === 'amount' && (
                    <div>
                      <Label htmlFor="amount">Importe del Vale *</Label>
                      <div className="mt-2">
                        <div className="grid grid-cols-5 gap-2 mb-3">
                          {PREDEFINED_AMOUNTS.map((amount) => (
                            <Button
                              key={amount}
                              type="button"
                              variant={watchAmount === amount ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setValue('amount', amount)}
                            >
                              {formatPrice(amount)}
                            </Button>
                          ))}
                        </div>
                        <Input
                          id="amount"
                          type="number"
                          {...register('amount', { valueAsNumber: true })}
                          min="25"
                          max="500"
                          placeholder="Cantidad personalizada"
                        />
                      </div>
                      {errors.amount && (
                        <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
                      )}
                    </div>
                  )}

                  {watchType === 'event' && (
                    <div>
                      <Label htmlFor="eventId">Seleccionar Evento *</Label>
                      <select
                        {...register('eventId')}
                        className="w-full mt-2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="">Selecciona un evento...</option>
                        {events.map((event) => (
                          <option key={event.id} value={event.id}>
                            {event.title} - {formatPrice(event.price)} - {safeFormatDate(event.date)}
                          </option>
                        ))}
                      </select>
                      {selectedEvent && (
                        <div className="mt-2 p-3 bg-purple-50 rounded-lg">
                          <p className="text-sm text-purple-700">
                            <strong>{selectedEvent.title}</strong><br />
                            {formatPrice(selectedEvent.price)} - {safeFormatDate(selectedEvent.date)}
                          </p>
                        </div>
                      )}
                      
                      {selectedEvent && (
                        <div className="mt-4">
                          <Label htmlFor="ticketQuantity">Cantidad de Tickets *</Label>
                          <div className="mt-2">
                            <div className="grid grid-cols-4 gap-2 mb-3">
                              {[2, 3, 4, 5, 6, 7, 8, 9].map((quantity) => (
                                <Button
                                  key={quantity}
                                  type="button"
                                  variant={watch('ticketQuantity') === quantity ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => setValue('ticketQuantity', quantity)}
                                >
                                  {quantity} {quantity === 1 ? 'ticket' : 'tickets'}
                                </Button>
                              ))}
                            </div>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <p className="text-sm text-blue-700">
                                <strong>Precio total:</strong> {formatPrice((selectedEvent?.price || 0) * (watch('ticketQuantity') || 2))}
                                <br />
                                <span className="text-xs">
                                  {watch('ticketQuantity') || 2} tickets × {formatPrice(selectedEvent?.price || 0)} cada uno
                                </span>
                              </p>
                            </div>
                          </div>
                          {errors.ticketQuantity && (
                            <p className="text-red-500 text-sm mt-1">{errors.ticketQuantity.message}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {watchType === 'pack' && (
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
                      <div className="flex items-start">
                        <Gift className="h-8 w-8 text-purple-600 mr-4 mt-1" />
                        <div>
                          <h3 className="text-lg font-semibold text-purple-900 mb-2">
                            Pack Mystery Lover
                          </h3>
                          <p className="text-purple-700 mb-3">
                            3 eventos de misterio con 30€ de descuento incluido
                          </p>
                          <div className="flex items-center space-x-4 text-sm">
                            <Badge variant="secondary">3 Eventos</Badge>
                            <Badge variant="secondary">Categorías: Murder, Detective</Badge>
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              Ahorro: 30€
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Información del Comprador */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Tu Información</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="purchaserName">Tu nombre *</Label>
                        <div className="relative mt-1">
                          <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="purchaserName"
                            {...register('purchaserName')}
                            placeholder="Tu nombre completo"
                            className="pl-10"
                          />
                        </div>
                        {errors.purchaserName && (
                          <p className="text-red-500 text-sm mt-1">{errors.purchaserName.message}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="purchaserEmail">Tu email *</Label>
                        <div className="relative mt-1">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="purchaserEmail"
                            type="email"
                            {...register('purchaserEmail')}
                            placeholder="tu@email.com"
                            className="pl-10"
                          />
                        </div>
                        {errors.purchaserEmail && (
                          <p className="text-red-500 text-sm mt-1">{errors.purchaserEmail.message}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Información del Destinatario */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Para Quien es el Regalo</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="recipientName">Nombre del destinatario</Label>
                        <div className="relative mt-1">
                          <Gift className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="recipientName"
                            {...register('recipientName')}
                            placeholder="Nombre de quien recibe el regalo"
                            className="pl-10"
                          />
                        </div>
                        {errors.recipientName && (
                          <p className="text-red-500 text-sm mt-1">{errors.recipientName.message}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="recipientEmail">Email del destinatario</Label>
                        <div className="relative mt-1">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="recipientEmail"
                            type="email"
                            {...register('recipientEmail')}
                            placeholder="email@destinatario.com"
                            className="pl-10"
                          />
                        </div>
                        {errors.recipientEmail && (
                          <p className="text-red-500 text-sm mt-1">{errors.recipientEmail.message}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Mensaje Personal */}
                  <div>
                    <Label htmlFor="personalMessage">Mensaje Personal (opcional)</Label>
                    <div className="relative mt-1">
                      <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Textarea
                        id="personalMessage"
                        {...register('personalMessage')}
                        placeholder="Escribe un mensaje personal para el destinatario..."
                        rows={4}
                        className="pl-10"
                      />
                    </div>
                    {errors.personalMessage && (
                      <p className="text-red-500 text-sm mt-1">{errors.personalMessage.message}</p>
                    )}
                  </div>

                  {/* Entrega Programada */}
                  <div>
                    <div className="flex items-center space-x-2 mb-3">
                      <input
                        type="checkbox"
                        id="scheduleDelivery"
                        checked={showDeliveryDate}
                        onChange={(e) => setShowDeliveryDate(e.target.checked)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <Label htmlFor="scheduleDelivery">
                        Programar entrega para una fecha específica
                      </Label>
                    </div>
                    
                    {showDeliveryDate && (
                      <Input
                        type="datetime-local"
                        {...register('deliveryDate', { 
                          setValueAs: (value) => value ? new Date(value) : undefined 
                        })}
                        min={new Date().toISOString().slice(0, 16)}
                      />
                    )}
                  </div>

                  {/* Template Selection */}
                  <div>
                    <Label className="text-base font-medium mb-4 block">
                      <Palette className="inline h-4 w-4 mr-2" />
                      Diseño del Vale
                    </Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(TEMPLATE_INFO).map(([key, info]) => (
                        <div key={key}>
                          <input
                            type="radio"
                            value={key}
                            {...register('template')}
                            id={`template-${key}`}
                            className="sr-only peer"
                          />
                          <label
                            htmlFor={`template-${key}`}
                            className={`flex flex-col p-3 border rounded-lg cursor-pointer hover:bg-gray-50 peer-checked:border-purple-500 peer-checked:bg-purple-50 transition-colors ${info.color}`}
                          >
                            <div className="flex items-center justify-center mb-2">
                              {info.icon}
                            </div>
                            <span className="font-medium text-center text-sm">{info.name}</span>
                            <span className="text-xs text-gray-600 text-center mt-1">
                              {info.description}
                            </span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

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
                          El PDF del vale se generará automáticamente tras el pago.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-lg py-3"
                    size="lg"
                  >
                    <Lock className="h-5 w-5 mr-2" />
                    {submitting ? 'Procesando...' : `Proceder al Pago - ${formatPrice(totalPrice)}`}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <Card>
              <CardHeader>
                <CardTitle>Resumen del Vale</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Voucher Preview */}
                <div className="border-2 border-dashed border-purple-300 rounded-lg p-4 bg-gradient-to-br from-purple-50 to-pink-50">
                  <div className="text-center">
                    <Gift className="h-12 w-12 text-purple-600 mx-auto mb-3" />
                    <h3 className="font-bold text-lg text-purple-900 mb-2">
                      Vale Regalo Mystery Events
                    </h3>
                    
                    {watchType === 'amount' && (
                      <div className="text-2xl font-bold text-purple-600">
                        {formatPrice(watchAmount || 100)}
                      </div>
                    )}
                    
                    {watchType === 'event' && selectedEvent && (
                      <div>
                        <div className="text-lg font-semibold text-purple-900">
                          {selectedEvent.title}
                        </div>
                        <div className="text-2xl font-bold text-purple-600 mt-1">
                          {formatPrice(selectedEvent.price)}
                        </div>
                      </div>
                    )}
                    
                    {watchType === 'pack' && (
                      <div>
                        <div className="text-lg font-semibold text-purple-900">
                          Pack Mystery Lover
                        </div>
                        <div className="text-2xl font-bold text-purple-600 mt-1">
                          {formatPrice(VOUCHER_PACKS['mystery-lover'].price)}
                        </div>
                        <div className="text-sm text-green-600 font-medium mt-1">
                          Ahorro: {formatPrice(VOUCHER_PACKS['mystery-lover'].discount)}
                        </div>
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-600 mt-3">
                      Template: {TEMPLATE_INFO[watchTemplate].name}
                    </div>
                  </div>
                </div>

                {/* Price Details */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Valor del vale:</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gastos de gestión:</span>
                    <span>Incluidos</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-purple-600">{formatPrice(totalPrice)}</span>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-medium mb-3">Incluye:</h4>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-center">
                      <Gift className="h-4 w-4 text-green-600 mr-2" />
                      PDF elegante y personalizable
                    </li>
                    <li className="flex items-center">
                      <Mail className="h-4 w-4 text-green-600 mr-2" />
                      Envío automático por email
                    </li>
                    <li className="flex items-center">
                      <Calendar className="h-4 w-4 text-green-600 mr-2" />
                      Válido durante 1 año
                    </li>
                    <li className="flex items-center">
                      <Shield className="h-4 w-4 text-green-600 mr-2" />
                      Código QR para validación
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}