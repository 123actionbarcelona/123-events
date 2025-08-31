'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { eventSchema, EventFormData } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Clock, MapPin, Users, Euro, Tag, Image, Save, X, Mail, Settings } from 'lucide-react'
import { ImageUpload } from '@/components/admin/image-upload'
import { formatDate } from '@/lib/utils'

interface EventFormProps {
  event?: EventFormData & { id?: string }
  onSubmit: (data: EventFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

const categoryOptions = [
  { value: 'murder', label: 'Asesinato/Murder Mystery' },
  { value: 'escape', label: 'Escape Room' },
  { value: 'detective', label: 'Detective' },
  { value: 'horror', label: 'Terror/Horror' },
]

const statusOptions = [
  { value: 'draft', label: 'Borrador' },
  { value: 'active', label: 'Activo' },
  { value: 'soldout', label: 'Agotado' },
  { value: 'cancelled', label: 'Cancelado' },
]

interface EmailTemplate {
  id: string
  name: string
  subject: string
  category?: string
  variables: string[]
}

export function EventForm({ event, onSubmit, onCancel, isLoading }: EventFormProps) {
  const { data: session, status } = useSession()
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: event ? {
      ...event,
      date: event.date ? new Date(event.date).toISOString().split('T')[0] : '',
    } : {
      status: 'draft',
      category: 'murder',
      duration: 120,
      capacity: 20,
      price: 35,
    },
  })

  const watchImageUrl = watch('imageUrl')
  const watchCategory = watch('category')
  
  // Cargar plantillas disponibles
  useEffect(() => {
    async function loadTemplates() {
      // Solo cargar si la sesión está autenticada
      if (status !== 'authenticated') {
        return
      }
      
      try {
        const response = await fetch('/api/admin/templates', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        })
        
        if (response.ok) {
          const data = await response.json()
          // La API ahora devuelve { templates: [...], stats: {...} }
          const templateList = data.templates || []
          setTemplates(templateList)
        } else {
          console.error('Templates loading failed:', response.status)
          setTemplates([])
        }
      } catch (error) {
        console.error('Error loading templates:', error)
        setTemplates([])
      } finally {
        setLoadingTemplates(false)
      }
    }
    
    loadTemplates()
  }, [session, status])

  // Resincronizar el formulario si el evento cambia (modo edición)
  useEffect(() => {
    if (event && templates.length > 0) {
      reset({
        ...event,
        date: event.date ? new Date(event.date).toISOString().split('T')[0] : '',
        // Convertir template IDs a template names para los selects
        confirmationTemplateId: getTemplateNameById(event.confirmationTemplateId),
        reminderTemplateId: getTemplateNameById(event.reminderTemplateId),
        voucherTemplateId: getTemplateNameById(event.voucherTemplateId),
      })
    }
  }, [event, templates, reset])

  const handleImageChange = (url: string) => {
    setValue('imageUrl', url, { shouldDirty: true, shouldValidate: true })
  }

  // Filtrar plantillas según el tipo y categoría del evento
  const getTemplatesForType = (type: 'confirmation' | 'reminder' | 'voucher') => {
    return templates.filter(template => {
      // Filtrado más flexible - buscar por múltiples patrones
      const templateName = template.name.toLowerCase()
      
      if (type === 'confirmation') {
        return templateName.includes('confirmation') || 
               templateName.includes('booking_confirmation') ||
               templateName.includes('confirm')
      } else if (type === 'reminder') {
        return templateName.includes('reminder') || 
               templateName.includes('event_reminder') ||
               templateName.includes('remind')
      } else if (type === 'voucher') {
        return templateName.includes('voucher') || 
               templateName.includes('gift') ||
               templateName.includes('vale')
      }
      
      return false
    }).sort((a, b) => {
      // Priorizar plantillas de la categoría actual
      const aHasCategory = a.name.includes(watchCategory || 'murder')
      const bHasCategory = b.name.includes(watchCategory || 'murder')
      
      if (aHasCategory && !bHasCategory) return -1
      if (!aHasCategory && bHasCategory) return 1
      
      // Ordenar alfabéticamente si ambas tienen la misma prioridad
      return (a.displayName || a.name).localeCompare(b.displayName || b.name)
    })
  }

  // Función para obtener el nombre legible de la plantilla
  const getTemplateDisplayName = (template: any) => {
    // Si la API devuelve displayName, usarlo. Si no, convertir el nombre interno
    if (template.displayName) {
      return template.displayName
    }
    
    // Fallback: convertir el nombre interno
    const templateName = typeof template === 'string' ? template : template.name
    return templateName
      .replace(/^(murder|escape|detective|horror)_/, '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
  }

  const isEdit = !!event?.id

  // Función para convertir template name a template ID
  const getTemplateIdByName = (templateName: string | null | undefined): string | null => {
    if (!templateName || templateName === '') return null
    const template = templates.find(t => t.name === templateName)
    return template ? template.id : null
  }

  // Función para convertir template ID a template name (para cargar en el formulario)
  const getTemplateNameById = (templateId: string | null | undefined): string | undefined => {
    if (!templateId || templateId === '') return undefined
    const template = templates.find(t => t.id === templateId)
    return template ? template.name : undefined
  }

  const onSubmitWithErrorLogging = async (data: EventFormData) => {
    console.log('🚀 Form submission started with data:', data)
    
    // Convert template names back to IDs for backend compatibility
    const cleanData = {
      ...data,
      confirmationTemplateId: getTemplateIdByName(data.confirmationTemplateId),
      reminderTemplateId: getTemplateIdByName(data.reminderTemplateId),
      voucherTemplateId: getTemplateIdByName(data.voucherTemplateId),
    }
    
    try {
      await onSubmit(cleanData as EventFormData)
      console.log('✅ Form submission successful')
    } catch (error) {
      console.error('❌ Form submission failed:', error)
    }
  }

  const onInvalid = (errors: any) => {
    console.error('❌ Form validation failed:', JSON.stringify(errors, null, 2))
    // Show user-friendly error
    alert('Error de validación: Por favor revisa todos los campos obligatorios.')
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          {isEdit ? 'Editar Evento' : 'Crear Nuevo Evento'}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit(onSubmitWithErrorLogging, onInvalid)} className="space-y-6">
          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <Label htmlFor="title">Título del Evento *</Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="Ej: Asesinato en el Orient Express"
                className="mt-1"
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description">Descripción *</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Describe el evento, la experiencia que vivirán los participantes..."
                rows={4}
                className="mt-1"
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="category">Categoría *</Label>
              <Select value={watchCategory} onValueChange={(value) => setValue('category', value as any)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecciona categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="status">Estado</Label>
              <Select value={watch('status')} onValueChange={(value) => setValue('status', value as any)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecciona estado" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Imagen */}
          <div className="md:col-span-2">
            <ImageUpload
              value={watchImageUrl}
              onChange={handleImageChange}
              category={watchCategory}
              label="Imagen del evento"
            />
            {errors.imageUrl && (
              <p className="text-red-500 text-sm mt-1">{errors.imageUrl.message}</p>
            )}
          </div>

          {/* Fecha y hora */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="date">Fecha *</Label>
              <div className="relative mt-1">
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="date"
                  type="date"
                  {...register('date')}
                  className="pl-10"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              {errors.date && (
                <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="time">Hora *</Label>
              <div className="relative mt-1">
                <Clock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="time"
                  type="time"
                  {...register('time')}
                  className="pl-10"
                />
              </div>
              {errors.time && (
                <p className="text-red-500 text-sm mt-1">{errors.time.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="duration">Duración (minutos) *</Label>
              <Input
                id="duration"
                type="number"
                {...register('duration', { valueAsNumber: true })}
                placeholder="120"
                min="30"
                max="480"
                className="mt-1"
              />
              {errors.duration && (
                <p className="text-red-500 text-sm mt-1">{errors.duration.message}</p>
              )}
            </div>
          </div>

          {/* Ubicación y capacidad */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="location">Ubicación *</Label>
              <div className="relative mt-1">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="location"
                  {...register('location')}
                  placeholder="Ej: Teatro Principal, Madrid"
                  className="pl-10"
                />
              </div>
              {errors.location && (
                <p className="text-red-500 text-sm mt-1">{errors.location.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="capacity">Capacidad *</Label>
              <div className="relative mt-1">
                <Users className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="capacity"
                  type="number"
                  {...register('capacity', { valueAsNumber: true })}
                  placeholder="20"
                  min="1"
                  max="100"
                  className="pl-10"
                />
              </div>
              {errors.capacity && (
                <p className="text-red-500 text-sm mt-1">{errors.capacity.message}</p>
              )}
            </div>
          </div>

          {/* Precio y límites de compra */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="price">Precio (€) *</Label>
              <div className="relative mt-1">
                <Euro className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  {...register('price', { valueAsNumber: true })}
                  placeholder="35.00"
                  min="0"
                  max="1000"
                  className="pl-10"
                />
              </div>
              {errors.price && (
                <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="minTickets">Mínimo de tickets por compra</Label>
              <Input
                id="minTickets"
                type="number"
                {...register('minTickets', { valueAsNumber: true })}
                placeholder="2"
                min="1"
                max="20"
                className="mt-1"
              />
              {errors.minTickets && (
                <p className="text-red-500 text-sm mt-1">{errors.minTickets.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="maxTickets">Máximo de tickets por compra</Label>
              <Input
                id="maxTickets"
                type="number"
                {...register('maxTickets', { valueAsNumber: true })}
                placeholder="10"
                min="1"
                max="50"
                className="mt-1"
              />
              {errors.maxTickets && (
                <p className="text-red-500 text-sm mt-1">{errors.maxTickets.message}</p>
              )}
            </div>
          </div>

          {/* Plantillas de Email */}
          <div className="border-t pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Configuración de Plantillas Email</h3>
            </div>
            
            <p className="text-gray-600 text-sm mb-6">
              Asigna plantillas específicas para este evento. Si no se asigna una plantilla específica, 
              se usará la plantilla por defecto de la categoría <strong>{categoryOptions.find(c => c.value === watchCategory)?.label}</strong>.
            </p>

            {loadingTemplates ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Cargando plantillas...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Plantilla de Confirmación */}
                <div>
                  <Label>Confirmación de Reserva</Label>
                  <Select 
                    value={watch('confirmationTemplateId') || ''} 
                    onValueChange={(value) => setValue('confirmationTemplateId', value === '' ? undefined : value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Por defecto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">
                        <div className="flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          Por defecto (categoría)
                        </div>
                      </SelectItem>
                      {getTemplatesForType('confirmation').map((template) => (
                        <SelectItem key={template.id} value={template.name}>
                          <div className="flex flex-col">
                            <span className="font-medium">{getTemplateDisplayName(template)}</span>
                            <span className="text-xs text-gray-500 truncate">{template.subject}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Email enviado tras confirmar el pago
                  </p>
                </div>

                {/* Plantilla de Recordatorio */}
                <div>
                  <Label>Recordatorio de Evento</Label>
                  <Select 
                    value={watch('reminderTemplateId') || ''} 
                    onValueChange={(value) => setValue('reminderTemplateId', value === '' ? undefined : value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Por defecto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">
                        <div className="flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          Por defecto (categoría)
                        </div>
                      </SelectItem>
                      {getTemplatesForType('reminder').map((template) => (
                        <SelectItem key={template.id} value={template.name}>
                          <div className="flex flex-col">
                            <span className="font-medium">{getTemplateDisplayName(template)}</span>
                            <span className="text-xs text-gray-500 truncate">{template.subject}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Email enviado antes del evento
                  </p>
                </div>

                {/* Plantilla de Vale Regalo */}
                <div>
                  <Label>Vale Regalo del Evento</Label>
                  <Select 
                    value={watch('voucherTemplateId') || ''} 
                    onValueChange={(value) => setValue('voucherTemplateId', value === '' ? undefined : value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Por defecto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">
                        <div className="flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          Por defecto (general)
                        </div>
                      </SelectItem>
                      {getTemplatesForType('voucher').map((template) => (
                        <SelectItem key={template.id} value={template.name}>
                          <div className="flex flex-col">
                            <span className="font-medium">{getTemplateDisplayName(template)}</span>
                            <span className="text-xs text-gray-500 truncate">{template.subject}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Para vales específicos de este evento
                  </p>
                </div>
              </div>
            )}
            
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">💡 Sugerencia:</p>
                  <p>Las plantillas específicas permiten personalizar completamente la experiencia del usuario para cada tipo de evento. 
                  Puedes crear y gestionar plantillas desde la sección <strong>Admin → Plantillas</strong>.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Guardando...' : isEdit ? 'Actualizar Evento' : 'Crear Evento'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}