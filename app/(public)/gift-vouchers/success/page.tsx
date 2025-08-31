'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, Download, Mail, Gift, ArrowRight, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatPrice, safeFormatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface VoucherDetails {
  id: string
  code: string
  type: string
  originalAmount: number
  purchaserName: string
  recipientName?: string
  personalMessage?: string
  templateUsed: string
  expiryDate: string
  event?: {
    title: string
    date: string
  }
}

export default function VoucherSuccessPage() {
  const [voucher, setVoucher] = useState<VoucherDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    if (!sessionId) {
      setLoading(false)
      return
    }

    const fetchVoucherDetails = async () => {
      try {
        // En producción, aquí harías una llamada para obtener detalles del voucher
        // basado en el session_id de Stripe
        const response = await fetch(`/api/vouchers/success?session_id=${sessionId}`)
        
        if (response.ok) {
          const data = await response.json()
          setVoucher(data.voucher)
        } else {
          toast.error('No se pudo cargar la información del vale')
        }
      } catch (error) {
        console.error('Error fetching voucher details:', error)
        toast.error('Error al cargar los detalles del vale')
      } finally {
        setLoading(false)
      }
    }

    fetchVoucherDetails()
  }, [sessionId])

  const downloadPdf = async () => {
    if (!voucher) return
    
    setDownloadingPdf(true)
    try {
      const response = await fetch(`/api/vouchers/${voucher.id}/pdf?download=true`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `vale-regalo-${voucher.code}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast.success('PDF descargado correctamente')
      } else {
        toast.error('Error al descargar el PDF')
      }
    } catch (error) {
      console.error('Error downloading PDF:', error)
      toast.error('Error al descargar el PDF')
    } finally {
      setDownloadingPdf(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!voucher) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Gift className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Vale no encontrado
          </h1>
          <p className="text-gray-600 mb-6">
            No se pudo cargar la información del vale regalo
          </p>
          <Link href="/gift-vouchers">
            <Button>
              <ArrowRight className="h-4 w-4 mr-2" />
              Crear nuevo vale
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-green-100 p-4">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ¡Vale Regalo Creado!
          </h1>
          <p className="text-xl text-gray-600">
            Tu vale regalo ha sido procesado correctamente
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Voucher Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Gift className="h-5 w-5 mr-2 text-purple-600" />
                Detalles del Vale
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Voucher Code */}
              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border-2 border-dashed border-purple-300">
                <div className="text-sm text-gray-600 mb-2">Código del Vale</div>
                <div className="text-2xl font-mono font-bold text-purple-600 tracking-wider">
                  {voucher.code}
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tipo:</span>
                  <span className="font-medium">
                    {voucher.type === 'amount' && 'Por Importe'}
                    {voucher.type === 'event' && 'Para Evento'}
                    {voucher.type === 'pack' && 'Pack Premium'}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Valor:</span>
                  <span className="font-medium text-lg text-purple-600">
                    {formatPrice(voucher.originalAmount)}
                  </span>
                </div>

                {voucher.event && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Evento:</span>
                    <span className="font-medium text-right">
                      {voucher.event.title}<br />
                      <span className="text-sm text-gray-500">
                        {safeFormatDate(voucher.event.date)}
                      </span>
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-gray-600">Válido hasta:</span>
                  <span className="font-medium">
                    {safeFormatDate(voucher.expiryDate)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Comprado por:</span>
                  <span className="font-medium">{voucher.purchaserName}</span>
                </div>

                {voucher.recipientName && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Para:</span>
                    <span className="font-medium">{voucher.recipientName}</span>
                  </div>
                )}

                {voucher.personalMessage && (
                  <div>
                    <span className="text-gray-600">Mensaje:</span>
                    <p className="mt-1 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                      "{voucher.personalMessage}"
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Próximos Pasos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Download PDF */}
              <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-lg">
                <Download className="h-6 w-6 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-blue-900 mb-2">
                    Descargar Vale PDF
                  </h3>
                  <p className="text-blue-800 text-sm mb-3">
                    El vale está disponible como PDF elegante para imprimir o enviar digitalmente.
                  </p>
                  <Button
                    onClick={downloadPdf}
                    disabled={downloadingPdf}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {downloadingPdf ? 'Descargando...' : 'Descargar PDF'}
                  </Button>
                </div>
              </div>

              {/* Email Sent */}
              <div className="flex items-start space-x-4 p-4 bg-green-50 rounded-lg">
                <Mail className="h-6 w-6 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-green-900 mb-2">
                    Email Enviado
                  </h3>
                  <p className="text-green-800 text-sm">
                    {voucher.recipientName 
                      ? `Se ha enviado el vale por email a ${voucher.recipientName}`
                      : 'Se ha enviado una copia del vale a tu email'
                    }
                  </p>
                </div>
              </div>

              {/* How to Use */}
              <div className="space-y-3">
                <h3 className="font-medium">Cómo usar el vale:</h3>
                <ol className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-start">
                    <span className="bg-purple-100 text-purple-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                      1
                    </span>
                    Ve a la página de eventos y selecciona tu experiencia
                  </li>
                  <li className="flex items-start">
                    <span className="bg-purple-100 text-purple-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                      2
                    </span>
                    En el proceso de reserva, elige "Tengo un vale regalo"
                  </li>
                  <li className="flex items-start">
                    <span className="bg-purple-100 text-purple-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                      3
                    </span>
                    Introduce el código: <strong>{voucher.code}</strong>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-purple-100 text-purple-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                      4
                    </span>
                    ¡Disfruta tu experiencia de misterio!
                  </li>
                </ol>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Link href="/events" className="flex-1">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700">
                    <Gift className="h-4 w-4 mr-2" />
                    Ver Eventos
                  </Button>
                </Link>
                <Link href="/" className="flex-1">
                  <Button variant="outline" className="w-full">
                    <Home className="h-4 w-4 mr-2" />
                    Inicio
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Important Notes */}
        <Card className="mt-8">
          <CardContent className="pt-6">
            <h3 className="font-medium mb-3">Información Importante:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• El vale es válido durante 1 año desde la fecha de compra</li>
              <li>• Se puede usar para el pago total o parcial de cualquier evento</li>
              <li>• En caso de pérdida, contacta con admin@mysteryevents.com con el código</li>
              <li>• Los vales no son reembolsables pero sí transferibles</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}