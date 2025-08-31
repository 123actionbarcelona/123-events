import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendEmail, sendBookingConfirmationEmail, sendBookingReminderEmail } from '@/lib/gmail'
import { db } from '@/lib/db'
import { z } from 'zod'

const sendEmailSchema = z.object({
  type: z.enum(['booking_confirmation', 'booking_reminder', 'custom']),
  bookingId: z.string().optional(),
  to: z.string().email().optional(),
  subject: z.string().optional(),
  html: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación para envíos manuales
    const body = await request.json()
    const { type, bookingId, to, subject, html } = sendEmailSchema.parse(body)

    if (type === 'custom') {
      // Para emails personalizados, verificar que sea admin
      const session = await getServerSession(authOptions)
      if (!session?.user) {
        return NextResponse.json(
          { error: 'No autorizado' },
          { status: 401 }
        )
      }

      if (!to || !subject || !html) {
        return NextResponse.json(
          { error: 'Faltan datos para email personalizado' },
          { status: 400 }
        )
      }

      const success = await sendEmail({ to, subject, html })
      
      return NextResponse.json({
        success,
        message: success ? 'Email enviado exitosamente' : 'Error al enviar email'
      })
    }

    // Para emails automáticos, verificar que existe la reserva
    if (!bookingId) {
      return NextResponse.json(
        { error: 'ID de reserva requerido' },
        { status: 400 }
      )
    }

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        event: true,
        customer: true,
        tickets: true,
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      )
    }

    let success = false

    switch (type) {
      case 'booking_confirmation':
        success = await sendBookingConfirmationEmail(booking)
        break
      case 'booking_reminder':
        success = await sendBookingReminderEmail(booking)
        break
    }

    return NextResponse.json({
      success,
      message: success ? 'Email enviado exitosamente' : 'Error al enviar email'
    })

  } catch (error) {
    console.error('Error sending email:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}