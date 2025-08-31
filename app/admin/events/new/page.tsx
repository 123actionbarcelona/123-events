'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { EventForm } from '@/components/admin/event-form'
import { EventFormData } from '@/lib/validations'
import toast from 'react-hot-toast'

export default function NewEventPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (data: EventFormData) => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const event = await response.json()
        toast.success('Evento creado exitosamente')
        router.push('/admin/events')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al crear el evento')
      }
    } catch (error) {
      console.error('Error creating event:', error)
      toast.error('Error al crear el evento')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/admin/events')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Crear Nuevo Evento</h1>
        <p className="text-gray-600">Completa los detalles para crear un nuevo evento de misterio</p>
      </div>

      <EventForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    </div>
  )
}