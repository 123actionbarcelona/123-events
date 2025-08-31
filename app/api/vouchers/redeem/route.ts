// app/api/vouchers/redeem/route.ts
// API para canjear vales regalo
// Creado: 24 Agosto 2025

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { 
  RedeemVoucherSchema,
  canUseVoucher,
  calculateVoucherUsage,
  VoucherStatus
} from '@/lib/voucher-utils'

// ================================
// POST - Canjear vale regalo
// ================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar datos de entrada
    const { voucherCode, bookingId, amountToUse } = RedeemVoucherSchema.parse(body)

    // Verificar que la reserva existe
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        event: {
          select: { id: true, title: true, price: true }
        },
        voucherRedemption: true
      }
    })

    if (!booking) {
      return NextResponse.json({
        success: false,
        error: 'Reserva no encontrada'
      }, { status: 404 })
    }

    // Verificar que la reserva no tenga ya un vale canjeado
    if (booking.voucherRedemption) {
      return NextResponse.json({
        success: false,
        error: 'Esta reserva ya tiene un vale canjeado',
        existingRedemption: booking.voucherRedemption
      }, { status: 400 })
    }

    // Buscar y validar el vale
    const voucher = await db.giftVoucher.findUnique({
      where: { code: voucherCode },
      include: {
        event: {
          select: { id: true, title: true }
        },
        redemptions: {
          include: {
            booking: {
              select: { bookingCode: true, customerName: true }
            }
          }
        }
      }
    })

    if (!voucher) {
      return NextResponse.json({
        success: false,
        error: 'Vale no encontrado'
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
        success: false,
        error: usabilityCheck.reason,
        voucher: {
          code: voucher.code,
          status: voucher.status,
          currentBalance: voucher.currentBalance,
          expiryDate: voucher.expiryDate
        }
      }, { status: 400 })
    }

    // Validar compatibilidad evento-vale
    if (voucher.type === 'event' && voucher.eventId) {
      if (voucher.eventId !== booking.eventId) {
        return NextResponse.json({
          success: false,
          error: 'Este vale no es válido para este evento',
          voucherEvent: voucher.event?.title,
          bookingEvent: booking.event?.title
        }, { status: 400 })
      }
    }

    // Verificar que el monto a usar es válido
    if (amountToUse > voucher.currentBalance) {
      return NextResponse.json({
        success: false,
        error: 'El vale no tiene suficiente saldo',
        available: voucher.currentBalance,
        requested: amountToUse
      }, { status: 400 })
    }

    if (amountToUse > booking.totalAmount) {
      return NextResponse.json({
        success: false,
        error: 'El monto a usar excede el total de la reserva',
        bookingTotal: booking.totalAmount,
        requested: amountToUse
      }, { status: 400 })
    }

    // Calcular nuevos valores
    const newVoucherBalance = voucher.currentBalance - amountToUse
    const stripeAmount = booking.totalAmount - amountToUse
    
    // Determinar nuevo estado del vale
    let newVoucherStatus = voucher.status
    if (newVoucherBalance <= 0) {
      newVoucherStatus = VoucherStatus.USED
    }

    // Determinar método de pago de la reserva
    let paymentMethod = 'voucher'
    if (stripeAmount > 0) {
      paymentMethod = 'mixed'
    }

    // Ejecutar transacción
    const result = await db.$transaction(async (tx) => {
      // Crear la redención
      const redemption = await tx.voucherRedemption.create({
        data: {
          voucherId: voucher.id,
          bookingId: booking.id,
          amountUsed: amountToUse
        },
        include: {
          voucher: {
            select: {
              code: true,
              type: true,
              originalAmount: true
            }
          },
          booking: {
            select: {
              bookingCode: true,
              customerName: true,
              totalAmount: true
            }
          }
        }
      })

      // Actualizar el vale
      const updatedVoucher = await tx.giftVoucher.update({
        where: { id: voucher.id },
        data: {
          currentBalance: newVoucherBalance,
          status: newVoucherStatus
        }
      })

      // Actualizar la reserva con información de pago
      const updatedBooking = await tx.booking.update({
        where: { id: booking.id },
        data: {
          paymentMethod,
          voucherAmount: amountToUse,
          stripeAmount: stripeAmount > 0 ? stripeAmount : null
        },
        include: {
          event: {
            select: { title: true, date: true }
          },
          voucherRedemption: {
            include: {
              voucher: {
                select: { code: true, originalAmount: true }
              }
            }
          }
        }
      })

      return {
        redemption,
        updatedVoucher,
        updatedBooking
      }
    })

    // Preparar respuesta de éxito
    return NextResponse.json({
      success: true,
      redemption: {
        id: result.redemption.id,
        amountUsed: result.redemption.amountUsed,
        redeemedAt: result.redemption.redeemedAt,
        voucher: result.redemption.voucher,
        booking: result.redemption.booking
      },
      voucher: {
        code: voucher.code,
        previousBalance: voucher.currentBalance,
        currentBalance: result.updatedVoucher.currentBalance,
        newStatus: result.updatedVoucher.status,
        fullyUsed: result.updatedVoucher.status === VoucherStatus.USED
      },
      booking: {
        id: result.updatedBooking.id,
        paymentMethod: result.updatedBooking.paymentMethod,
        voucherAmount: result.updatedBooking.voucherAmount,
        stripeAmount: result.updatedBooking.stripeAmount,
        requiresStripePayment: (result.updatedBooking.stripeAmount || 0) > 0
      }
    })

  } catch (error) {
    console.error('Error redeeming voucher:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: 'Datos de canje inválidos',
        details: error.errors
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

// ================================
// DELETE - Cancelar canje (ADMIN)
// ================================
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const redemptionId = searchParams.get('redemptionId')
    
    if (!redemptionId) {
      return NextResponse.json(
        { error: 'ID de canje requerido' },
        { status: 400 }
      )
    }

    // Buscar la redención
    const redemption = await db.voucherRedemption.findUnique({
      where: { id: redemptionId },
      include: {
        voucher: true,
        booking: true
      }
    })

    if (!redemption) {
      return NextResponse.json(
        { error: 'Canje no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que la reserva no esté ya completada
    if (redemption.booking.paymentStatus === 'completed') {
      return NextResponse.json({
        error: 'No se puede cancelar el canje de una reserva completada'
      }, { status: 400 })
    }

    // Revertir la transacción
    const result = await db.$transaction(async (tx) => {
      // Restaurar saldo del vale
      const updatedVoucher = await tx.giftVoucher.update({
        where: { id: redemption.voucher.id },
        data: {
          currentBalance: redemption.voucher.currentBalance + redemption.amountUsed,
          status: VoucherStatus.ACTIVE // Reactivar si estaba usado
        }
      })

      // Actualizar la reserva
      const updatedBooking = await tx.booking.update({
        where: { id: redemption.booking.id },
        data: {
          paymentMethod: 'card',
          voucherAmount: null,
          stripeAmount: null
        }
      })

      // Eliminar la redención
      await tx.voucherRedemption.delete({
        where: { id: redemptionId }
      })

      return { updatedVoucher, updatedBooking }
    })

    return NextResponse.json({
      success: true,
      message: 'Canje cancelado exitosamente',
      voucher: {
        code: result.updatedVoucher.code,
        restoredBalance: result.updatedVoucher.currentBalance
      }
    })

  } catch (error) {
    console.error('Error cancelling redemption:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}