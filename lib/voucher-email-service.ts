import { gmail_v1, google } from 'googleapis'
import { db } from '@/lib/db'
import { renderGiftVoucherEmail, renderVoucherPurchaseConfirmationEmail } from './email-templates'

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

interface SendVoucherEmailOptions {
  voucherId: string
  recipientEmail?: string
  scheduleDelivery?: Date
}

interface SendPurchaseConfirmationOptions {
  voucherId: string
  purchaserEmail: string
}

class VoucherEmailService {
  
  // Enviar vale regalo al destinatario
  async sendVoucherToRecipient(options: SendVoucherEmailOptions): Promise<boolean> {
    try {
      const voucher = await db.giftVoucher.findUnique({
        where: { id: options.voucherId },
        include: {
          event: {
            include: {
              voucherTemplate: true
            }
          }
        }
      })

      if (!voucher) {
        throw new Error('Vale no encontrado')
      }

      const recipientEmail = options.recipientEmail || voucher.recipientEmail
      
      if (!recipientEmail) {
        console.log(`Vale ${voucher.code} no tiene email de destinatario`)
        return false
      }

      // Si tiene programación de entrega y aún no es el momento
      const deliveryDate = options.scheduleDelivery || voucher.scheduledDeliveryDate
      if (deliveryDate && new Date() < deliveryDate) {
        console.log(`Vale ${voucher.code} programado para ${deliveryDate}`)
        return false
      }

      // Generar URL de descarga del PDF
      const downloadUrl = `${process.env.NEXTAUTH_URL}/api/vouchers/${voucher.id}/pdf`

      // Obtener plantilla desde DB
      const template = await this.getVoucherTemplate(voucher, 'gift')
      if (!template) {
        throw new Error('No se encontró plantilla para vale regalo')
      }

      // Renderizar template con variables
      const htmlContent = this.replaceTemplateVariables(template.html, {
        voucherCode: voucher.code,
        recipientName: voucher.recipientName || 'Estimado/a cliente',
        purchaserName: voucher.purchaserName,
        personalMessage: voucher.personalMessage || '',
        amount: voucher.originalAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }),
        expirationDate: voucher.expiryDate ? 
          voucher.expiryDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : 
          'Sin fecha de expiración',
        downloadUrl: downloadUrl || '#'
      })

      const subject = this.replaceTemplateVariables(template.subject, {
        recipientName: voucher.recipientName || '',
        voucherCode: voucher.code
      })

      const emailMessage = [
        'Content-Type: text/html; charset="UTF-8"',
        'MIME-Version: 1.0',
        `To: ${recipientEmail}`,
        `Subject: ${subject}`,
        '',
        htmlContent
      ].join('\n')

      const encodedMessage = Buffer.from(emailMessage)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')

      // Enviar email
      await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
        },
      })

      // Marcar como enviado
      await db.giftVoucher.update({
        where: { id: voucher.id },
        data: {
          recipientEmailSent: true,
          recipientEmailSentAt: new Date(),
        },
      })

      console.log(`Vale regalo enviado a ${recipientEmail} para código ${voucher.code}`)
      return true

    } catch (error) {
      console.error('Error enviando vale regalo:', error)
      
      // Registrar el error en la base de datos
      await db.giftVoucher.update({
        where: { id: options.voucherId },
        data: {
          recipientEmailSent: false,
        },
      })

      return false
    }
  }

  // Enviar confirmación de compra al comprador
  async sendPurchaseConfirmation(options: SendPurchaseConfirmationOptions): Promise<boolean> {
    try {
      const voucher = await db.giftVoucher.findUnique({
        where: { id: options.voucherId },
        include: {
          event: {
            include: {
              voucherTemplate: true
            }
          }
        }
      })

      if (!voucher) {
        throw new Error('Vale no encontrado')
      }

      // Obtener plantilla desde DB
      const template = await this.getVoucherTemplate(voucher, 'purchase_confirmation')
      if (!template) {
        throw new Error('No se encontró plantilla para confirmación de compra')
      }

      // Renderizar template con variables
      const htmlContent = this.replaceTemplateVariables(template.html, {
        purchaserName: voucher.purchaserName,
        voucherCode: voucher.code,
        amount: voucher.originalAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }),
        recipientName: voucher.recipientName || 'No especificado',
        recipientEmail: voucher.recipientEmail || 'No especificado',
        personalMessage: voucher.personalMessage || 'Ningún mensaje personalizado'
      })

      // Preparar el email
      const subject = this.replaceTemplateVariables(template.subject, {
        purchaserName: voucher.purchaserName,
        voucherCode: voucher.code
      })

      const emailMessage = [
        'Content-Type: text/html; charset="UTF-8"',
        'MIME-Version: 1.0',
        `To: ${options.purchaserEmail}`,
        `Subject: ${subject}`,
        '',
        htmlContent
      ].join('\n')

      const encodedMessage = Buffer.from(emailMessage)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')

      // Enviar email
      await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
        },
      })

      // Marcar como enviado
      await db.giftVoucher.update({
        where: { id: voucher.id },
        data: {
          purchaserEmailSent: true,
          purchaserEmailSentAt: new Date(),
        },
      })

      console.log(`Confirmación de compra enviada a ${options.purchaserEmail} para vale ${voucher.code}`)
      return true

    } catch (error) {
      console.error('Error enviando confirmación de compra:', error)
      
      // Registrar el error en la base de datos
      await db.giftVoucher.update({
        where: { id: options.voucherId },
        data: {
          purchaserEmailSent: false,
        },
      })

      return false
    }
  }

  // Reenviar vale al destinatario (para uso desde admin)
  async resendVoucherEmail(voucherId: string, newEmail?: string): Promise<boolean> {
    try {
      // Si se proporciona nuevo email, actualizar el vale
      if (newEmail) {
        await db.giftVoucher.update({
          where: { id: voucherId },
          data: { 
            recipientEmail: newEmail,
            recipientEmailSent: false
          },
        })
      }

      return await this.sendVoucherToRecipient({ voucherId })

    } catch (error) {
      console.error('Error reenviando vale:', error)
      return false
    }
  }

  // Procesar vales programados para entrega
  async processScheduledVouchers(): Promise<number> {
    try {
      const now = new Date()
      
      // Obtener vales programados que deben ser enviados
      const scheduledVouchers = await db.giftVoucher.findMany({
        where: {
          status: 'active',
          recipientEmailSent: false,
          scheduledDeliveryDate: {
            lte: now
          },
          recipientEmail: {
            not: null
          }
        }
      })

      let sentCount = 0

      for (const voucher of scheduledVouchers) {
        const success = await this.sendVoucherToRecipient({ 
          voucherId: voucher.id 
        })
        
        if (success) {
          sentCount++
        }
      }

      console.log(`Procesados ${sentCount} vales programados de ${scheduledVouchers.length}`)
      return sentCount

    } catch (error) {
      console.error('Error procesando vales programados:', error)
      return 0
    }
  }

  // Enviar recordatorios de vales próximos a expirar
  async sendExpirationReminders(): Promise<number> {
    try {
      const reminderDate = new Date()
      reminderDate.setDate(reminderDate.getDate() + 30) // 30 días antes de expirar

      // Obtener vales próximos a expirar que no han sido recordados
      const expiringVouchers = await db.giftVoucher.findMany({
        where: {
          status: 'active',
          currentBalance: { gt: 0 },
          expiryDate: {
            lte: reminderDate
          },
          expirationReminderSent: false,
          recipientEmail: {
            not: null
          }
        }
      })

      let sentCount = 0

      for (const voucher of expiringVouchers) {
        // Aquí podrías crear una plantilla específica para recordatorio de expiración
        // Por ahora, reenviaremos el vale original
        const success = await this.sendVoucherToRecipient({
          voucherId: voucher.id,
          recipientEmail: voucher.recipientEmail!
        })

        if (success) {
          // Marcar como recordatorio enviado
          await db.giftVoucher.update({
            where: { id: voucher.id },
            data: { expirationReminderSent: true }
          })
          
          sentCount++
        }
      }

      console.log(`Enviados ${sentCount} recordatorios de expiración`)
      return sentCount

    } catch (error) {
      console.error('Error enviando recordatorios de expiración:', error)
      return 0
    }
  }

  // Métodos auxiliares privados
  private async getVoucherTemplate(voucher: any, type: 'gift' | 'purchase_confirmation' | 'expiration_reminder') {
    try {
      // 1. Si el vale es para un evento específico, buscar plantilla del evento
      if (voucher.eventId && voucher.event) {
        const eventTemplate = voucher.event.voucherTemplate
        if (eventTemplate && eventTemplate.active) {
          console.log(`Using event-specific voucher template: ${eventTemplate.name}`)
          return eventTemplate
        }
      }

      // 2. Buscar plantilla por tipo específico
      let templateName = ''
      if (type === 'gift') templateName = 'voucher_gift'
      if (type === 'purchase_confirmation') templateName = 'voucher_purchase_confirmation'
      if (type === 'expiration_reminder') templateName = 'voucher_expiration_reminder'

      const specificTemplate = await db.emailTemplate.findUnique({
        where: { name: templateName, active: true }
      })
      
      if (specificTemplate) {
        console.log(`Using specific voucher template: ${specificTemplate.name}`)
        return specificTemplate
      }

      // 3. Fallback a plantilla genérica
      const genericTemplate = await db.emailTemplate.findFirst({
        where: { 
          name: { contains: 'voucher' },
          active: true
        },
        orderBy: { createdAt: 'desc' }
      })

      if (genericTemplate) {
        console.log(`Using generic voucher template: ${genericTemplate.name}`)
        return genericTemplate
      }

      return null

    } catch (error) {
      console.error('Error fetching voucher template:', error)
      return null
    }
  }

  private replaceTemplateVariables(template: string, variables: Record<string, string>): string {
    let result = template
    
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      result = result.replace(regex, value)
    }
    
    return result
  }
}

export const voucherEmailService = new VoucherEmailService()

// Funciones helper para usar en APIs
export const sendVoucherEmail = (options: SendVoucherEmailOptions) => 
  voucherEmailService.sendVoucherToRecipient(options)

export const sendVoucherPurchaseConfirmation = (options: SendPurchaseConfirmationOptions) =>
  voucherEmailService.sendPurchaseConfirmation(options)

export const resendVoucherEmail = (voucherId: string, newEmail?: string) =>
  voucherEmailService.resendVoucherEmail(voucherId, newEmail)

export const processScheduledVouchers = () =>
  voucherEmailService.processScheduledVouchers()

export const sendExpirationReminders = () =>
  voucherEmailService.sendExpirationReminders()