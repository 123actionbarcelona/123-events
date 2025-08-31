// Script para forzar el envío de un voucher específico
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function forceSendVoucher() {
  const voucherId = 'cmf032zm40000pnpl9f0v9j7p';
  
  try {
    console.log('📧 Forzando envío de voucher:', voucherId);
    
    // Obtener el voucher
    const voucher = await prisma.giftVoucher.findUnique({
      where: { id: voucherId }
    });
    
    if (!voucher) {
      console.error('❌ Voucher no encontrado');
      return;
    }
    
    console.log('📧 Voucher encontrado:', {
      code: voucher.code,
      purchaserEmail: voucher.purchaserEmail,
      status: voucher.status
    });
    
    // Importar y ejecutar función de envío
    console.log('📨 Importando función de envío...');
    const { sendVoucherWithPDF } = require('../lib/voucher-email-with-pdf');
    
    console.log('🚀 Enviando email a:', voucher.purchaserEmail);
    const result = await sendVoucherWithPDF(voucherId, voucher.purchaserEmail);
    
    if (result) {
      console.log('✅ Email enviado exitosamente');
    } else {
      console.log('❌ Fallo al enviar el email');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

forceSendVoucher();