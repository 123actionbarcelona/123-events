// app/api/vouchers/success/route.ts
// API para obtener detalles del voucher después del pago exitoso
// Creado: 31 Agosto 2025

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { findVoucherBySessionId } from '@/lib/voucher-validation'

// ================================
// GET - Obtener detalles del voucher por session_id
// ================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID requerido' },
        { status: 400 }
      )
    }

    // Buscar el voucher usando función validada
    const voucher = await findVoucherBySessionId(sessionId)

    if (!voucher) {
      // Log para debugging en desarrollo
      console.error('Voucher not found for session_id:', sessionId)
      return NextResponse.json(
        { error: 'Vale no encontrado' },
        { status: 404 }
      )
    }

    // 🎯 DESARROLLO LOCAL: Simular webhook si el vale está pending
    if (voucher.paymentStatus === 'pending') {
      console.log('🚀 LOCAL DEV: Simulating webhook for voucher:', voucher.code)
      
      try {
        // Actualizar voucher a completed (como haría el webhook)
        await db.giftVoucher.update({
          where: { id: voucher.id },
          data: {
            paymentStatus: 'completed',
            paidAt: new Date(),
            status: 'active'
          }
        })

        // Enviar email de confirmación al comprador con PDF adjunto
        if (voucher.purchaserEmail) {
          try {
            console.log(`🚀 Attempting to send email to: ${voucher.purchaserEmail}`)
            const { sendVoucherWithPDF } = await import('@/lib/voucher-email-with-pdf')
            const emailSent = await sendVoucherWithPDF(voucher.id, voucher.purchaserEmail)
            if (emailSent) {
              console.log(`📧 Purchase confirmation with PDF sent to: ${voucher.purchaserEmail}`)
            } else {
              console.error(`❌ Failed to send email to: ${voucher.purchaserEmail}`)
            }
          } catch (emailError) {
            console.error('❌ Error sending purchase confirmation with PDF:', emailError)
          }
        }

        // Enviar vale al destinatario con PDF adjunto (si tiene email)
        if (voucher.recipientEmail) {
          try {
            const { sendVoucherWithPDF } = await import('@/lib/voucher-email-with-pdf')
            await sendVoucherWithPDF(voucher.id, voucher.recipientEmail)
            console.log(`📧 Gift voucher with PDF sent to: ${voucher.recipientEmail}`)
          } catch (emailError) {
            console.error('Error sending gift voucher with PDF:', emailError)
          }
        }

        console.log('✅ LOCAL DEV: Webhook simulation completed')
        
      } catch (error) {
        console.error('❌ LOCAL DEV: Error simulating webhook:', error)
      }
    }

    // Preparar datos para la respuesta
    const voucherData = {
      id: voucher.id,
      code: voucher.code,
      type: voucher.type,
      originalAmount: voucher.originalAmount,
      purchaserName: voucher.purchaserName,
      recipientName: voucher.recipientName,
      personalMessage: voucher.personalMessage,
      templateUsed: voucher.templateUsed,
      expiryDate: voucher.expiryDate.toISOString(),
      event: voucher.event ? {
        title: voucher.event.title,
        date: voucher.event.date.toISOString()
      } : null,
      status: 'active', // Mostrar como activo después de la simulación
      paymentStatus: 'completed' // Mostrar como completado
    }

    return NextResponse.json({
      success: true,
      voucher: voucherData
    })

  } catch (error) {
    console.error('Error fetching voucher success details:', error)
    return NextResponse.json(
      { error: 'Error obteniendo detalles del vale' },
      { status: 500 }
    )
  }
}