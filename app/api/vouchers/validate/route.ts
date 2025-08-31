// app/api/vouchers/validate/route.ts
// API para validar vales regalo
// Creado: 24 Agosto 2025

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { 
  ValidateVoucherSchema,
  canUseVoucher,
  calculateVoucherUsage,
  VoucherStatus
} from '@/lib/voucher-utils'

// ================================
// POST - Validar vale regalo
// ================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar datos de entrada
    const { code, eventId, amount } = ValidateVoucherSchema.parse(body)

    // Buscar el vale en la base de datos
    const voucher = await db.giftVoucher.findUnique({
      where: { code },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            price: true,
            date: true,
            status: true
          }
        },
        redemptions: {
          include: {
            booking: {
              select: { 
                bookingCode: true, 
                customerName: true,
                totalAmount: true,
                createdAt: true
              }
            }
          },
          orderBy: { redeemedAt: 'desc' }
        }
      }
    })

    // Verificar que el vale existe
    if (!voucher) {
      return NextResponse.json({
        valid: false,
        error: 'Vale no encontrado',
        errorCode: 'VOUCHER_NOT_FOUND'
      }, { status: 404 })
    }

    // Verificar si el vale puede ser usado
    const usabilityCheck = canUseVoucher({
      status: voucher.status,
      currentBalance: voucher.currentBalance,
      expiryDate: voucher.expiryDate
    })

    if (!usabilityCheck.canUse) {
      return NextResponse.json({
        valid: false,
        error: usabilityCheck.reason,
        errorCode: 'VOUCHER_UNUSABLE',
        voucher: {
          code: voucher.code,
          status: voucher.status,
          currentBalance: voucher.currentBalance,
          expiryDate: voucher.expiryDate,
          originalAmount: voucher.originalAmount
        }
      }, { status: 400 })
    }

    // Validaciones específicas según contexto
    let validationWarnings = []
    let maxUsableAmount = voucher.currentBalance

    // Si es vale para evento específico
    if (voucher.type === 'event' && voucher.eventId) {
      if (eventId && eventId !== voucher.eventId) {
        return NextResponse.json({
          valid: false,
          error: 'Este vale es solo válido para un evento específico',
          errorCode: 'WRONG_EVENT',
          allowedEvent: voucher.event
        }, { status: 400 })
      }
      
      // Si no se especificó evento, informar cuál es válido
      if (!eventId) {
        validationWarnings.push({
          type: 'EVENT_SPECIFIC',
          message: `Vale válido solo para: ${voucher.event?.title}`,
          eventRequired: voucher.event
        })
      }
    }

    // Si se especificó un monto para validar
    if (amount) {
      const usage = calculateVoucherUsage(voucher.currentBalance, amount)
      maxUsableAmount = usage.amountToUse
      
      if (!usage.fullyCovered) {
        validationWarnings.push({
          type: 'PARTIAL_COVERAGE',
          message: `El vale cubre ${usage.amountToUse}€ de ${amount}€`,
          amountCovered: usage.amountToUse,
          remainingToPay: amount - usage.amountToUse
        })
      }
    }

    // Preparar información del vale
    const voucherInfo = {
      id: voucher.id,
      code: voucher.code,
      type: voucher.type,
      status: voucher.status,
      originalAmount: voucher.originalAmount,
      currentBalance: voucher.currentBalance,
      maxUsableAmount,
      expiryDate: voucher.expiryDate,
      purchaserName: voucher.purchaserName,
      recipientName: voucher.recipientName,
      personalMessage: voucher.personalMessage,
      event: voucher.event,
      redemptions: voucher.redemptions,
      createdAt: voucher.createdAt
    }

    return NextResponse.json({
      valid: true,
      voucher: voucherInfo,
      warnings: validationWarnings,
      usageInfo: amount ? {
        requestedAmount: amount,
        ...calculateVoucherUsage(voucher.currentBalance, amount)
      } : null
    })

  } catch (error) {
    console.error('Error validating voucher:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json({
        valid: false,
        error: 'Datos de validación inválidos',
        details: error.errors
      }, { status: 400 })
    }
    
    return NextResponse.json({
      valid: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

// ================================
// GET - Obtener info vale por código
// ================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    
    if (!code) {
      return NextResponse.json(
        { error: 'Código de vale requerido' },
        { status: 400 }
      )
    }

    // Buscar vale con información básica (sin validar uso)
    const voucher = await db.giftVoucher.findUnique({
      where: { code },
      select: {
        id: true,
        code: true,
        type: true,
        status: true,
        originalAmount: true,
        currentBalance: true,
        expiryDate: true,
        purchaserName: true,
        recipientName: true,
        personalMessage: true,
        templateUsed: true,
        createdAt: true,
        event: {
          select: {
            id: true,
            title: true,
            date: true,
            status: true
          }
        },
        redemptions: {
          select: {
            id: true,
            amountUsed: true,
            redeemedAt: true,
            booking: {
              select: {
                bookingCode: true,
                customerName: true
              }
            }
          },
          orderBy: { redeemedAt: 'desc' }
        }
      }
    })

    if (!voucher) {
      return NextResponse.json(
        { error: 'Vale no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ voucher })

  } catch (error) {
    console.error('Error fetching voucher info:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}