'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  Gift, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader2,
  Info,
  Calendar,
  User
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatPrice, safeFormatDate } from '@/lib/utils'
import { 
  VoucherValidatorSchema,
  VoucherValidatorData,
  ValidateVoucherResponse,
  VoucherValidationState
} from '@/types/vouchers'
import toast from 'react-hot-toast'

interface VoucherValidatorProps {
  eventId?: string
  amount?: number
  onValidated?: (result: ValidateVoucherResponse) => void
  onRemoved?: () => void
  className?: string
  showTitle?: boolean
}

export function VoucherValidator({ 
  eventId, 
  amount, 
  onValidated, 
  onRemoved,
  className = '',
  showTitle = true
}: VoucherValidatorProps) {
  const [validationState, setValidationState] = useState<VoucherValidationState>({
    isValidating: false,
    isValid: false,
    voucher: null,
    error: null,
    warnings: []
  })

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors }
  } = useForm<VoucherValidatorData>({
    resolver: zodResolver(VoucherValidatorSchema)
  })

  const voucherCode = watch('code')

  // Reset validation when code changes
  useEffect(() => {
    if (voucherCode && validationState.isValid) {
      setValidationState(prev => ({
        ...prev,
        isValid: false,
        voucher: null,
        error: null,
        warnings: []
      }))
    }
  }, [voucherCode, validationState.isValid])

  const validateVoucher = async (data: VoucherValidatorData) => {
    setValidationState(prev => ({ ...prev, isValidating: true, error: null }))

    try {
      const response = await fetch('/api/vouchers/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: data.code,
          eventId,
          amount
        }),
      })

      const result: ValidateVoucherResponse = await response.json()

      if (result.valid && result.voucher) {
        setValidationState({
          isValidating: false,
          isValid: true,
          voucher: result.voucher,
          error: null,
          warnings: result.warnings || []
        })
        
        toast.success('Vale válido')
        onValidated?.(result)
      } else {
        setValidationState({
          isValidating: false,
          isValid: false,
          voucher: null,
          error: result.error || 'Vale inválido',
          warnings: []
        })
        
        toast.error(result.error || 'Vale inválido')
      }
    } catch (error) {
      console.error('Error validating voucher:', error)
      const errorMessage = 'Error al validar el vale'
      
      setValidationState({
        isValidating: false,
        isValid: false,
        voucher: null,
        error: errorMessage,
        warnings: []
      })
      
      toast.error(errorMessage)
    }
  }

  const removeVoucher = () => {
    setValidationState({
      isValidating: false,
      isValid: false,
      voucher: null,
      error: null,
      warnings: []
    })
    reset()
    onRemoved?.()
    toast.success('Vale removido')
  }

  const { isValidating, isValid, voucher, error, warnings } = validationState

  // Si ya hay un vale válido, mostrar la información
  if (isValid && voucher) {
    return (
      <Card className={`border-green-200 bg-green-50 ${className}`}>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <h3 className="font-medium text-green-900">Vale Aplicado</h3>
            </div>
            <Button
              onClick={removeVoucher}
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Remover
            </Button>
          </div>

          {/* Voucher Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Código:</span>
              <span className="font-mono text-sm bg-white px-2 py-1 rounded border">
                {voucher.code}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Saldo disponible:</span>
              <span className="font-bold text-green-600">
                {formatPrice(voucher.currentBalance)}
              </span>
            </div>

            {voucher.maxUsableAmount && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Se aplicará:</span>
                <span className="font-bold text-purple-600">
                  {formatPrice(voucher.maxUsableAmount)}
                </span>
              </div>
            )}

            {/* Vale específico para evento */}
            {voucher.type === 'event' && voucher.event && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                  <Calendar className="h-4 w-4 text-blue-600 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Vale para evento específico
                    </p>
                    <p className="text-xs text-blue-700">
                      {voucher.event.title} - {safeFormatDate(voucher.event.date)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Información del destinatario */}
            {voucher.recipientName && (
              <div className="flex items-center">
                <User className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">
                  Para: {voucher.recipientName}
                </span>
              </div>
            )}

            {/* Warnings */}
            {warnings && warnings.length > 0 && (
              <div className="space-y-2">
                {warnings.map((warning, index) => (
                  <div 
                    key={index}
                    className="flex items-start p-2 bg-yellow-50 border border-yellow-200 rounded-lg"
                  >
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-yellow-700">{warning.message}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Fecha de expiración */}
            <div className="pt-2 border-t border-green-200">
              <p className="text-xs text-gray-500">
                Válido hasta: {safeFormatDate(voucher.expiryDate)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`${className}`}>
      <CardContent className="pt-6">
        {showTitle && (
          <div className="flex items-center mb-4">
            <Gift className="h-5 w-5 text-purple-600 mr-2" />
            <h3 className="font-medium">¿Tienes un vale regalo?</h3>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <div className="flex space-x-2">
              <div className="flex-1">
                <Input
                  {...register('code')}
                  placeholder="GIFT-XXXX-XXXX"
                  className="font-mono"
                  disabled={isValidating}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (voucherCode) {
                        handleSubmit(validateVoucher)()
                      }
                    }
                  }}
                />
                {errors.code && (
                  <p className="text-red-500 text-sm mt-1">{errors.code.message}</p>
                )}
              </div>
              <Button 
                type="button"
                onClick={handleSubmit(validateVoucher)}
                disabled={isValidating || !voucherCode}
                size="default"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Validando...
                  </>
                ) : (
                  'Validar'
                )}
              </Button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-start p-3 bg-red-50 border border-red-200 rounded-lg">
              <XCircle className="h-4 w-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Info about vouchers */}
          {!error && !isValid && (
            <div className="flex items-start p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Info className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-700">
                <p className="mb-1">Los vales regalo pueden usarse para:</p>
                <ul className="text-xs space-y-1">
                  <li>• Pago total de la reserva</li>
                  <li>• Pago parcial (el resto se paga con tarjeta)</li>
                  <li>• Cualquier evento disponible</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Hook personalizado para usar el validator
export function useVoucherValidator(eventId?: string, amount?: number) {
  const [voucherData, setVoucherData] = useState<ValidateVoucherResponse | null>(null)
  const [isVoucherApplied, setIsVoucherApplied] = useState(false)

  const handleVoucherValidated = (result: ValidateVoucherResponse) => {
    setVoucherData(result)
    setIsVoucherApplied(true)
  }

  const handleVoucherRemoved = () => {
    setVoucherData(null)
    setIsVoucherApplied(false)
  }

  const getPaymentBreakdown = (currentEventId?: string, currentAmount?: number) => {
    const useEventId = currentEventId || eventId
    const useAmount = currentAmount || amount
    
    if (!isVoucherApplied || !voucherData?.voucher || !useAmount) {
      return {
        voucherAmount: 0,
        stripeAmount: useAmount || 0,
        totalAmount: useAmount || 0,
        paymentMethod: 'card' as const
      }
    }

    const voucherAmount = Math.min(voucherData.voucher.maxUsableAmount, useAmount)
    const stripeAmount = useAmount - voucherAmount
    
    return {
      voucherAmount,
      stripeAmount,
      totalAmount: useAmount,
      paymentMethod: stripeAmount > 0 ? 'mixed' as const : 'voucher' as const
    }
  }

  const reset = () => {
    setVoucherData(null)
    setIsVoucherApplied(false)
  }

  return {
    voucherData,
    isVoucherApplied,
    handleVoucherValidated,
    handleVoucherRemoved,
    getPaymentBreakdown,
    reset
  }
}