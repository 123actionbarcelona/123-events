import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Datos mock para vista previa según categoría
const mockData = {
  booking: {
    customerName: 'Ana García',
    eventName: 'Murder Mystery: El Testamento Perdido',
    eventDate: '15 de febrero de 2025',
    eventTime: '20:30',
    eventLocation: 'Teatro Principal, Madrid',
    bookingId: 'BK-2025-001234',
    totalAmount: '45.00',
    ticketCount: '2',
    specialInstructions: 'Presentarse 15 minutos antes. Dress code: formal elegante.'
  },
  voucher: {
    voucherCode: 'GIFT-2025-DEMO',
    amount: '100.00',
    purchaserName: 'María López',
    recipientName: 'Carlos Martín',
    recipientEmail: 'carlos@example.com',
    personalMessage: '¡Feliz cumpleaños! Disfruta de esta experiencia única.',
    expirationDate: '31 de diciembre de 2025'
  },
  reminder: {
    customerName: 'Pedro Rodríguez',
    eventName: 'Escape Room: La Mansión Embrujada',
    eventDate: 'mañana, 16 de febrero',
    eventTime: '19:00',
    eventLocation: 'Escape Center, Barcelona',
    bookingId: 'BK-2025-005678',
    checkinInstructions: 'Presentarse en recepción 10 minutos antes',
    weatherTip: 'El tiempo estará fresco, considera traer una chaqueta ligera'
  },
  marketing: {
    subscriberName: 'Laura Sánchez',
    monthlyEvents: `
      • Murder Mystery: El Club Secreto - 20 Feb, Madrid
      • Escape Room: Prisión de Alcatraz - 25 Feb, Barcelona
      • Detective Night: Caso Noir - 28 Feb, Valencia
    `,
    specialOffers: 'Descuento del 20% en reservas grupales de 4+ personas',
    unsubscribeLink: 'https://mysteryevents.com/unsubscribe?token=demo123'
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { content, category, subject } = body

    if (!content || !category) {
      return NextResponse.json({ 
        error: 'Campos requeridos: content, category' 
      }, { status: 400 })
    }

    // Obtener datos mock según la categoría
    const data = mockData[category as keyof typeof mockData] || mockData.booking

    // Procesar el contenido reemplazando variables
    let processedContent = content
    let processedSubject = subject || 'Vista Previa de Email'

    // Reemplazar variables en el contenido
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      processedContent = processedContent.replace(regex, value)
      if (processedSubject) {
        processedSubject = processedSubject.replace(regex, value)
      }
    })

    // Generar HTML completo para preview
    const previewHtml = generatePreviewHtml(processedContent, processedSubject)

    return NextResponse.json({
      html: previewHtml,
      subject: processedSubject,
      category,
      mockDataUsed: data
    })
  } catch (error) {
    console.error('Error generating preview:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

function generatePreviewHtml(content: string, subject: string): string {
  // Si el contenido ya es HTML completo, devolverlo tal como está
  if (content.includes('<html') || content.includes('<!DOCTYPE')) {
    return content
  }

  // Si no, envolver en HTML básico
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .email-container {
      background-color: #ffffff;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e11d48;
    }
    .header h1 {
      color: #e11d48;
      font-size: 28px;
      margin: 0;
    }
    .content {
      margin-bottom: 30px;
    }
    .footer {
      border-top: 1px solid #ddd;
      padding-top: 20px;
      font-size: 14px;
      color: #666;
      text-align: center;
    }
    .button {
      display: inline-block;
      padding: 12px 25px;
      background-color: #e11d48;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
      margin: 10px 0;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>Mystery Events</h1>
      <p>Vista Previa de Plantilla</p>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>Este es un email de vista previa generado por el sistema de plantillas.</p>
      <p>Mystery Events Platform • info@mysteryevents.com</p>
    </div>
  </div>
</body>
</html>
  `
}