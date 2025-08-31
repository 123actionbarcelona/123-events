// lib/voucher-utils.ts
// Utilidades para el sistema de vales regalo
// Creado: 24 Agosto 2025

import { z } from 'zod'
import { addYears } from 'date-fns'

// ================================
// TIPOS Y VALIDACIONES
// ================================

export const VoucherTypes = {
  AMOUNT: 'amount',
  EVENT: 'event', 
  PACK: 'pack'
} as const

export const VoucherStatus = {
  ACTIVE: 'active',
  USED: 'used',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled'
} as const

export const VoucherTemplates = {
  ELEGANT: 'elegant',
  CHRISTMAS: 'christmas',
  MYSTERY: 'mystery',
  FUN: 'fun'
} as const

// Esquema para crear vale regalo
export const CreateVoucherSchema = z.object({
  type: z.enum(['amount', 'event', 'pack']),
  amount: z.number().positive().optional(),
  eventId: z.string().optional(),
  purchaserName: z.string().min(2, 'Nombre requerido'),
  purchaserEmail: z.string().email('Email inválido'),
  recipientName: z.string().min(2, 'Nombre destinatario requerido').optional().or(z.literal('')),
  recipientEmail: z.string().email('Email destinatario inválido').optional().or(z.literal('')),
  personalMessage: z.string().max(500, 'Mensaje máximo 500 caracteres').optional(),
  deliveryDate: z.date().optional(),
  template: z.enum(['elegant', 'christmas', 'mystery', 'fun']).default('elegant')
})

// Esquema para validar vale
export const ValidateVoucherSchema = z.object({
  code: z.string().regex(/^GIFT-[A-Z0-9]{4}-[A-Z0-9]{4}$/, 'Código inválido'),
  eventId: z.string().optional(),
  amount: z.number().positive().optional()
})

// Esquema para canjear vale
export const RedeemVoucherSchema = z.object({
  voucherCode: z.string().regex(/^GIFT-[A-Z0-9]{4}-[A-Z0-9]{4}$/, 'Código inválido'),
  bookingId: z.string(),
  amountToUse: z.number().positive()
})

export type CreateVoucherInput = z.infer<typeof CreateVoucherSchema>
export type ValidateVoucherInput = z.infer<typeof ValidateVoucherSchema>
export type RedeemVoucherInput = z.infer<typeof RedeemVoucherSchema>

// ================================
// GENERADOR DE CÓDIGOS ÚNICOS
// ================================

/**
 * Genera un código único para vale regalo
 * Formato: GIFT-XXXX-XXXX (donde X son letras/números)
 */
export function generateVoucherCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  
  const getRandomChar = () => chars.charAt(Math.floor(Math.random() * chars.length))
  
  const part1 = Array.from({length: 4}, getRandomChar).join('')
  const part2 = Array.from({length: 4}, getRandomChar).join('')
  
  return `GIFT-${part1}-${part2}`
}

/**
 * Valida formato de código de vale
 */
export function isValidVoucherCode(code: string): boolean {
  const regex = /^GIFT-[A-Z0-9]{4}-[A-Z0-9]{4}$/
  return regex.test(code)
}

// ================================
// VALIDACIONES DE NEGOCIO
// ================================

/**
 * Calcula fecha de expiración (1 año desde compra)
 */
export function calculateExpiryDate(purchaseDate: Date = new Date()): Date {
  return addYears(purchaseDate, 1)
}

/**
 * Verifica si un vale está expirado
 */
export function isVoucherExpired(expiryDate: Date): boolean {
  return new Date() > expiryDate
}

/**
 * Verifica si un vale puede ser usado
 */
export function canUseVoucher(voucher: {
  status: string
  currentBalance: number
  expiryDate: Date
}): { canUse: boolean; reason?: string } {
  if (voucher.status !== VoucherStatus.ACTIVE) {
    return { canUse: false, reason: 'Vale no activo' }
  }
  
  if (voucher.currentBalance <= 0) {
    return { canUse: false, reason: 'Vale sin saldo' }
  }
  
  if (isVoucherExpired(voucher.expiryDate)) {
    return { canUse: false, reason: 'Vale expirado' }
  }
  
  return { canUse: true }
}

/**
 * Calcula cuánto se puede usar de un vale para una compra
 */
export function calculateVoucherUsage(
  voucherBalance: number, 
  purchaseAmount: number
): {
  amountToUse: number
  remainingBalance: number
  fullyCovered: boolean
} {
  const amountToUse = Math.min(voucherBalance, purchaseAmount)
  const remainingBalance = voucherBalance - amountToUse
  const fullyCovered = amountToUse >= purchaseAmount
  
  return {
    amountToUse,
    remainingBalance,
    fullyCovered
  }
}

// ================================
// UTILIDADES PACKS
// ================================

export const VOUCHER_PACKS = {
  'mystery-lover': {
    name: 'Pack Mystery Lover',
    events: 3,
    validForCategories: ['murder', 'detective'],
    price: 150, // 3 eventos x €60 = €180, pero pack €150
    discount: 30
  },
  'experience-premium': {
    name: 'Experiencia Premium',
    events: 5,
    validForAll: true,
    price: 250, // 5 eventos x €60 = €300, pero pack €250
    discount: 50
  }
} as const

export type VoucherPack = keyof typeof VOUCHER_PACKS

/**
 * Obtiene información de un pack
 */
export function getPackInfo(packId: string) {
  return VOUCHER_PACKS[packId as VoucherPack] || null
}

// ================================
// FORMATTERS
// ================================

/**
 * Formatea un código de vale para mostrar
 */
export function formatVoucherCode(code: string): string {
  return code.replace(/(.{4})/g, '$1 ').trim()
}

/**
 * Formatea cantidad de dinero
 */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}

/**
 * Formatea fecha para mostrar
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

// ================================
// CONSTANTES
// ================================

export const VOUCHER_CONFIG = {
  MIN_AMOUNT: 25,
  MAX_AMOUNT: 500,
  DEFAULT_EXPIRY_YEARS: 1,
  MAX_MESSAGE_LENGTH: 500,
  ALLOWED_TEMPLATES: ['elegant', 'christmas', 'mystery', 'fun'] as const
} as const