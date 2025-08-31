'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useDebounce } from '@/lib/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import {
  Mail,
  Settings,
  Eye,
  Edit3,
  Copy,
  Plus,
  Send,
  Calendar,
  Gift,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react'

interface EmailTemplate {
  id: string
  name: string
  subject: string
  description: string
  category: 'booking' | 'voucher' | 'reminder' | 'marketing'
  status: 'active' | 'draft' | 'archived'
  lastModified: string
  usageCount: number
  variables: string[]
}

// Mock data removed - using only real API data now

const categoryColors = {
  booking: 'bg-blue-100 text-blue-800',
  voucher: 'bg-purple-100 text-purple-800',
  reminder: 'bg-orange-100 text-orange-800',
  marketing: 'bg-green-100 text-green-800'
}

const statusColors = {
  active: 'bg-green-100 text-green-800',
  draft: 'bg-gray-100 text-gray-800',
  archived: 'bg-red-100 text-red-800'
}

const categoryIcons = {
  booking: CheckCircle,
  voucher: Gift,
  reminder: Calendar,
  marketing: Send
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean
    html: string
    subject: string
    templateName: string
  }>({
    isOpen: false,
    html: '',
    subject: '',
    templateName: ''
  })
  const [stats, setStats] = useState({
    totalTemplates: 0,
    activeTemplates: 0,
    totalSent: 0,
    draftTemplates: 0
  })
  const [testEmailModal, setTestEmailModal] = useState<{
    isOpen: boolean
    template: EmailTemplate | null
    email: string
    sending: boolean
  }>({
    isOpen: false,
    template: null,
    email: '',
    sending: false
  })

  // OPTIMIZACIÓN: useCallback para evitar re-renders innecesarios
  const fetchTemplates = useCallback(async () => {
    setRefreshing(true)
    try {
      console.time('⚡ Templates API Call')
      
      const params = new URLSearchParams()
      if (debouncedSearchTerm) params.set('search', debouncedSearchTerm)
      if (selectedCategory !== 'all') params.set('category', selectedCategory)
      if (selectedStatus !== 'all') params.set('status', selectedStatus)
      params.set('limit', '100')
      
      const response = await fetch(`/api/admin/templates?${params}`, { 
        cache: 'no-store' 
      })
      
      console.timeEnd('⚡ Templates API Call')
      
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
        setStats(data.stats || {
          totalTemplates: 0,
          activeTemplates: 0,
          totalSent: 0,
          draftTemplates: 0
        })
        console.log('📊 Templates loaded:', data.templates?.length)
      } else {
        console.error('Error loading templates:', response.status)
        setTemplates([])
      }
    } catch (error) {
      console.error('Error loading templates:', error)
      setTemplates([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [debouncedSearchTerm, selectedCategory, selectedStatus])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  // OPTIMIZACIÓN: Stats ahora vienen del servidor, no calculamos en cliente

  // OPTIMIZACIÓN: Filtrado se hace en servidor, solo memoizamos los datos
  const filteredTemplates = useMemo(() => {
    // El filtrado se hace en el servidor, pero mantenemos capacidad local para casos edge
    return templates
  }, [templates])

  // Funciones de acción
  const handlePreview = async (template: EmailTemplate) => {
    try {
      // Primero necesitamos obtener el HTML completo de la plantilla
      const templateResponse = await fetch(`/api/admin/templates/${template.id}`)
      if (!templateResponse.ok) {
        alert('Error al cargar la plantilla')
        return
      }
      
      const fullTemplate = await templateResponse.json()
      
      // Ahora enviamos el HTML real para preview
      const response = await fetch('/api/admin/templates/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: fullTemplate.content || '', // El HTML real de la plantilla
          category: template.category,
          subject: template.subject,
          templateName: template.name
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        // Abrir en modal interno elegante
        setPreviewModal({
          isOpen: true,
          html: data.html,
          subject: data.subject || template.subject,
          templateName: template.name
        })
      } else {
        alert('Error al generar vista previa')
      }
    } catch (error) {
      console.error('Error previewing template:', error)
      alert('Error al generar vista previa')
    }
  }

  // Función para cerrar el modal
  const closePreviewModal = () => {
    setPreviewModal({
      isOpen: false,
      html: '',
      subject: '',
      templateName: ''
    })
  }

  // Manejar tecla ESC para cerrar modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && previewModal.isOpen) {
        closePreviewModal()
      }
    }

    if (previewModal.isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevenir scroll del body cuando el modal está abierto
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [previewModal.isOpen])

  const handleDuplicate = async (template: EmailTemplate) => {
    try {
      const response = await fetch(`/api/admin/templates/${template.id}/duplicate`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const newTemplate = await response.json()
        setTemplates([...templates, newTemplate])
        alert('Plantilla duplicada correctamente')
      } else {
        alert('Error al duplicar plantilla')
      }
    } catch (error) {
      console.error('Error duplicating template:', error)
      alert('Error al duplicar plantilla')
    }
  }

  const handleEdit = (template: EmailTemplate) => {
    // Redirigir a página de edición (cuando la implementemos)
    window.location.href = `/admin/templates/${template.id}/edit`
  }

  const handleSendTest = (template: EmailTemplate) => {
    setTestEmailModal({
      isOpen: true,
      template,
      email: '',
      sending: false
    })
  }

  const handleSendTestEmail = async () => {
    if (!testEmailModal.template || !testEmailModal.email) return

    setTestEmailModal(prev => ({ ...prev, sending: true }))

    try {
      const response = await fetch(
        `/api/admin/templates/${testEmailModal.template.id}/test`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: testEmailModal.email })
        }
      )

      if (response.ok) {
        const data = await response.json()
        alert(`✅ ${data.message}`)
        setTestEmailModal({
          isOpen: false,
          template: null,
          email: '',
          sending: false
        })
      } else {
        const error = await response.json()
        alert(`❌ Error: ${error.error || 'No se pudo enviar el email'}`)
      }
    } catch (error) {
      console.error('Error sending test email:', error)
      alert('❌ Error al enviar el email de prueba')
    } finally {
      setTestEmailModal(prev => ({ ...prev, sending: false }))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Plantillas de Email</h1>
          <p className="text-muted-foreground">
            Gestiona las plantillas de correo electrónico para automatizar comunicaciones
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={fetchTemplates}
            variant="outline"
            disabled={refreshing}
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Actualizando...' : 'Actualizar'}
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configuración SMTP
          </Button>
          <Button onClick={() => window.location.href = '/admin/templates/new'}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Plantilla
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre, asunto o contenido..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activas</option>
                <option value="draft">Borradores</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards - OPTIMIZADAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plantillas</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTemplates}</div>
            <p className="text-xs text-muted-foreground">
              En el sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeTemplates}</div>
            <p className="text-xs text-muted-foreground">
              Funcionando
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Enviados</CardTitle>
            <Send className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalSent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total histórico
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Borradores</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.draftTemplates}</div>
            <p className="text-xs text-muted-foreground">
              Pendientes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all" onClick={() => setSelectedCategory('all')}>Todas ({stats.totalTemplates})</TabsTrigger>
          <TabsTrigger value="booking" onClick={() => setSelectedCategory('booking')}>Reservas</TabsTrigger>
          <TabsTrigger value="voucher" onClick={() => setSelectedCategory('voucher')}>Vales Regalo</TabsTrigger>
          <TabsTrigger value="reminder" onClick={() => setSelectedCategory('reminder')}>Recordatorios</TabsTrigger>
          <TabsTrigger value="marketing" onClick={() => setSelectedCategory('marketing')}>Marketing</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedCategory} className="space-y-4">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Cargando plantillas...</p>
              </div>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm || selectedStatus !== 'all' ? (
                <div>
                  <p className="mb-2">No se encontraron plantillas con los filtros aplicados</p>
                  <Button variant="outline" onClick={() => {
                    setSearchTerm('')
                    setSelectedStatus('all')
                    setSelectedCategory('all')
                  }}>
                    Limpiar filtros
                  </Button>
                </div>
              ) : (
                'No hay plantillas disponibles'
              )}
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredTemplates.map((template) => {
              const IconComponent = categoryIcons[template.category] || Mail
              return (
                <Card key={template.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${categoryColors[template.category]}`}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <CardDescription className="text-sm font-mono bg-gray-100 px-2 py-1 rounded mt-1">
                            {template.subject}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={statusColors[template.status]}>
                          {template.status === 'active' ? 'Activa' : 
                           template.status === 'draft' ? 'Borrador' : 'Archivada'}
                        </Badge>
                        <Badge variant="outline">
                          {template.usageCount} enviados
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">{template.description}</p>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Variables disponibles:</h4>
                      <div className="flex flex-wrap gap-2">
                        {template.variables.map((variable) => (
                          <Badge key={variable} variant="secondary" className="text-xs">
                            {'{{'}{variable}{'}}'}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <p className="text-xs text-muted-foreground">
                        Última modificación: {new Date(template.lastModified).toLocaleDateString('es-ES')}
                      </p>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handlePreview(template)}>
                          <Eye className="h-4 w-4 mr-1" />
                          Vista Previa
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDuplicate(template)}>
                          <Copy className="h-4 w-4 mr-1" />
                          Duplicar
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleEdit(template)}>
                          <Edit3 className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button size="sm" disabled={template.status !== 'active'} onClick={() => handleSendTest(template)}>
                          <Send className="h-4 w-4 mr-1" />
                          Enviar Test
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Empty state moved to inside the TabsContent */}

      {/* Modal de Envío de Test */}
      {testEmailModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="border-b px-6 py-4">
              <h3 className="text-lg font-semibold">
                Enviar Email de Prueba
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {testEmailModal.template?.name}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Email destinatario
                </label>
                <Input
                  type="email"
                  placeholder="ejemplo@email.com"
                  value={testEmailModal.email}
                  onChange={(e) => setTestEmailModal(prev => ({ 
                    ...prev, 
                    email: e.target.value 
                  }))}
                  disabled={testEmailModal.sending}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Se enviará un email de prueba con datos de ejemplo
                </p>
              </div>
            </div>
            <div className="border-t px-6 py-4 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setTestEmailModal({
                  isOpen: false,
                  template: null,
                  email: '',
                  sending: false
                })}
                disabled={testEmailModal.sending}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSendTestEmail}
                disabled={!testEmailModal.email || testEmailModal.sending}
              >
                {testEmailModal.sending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar Test
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Vista Previa */}
      {previewModal.isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={closePreviewModal}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="text-lg font-semibold">Vista Previa - {previewModal.templateName}</h3>
                <p className="text-sm text-gray-600">{previewModal.subject}</p>
              </div>
              <button
                onClick={closePreviewModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Cerrar (ESC)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Contenido del Modal */}
            <div className="flex-1 overflow-auto">
              <iframe
                srcDoc={previewModal.html}
                className="w-full h-full min-h-[600px]"
                title="Vista previa de plantilla"
                style={{ border: 'none' }}
              />
            </div>
            
            {/* Footer del Modal */}
            <div className="p-4 border-t bg-gray-50">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  💡 Esta es una vista previa con datos de ejemplo
                </p>
                <button
                  onClick={closePreviewModal}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}