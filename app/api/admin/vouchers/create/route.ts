// app/api/admin/vouchers/create/route.ts
// API para crear vales desde el panel de admin

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { 
  CreateVoucherSchema, 
  generateVoucherCode, 
  calculateExpiryDate 
} from '@/lib/voucher-utils'

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación de admin
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' }, 
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validar datos con el schema existente
    const validatedData = CreateVoucherSchema.parse(body)
    
    // Generar código único
    const code = generateVoucherCode()
    
    // Calcular fecha de expiración (1 año)
    const expiryDate = calculateExpiryDate()
    
    // Crear el voucher en la base de datos
    const voucher = await db.giftVoucher.create({
      data: {
        code,
        type: validatedData.type,
        originalAmount: validatedData.amount || 0,
        currentBalance: validatedData.amount || 0,
        purchaserName: validatedData.purchaserName,
        purchaserEmail: validatedData.purchaserEmail,
        recipientName: validatedData.recipientName || null,
        recipientEmail: validatedData.recipientEmail || null,
        personalMessage: validatedData.personalMessage || null,
        templateUsed: validatedData.template,
        paymentStatus: 'completed', // Admin crea vouchers ya pagados
        status: 'active',
        expiryDate,
        paidAt: new Date(),
        activatedAt: new Date(),
      }
    })

    return NextResponse.json({
      success: true,
      voucher: {
        id: voucher.id,
        code: voucher.code,
        purchaserName: voucher.purchaserName,
        originalAmount: voucher.originalAmount,
        currentBalance: voucher.currentBalance,
        status: voucher.status
      }
    })

  } catch (error) {
    console.error('Error creating voucher from admin:', error)
    
    if (error.name === 'ZodError') {
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