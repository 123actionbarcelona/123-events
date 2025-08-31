// Script para crear vales regalo de prueba
// Ejecutar con: node scripts/create-test-vouchers.js

require('dotenv').config()
const { PrismaClient } = require('@prisma/client')

const db = new PrismaClient()

async function createTestVouchers() {
  console.log('🎁 Creando vales regalo de prueba...')

  try {
    // 1. Vale de 50€ - Importe libre
    const voucher1 = await db.giftVoucher.create({
      data: {
        code: 'GIFT-TEST-50EU',
        type: 'amount',
        originalAmount: 50,
        currentBalance: 50,
        purchaserName: 'Usuario de Prueba',
        purchaserEmail: 'test@mysteryevents.com',
        status: 'active',
        purchaseDate: new Date(),
        expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        paymentStatus: 'paid',
        paidAt: new Date(),
        templateUsed: 'elegant'
      }
    })
    console.log('✅ Vale 1:', voucher1.code, '- €50')

    // 2. Vale de 100€ - Importe libre
    const voucher2 = await db.giftVoucher.create({
      data: {
        code: 'GIFT-TEST-100E',
        type: 'amount',
        originalAmount: 100,
        currentBalance: 100,
        purchaserName: 'Cliente Premium',
        purchaserEmail: 'premium@mysteryevents.com',
        status: 'active',
        purchaseDate: new Date(),
        expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        paymentStatus: 'paid',
        paidAt: new Date(),
        templateUsed: 'mystery'
      }
    })
    console.log('✅ Vale 2:', voucher2.code, '- €100')

    // 3. Vale de 25€ - Importe pequeño
    const voucher3 = await db.giftVoucher.create({
      data: {
        code: 'GIFT-MINI-25EU',
        type: 'amount',
        originalAmount: 25,
        currentBalance: 25,
        purchaserName: 'Compra Pequeña',
        purchaserEmail: 'mini@mysteryevents.com',
        status: 'active',
        purchaseDate: new Date(),
        expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        paymentStatus: 'paid',
        paidAt: new Date(),
        templateUsed: 'fun'
      }
    })
    console.log('✅ Vale 3:', voucher3.code, '- €25')

    // 4. Vale de 150€ - Importe alto
    const voucher4 = await db.giftVoucher.create({
      data: {
        code: 'GIFT-MAX-150E',
        type: 'amount',
        originalAmount: 150,
        currentBalance: 150,
        purchaserName: 'Gran Regalo',
        purchaserEmail: 'grande@mysteryevents.com',
        status: 'active',
        purchaseDate: new Date(),
        expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        paymentStatus: 'paid',
        paidAt: new Date(),
        templateUsed: 'christmas'
      }
    })
    console.log('✅ Vale 4:', voucher4.code, '- €150')

    // 5. Vale parcialmente usado
    const voucher5 = await db.giftVoucher.create({
      data: {
        code: 'GIFT-USED-75EU',
        type: 'amount',
        originalAmount: 100,
        currentBalance: 75, // Ya usado 25€
        purchaserName: 'Vale Usado',
        purchaserEmail: 'usado@mysteryevents.com',
        status: 'active',
        purchaseDate: new Date(),
        expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        paymentStatus: 'paid',
        paidAt: new Date(),
        templateUsed: 'elegant'
      }
    })
    console.log('✅ Vale 5:', voucher5.code, '- €75 (parcialmente usado)')

    console.log('\n🎯 VALES REGALO CREADOS PARA TESTING:')
    console.log('==========================================')
    console.log(`1. ${voucher1.code} - €50.00 (completo)`)
    console.log(`2. ${voucher2.code} - €100.00 (completo)`)
    console.log(`3. ${voucher3.code} - €25.00 (completo)`)
    console.log(`4. ${voucher4.code} - €150.00 (completo)`)
    console.log(`5. ${voucher5.code} - €75.00 (parcialmente usado)`)
    console.log('==========================================')
    console.log('\n✨ ¡Usa estos códigos para probar pagos mixtos!')
    console.log('💡 Puedes combinarlos con tarjeta si el evento cuesta más')

  } catch (error) {
    console.error('❌ Error creando vales:', error)
  } finally {
    await db.$disconnect()
  }
}

createTestVouchers()