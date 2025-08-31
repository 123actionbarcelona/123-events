import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { sendVoucherEmail, sendVoucherPurchaseConfirmation } from '@/lib/voucher-email-service'

// Simular el webhook de Stripe para testing local
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación de admin
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { id: voucherId } = await params

    console.log(`🧪 Simulando webhook para voucher ${voucherId}`)

    // 1. Actualizar estado del voucher como si el pago se completara
    const voucher = await db.giftVoucher.update({
      where: { id: voucherId },
      data: {
        paymentStatus: 'completed',
        paidAt: new Date(),
        status: 'active'
      },
      include: {
        event: {
          select: { title: true, date: true }
        }
      }
    })

    console.log(`✅ Voucher ${voucher.code} actualizado a completed`)

    const emailResults = {
      purchaseConfirmation: false,
      giftVoucher: false
    }

    // 2. Enviar emails como lo haría el webhook
    try {
      // Email al comprador
      const purchaseEmailSent = await sendVoucherPurchaseConfirmation({
        voucherId: voucher.id,
        purchaserEmail: voucher.purchaserEmail
      })

      emailResults.purchaseConfirmation = purchaseEmailSent

      if (purchaseEmailSent) {
        console.log(`📧 Email de confirmación enviado a: ${voucher.purchaserEmail}`)
      } else {
        console.error('❌ Falló el envío de email de confirmación')
      }

      // Email al destinatario (si no hay programación de entrega)
      if (!voucher.scheduledDeliveryDate && voucher.recipientEmail) {
        const recipientEmailSent = await sendVoucherEmail({
          voucherId: voucher.id,
          recipientEmail: voucher.recipientEmail
        })

        emailResults.giftVoucher = recipientEmailSent

        if (recipientEmailSent) {
          console.log(`📧 Email de vale regalo enviado a: ${voucher.recipientEmail}`)
        } else {
          console.error('❌ Falló el envío de email de vale regalo')
        }
      } else if (voucher.scheduledDeliveryDate) {
        console.log(`⏰ Vale programado para entrega: ${voucher.scheduledDeliveryDate}`)
        emailResults.giftVoucher = 'scheduled'
      } else {
        console.log('⚠️  No hay email de destinatario configurado')
        emailResults.giftVoucher = 'no_recipient_email'
      }

    } catch (emailError) {
      console.error('❌ Error enviando emails:', emailError)
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook simulado exitosamente',
      voucher: {
        id: voucher.id,
        code: voucher.code,
        paymentStatus: voucher.paymentStatus,
        status: voucher.status
      },
      emails: emailResults
    })

  } catch (error) {
    console.error('❌ Error simulando webhook:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}