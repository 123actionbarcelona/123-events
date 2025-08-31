'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Gift, 
  ArrowLeft,
  Download,
  Mail,
  Calendar,
  User,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Edit,
  QrCode
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { formatPrice, formatDate } from '@/lib/utils'
import { GiftVoucher, VoucherRedemption } from '@/types/vouchers'
import toast from 'react-hot-toast'

interface VoucherDetailsProps {
  params: Promise<{ id: string }>
}

interface VoucherWithDetails extends GiftVoucher {
  redemptions: Array<VoucherRedemption & {
    booking: {
      bookingCode: string
      customerName: string
      totalAmount: number
      event: {
        title: string
        date: Date
      }
    }
  }>
}

export default function VoucherDetailPage({ params }: VoucherDetailsProps) {
  const [voucher, setVoucher] = useState<VoucherWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState({
    recipientName: '',
    recipientEmail: '',
    personalMessage: '',
    expiryDate: ''
  })
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  const router = useRouter()
  const [voucherId, setVoucherId] = useState<string>('')

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setVoucherId(resolvedParams.id)
    }
    getParams()
  }, [params])

  useEffect(() => {
    if (!voucherId) return
    
    const fetchVoucherDetails = async () => {
      try {
        const response = await fetch(`/api/vouchers/${voucherId}`)
        if (response.ok) {
          const data = await response.json()
          setVoucher(data.voucher)
          setEditData({
            recipientName: data.voucher.recipientName || '',
            recipientEmail: data.voucher.recipientEmail || '',
            personalMessage: data.voucher.personalMessage || '',
            expiryDate: new Date(data.voucher.expiryDate).toISOString().split('T')[0]
          })
        } else {
          toast.error('Vale no encontrado')
          router.push('/admin/vouchers')
        }
      } catch (error) {
        console.error('Error fetching voucher:', error)
        toast.error('Error al cargar el vale')
        router.push('/admin/vouchers')
      } finally {
        setLoading(false)
      }
    }

    fetchVoucherDetails()
  }, [voucherId, router])

  const handleAction = async (action: string, actionFn: () => Promise<void>) => {
    setActionLoading(action)
    try {
      await actionFn()
    } finally {
      setActionLoading(null)
    }
  }

  const downloadPDF = () => handleAction('download', async () => {
    const response = await fetch(`/api/vouchers/${voucherId}/pdf?admin=true&download=true`)
    
    if (response.ok) {
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `vale-regalo-${voucher?.code}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('PDF descargado correctamente')
    } else {
      toast.error('Error al descargar el PDF')
    }
  })

  const resendEmail = () => handleAction('email', async () => {
    const response = await fetch(`/api/vouchers/${voucherId}/resend-email`, {
      method: 'POST'
    })
    
    if (response.ok) {
      toast.success('Email reenviado correctamente')
      // Refrescar datos
      const refreshResponse = await fetch(`/api/vouchers/${voucherId}`)
      if (refreshResponse.ok) {
        const data = await refreshResponse.json()
        setVoucher(data.voucher)
      }
    } else {
      toast.error('Error al reenviar el email')
    }
  })

  const regeneratePDF = () => handleAction('regenerate', async () => {
    const response = await fetch(`/api/vouchers/${voucherId}/pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ template: voucher?.templateUsed })
    })
    
    if (response.ok) {
      toast.success('PDF regenerado correctamente')
    } else {
      toast.error('Error al regenerar el PDF')
    }
  })

  const updateVoucher = () => handleAction('update', async () => {
    const response = await fetch(`/api/vouchers`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: voucherId,
        ...editData,
        expiryDate: new Date(editData.expiryDate)
      })
    })
    
    if (response.ok) {
      const data = await response.json()
      setVoucher(data.voucher)
      setEditing(false)
      toast.success('Vale actualizado correctamente')
    } else {
      toast.error('Error al actualizar el vale')
    }
  })

  const cancelVoucher = () => handleAction('cancel', async () => {
    if (!confirm('¿Estás seguro de que quieres cancelar este vale? Esta acción no se puede deshacer.')) {
      return
    }

    const response = await fetch(`/api/vouchers`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: voucherId,
        status: 'cancelled'
      })
    })
    
    if (response.ok) {
      const data = await response.json()
      setVoucher(data.voucher)
      toast.success('Vale cancelado correctamente')
    } else {
      toast.error('Error al cancelar el vale')
    }
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Activo</Badge>
      case 'used':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Usado</Badge>
      case 'expired':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Expirado</Badge>
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Cancelado</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!voucher) {
    return (
      <div className="text-center py-12">
        <Gift className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Vale no encontrado</h3>
        <p className="text-gray-600 mb-6">El vale solicitado no existe o ha sido eliminado</p>
        <Button onClick={() => router.push('/admin/vouchers')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Vales
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/admin/vouchers')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Gift className="h-8 w-8 mr-3 text-purple-600" />
              Vale {voucher.code}
            </h1>
            <div className="flex items-center space-x-3 mt-2">
              {getStatusBadge(voucher.status)}
              <Badge variant="outline">
                {voucher.type === 'amount' && 'Por Importe'}
                {voucher.type === 'event' && 'Para Evento'}
                {voucher.type === 'pack' && 'Pack Premium'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Acciones principales */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={downloadPDF}
            disabled={actionLoading === 'download'}
          >
            {actionLoading === 'download' ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            PDF
          </Button>
          
          {!voucher.emailSent && (
            <Button
              variant="outline"
              onClick={resendEmail}
              disabled={actionLoading === 'email'}
            >
              {actionLoading === 'email' ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              Enviar Email
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => setEditing(!editing)}
            disabled={voucher.status === 'cancelled'}
          >
            <Edit className="h-4 w-4 mr-2" />
            {editing ? 'Cancelar' : 'Editar'}
          </Button>

          {voucher.status === 'active' && (
            <Button
              variant="destructive"
              onClick={cancelVoucher}
              disabled={actionLoading === 'cancel'}
            >
              {actionLoading === 'cancel' ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Cancelar Vale
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Detalles del vale */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Vale</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {!editing ? (
                <>
                  {/* Vista normal */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Código</label>
                      <p className="font-mono text-lg font-bold text-purple-600">{voucher.code}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-600">Estado</label>
                      <div className="flex items-center space-x-2 mt-1">
                        {voucher.status === 'active' && <CheckCircle className="h-4 w-4 text-green-600" />}
                        {voucher.status === 'used' && <CheckCircle className="h-4 w-4 text-blue-600" />}
                        {voucher.status === 'expired' && <Clock className="h-4 w-4 text-orange-600" />}
                        {voucher.status === 'cancelled' && <XCircle className="h-4 w-4 text-red-600" />}
                        {getStatusBadge(voucher.status)}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-600">Valor Original</label>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatPrice(voucher.originalAmount)}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-600">Saldo Actual</label>
                      <p className="text-2xl font-bold text-green-600">
                        {formatPrice(voucher.currentBalance)}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-600">Fecha de Creación</label>
                      <p>{formatDate(new Date(voucher.createdAt))}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-600">Fecha de Expiración</label>
                      <p>{formatDate(new Date(voucher.expiryDate))}</p>
                      {new Date(voucher.expiryDate) < new Date() && (
                        <span className="text-red-600 text-sm">⚠️ Expirado</span>
                      )}
                    </div>
                  </div>

                  {voucher.event && (
                    <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-900">Vale para evento específico</span>
                      </div>
                      <p className="text-blue-800 mt-1">{voucher.event.title}</p>
                      <p className="text-blue-700 text-sm">
                        {formatDate(new Date(voucher.event.date))}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Destinatario</label>
                      <p>{voucher.recipientName || 'No especificado'}</p>
                      {voucher.recipientEmail && (
                        <p className="text-gray-500 text-sm">{voucher.recipientEmail}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-600">Template Usado</label>
                      <p className="capitalize">{voucher.templateUsed}</p>
                    </div>
                  </div>

                  {voucher.personalMessage && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Mensaje Personal</label>
                      <p className="mt-1 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                        "{voucher.personalMessage}"
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Vista de edición */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre del Destinatario
                      </label>
                      <Input
                        value={editData.recipientName}
                        onChange={(e) => setEditData({...editData, recipientName: e.target.value})}
                        placeholder="Nombre del destinatario"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email del Destinatario
                      </label>
                      <Input
                        type="email"
                        value={editData.recipientEmail}
                        onChange={(e) => setEditData({...editData, recipientEmail: e.target.value})}
                        placeholder="email@destinatario.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mensaje Personal
                      </label>
                      <Textarea
                        value={editData.personalMessage}
                        onChange={(e) => setEditData({...editData, personalMessage: e.target.value})}
                        placeholder="Mensaje personalizado..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha de Expiración
                      </label>
                      <Input
                        type="date"
                        value={editData.expiryDate}
                        onChange={(e) => setEditData({...editData, expiryDate: e.target.value})}
                      />
                    </div>

                    <div className="flex space-x-3 pt-4">
                      <Button
                        onClick={updateVoucher}
                        disabled={actionLoading === 'update'}
                      >
                        {actionLoading === 'update' ? (
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Guardar Cambios
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setEditing(false)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Historial de usos */}
          {voucher.redemptions && voucher.redemptions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Historial de Canjes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {voucher.redemptions.map((redemption) => (
                    <div key={redemption.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {redemption.booking.customerName}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {redemption.booking.event.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            Reserva: {redemption.booking.bookingCode}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-red-600">
                            -{formatPrice(redemption.amountUsed)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(new Date(redemption.redeemedAt))}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Panel lateral */}
        <div className="space-y-6">
          {/* Información del comprador */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Comprador
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Nombre</label>
                  <p className="font-medium">{voucher.purchaserName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-gray-700">{voucher.purchaserEmail}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Fecha de Compra</label>
                  <p className="text-gray-700">{formatDate(new Date(voucher.purchaseDate))}</p>
                </div>
                {voucher.stripePaymentId && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">ID Pago Stripe</label>
                    <p className="font-mono text-xs text-gray-700">{voucher.stripePaymentId}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Estado del email */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                Estado Email
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  {voucher.emailSent ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className={voucher.emailSent ? 'text-green-600' : 'text-red-600'}>
                    {voucher.emailSent ? 'Email enviado' : 'Email no enviado'}
                  </span>
                </div>
                
                {voucher.emailSentAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Enviado</label>
                    <p className="text-gray-700">{formatDate(new Date(voucher.emailSentAt))}</p>
                  </div>
                )}

                {voucher.deliveryDate && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Entrega Programada</label>
                    <p className="text-gray-700">{formatDate(new Date(voucher.deliveryDate))}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-600">Descargas PDF</label>
                  <p className="text-gray-700">{voucher.downloadCount} veces</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Acciones rápidas */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={regeneratePDF}
                disabled={actionLoading === 'regenerate'}
              >
                {actionLoading === 'regenerate' ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Regenerar PDF
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.open(`${window.location.origin}/validate/${voucher.code}`, '_blank')}
              >
                <QrCode className="h-4 w-4 mr-2" />
                Ver QR Validación
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}