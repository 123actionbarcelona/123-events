import { db } from '../lib/db'
import { sendVoucherWithPDF } from '../lib/voucher-email-with-pdf'

async function resendVoucherEmail() {
  const voucherId = process.argv[2] || 'cmf032zm40000pnpl9f0v9j7p'
  
  try {
    console.log('📧 Buscando voucher:', voucherId)
    
    const voucher = await db.giftVoucher.findUnique({
      where: { id: voucherId },
      include: {
        event: true
      }
    })
    
    if (!voucher) {
      console.error('❌ Voucher no encontrado')
      process.exit(1)
    }
    
    console.log('📧 Reenviando email para voucher:', voucher.code)
    console.log('📧 Destinatario:', voucher.purchaserEmail)
    
    const result = await sendVoucherWithPDF(voucherId)
    
    if (result) {
      console.log('✅ Email reenviado correctamente con PDF')
      
      // Actualizar flags de email enviado
      await db.giftVoucher.update({
        where: { id: voucherId },
        data: {
          purchaserEmailSent: true,
          purchaserEmailSentAt: new Date()
        }
      })
      
      console.log('✅ Base de datos actualizada')
    } else {
      console.error('❌ No se pudo enviar el email')
    }
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await db.$disconnect()
  }
}

resendVoucherEmail()