import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { google } from 'googleapis'

// Configuración de Gmail API
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
)

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN
})

const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { email } = body

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Email válido requerido' }, { status: 400 })
    }

    // Obtener la plantilla
    const template = await prisma.emailTemplate.findUnique({
      where: { id }
    })

    if (!template) {
      return NextResponse.json({ error: 'Plantilla no encontrada' }, { status: 404 })
    }

    // Preparar variables de prueba
    const testVariables: Record<string, string> = {
      customerName: 'Juan Pérez',
      customer_name: 'Juan Pérez',
      eventTitle: 'Evento de Prueba',
      event_title: 'Cena con Misterio - Evento de Prueba',
      eventName: 'Cena con Misterio',
      event_name: 'Cena con Misterio',
      eventDate: '15 de Enero 2025',
      event_date: '15 de Enero 2025',
      eventTime: '20:00',
      event_time: '20:00',
      eventLocation: 'Restaurante Mystery, Barcelona',
      event_location: 'Restaurante Mystery, Barcelona',
      bookingCode: 'TEST-XXXX-YYYY',
      order_number: 'TEST-XXXX-YYYY',
      quantity: '2',
      companions: '1',
      guest_name: 'María García',
      totalAmount: '180€',
      total_paid: '180€',
      voucherCode: 'GIFT-TEST-DEMO',
      amount: '100€',
      recipientName: 'Ana López',
      purchaserName: 'Carlos Martín',
      expiryDate: '31 de Diciembre 2025',
      personalMessage: 'Este es un mensaje de prueba para el vale regalo',
      qr_img_src: 'https://via.placeholder.com/200x200?text=QR+Code',
      cta_url: '#',
      calendar_url: '#'
    }

    // Reemplazar variables en el HTML
    let htmlContent = template.html
    let subjectContent = template.subject

    // Reemplazar variables en el contenido
    Object.entries(testVariables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g')
      htmlContent = htmlContent.replace(regex, value)
      subjectContent = subjectContent.replace(regex, value)
    })

    // Si es para testing, agregar banner de prueba
    const testBanner = `
      <div style="background: #ff9800; color: white; padding: 10px; text-align: center; font-weight: bold;">
        ⚠️ ESTE ES UN EMAIL DE PRUEBA - NO ES UN EVENTO REAL ⚠️
      </div>
    `
    htmlContent = testBanner + htmlContent

    // Preparar el mensaje MIME
    const encodedSubject = `=?UTF-8?B?${Buffer.from('[TEST] ' + subjectContent, 'utf-8').toString('base64')}?=`
    
    const message = [
      `From: Mystery Events <${process.env.GMAIL_FROM_EMAIL}>`,
      `To: ${email}`,
      `Subject: ${encodedSubject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      htmlContent
    ].join('\n')

    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

    // Enviar el email
    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    })

    console.log(`✅ Test email sent to ${email} - Message ID: ${result.data.id}`)

    return NextResponse.json({ 
      success: true, 
      message: `Email de prueba enviado a ${email}`,
      messageId: result.data.id
    })

  } catch (error) {
    console.error('Error sending test email:', error)
    return NextResponse.json({ 
      error: 'Error al enviar email de prueba',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}