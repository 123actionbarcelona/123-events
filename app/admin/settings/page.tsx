'use client'

import { useState, useEffect } from 'react'
import { 
  Settings, 
  Gift,
  Save,
  RotateCcw,
  Info,
  AlertCircle,
  Mail,
  Globe
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import toast from 'react-hot-toast'

interface AppSetting {
  key: string
  value: string
  type: 'string' | 'number' | 'boolean' | 'json' | 'template'
  description?: string
  category: string
}

interface EmailTemplate {
  id: string
  name: string
  subject: string
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AppSetting[]>([])
  const [templateSettings, setTemplateSettings] = useState<AppSetting[]>([])
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [activeTab, setActiveTab] = useState('vouchers')

  useEffect(() => {
    fetchSettings()
    fetchTemplateSettings()
    fetchEmailTemplates()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings?category=vouchers')
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings || [])
      } else {
        toast.error('Error al cargar configuración')
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Error al cargar configuración')
    }
  }

  const fetchTemplateSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings?category=email')
      if (response.ok) {
        const data = await response.json()
        setTemplateSettings(data.settings || [])
      }
    } catch (error) {
      console.error('Error fetching template settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEmailTemplates = async () => {
    try {
      const response = await fetch('/api/admin/templates')
      if (response.ok) {
        const data = await response.json()
        setEmailTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }

  const updateSetting = (key: string, value: string) => {
    setSettings(prev => prev.map(setting => 
      setting.key === key ? { ...setting, value } : setting
    ))
    setHasChanges(true)
  }

  const updateTemplateSetting = (key: string, value: string) => {
    setTemplateSettings(prev => prev.map(setting => 
      setting.key === key ? { ...setting, value } : setting
    ))
    setHasChanges(true)
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      // Combinar ambos tipos de configuraciones
      const allSettings = [...settings, ...templateSettings]
      
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings: allSettings }),
      })

      if (response.ok) {
        toast.success('Configuración guardada correctamente')
        setHasChanges(false)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al guardar configuración')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Error al guardar configuración')
    } finally {
      setSaving(false)
    }
  }

  const resetSettings = () => {
    fetchSettings()
    fetchTemplateSettings()
    setHasChanges(false)
    toast.success('Configuración restaurada')
  }

  const renderSettingInput = (setting: AppSetting, isTemplate = false) => {
    const { key, value, type, description } = setting
    const updateFunc = isTemplate ? updateTemplateSetting : updateSetting

    switch (type) {
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => updateFunc(key, e.target.value)}
            min={key.includes('min') ? '1' : '0'}
            max={key.includes('max') ? '20' : '1000'}
          />
        )
      
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={value === 'true'}
              onChange={(e) => updateFunc(key, e.target.checked.toString())}
              className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">
              {value === 'true' ? 'Habilitado' : 'Deshabilitado'}
            </span>
          </div>
        )
      
      case 'json':
        return (
          <textarea
            value={value}
            onChange={(e) => updateFunc(key, e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            placeholder="JSON válido"
          />
        )
      
      case 'template':
        return (
          <select
            value={value}
            onChange={(e) => updateFunc(key, e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">-- Sin template asignado --</option>
            {emailTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name} - {template.subject}
              </option>
            ))}
          </select>
        )
      
      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => updateFunc(key, e.target.value)}
          />
        )
    }
  }

  const getSettingLabel = (key: string) => {
    const labels: Record<string, string> = {
      'voucher.min_tickets': 'Mínimo de tickets por vale',
      'voucher.max_tickets': 'Máximo de tickets por vale',
      'voucher.allow_partial_redemption': 'Permitir canje parcial',
      'voucher.default_expiry_days': 'Días de validez por defecto',
      'voucher.templates_enabled': 'Plantillas PDF disponibles',
      // Global Templates
      'email.default_confirmation_template': 'Template Global - Confirmaciones',
      'email.default_reminder_template': 'Template Global - Recordatorios',
      'email.default_voucher_template': 'Template Global - Vales',
      // Murder Mystery
      'email.murder_confirmation_template': 'Murder Mystery - Confirmaciones',
      'email.murder_reminder_template': 'Murder Mystery - Recordatorios',
      'email.murder_voucher_template': 'Murder Mystery - Vales',
      // Escape Room
      'email.escape_confirmation_template': 'Escape Room - Confirmaciones',
      'email.escape_reminder_template': 'Escape Room - Recordatorios',
      'email.escape_voucher_template': 'Escape Room - Vales',
      // Detective
      'email.detective_confirmation_template': 'Detective - Confirmaciones',
      'email.detective_reminder_template': 'Detective - Recordatorios',
      'email.detective_voucher_template': 'Detective - Vales',
      // Horror
      'email.horror_confirmation_template': 'Horror - Confirmaciones',
      'email.horror_reminder_template': 'Horror - Recordatorios',
      'email.horror_voucher_template': 'Horror - Vales',
    }
    return labels[key] || key
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Settings className="w-8 h-8 mr-3" />
            Configuración del Sistema
          </h1>
          <p className="text-gray-600">Gestiona la configuración de vales regalo y eventos</p>
        </div>
        
        <div className="flex space-x-3">
          {hasChanges && (
            <Button
              variant="outline"
              onClick={resetSettings}
              disabled={saving}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Descartar
            </Button>
          )}
          
          <Button
            onClick={saveSettings}
            disabled={!hasChanges || saving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>

      {hasChanges && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-amber-600 mr-3 mt-0.5" />
          <div>
            <p className="text-amber-800 font-medium">Cambios sin guardar</p>
            <p className="text-amber-700 text-sm">
              Tienes cambios pendientes. No olvides guardarlos antes de salir.
            </p>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="vouchers" className="flex items-center gap-2">
            <Gift className="w-4 h-4" />
            Vales Regalo
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Templates Email
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vouchers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Gift className="w-6 h-6 mr-2 text-purple-600" />
                Configuración de Vales Regalo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {settings.map((setting) => (
                <div key={setting.key} className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Label htmlFor={setting.key} className="text-sm font-medium">
                        {getSettingLabel(setting.key)}
                      </Label>
                      {setting.description && (
                        <p className="text-xs text-gray-500 mt-1 flex items-start">
                          <Info className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                          {setting.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="max-w-md">
                    {renderSettingInput(setting)}
                  </div>
                  
                  {setting.key === 'voucher.min_tickets' && (
                    <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                      💡 Recomendado: Mínimo 2 personas para experiencias grupales óptimas
                    </p>
                  )}
                  
                  {setting.key === 'voucher.max_tickets' && (
                    <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                      💡 Máximo recomendado para mantener la intimidad de la experiencia
                    </p>
                  )}
                </div>
              ))}

              {settings.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Settings className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No hay configuraciones de vales disponibles</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="w-6 h-6 mr-2 text-blue-600" />
                Templates por Defecto - Jerarquía de Asignación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">¿Cómo funciona la jerarquía?</h4>
                    <ol className="text-sm text-blue-800 mt-2 space-y-1">
                      <li><strong>1. Específico del evento</strong>: Si un evento tiene template asignado, se usa ese</li>
                      <li><strong>2. Por categoría</strong>: Si no hay template específico, se usa el de la categoría (Murder, Escape, etc.)</li>
                      <li><strong>3. Global</strong>: Si no hay template de categoría, se usa el template global</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="grid gap-6">
                {/* Global Templates */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <Globe className="w-5 h-5 text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Templates Globales (Fallback)</h3>
                  </div>
                  {templateSettings.filter(s => s.key.includes('default')).map((setting) => (
                    <div key={setting.key} className="space-y-2">
                      <Label className="text-sm font-medium">{getSettingLabel(setting.key)}</Label>
                      <div className="max-w-md">
                        {renderSettingInput(setting, true)}
                      </div>
                      {setting.description && (
                        <p className="text-xs text-gray-500 flex items-start">
                          <Info className="w-3 h-3 mr-1 mt-0.5" />
                          {setting.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Category Templates */}
                {['murder', 'escape', 'detective', 'horror'].map((category) => (
                  <div key={category} className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <Mail className="w-5 h-5 text-purple-600" />
                      <h3 className="text-lg font-semibold text-gray-900 capitalize">{category} Templates</h3>
                    </div>
                    {templateSettings.filter(s => s.key.includes(category)).map((setting) => (
                      <div key={setting.key} className="space-y-2">
                        <Label className="text-sm font-medium">{getSettingLabel(setting.key)}</Label>
                        <div className="max-w-md">
                          {renderSettingInput(setting, true)}
                        </div>
                        {setting.description && (
                          <p className="text-xs text-gray-500 flex items-start">
                            <Info className="w-3 h-3 mr-1 mt-0.5" />
                            {setting.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ))}

                {templateSettings.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Mail className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>No hay configuraciones de templates disponibles</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Información del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Versión:</span>
              <span className="ml-2">1.0.0</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Última actualización:</span>
              <span className="ml-2">24 Agosto 2025</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Base de datos:</span>
              <span className="ml-2 text-green-600">✅ Conectada</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Sistema vales:</span>
              <span className="ml-2 text-green-600">✅ Activo</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}