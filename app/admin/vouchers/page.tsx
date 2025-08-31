'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Gift, 
  Search, 
  Filter, 
  Download,
  Eye,
  Mail,
  Calendar,
  Plus,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatPrice, formatDate } from '@/lib/utils'
import { GiftVoucher } from '@/types/vouchers'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface VoucherStats {
  totalActive: number
  totalValueActive: number
  totalValueSold: number
  totalUsed: number
  totalExpired: number
}

interface VouchersResponse {
  vouchers: GiftVoucher[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  stats: VoucherStats
}

export default function AdminVouchersPage() {
  const [vouchersData, setVouchersData] = useState<VouchersResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)
  
  const router = useRouter()

  const fetchVouchers = async (page: number = 1, search: string = '', status: string = 'all') => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
        ...(status !== 'all' && { status })
      })

      const response = await fetch(`/api/vouchers?${params}`)
      if (response.ok) {
        const data = await response.json()
        setVouchersData(data)
      } else {
        toast.error('Error al cargar los vales regalo')
      }
    } catch (error) {
      console.error('Error fetching vouchers:', error)
      toast.error('Error al cargar los vales regalo')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVouchers(currentPage, searchTerm, statusFilter)
  }, [currentPage, searchTerm, statusFilter])

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status)
    setCurrentPage(1)
  }

  const downloadVoucherPDF = async (voucherId: string, voucherCode: string) => {
    try {
      const response = await fetch(`/api/vouchers/${voucherId}/pdf?admin=true&download=true`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `vale-regalo-${voucherCode}.pdf`
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
    }
  }

  const resendVoucherEmail = async (voucherId: string, voucherCode: string) => {
    try {
      const response = await fetch(`/api/vouchers/${voucherId}/resend-email`, {
        method: 'POST'
      })
      
      if (response.ok) {
        toast.success('Email reenviado correctamente')
        fetchVouchers(currentPage, searchTerm, statusFilter)
      } else {
        toast.error('Error al reenviar el email')
      }
    } catch (error) {
      console.error('Error resending email:', error)
      toast.error('Error al reenviar el email')
    }
  }

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'used':
        return <CheckCircle className="h-4 w-4 text-blue-600" />
      case 'expired':
        return <Clock className="h-4 w-4 text-orange-600" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  if (loading && !vouchersData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Gift className="h-8 w-8 mr-3 text-purple-600" />
            Vales Regalo
          </h1>
          <p className="text-gray-600">Gestiona todos los vales regalo del sistema</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Crear Vale
        </Button>
      </div>

      {/* Estadísticas */}
      {vouchersData?.stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Vales Activos</p>
                  <p className="text-3xl font-bold text-green-600">
                    {vouchersData.stats.totalActive}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatPrice(vouchersData.stats.totalValueActive)} valor total
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Valor Vendido</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {formatPrice(vouchersData.stats.totalValueSold)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Total facturado
                  </p>
                </div>
                <Gift className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Vales Usados</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {vouchersData.stats.totalUsed || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Totalmente canjeados
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Expirados</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {vouchersData.stats.totalExpired || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Sin usar
                  </p>
                </div>
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros y búsqueda */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por código, nombre, email..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="used">Usados</option>
                <option value="expired">Expirados</option>
                <option value="cancelled">Cancelados</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de vales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Vales Regalo ({vouchersData?.pagination.total || 0})</span>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Filter className="h-4 w-4" />
              <span>Página {vouchersData?.pagination.page || 1} de {vouchersData?.pagination.pages || 1}</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {vouchersData?.vouchers && vouchersData.vouchers.length > 0 ? (
            <div className="space-y-4">
              {vouchersData.vouchers.map((voucher) => (
                <div key={voucher.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(voucher.status)}
                          <span className="font-mono text-lg font-bold text-purple-600">
                            {voucher.code}
                          </span>
                        </div>
                        {getStatusBadge(voucher.status)}
                        <Badge variant="outline">
                          {voucher.type === 'amount' && 'Por Importe'}
                          {voucher.type === 'event' && 'Para Evento'}
                          {voucher.type === 'pack' && 'Pack Premium'}
                        </Badge>
                      </div>
                      
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Comprador:</span>
                          <p className="font-medium">{voucher.purchaserName}</p>
                          <p className="text-gray-400">{voucher.purchaserEmail}</p>
                        </div>
                        
                        {voucher.recipientName && (
                          <div>
                            <span className="text-gray-500">Destinatario:</span>
                            <p className="font-medium">{voucher.recipientName}</p>
                            {voucher.recipientEmail && (
                              <p className="text-gray-400">{voucher.recipientEmail}</p>
                            )}
                          </div>
                        )}
                        
                        <div>
                          <span className="text-gray-500">Valor:</span>
                          <p className="font-medium">
                            <span className="text-lg font-bold text-green-600">
                              {formatPrice(voucher.currentBalance)}
                            </span>
                            {voucher.currentBalance !== voucher.originalAmount && (
                              <span className="text-sm text-gray-500 ml-2">
                                de {formatPrice(voucher.originalAmount)}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      {voucher.event && (
                        <div className="mt-2 p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                          <span className="text-sm font-medium text-blue-900">
                            Para evento: {voucher.event.title}
                          </span>
                          <span className="text-sm text-blue-700 ml-2">
                            ({new Date(voucher.event.date).toLocaleDateString()})
                          </span>
                        </div>
                      )}

                      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-4">
                          <span>Creado: {new Date(voucher.createdAt).toLocaleDateString()}</span>
                          <span>Expira: {new Date(voucher.expiryDate).toLocaleDateString()}</span>
                          {voucher.downloadCount > 0 && (
                            <span>Descargado {voucher.downloadCount} veces</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {voucher.emailSent ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span>{voucher.emailSent ? 'Email enviado' : 'Email pendiente'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/vouchers/${voucher.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadVoucherPDF(voucher.id, voucher.code)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>

                      {!voucher.emailSent && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resendVoucherEmail(voucher.id, voucher.code)}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Gift className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay vales regalo
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || statusFilter !== 'all' 
                  ? 'No se encontraron vales con los filtros aplicados'
                  : 'Los vales regalo aparecerán aquí cuando se creen'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Link href="/gift-vouchers" target="_blank">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Primer Vale
                  </Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginación */}
      {vouchersData?.pagination && vouchersData.pagination.pages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          
          <span className="text-sm text-gray-600">
            Página {currentPage} de {vouchersData.pagination.pages}
          </span>
          
          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.min(vouchersData.pagination.pages, currentPage + 1))}
            disabled={currentPage === vouchersData.pagination.pages}
          >
            Siguiente
          </Button>
        </div>
      )}

      {/* Modal de Creación de Vale */}
      {showCreateModal && (
        <CreateVoucherModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            fetchVouchers(currentPage, searchTerm, statusFilter)
          }}
        />
      )}
    </div>
  )
}

// Componente Modal para Crear Voucher
function CreateVoucherModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: { 
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void 
}) {
  const [formData, setFormData] = useState({
    type: 'amount',
    amount: '',
    purchaserName: '',
    purchaserEmail: '',
    recipientName: '',
    recipientEmail: '',
    personalMessage: '',
    template: 'elegant'
  })
  const [creating, setCreating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    try {
      const response = await fetch('/api/admin/vouchers/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount)
        }),
      })

      if (response.ok) {
        toast.success('Vale creado exitosamente')
        onSuccess()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al crear el vale')
      }
    } catch (error) {
      console.error('Error creating voucher:', error)
      toast.error('Error al crear el vale')
    } finally {
      setCreating(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Crear Vale Regalo</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valor (EUR)
            </label>
            <Input
              type="number"
              min="25"
              max="500"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              placeholder="100.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Comprador
            </label>
            <Input
              type="text"
              value={formData.purchaserName}
              onChange={(e) => setFormData({...formData, purchaserName: e.target.value})}
              placeholder="Nombre completo"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email del Comprador
            </label>
            <Input
              type="email"
              value={formData.purchaserEmail}
              onChange={(e) => setFormData({...formData, purchaserEmail: e.target.value})}
              placeholder="email@ejemplo.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Destinatario (Opcional)
            </label>
            <Input
              type="text"
              value={formData.recipientName}
              onChange={(e) => setFormData({...formData, recipientName: e.target.value})}
              placeholder="Para quien es el regalo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Destinatario (Opcional)
            </label>
            <Input
              type="email"
              value={formData.recipientEmail}
              onChange={(e) => setFormData({...formData, recipientEmail: e.target.value})}
              placeholder="email@ejemplo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mensaje Personal (Opcional)
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={formData.personalMessage}
              onChange={(e) => setFormData({...formData, personalMessage: e.target.value})}
              placeholder="Mensaje personalizado para el destinatario"
              maxLength={500}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={creating}
              className="flex-1"
            >
              {creating ? 'Creando...' : 'Crear Vale'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}