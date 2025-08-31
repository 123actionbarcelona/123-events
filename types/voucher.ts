// types/voucher.ts
// Tipos TypeScript para vouchers - evita errores de inconsistencia
// Creado: 31 Agosto 2025

export interface VoucherCreateData {
  type: 'amount' | 'event' | 'pack'
  amount?: number
  eventId?: string
  ticketQuantity?: number
  purchaserName: string
  purchaserEmail: string
  recipientName?: string
  recipientEmail?: string
  personalMessage?: string
  deliveryDate?: Date
  template: string
}

export interface VoucherStripeData {
  id: string
  stripeSessionId: string
  stripePaymentId: string | null
  paymentStatus: 'pending' | 'completed' | 'failed'
  status: 'active' | 'redeemed' | 'cancelled' | 'expired'
}

export interface VoucherWithStripe extends VoucherStripeData {
  code: string
  type: 'amount' | 'event' | 'pack'
  originalAmount: number
  currentBalance: number
  purchaserName: string
  purchaserEmail: string
  recipientName?: string
  recipientEmail?: string
  personalMessage?: string
  templateUsed: string
  expiryDate: Date
  createdAt: Date
  updatedAt: Date
  eventId?: string
  ticketQuantity?: number
  event?: {
    id: string
    title: string
    date: Date
  } | null
}

// Tipos para validar que los campos críticos estén presentes
export type VoucherRequiredFields = Required<Pick<VoucherWithStripe, 'stripeSessionId' | 'stripePaymentId' | 'paymentStatus'>>

// Tipo para asegurar que el webhook tiene los datos necesarios
export interface WebhookVoucherData {
  voucherId: string
  sessionId: string
  paymentIntentId?: string
}