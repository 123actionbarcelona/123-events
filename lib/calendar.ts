import { google } from 'googleapis'

const calendar = google.calendar('v3')

// Configurar OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'urn:ietf:wg:oauth:2.0:oob'
)

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
})

export interface CalendarEvent {
  eventId: string
  title: string
  description: string
  location: string
  startDateTime: string
  endDateTime: string
  attendees?: string[]
}

export interface CalendarResult {
  success: boolean
  calendarEventId?: string
  error?: string
}

export async function createCalendarEvent(eventData: CalendarEvent): Promise<CalendarResult> {
  try {
    const event = {
      summary: eventData.title,
      description: eventData.description,
      location: eventData.location,
      start: {
        dateTime: eventData.startDateTime,
        timeZone: 'Europe/Madrid',
      },
      end: {
        dateTime: eventData.endDateTime,
        timeZone: 'Europe/Madrid',
      },
      attendees: eventData.attendees?.map(email => ({ email })),
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 día antes
          { method: 'popup', minutes: 60 }, // 1 hora antes
        ],
      },
    }

    const response = await calendar.events.insert({
      auth: oauth2Client,
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      requestBody: event,
    })

    console.log('Calendar event created:', response.data.id)
    
    return {
      success: true,
      calendarEventId: response.data.id || undefined,
    }

  } catch (error) {
    console.error('Error creating calendar event:', error)
    return {
      success: false,
      error: 'Error al crear evento en calendario',
    }
  }
}

export async function updateCalendarEvent(
  calendarEventId: string, 
  eventData: Partial<CalendarEvent>
): Promise<CalendarResult> {
  try {
    const event: any = {}

    if (eventData.title) event.summary = eventData.title
    if (eventData.description) event.description = eventData.description
    if (eventData.location) event.location = eventData.location
    if (eventData.startDateTime) {
      event.start = {
        dateTime: eventData.startDateTime,
        timeZone: 'Europe/Madrid',
      }
    }
    if (eventData.endDateTime) {
      event.end = {
        dateTime: eventData.endDateTime,
        timeZone: 'Europe/Madrid',
      }
    }
    if (eventData.attendees) {
      event.attendees = eventData.attendees.map(email => ({ email }))
    }

    const response = await calendar.events.update({
      auth: oauth2Client,
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      eventId: calendarEventId,
      requestBody: event,
    })

    console.log('Calendar event updated:', response.data.id)
    
    return {
      success: true,
      calendarEventId: response.data.id || undefined,
    }

  } catch (error) {
    console.error('Error updating calendar event:', error)
    return {
      success: false,
      error: 'Error al actualizar evento en calendario',
    }
  }
}

export async function deleteCalendarEvent(calendarEventId: string): Promise<boolean> {
  try {
    await calendar.events.delete({
      auth: oauth2Client,
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      eventId: calendarEventId,
    })

    console.log('Calendar event deleted:', calendarEventId)
    return true

  } catch (error) {
    console.error('Error deleting calendar event:', error)
    return false
  }
}

export async function syncEventToCalendar(event: any): Promise<CalendarResult> {
  const startDate = new Date(event.date)
  const [hours, minutes] = event.time.split(':').map(Number)
  startDate.setHours(hours, minutes, 0, 0)

  const endDate = new Date(startDate)
  endDate.setHours(startDate.getHours() + 2) // Asumimos 2 horas de duración

  const calendarEvent: CalendarEvent = {
    eventId: event.id,
    title: event.title,
    description: `${event.description}\n\nPrecio: €${event.price}\nCapacidad: ${event.capacity} personas`,
    location: event.location,
    startDateTime: startDate.toISOString(),
    endDateTime: endDate.toISOString(),
  }

  if (event.calendarEventId) {
    // Actualizar evento existente
    return await updateCalendarEvent(event.calendarEventId, calendarEvent)
  } else {
    // Crear nuevo evento
    return await createCalendarEvent(calendarEvent)
  }
}

export async function addAttendeeToCalendarEvent(
  calendarEventId: string,
  attendeeEmail: string,
  attendeeName?: string
): Promise<boolean> {
  try {
    // Obtener evento actual
    const eventResponse = await calendar.events.get({
      auth: oauth2Client,
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      eventId: calendarEventId,
    })

    const currentEvent = eventResponse.data
    const existingAttendees = currentEvent.attendees || []
    
    // Verificar si el asistente ya existe
    const attendeeExists = existingAttendees.some(
      attendee => attendee.email === attendeeEmail
    )

    if (attendeeExists) {
      return true // Ya está agregado
    }

    // Agregar nuevo asistente con nombre opcional
    const newAttendee: any = { email: attendeeEmail }
    if (attendeeName) {
      newAttendee.displayName = attendeeName
    }
    const updatedAttendees = [...existingAttendees, newAttendee]

    await calendar.events.update({
      auth: oauth2Client,
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      eventId: calendarEventId,
      requestBody: {
        ...currentEvent,
        attendees: updatedAttendees,
      },
    })

    console.log('Attendee added to calendar event:', attendeeEmail)
    return true

  } catch (error) {
    console.error('Error adding attendee to calendar event:', error)
    return false
  }
}

// Nueva función para actualizar el evento con los totales de reservas
export async function updateCalendarEventWithBookingTotals(
  calendarEventId: string,
  eventData: {
    title: string
    totalTicketsSold: number
    availableTickets: number
    capacity: number
    attendeeEmail?: string
    attendeeName?: string
  }
): Promise<boolean> {
  try {
    // Obtener evento actual de Google Calendar
    const eventResponse = await calendar.events.get({
      auth: oauth2Client,
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      eventId: calendarEventId,
    })

    const currentEvent = eventResponse.data
    const existingAttendees = currentEvent.attendees || []
    
    // Agregar nuevo asistente si se proporciona
    let updatedAttendees = existingAttendees
    if (eventData.attendeeEmail) {
      const attendeeExists = existingAttendees.some(
        attendee => attendee.email === eventData.attendeeEmail
      )
      
      if (!attendeeExists) {
        const newAttendee: any = { email: eventData.attendeeEmail }
        if (eventData.attendeeName) {
          newAttendee.displayName = eventData.attendeeName
        }
        updatedAttendees = [...existingAttendees, newAttendee]
      }
    }

    // Actualizar título con los totales
    const updatedTitle = `${eventData.title} - ${eventData.totalTicketsSold}/${eventData.capacity} tickets vendidos`
    
    // Actualizar descripción con información detallada
    const originalDescription = currentEvent.description || ''
    const descriptionLines = originalDescription.split('\n')
    
    // Buscar línea con estadísticas o agregarla
    const statsLineIndex = descriptionLines.findIndex(line => line.startsWith('📊'))
    const statsLine = `📊 Tickets vendidos: ${eventData.totalTicketsSold}/${eventData.capacity} | Disponibles: ${eventData.availableTickets}`
    
    if (statsLineIndex >= 0) {
      descriptionLines[statsLineIndex] = statsLine
    } else {
      // Agregar al principio de la descripción
      descriptionLines.unshift(statsLine)
      descriptionLines.unshift('') // Línea en blanco después de las estadísticas
    }
    
    const updatedDescription = descriptionLines.join('\n')

    // Actualizar el evento en Google Calendar
    await calendar.events.update({
      auth: oauth2Client,
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      eventId: calendarEventId,
      requestBody: {
        ...currentEvent,
        summary: updatedTitle,
        description: updatedDescription,
        attendees: updatedAttendees,
      },
    })

    console.log(`Calendar event updated: ${updatedTitle}`)
    return true

  } catch (error) {
    console.error('Error updating calendar event with totals:', error)
    return false
  }
}