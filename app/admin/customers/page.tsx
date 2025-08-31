'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useDebounce } from '@/lib/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, Filter, Download, Eye, Mail, Phone } from 'lucide-react'

interface Customer {
  id: string
  name: string
  email: string
  phone?: string
  totalBookings: number
  totalSpent: number
  lastBookingDate: string
  status: 'active' | 'inactive'
  createdAt: string
  favoriteCategory?: string
}

interface CustomerStats {
  totalCustomers: number
  activeCustomers: number
  totalRevenue: number
  averageSpent: number
}

// Datos ahora vienen de la API /api/admin/customers

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<CustomerStats | null>(null)
  
  // OPTIMIZACIÓN: Debounce para búsquedas
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    try {
      console.time('⚡ Customers API Call')
      
      const params = new URLSearchParams()
      if (debouncedSearchTerm) params.set('search', debouncedSearchTerm)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      params.set('limit', '50')
      
      const response = await fetch(`/api/admin/customers?${params}`, {
        cache: 'no-store'
      })
      
      console.timeEnd('⚡ Customers API Call')
      
      if (response.ok) {
        const data = await response.json()
        setCustomers(data.customers || [])
        setStats(data.stats || null)
        console.log('📊 Customers loaded:', data.customers?.length)
      }
    } catch (error) {
      console.error('❌ Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }, [debouncedSearchTerm, statusFilter])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  // OPTIMIZACIÓN: Filtrado memoizado (ahora se hace en servidor)
  const filteredCustomers = useMemo(() => {
    // El filtrado se hace en el servidor, pero mantenemos capacidad local
    return customers
  }, [customers])
  
  // OPTIMIZACIÓN: Estadísticas memoizadas
  const memoizedStats = useMemo(() => {
    if (stats) return stats
    
    // Fallback calculations si no vienen del servidor
    const totalCustomers = customers.length
    const activeCustomers = customers.filter(c => c.status === 'active').length
    const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0)
    const averageSpent = totalCustomers > 0 ? totalRevenue / totalCustomers : 0
    
    return { totalCustomers, activeCustomers, totalRevenue, averageSpent }
  }, [stats, customers])

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800'
    }
    
    const labels = {
      active: 'Activo',
      inactive: 'Inactivo'
    }

    return (
      <Badge className={variants[status] || variants.active}>
        {labels[status] || status}
      </Badge>
    )
  }

  const getCategoryBadge = (category: string) => {
    const variants = {
      murder: 'bg-red-100 text-red-800',
      escape: 'bg-blue-100 text-blue-800',
      detective: 'bg-purple-100 text-purple-800',
      horror: 'bg-orange-100 text-orange-800'
    }
    
    const labels = {
      murder: 'Murder Mystery',
      escape: 'Escape Room',
      detective: 'Detective',
      horror: 'Terror'
    }

    return (
      <Badge className={variants[category] || 'bg-gray-100 text-gray-800'}>
        {labels[category] || category}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatPrice = (amount: number) => {
    return `€${amount.toFixed(2)}`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Clientes</h1>
        </div>
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-gray-600">Gestiona tu base de clientes y sus preferencias</p>
        </div>
        <Button className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre, email o teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats rápidas - OPTIMIZADAS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{memoizedStats.totalCustomers}</div>
            <p className="text-sm text-gray-600">Total clientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{memoizedStats.activeCustomers}</div>
            <p className="text-sm text-gray-600">Activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{formatPrice(memoizedStats.totalRevenue)}</div>
            <p className="text-sm text-gray-600">Ingresos totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{memoizedStats.averageSpent.toFixed(0)}€</div>
            <p className="text-sm text-gray-600">Valor promedio</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de clientes */}
      <Card>
        <CardHeader>
          <CardTitle>Clientes ({filteredCustomers.length})</CardTitle>
          <CardDescription>
            Lista completa de clientes con filtros aplicados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No se encontraron clientes con los filtros aplicados
              </div>
            ) : (
              filteredCustomers.map((customer) => (
                <div key={customer.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold">{customer.name}</h4>
                        {getStatusBadge(customer.status)}
                        {customer.favoriteCategory && getCategoryBadge(customer.favoriteCategory)}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          <span>{customer.email}</span>
                        </div>
                        {customer.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Reservas:</span>
                          <div className="font-semibold">{customer.totalBookings}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Gastado:</span>
                          <div className="font-semibold">{formatPrice(customer.totalSpent)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Última reserva:</span>
                          <div className="font-semibold">{formatDate(customer.lastBookingDate)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Cliente desde:</span>
                          <div className="font-semibold">{formatDate(customer.createdAt)}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                        Ver perfil
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}