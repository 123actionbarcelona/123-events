// types/vouchers.ts
// Tipos TypeScript para el sistema de vales regalo
// Creado: 24 Agosto 2025
// Integrado con patrones existentes del proyecto

import { z } from 'zod'

// ================================
// TIPOS BÁSICOS DE VALES
// ================================

export type VoucherType = 'amount' | 'event' | 'pack'
export type VoucherStatus = 'active' | 'used' | 'expired' | 'cancelled'
export type VoucherTemplate = 'elegant' | 'christmas' | 'mystery' | 'fun'
export type PaymentMethod = 'card' | 'voucher' | 'mixed'

// ================================
// INTERFACES DE VALES
// ================================

export interface GiftVoucher {
  id: string
  code: string
  type: VoucherType
  
  // Valor
  originalAmount: number
  currentBalance: number
  eventId?: string
  event?: {
    id: string
    title: string
    date: Date
    price: number
    status: string
  }
  
  // Comprador
  purchaserName: string
  purchaserEmail: string
  purchaseDate: Date
  stripePaymentId?: string
  
  // Destinatario
  recipientName?: string
  recipientEmail?: string
  personalMessage?: string
  deliveryDate?: Date
  
  // Estado
  status: VoucherStatus
  expiryDate: Date
  activatedAt?: Date
  
  // PDF
  pdfUrl?: string
  templateUsed: VoucherTemplate
  
  // Tracking
  emailSent: boolean
  emailSentAt?: Date
  downloadCount: number
  
  // Metadata
  createdAt: Date
  updatedAt: Date
  
  // Relaciones
  redemptions?: VoucherRedemption[]
}

export interface VoucherRedemption {
  id: string
  voucherId: string
  voucher?: GiftVoucher
  bookingId: string
  booking?: {
    id: string
    bookingCode: string
    customerName: string
    totalAmount: number
    event: {
      title: string
      date: Date
    }
  }
  amountUsed: number
  redeemedAt: Date
}

// ================================
// SCHEMAS DE VALIDACIÓN (ZOD)
// ================================

// Schema para crear vale regalo (siguiendo patrón del booking)
export const CreateVoucherFormSchema = z.object({
  // Tipo y valor
  type: z.enum(['amount', 'event', 'pack'], {
    errorMap: () => ({ message: 'Selecciona un tipo de vale válido' })
  }),
  amount: z.number()
    .min(25, 'El mínimo son 25€')
    .max(500, 'El máximo son 500€')
    .optional(),
  eventId: z.string().optional(),
  ticketQuantity: z.number()
    .min(2, 'Mínimo 2 tickets')
    .max(9, 'Máximo 9 tickets')
    .optional(),
  
  // Información del comprador
  purchaserName: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre es demasiado largo'),
  purchaserEmail: z.string()
    .email('Email inválido')
    .max(255, 'Email demasiado largo'),
  
  // Información del destinatario
  recipientName: z.string()
    .min(2, 'El nombre del destinatario debe tener al menos 2 caracteres')
    .max(100, 'El nombre es demasiado largo')
    .optional()
    .or(z.literal('')),
  recipientEmail: z.string()
    .email('Email del destinatario inválido')
    .max(255, 'Email demasiado largo')
    .optional()
    .or(z.literal('')),
  
  // Personalización
  personalMessage: z.string()
    .max(500, 'El mensaje no puede exceder 500 caracteres')
    .optional()
    .or(z.literal('')),
  deliveryDate: z.date()
    .min(new Date(), 'La fecha de entrega debe ser futura')
    .optional(),
  
  // Template
  template: z.enum(['elegant', 'christmas', 'mystery', 'fun'])
    .default('elegant'),
  
  // Términos (siguiendo patrón del booking)
  acceptTerms: z.boolean()
    .refine(val => val === true, 'Debes aceptar los términos y condiciones'),
  acceptMarketing: z.boolean().optional()
})

// Schema para validar vale (API)
export const ValidateVoucherSchema = z.object({
  code: z.string()
    .regex(/^GIFT-[A-Z0-9]{4}-[A-Z0-9]{4}$/, 'Formato de código inválido'),
  eventId: z.string().optional(),
  amount: z.number().positive().optional()
})

// Schema para canjear vale (API)  
export const RedeemVoucherSchema = z.object({
  voucherCode: z.string()
    .regex(/^GIFT-[A-Z0-9]{4}-[A-Z0-9]{4}$/, 'Formato de código inválido'),
  bookingId: z.string(),
  amountToUse: z.number().positive()
})

// Schema para validador frontend
export const VoucherValidatorSchema = z.object({
  code: z.string()
    .min(1, 'Ingresa el código del vale')
    .regex(/^GIFT-[A-Z0-9]{4}-[A-Z0-9]{4}$/i, 'Formato: GIFT-XXXX-XXXX')
    .transform(val => val.toUpperCase())
})

// ================================
// TIPOS INFERIDOS
// ================================

export type CreateVoucherFormData = z.infer<typeof CreateVoucherFormSchema>
export type ValidateVoucherData = z.infer<typeof ValidateVoucherSchema>
export type RedeemVoucherData = z.infer<typeof RedeemVoucherSchema>
export type VoucherValidatorData = z.infer<typeof VoucherValidatorSchema>

// ================================
// TIPOS DE RESPUESTA API
// ================================

export interface CreateVoucherResponse {
  voucher: {
    id: string
    code: string
    amount: number
    type: VoucherType
    expiryDate: Date
  }
  checkoutUrl: string
}

export interface ValidateVoucherResponse {
  valid: boolean
  voucher?: {
    id: string
    code: string
    type: VoucherType
    status: VoucherStatus
    originalAmount: number
    currentBalance: number
    maxUsableAmount: number
    expiryDate: Date
    purchaserName: string
    recipientName?: string
    personalMessage?: string
    event?: {
      id: string
      title: string
      date: Date
      status: string
    }
    redemptions?: VoucherRedemption[]
    createdAt: Date
  }
  warnings?: Array<{
    type: string
    message: string
    eventRequired?: any
    amountCovered?: number
    remainingToPay?: number
  }>
  usageInfo?: {
    requestedAmount: number
    amountToUse: number
    remainingBalance: number
    fullyCovered: boolean
  }
  error?: string
  errorCode?: string
  allowedEvent?: any
}

export interface RedeemVoucherResponse {
  success: boolean
  redemption?: {
    id: string
    amountUsed: number
    redeemedAt: Date
    voucher: {
      code: string
      originalAmount: number
    }
    booking: {
      bookingCode: string
      customerName: string
      totalAmount: number
    }
  }
  voucher?: {
    code: string
    previousBalance: number
    currentBalance: number
    newStatus: VoucherStatus
    fullyUsed: boolean
  }
  booking?: {
    id: string
    paymentMethod: PaymentMethod
    voucherAmount?: number
    stripeAmount?: number
    requiresStripePayment: boolean
  }
  error?: string
}

// ================================
// TIPOS DE PACKS
// ================================

export interface VoucherPack {
  id: string
  name: string
  events: number
  validForCategories?: string[]
  validForAll?: boolean
  price: number
  discount: number
  description: string
}

export const VOUCHER_PACKS: Record<string, VoucherPack> = {
  'mystery-lover': {
    id: 'mystery-lover',
    name: 'Pack Mystery Lover',
    events: 3,
    validForCategories: ['murder', 'detective'],
    price: 150,
    discount: 30,
    description: '3 eventos de misterio con 30€ de descuento'
  },
  'experience-premium': {
    id: 'experience-premium',
    name: 'Experiencia Premium',
    events: 5,
    validForAll: true,
    price: 250,
    discount: 50,
    description: '5 eventos de cualquier tipo con 50€ de descuento'
  }
}

// ================================
// CONSTANTES
// ================================

export const VOUCHER_CONSTANTS = {
  MIN_AMOUNT: 25,
  MAX_AMOUNT: 500,
  DEFAULT_EXPIRY_YEARS: 1,
  MAX_MESSAGE_LENGTH: 500,
  CODE_PATTERN: /^GIFT-[A-Z0-9]{4}-[A-Z0-9]{4}$/,
  TEMPLATES: ['elegant', 'christmas', 'mystery', 'fun'] as const,
  TYPES: ['amount', 'event', 'pack'] as const,
  STATUSES: ['active', 'used', 'expired', 'cancelled'] as const
} as const

// ================================
// HELPERS DE TIPOS
// ================================

export type VoucherWithEvent = GiftVoucher & {
  event: NonNullable<GiftVoucher['event']>
}

export type VoucherWithRedemptions = GiftVoucher & {
  redemptions: VoucherRedemption[]
}

export type ActiveVoucher = GiftVoucher & {
  status: 'active'
  currentBalance: number
}

// Tipo para el componente de validación
export interface VoucherValidationState {
  isValidating: boolean
  isValid: boolean
  voucher: ValidateVoucherResponse['voucher'] | null
  error: string | null
  warnings: ValidateVoucherResponse['warnings']
}

// Tipo para el contexto del carrito con vale
export interface CartWithVoucher {
  eventId: string
  quantity: number
  totalAmount: number
  voucher?: {
    code: string
    amountToUse: number
    remainingBalance: number
    requiresStripePayment: boolean
    stripeAmount: number
  }
}