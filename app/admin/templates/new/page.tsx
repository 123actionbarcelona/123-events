'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Eye,
  Save,
  Send,
  Info,
  Code,
  Palette,
  Settings
} from 'lucide-react'

interface TemplateVariable {
  name: string
  description: string
  example: string
  required: boolean
}

const availableVariables: Record<string, TemplateVariable[]> = {
  booking: [
    { name: 'customerName', description: 'Nombre del cliente', example: 'Juan Pérez', required: true },
    { name: 'eventName', description: 'Nombre del evento', example: 'Murder Mystery: El Testamento', required: true },
    { name: 'eventDate', description: 'Fecha del evento', example: '15 de enero de 2025', required: true },
    { name: 'eventTime', description: 'Hora del evento', example: '20:30', required: true },
    { name: 'eventLocation', description: 'Ubicación del evento', example: 'Teatro Principal, Madrid', required: true },
    { name: 'bookingId', description: 'ID de la reserva', example: 'BK-2025-001', required: true },
    { name: 'totalAmount', description: 'Monto total pagado', example: '45.00', required: true },
    { name: 'ticketCount', description: 'Número de tickets', example: '2', required: false },
    { name: 'specialInstructions', description: 'Instrucciones especiales', example: 'Traer identificación', required: false }
  ],
  voucher: [
    { name: 'voucherCode', description: 'Código del vale', example: 'GIFT-2025-ABCD', required: true },
    { name: 'amount', description: 'Valor del vale', example: '100.00', required: true },
    { name: 'purchaserName', description: 'Nombre del comprador', example: 'María García', required: true },
    { name: 'recipientName', description: 'Nombre del destinatario', example: 'Carlos López', required: false },
    { name: 'recipientEmail', description: 'Email del destinatario', example: 'carlos@email.com', required: false },
    { name: 'personalMessage', description: 'Mensaje personalizado', example: '¡Feliz cumpleaños!', required: false },
    { name: 'expirationDate', description: 'Fecha de expiración', example: '31 de diciembre de 2025', required: false }
  ],
  reminder: [
    { name: 'customerName', description: 'Nombre del cliente', example: 'Ana Martín', required: true },
    { name: 'eventName', description: 'Nombre del evento', example: 'Escape Room: La Mansión', required: true },
    { name: 'eventDate', description: 'Fecha del evento', example: 'mañana, 16 de enero', required: true },
    { name: 'eventTime', description: 'Hora del evento', example: '19:00', required: true },
    { name: 'eventLocation', description: 'Ubicación del evento', example: 'Escape Center, Barcelona', required: true },
    { name: 'checkinInstructions', description: 'Instrucciones de llegada', example: 'Presentarse en recepción', required: false },
    { name: 'weatherTip', description: 'Consejo del clima', example: 'Lleva una chaqueta ligera', required: false }
  ],
  marketing: [
    { name: 'subscriberName', description: 'Nombre del suscriptor', example: 'Laura Ruiz', required: true },
    { name: 'monthlyEvents', description: 'Eventos del mes', example: 'Lista de eventos', required: false },
    { name: 'specialOffers', description: 'Ofertas especiales', example: 'Descuento del 20%', required: false },
    { name: 'unsubscribeLink', description: 'Link para darse de baja', example: 'https://...', required: true }
  ]
}

export default function NewTemplatePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('basic')
  const [template, setTemplate] = useState({
    name: '',
    subject: '',
    description: '',
    category: '',
    content: '',
    preheader: ''
  })

  const handleSave = async (isDraft = true) => {
    // Validaciones básicas - SOLO campos esenciales, NO variables
    if (!template.name || !template.subject || !template.category) {
      alert('Por favor completa los campos requeridos: Nombre, Asunto y Categoría')
      return
    }

    if (!template.content) {
      alert('Por favor agrega contenido a la plantilla')
      return
    }

    try {
      const response = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: template.name,
          subject: template.subject,
          description: template.description,
          category: template.category,
          content: template.content,
          preheader: template.preheader,
          status: isDraft ? 'draft' : 'active'
        })
      })

      if (response.ok) {
        const newTemplate = await response.json()
        console.log('Template saved successfully:', newTemplate)
        alert(`Plantilla ${isDraft ? 'guardada como borrador' : 'activada'} correctamente`)
        router.push('/admin/templates')
      } else {
        const error = await response.json()
        console.error('Error saving template:', error)
        alert(`Error al guardar plantilla: ${error.error || 'Error desconocido'}`)
      }
    } catch (error) {
      console.error('Error saving template:', error)
      alert('Error al guardar plantilla. Por favor intenta de nuevo.')
    }
  }

  const selectedVariables = template.category ? availableVariables[template.category] || [] : []

  const insertVariable = (variableName: string, targetField: 'content' | 'subject' | 'description' = 'content') => {
    if (targetField === 'content') {
      const cursorPosition = (document.querySelector('#template-content') as HTMLTextAreaElement)?.selectionStart || 0
      const before = template.content.substring(0, cursorPosition)
      const after = template.content.substring(cursorPosition)
      
      setTemplate(prev => ({
        ...prev,
        content: before + `{{${variableName}}}` + after
      }))
    } else if (targetField === 'subject') {
      setTemplate(prev => ({
        ...prev,
        subject: prev.subject + `{{${variableName}}}`
      }))
    } else if (targetField === 'description') {
      setTemplate(prev => ({
        ...prev,
        description: prev.description + `{{${variableName}}}`
      }))
    }
  }

  const handleDragStart = (e: React.DragEvent, variableName: string) => {
    e.dataTransfer.setData('text/plain', `{{${variableName}}}`)
    e.dataTransfer.setData('variable', variableName)
  }

  const handleDrop = (e: React.DragEvent, targetField: 'content' | 'subject' | 'description') => {
    e.preventDefault()
    const variableText = e.dataTransfer.getData('text/plain')
    const variableName = e.dataTransfer.getData('variable')
    
    if (targetField === 'content') {
      const textarea = e.target as HTMLTextAreaElement
      const cursorPosition = textarea.selectionStart || 0
      const before = template.content.substring(0, cursorPosition)
      const after = template.content.substring(cursorPosition)
      
      setTemplate(prev => ({
        ...prev,
        content: before + variableText + after
      }))
    } else if (targetField === 'subject') {
      setTemplate(prev => ({
        ...prev,
        subject: prev.subject + variableText
      }))
    } else if (targetField === 'description') {
      setTemplate(prev => ({
        ...prev,
        description: prev.description + variableText
      }))
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Nueva Plantilla de Email</h1>
            <p className="text-muted-foreground">
              Crea una plantilla personalizada para automatizar tus comunicaciones
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            Vista Previa
          </Button>
          <Button variant="outline" onClick={() => handleSave(true)}>
            <Save className="h-4 w-4 mr-2" />
            Guardar Borrador
          </Button>
          <Button onClick={() => handleSave(false)}>
            <Send className="h-4 w-4 mr-2" />
            Activar Plantilla
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor Principal */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">
                <Settings className="h-4 w-4 mr-2" />
                Configuración
              </TabsTrigger>
              <TabsTrigger value="content">
                <Code className="h-4 w-4 mr-2" />
                Contenido
              </TabsTrigger>
              <TabsTrigger value="design">
                <Palette className="h-4 w-4 mr-2" />
                Diseño
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Información Básica</CardTitle>
                  <CardDescription>
                    Define los datos básicos de tu plantilla de email
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="template-name">Nombre de la Plantilla *</Label>
                    <Input
                      id="template-name"
                      placeholder="ej: Confirmación de Reserva"
                      value={template.name}
                      onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="template-subject">Asunto del Email *</Label>
                    <Input
                      id="template-subject"
                      placeholder="ej: ✅ Reserva confirmada - {{eventName}}"
                      value={template.subject}
                      onChange={(e) => setTemplate(prev => ({ ...prev, subject: e.target.value }))}
                      onDrop={(e) => handleDrop(e, 'subject')}
                      onDragOver={handleDragOver}
                      title="Puedes arrastrar variables aquí"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="template-preheader">Preheader (opcional)</Label>
                    <Input
                      id="template-preheader"
                      placeholder="Texto que aparece después del asunto en algunos clientes de email"
                      value={template.preheader}
                      onChange={(e) => setTemplate(prev => ({ ...prev, preheader: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="template-category">Categoría *</Label>
                    <Select value={template.category} onValueChange={(value) => setTemplate(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="booking">Reservas</SelectItem>
                        <SelectItem value="voucher">Vales Regalo</SelectItem>
                        <SelectItem value="reminder">Recordatorios</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="template-description">Descripción</Label>
                    <Textarea
                      id="template-description"
                      placeholder="Describe cuándo y cómo se usa esta plantilla..."
                      value={template.description}
                      onChange={(e) => setTemplate(prev => ({ ...prev, description: e.target.value }))}
                      onDrop={(e) => handleDrop(e, 'description')}
                      onDragOver={handleDragOver}
                      title="Puedes arrastrar variables aquí"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Contenido del Email</CardTitle>
                  <CardDescription>
                    Escribe el contenido HTML de tu plantilla. Usa variables para personalizar el contenido.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="template-content">Contenido HTML *</Label>
                    <Textarea
                      id="template-content"
                      placeholder="Escribe tu plantilla HTML aquí..."
                      value={template.content}
                      onChange={(e) => setTemplate(prev => ({ ...prev, content: e.target.value }))}
                      onDrop={(e) => handleDrop(e, 'content')}
                      onDragOver={handleDragOver}
                      title="Puedes arrastrar variables aquí o hacer clic en ellas"
                      rows={20}
                      className="font-mono text-sm border-2 border-dashed border-blue-200 hover:border-blue-300"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="design" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Personalización de Diseño</CardTitle>
                  <CardDescription>
                    Ajusta los colores y el estilo de tu plantilla
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-8 text-muted-foreground">
                    <Palette className="h-12 w-12 mx-auto mb-4" />
                    <p>Editor de diseño visual próximamente</p>
                    <p className="text-sm">Por ahora, edita el HTML directamente en la pestaña Contenido</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Panel Lateral */}
        <div className="space-y-6">
          {/* Variables Disponibles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Code className="h-4 w-4 mr-2" />
                Variables Disponibles
              </CardTitle>
              <CardDescription>
                {template.category 
                  ? `Variables para plantillas de ${template.category === 'booking' ? 'reservas' : 
                     template.category === 'voucher' ? 'vales regalo' :
                     template.category === 'reminder' ? 'recordatorios' : 'marketing'}`
                  : 'Selecciona una categoría para ver las variables'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedVariables.length > 0 ? (
                <div className="space-y-3">
                  {selectedVariables.map((variable) => (
                    <div 
                      key={variable.name} 
                      className="p-3 border rounded-lg cursor-move hover:bg-blue-50 hover:border-blue-300 transition-colors select-none"
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, variable.name)}
                      onClick={() => insertVariable(variable.name)}
                      title="Arrastra al editor o haz clic para insertar"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline" className="font-mono text-xs bg-blue-50">
                          {'{{'}{variable.name}{'}}'}
                        </Badge>
                        <div className="flex items-center space-x-1">
                          {variable.required && (
                            <Badge variant="secondary" className="text-xs">Sugerida</Badge>
                          )}
                          <div className="text-gray-400 text-xs">⋮⋮</div>
                        </div>
                      </div>
                      <p className="text-sm font-medium">{variable.description}</p>
                      <p className="text-xs text-muted-foreground">Ej: {variable.example}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Info className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Selecciona una categoría para ver las variables disponibles</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Consejos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="h-4 w-4 mr-2" />
                Consejos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• <strong>Drag & Drop:</strong> Arrastra variables desde el panel lateral al editor</li>
                <li>• <strong>Clic rápido:</strong> Haz clic en cualquier variable para insertarla</li>
                <li>• <strong>Variables opcionales:</strong> Puedes crear plantillas sin variables si deseas</li>
                <li>• Usa HTML responsivo para móviles</li>
                <li>• Prueba tu plantilla antes de activarla</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}