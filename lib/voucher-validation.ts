// lib/voucher-validation.ts
// Validaciones para asegurar consistencia de datos en vouchers
// Creado: 31 Agosto 2025

import { db } from '@/lib/db'
import { VoucherWithStripe, WebhookVoucherData } from '@/types/voucher'

/**
 * Valida que un voucher tenga todos los campos de Stripe necesarios
 */
export function validateVoucherStripeFields(voucher: any): voucher is VoucherWithStripe {
  return (
    voucher &&
    typeof voucher.id === 'string' &&
    typeof voucher.stripeSessionId === 'string' &&
    voucher.stripeSessionId.length > 0 &&
    ['pending', 'completed', 'failed'].includes(voucher.paymentStatus) &&
    ['active', 'redeemed', 'cancelled', 'expired'].includes(voucher.status)
  )
}

/**
 * Encuentra un voucher por session_id y valida que tenga los campos correctos
 */
export async function findVoucherBySessionId(sessionId: string): Promise<VoucherWithStripe | null> {
  if (!sessionId || typeof sessionId !== 'string') {
    throw new Error('Session ID inválido')
  }

  const voucher = await db.giftVoucher.findFirst({
    where: { stripeSessionId: sessionId },
    include: {
      event: {
        select: { id: true, title: true, date: true }
      }
    }
  })

  if (!voucher) {
    return null
  }

  if (!validateVoucherStripeFields(voucher)) {
    console.error('Voucher encontrado pero con campos de Stripe incompletos:', {
      id: voucher.id,
      code: voucher.code,
      stripeSessionId: voucher.stripeSessionId,
      stripePaymentId: voucher.stripePaymentId,
      paymentStatus: voucher.paymentStatus
    })
    throw new Error('Voucher con datos inconsistentes - contacte soporte técnico')
  }

  return voucher as VoucherWithStripe
}

/**
 * Actualiza un voucher asegurando que todos los campos de Stripe se guardan correctamente
 */
export async function updateVoucherWithStripeData(
  voucherId: string, 
  stripeData: {
    sessionId: string
    paymentIntentId?: string
    paymentStatus: 'pending' | 'completed' | 'failed'
    status?: 'active' | 'redeemed' | 'cancelled' | 'expired'
  }
) {
  const updateData: any = {
    stripeSessionId: stripeData.sessionId,
    paymentStatus: stripeData.paymentStatus
  }

  if (stripeData.paymentIntentId) {
    updateData.stripePaymentId = stripeData.paymentIntentId
  }

  if (stripeData.status) {
    updateData.status = stripeData.status
  }

  if (stripeData.paymentStatus === 'completed') {
    updateData.paidAt = new Date()
  }

  const updatedVoucher = await db.giftVoucher.update({
    where: { id: voucherId },
    data: updateData
  })

  // Validar que la actualización fue correcta
  if (!validateVoucherStripeFields(updatedVoucher)) {
    console.error('Error: Voucher actualizado con datos inconsistentes', updatedVoucher)
    throw new Error('Fallo en actualización de voucher - datos inconsistentes')
  }

  return updatedVoucher
}

/**
 * Valida datos del webhook antes de procesar
 */
export function validateWebhookData(metadata: any): WebhookVoucherData | null {
  if (!metadata || typeof metadata !== 'object') {
    return null
  }

  const { type, voucherId } = metadata

  if (type !== 'voucher_purchase' || !voucherId || typeof voucherId !== 'string') {
    return null
  }

  return {
    voucherId,
    sessionId: '', // Se llena desde el webhook
    paymentIntentId: metadata.paymentIntentId
  }
}

/**
 * Verifica la consistencia de datos de voucher en la base de datos
 * Útil para debugging y health checks
 */
export async function checkVoucherDataConsistency(voucherId: string): Promise<{
  isConsistent: boolean
  issues: string[]
  voucher: any
}> {
  const voucher = await db.giftVoucher.findUnique({
    where: { id: voucherId }
  })

  if (!voucher) {
    return {
      isConsistent: false,
      issues: ['Voucher no encontrado'],
      voucher: null
    }
  }

  const issues: string[] = []

  // Verificar campos críticos
  if (!voucher.stripeSessionId) {
    issues.push('stripeSessionId faltante')
  }

  if (voucher.paymentStatus === 'completed' && !voucher.stripePaymentId) {
    issues.push('stripePaymentId faltante para pago completado')
  }

  if (voucher.paymentStatus === 'completed' && voucher.status === 'pending') {
    issues.push('Status inconsistente: pago completado pero voucher pendiente')
  }

  if (voucher.paymentStatus === 'completed' && !voucher.paidAt) {
    issues.push('paidAt faltante para pago completado')
  }

  return {
    isConsistent: issues.length === 0,
    issues,
    voucher
  }
}