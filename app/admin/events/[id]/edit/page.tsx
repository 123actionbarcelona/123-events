'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { EventForm } from '@/components/admin/event-form'
import FormBuilder from '@/components/admin/form-builder'
import { EventFormData } from '@/lib/validations'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import toast from 'react-hot-toast'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EditEventPage({ params }: PageProps) {
  const [event, setEvent] = useState<EventFormData & { id: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
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

  const handleSubmit = async (data: EventFormData) => {
    if (!event) return
    
    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        toast.success('Evento actualizado exitosamente')
        router.push('/admin/events')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al actualizar el evento')
      }
    } catch (error) {
      console.error('Error updating event:', error)
      toast.error('Error al actualizar el evento')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/admin/events')
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Editar Evento</h1>
        <p className="text-gray-600">Modifica los detalles del evento "{event.title}"</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="general">Información General</TabsTrigger>
          <TabsTrigger value="form">Formulario Personalizado</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="mt-6">
          <EventForm
            event={event}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
          />
        </TabsContent>
        
        <TabsContent value="form" className="mt-6">
          <FormBuilder 
            eventId={eventId}
            onSave={() => toast.success('Formulario actualizado')}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}