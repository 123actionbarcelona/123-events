import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateVoucherCode } from '@/lib/voucher-utils'

// API especial para crear vales de prueba sin pago
export async function POST(request: NextRequest) {
  try {
    console.log('🎁 Creando vales de prueba...')

    const testVouchers = [
      {
        code: 'GIFT-TEST-50EU',
        originalAmount: 50,
        currentBalance: 50,
        purchaserName: 'Usuario Test',
        purchaserEmail: 'test@mysteryevents.com',
      },
      {
        code: 'GIFT-MINI-25EU',
        originalAmount: 25,
        currentBalance: 25,
        purchaserName: 'Cliente Pequeño',
        purchaserEmail: 'mini@test.com',
      },
      {
        code: 'GIFT-PREM-100E',
        originalAmount: 100,
        currentBalance: 100,
        purchaserName: 'Cliente Premium',
        purchaserEmail: 'premium@test.com',
      },
      {
        code: 'GIFT-GRAN-150E',
        originalAmount: 150,
        currentBalance: 150,
        purchaserName: 'Gran Regalo',
        purchaserEmail: 'grande@test.com',
      },
      {
        code: 'GIFT-USED-75EU',
        originalAmount: 100,
        currentBalance: 75, // Parcialmente usado
        purchaserName: 'Vale Parcial',
        purchaserEmail: 'usado@test.com',
      }
    ]

    const createdVouchers = []

    for (const voucher of testVouchers) {
      // Verificar si ya existe
      const existing = await db.giftVoucher.findUnique({
        where: { code: voucher.code }
      })

      if (existing) {
        console.log(`⚠️ Vale ${voucher.code} ya existe, saltando...`)
        createdVouchers.push(existing)
        continue
      }

      // Crear vale de prueba
      const newVoucher = await db.giftVoucher.create({
        data: {
          ...voucher,
          type: 'amount',
          status: 'active',
          paymentStatus: 'paid',
          purchaseDate: new Date(),
          paidAt: new Date(),
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 año
          templateUsed: 'elegant',
          personalMessage: 'Vale de prueba para testing del sistema',
        }
      })

      console.log(`✅ Creado: ${newVoucher.code} - €${newVoucher.currentBalance}`)
      createdVouchers.push(newVoucher)
    }

    return NextResponse.json({
      success: true,
      message: `${createdVouchers.length} vales de prueba creados`,
      vouchers: createdVouchers.map(v => ({
        code: v.code,
        amount: v.currentBalance,
        status: v.status
      }))
    })

  } catch (error) {
    console.error('❌ Error creando vales de prueba:', error)
    return NextResponse.json(
      { error: 'Error creando vales de prueba' },
      { status: 500 }
    )
  }
}