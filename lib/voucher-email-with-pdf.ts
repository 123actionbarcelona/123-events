import { google } from 'googleapis'
import { db } from '@/lib/db'
import { generateVoucherPDF } from '@/lib/pdf-generator'

// Configuración de Gmail API (igual que el original)
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
)

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN
})

const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

interface EmailData {
  to: string
  subject: string
  html: string
  attachments?: Array<{
    filename: string
    content: string
    encoding: 'base64'
  }>
}

function createMimeMessage(emailData: EmailData): string {
  const boundary = 'boundary_' + Math.random().toString(36).substr(2, 9)
  
  // Codificar el subject para UTF-8
  const encodedSubject = `=?UTF-8?B?${Buffer.from(emailData.subject, 'utf-8').toString('base64')}?=`
  
  let message = [
    `From: Mystery Events <${process.env.GMAIL_FROM_EMAIL}>`,
    `To: ${emailData.to}`,
    `Subject: ${encodedSubject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=utf-8',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(emailData.html, 'utf-8').toString('base64'),
  ].join('\n')

  // Añadir attachments si existen
  if (emailData.attachments && emailData.attachments.length > 0) {
    for (const attachment of emailData.attachments) {
      message += [
        '',
        `--${boundary}`,
        `Content-Type: application/pdf; name="${attachment.filename}"`,
        'Content-Transfer-Encoding: base64',
        `Content-Disposition: attachment; filename="${attachment.filename}"`,
        '',
        attachment.content,
      ].join('\n')
    }
  }

  message += `\n--${boundary}--`
  return message
}

async function sendEmailWithAttachments(emailData: EmailData): Promise<boolean> {
  try {
    console.log(`📨 Preparing to send email to: ${emailData.to}`)
    const message = createMimeMessage(emailData)
    
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

    console.log(`📤 Sending via Gmail API...`)
    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    })

    console.log(`📧 Email sent successfully! Message ID: ${result.data.id}`)
    return true

  } catch (error) {
    console.error('❌ Error sending email with attachment:', error)
    console.error('Error details:', (error as any).response?.data || (error as any).message)
    return false
  }
}

// Función principal: Enviar vale con PDF adjunto
export async function sendVoucherWithPDF(voucherId: string, recipientEmail: string): Promise<boolean> {
  try {
    console.log(`🚀 Sending voucher ${voucherId} with PDF to ${recipientEmail}`)

    // Obtener datos del voucher
    const voucher = await db.giftVoucher.findUnique({
      where: { id: voucherId },
      include: {
        event: {
          select: { title: true, date: true, price: true }
        }
      }
    })

    if (!voucher) {
      throw new Error('Vale no encontrado')
    }

    // Obtener plantilla de email desde la base de datos
    const template = await db.emailTemplate.findUnique({
      where: { name: 'voucher_purchase', active: true }
    })

    // Si no hay plantilla, usar plantilla básica
    const emailTemplate = template || {
      subject: '🎁 Tu vale regalo ha sido generado - {{amount}}',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            <h1 style="color: #1a1a2e; text-align: center;">🎁 ¡Vale Regalo Generado!</h1>
            
            <p style="font-size: 16px; color: #333;">Hola <strong>{{purchaserName}}</strong>,</p>
            
            <p style="font-size: 16px; color: #333;">Tu vale regalo ha sido generado exitosamente.</p>
            
            <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
              <h2 style="color: #1a1a2e; margin-top: 0;">Detalles del Vale:</h2>
              <ul style="list-style: none; padding: 0;">
                <li style="padding: 8px 0;"><strong>🎫 Código:</strong> <span style="background-color: #3b82f6; color: white; padding: 5px 10px; border-radius: 4px;">{{voucherCode}}</span></li>
                <li style="padding: 8px 0;"><strong>💰 Valor:</strong> {{amount}}</li>
                <li style="padding: 8px 0;"><strong>📅 Válido hasta:</strong> {{expiryDate}}</li>
                {{#recipientName}}<li style="padding: 8px 0;"><strong>🎁 Para:</strong> {{recipientName}}</li>{{/recipientName}}
                {{#personalMessage}}<li style="padding: 8px 0;"><strong>💌 Mensaje:</strong> "{{personalMessage}}"</li>{{/personalMessage}}
              </ul>
            </div>
            
            <div style="background-color: #dcfce7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
              <p style="margin: 0; font-size: 14px; color: #166534;">
                <strong>✅ PDF Adjunto:</strong> El vale regalo está adjunto a este email como archivo PDF. 
                Puedes descargarlo, imprimirlo o compartirlo con el destinatario.
              </p>
            </div>
            
            <p style="font-size: 16px; color: #333; margin-top: 30px;">¡Gracias por elegir Mystery Events!</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="text-align: center; color: #999; font-size: 12px;">
              Mystery Events Platform<br>
              Este es un email automático, por favor no respondas a este mensaje.
            </p>
          </div>
        </body>
        </html>
      `
    }

    // Generar PDF del voucher
    const pdfBuffer = await generateVoucherPDF({
      id: voucher.id,
      code: voucher.code,
      amount: voucher.originalAmount,
      recipientName: voucher.recipientName || 'Destinatario',
      purchaserName: voucher.purchaserName,
      personalMessage: voucher.personalMessage,
      expiryDate: voucher.expiryDate,
      template: voucher.templateUsed || 'elegant'
    })

    // Preparar variables para la plantilla
    const templateVariables = {
      purchaserName: voucher.purchaserName,
      voucherCode: voucher.code,
      amount: voucher.originalAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }),
      expiryDate: voucher.expiryDate ? 
        voucher.expiryDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : 
        'Sin fecha de expiración',
      recipientName: voucher.recipientName,
      personalMessage: voucher.personalMessage
    }

    // Renderizar plantilla con variables
    let htmlContent = emailTemplate.html
    let subject = emailTemplate.subject

    // Reemplazar variables normales
    for (const [key, value] of Object.entries(templateVariables)) {
      if (value) {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
        htmlContent = htmlContent.replace(regex, value)
        subject = subject.replace(regex, value)
      }
    }

    // Manejar bloques condicionales simples ({{#variable}}...{{/variable}})
    // Para recipientName
    if (templateVariables.recipientName) {
      htmlContent = htmlContent.replace(/\{\{#recipientName\}\}(.*?)\{\{\/recipientName\}\}/gs, '$1')
    } else {
      htmlContent = htmlContent.replace(/\{\{#recipientName\}\}(.*?)\{\{\/recipientName\}\}/gs, '')
    }

    // Para personalMessage
    if (templateVariables.personalMessage) {
      htmlContent = htmlContent.replace(/\{\{#personalMessage\}\}(.*?)\{\{\/personalMessage\}\}/gs, '$1')
    } else {
      htmlContent = htmlContent.replace(/\{\{#personalMessage\}\}(.*?)\{\{\/personalMessage\}\}/gs, '')
    }

    // Enviar email con PDF adjunto
    const emailData: EmailData = {
      to: recipientEmail,
      subject: subject,
      html: htmlContent,
      attachments: [
        {
          filename: `vale-regalo-${voucher.code}.pdf`,
          content: pdfBuffer.toString('base64'),
          encoding: 'base64'
        }
      ]
    }

    const success = await sendEmailWithAttachments(emailData)

    if (success) {
      // Marcar como enviado en la base de datos
      await db.giftVoucher.update({
        where: { id: voucher.id },
        data: {
          purchaserEmailSent: true,
          purchaserEmailSentAt: new Date(),
        },
      })

      console.log(`✅ Voucher email with PDF sent successfully to ${recipientEmail}`)
    }

    return success

  } catch (error) {
    console.error('❌ Error sending voucher with PDF:', error)
    return false
  }
}