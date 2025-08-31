import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateBookingCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `${timestamp}${random}`
}

export function generateTicketCode(bookingCode: string, index: number): string {
  return `${bookingCode}-T${(index + 1).toString().padStart(2, '0')}`
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(price)
}

// Función segura para crear objetos Date
export function safeDateObject(dateInput: string | Date | null | undefined): Date | null {
  if (!dateInput) return null
  
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
    
    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) {
      console.warn('Invalid date provided:', dateInput)
      return null
    }
    
    return date
  } catch (error) {
    console.warn('Error creating date from:', dateInput, error)
    return null
  }
}

// Función segura para formatear fechas
export function safeFormatDate(dateInput: string | Date | null | undefined, fallback: string = 'Fecha no válida'): string {
  const date = safeDateObject(dateInput)
  
  if (!date) return fallback
  
  try {
    return new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date)
  } catch (error) {
    console.warn('Error formatting date:', date, error)
    return fallback
  }
}

// Función segura para formatear fecha y hora
export function safeFormatDateTime(dateInput: string | Date | null | undefined, time?: string, fallback: string = 'Fecha no válida'): string {
  const dateStr = safeFormatDate(dateInput, fallback)
  if (dateStr === fallback) return fallback
  
  return time ? `${dateStr} a las ${time}` : dateStr
}

// Función segura para formatear fecha con hora (timestamp completo)
export function safeFormatDateTimeShort(dateInput: string | Date | null | undefined, fallback: string = 'Fecha no válida'): string {
  const date = safeDateObject(dateInput)
  
  if (!date) return fallback
  
  try {
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  } catch (error) {
    console.warn('Error formatting datetime:', date, error)
    return fallback
  }
}

// Funciones legacy (mantener compatibilidad)
export function formatDate(date: Date): string {
  return safeFormatDate(date)
}

export function formatDateTime(date: Date, time: string): string {
  return safeFormatDateTime(date, time)
}