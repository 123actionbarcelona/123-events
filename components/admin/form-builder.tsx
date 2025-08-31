'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, GripVertical, Edit2, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import toast from 'react-hot-toast'

interface FormField {
  id?: string
  label: string
  fieldName: string
  fieldType: string
  placeholder?: string
  required: boolean
  options?: string[]
  minLength?: number
  maxLength?: number
  minValue?: number
  maxValue?: number
  pattern?: string
  order: number
  active: boolean
}

interface FormBuilderProps {
  eventId: string
  onSave?: () => void
}

const fieldTypes = [
  { value: 'text', label: 'Texto corto' },
  { value: 'textarea', label: 'Texto largo' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Teléfono' },
  { value: 'number', label: 'Número' },
  { value: 'date', label: 'Fecha' },
  { value: 'dropdown', label: 'Lista desplegable' },
  { value: 'radio', label: 'Opción única' },
  { value: 'checkbox', label: 'Múltiple opción' },
]

export default function FormBuilder({ eventId, onSave }: FormBuilderProps) {
  const [fields, setFields] = useState<FormField[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingField, setEditingField] = useState<number | null>(null)
  const [newField, setNewField] = useState<FormField>({
    label: '',
    fieldName: '',
    fieldType: 'text',
    placeholder: '',
    required: false,
    options: [],
    order: 0,
    active: true,
  })
  const [showNewField, setShowNewField] = useState(false)

  useEffect(() => {
    fetchFields()
  }, [eventId])

  const fetchFields = async () => {
    try {
      const response = await fetch(`/api/admin/events/${eventId}/form-fields`)
      if (response.ok) {
        const data = await response.json()
        setFields(data.fields || [])
      }
    } catch (error) {
      console.error('Error fetching form fields:', error)
      toast.error('Error al cargar los campos del formulario')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveFields = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/events/${eventId}/form-fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields }),
      })

      if (!response.ok) throw new Error('Error saving fields')

      toast.success('Campos guardados correctamente')
      onSave?.()
    } catch (error) {
      console.error('Error saving fields:', error)
      toast.error('Error al guardar los campos')
    } finally {
      setSaving(false)
    }
  }

  const addField = () => {
    if (!newField.label || !newField.fieldName) {
      toast.error('Por favor completa los campos obligatorios')
      return
    }

    // Generar fieldName automático si no existe
    const fieldName = newField.fieldName || newField.label.toLowerCase().replace(/\s+/g, '_')
    
    const field: FormField = {
      ...newField,
      fieldName,
      order: fields.length,
      options: newField.fieldType === 'dropdown' || newField.fieldType === 'radio' || newField.fieldType === 'checkbox' 
        ? newField.options || [] 
        : undefined,
    }

    setFields([...fields, field])
    setNewField({
      label: '',
      fieldName: '',
      fieldType: 'text',
      placeholder: '',
      required: false,
      options: [],
      order: 0,
      active: true,
    })
    setShowNewField(false)
  }

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index))
  }

  const updateField = (index: number, updates: Partial<FormField>) => {
    const updatedFields = [...fields]
    updatedFields[index] = { ...updatedFields[index], ...updates }
    setFields(updatedFields)
  }

  const moveField = (fromIndex: number, toIndex: number) => {
    const updatedFields = [...fields]
    const [movedField] = updatedFields.splice(fromIndex, 1)
    updatedFields.splice(toIndex, 0, movedField)
    
    // Actualizar el orden
    updatedFields.forEach((field, index) => {
      field.order = index
    })
    
    setFields(updatedFields)
  }

  const renderFieldEditor = (field: FormField, index: number, isNew = false) => {
    const currentField = isNew ? newField : field
    const updateFn = isNew 
      ? (updates: Partial<FormField>) => setNewField({ ...newField, ...updates })
      : (updates: Partial<FormField>) => updateField(index, updates)

    return (
      <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Etiqueta de la pregunta *</Label>
            <Input
              value={currentField.label}
              onChange={(e) => updateFn({ label: e.target.value })}
              placeholder="Ej: ¿Tienes alergias alimentarias?"
            />
          </div>
          
          <div>
            <Label>Nombre del campo *</Label>
            <Input
              value={currentField.fieldName}
              onChange={(e) => updateFn({ fieldName: e.target.value })}
              placeholder="Ej: allergies"
              pattern="[a-z_]+"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Tipo de campo</Label>
            <Select
              value={currentField.fieldType}
              onValueChange={(value) => updateFn({ fieldType: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fieldTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Placeholder</Label>
            <Input
              value={currentField.placeholder || ''}
              onChange={(e) => updateFn({ placeholder: e.target.value })}
              placeholder="Texto de ayuda"
            />
          </div>
        </div>

        {/* Opciones para dropdown, radio, checkbox */}
        {['dropdown', 'radio', 'checkbox'].includes(currentField.fieldType) && (
          <div>
            <Label>Opciones (una por línea)</Label>
            <Textarea
              value={(currentField.options || []).join('\n')}
              onChange={(e) => updateFn({ options: e.target.value.split('\n').filter(o => o.trim()) })}
              placeholder="Opción 1&#10;Opción 2&#10;Opción 3"
              rows={3}
            />
          </div>
        )}

        {/* Validaciones según el tipo */}
        {['text', 'textarea'].includes(currentField.fieldType) && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Longitud mínima</Label>
              <Input
                type="number"
                value={currentField.minLength || ''}
                onChange={(e) => updateFn({ minLength: parseInt(e.target.value) || undefined })}
                min="0"
              />
            </div>
            <div>
              <Label>Longitud máxima</Label>
              <Input
                type="number"
                value={currentField.maxLength || ''}
                onChange={(e) => updateFn({ maxLength: parseInt(e.target.value) || undefined })}
                min="0"
              />
            </div>
          </div>
        )}

        {currentField.fieldType === 'number' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Valor mínimo</Label>
              <Input
                type="number"
                value={currentField.minValue || ''}
                onChange={(e) => updateFn({ minValue: parseFloat(e.target.value) || undefined })}
              />
            </div>
            <div>
              <Label>Valor máximo</Label>
              <Input
                type="number"
                value={currentField.maxValue || ''}
                onChange={(e) => updateFn({ maxValue: parseFloat(e.target.value) || undefined })}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch
              checked={currentField.required}
              onCheckedChange={(checked) => updateFn({ required: checked })}
            />
            <Label>Campo obligatorio</Label>
          </div>
          
          <div className="flex items-center gap-2">
            <Switch
              checked={currentField.active}
              onCheckedChange={(checked) => updateFn({ active: checked })}
            />
            <Label>Activo</Label>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="text-center py-4">Cargando campos...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Campos del Formulario</span>
          <Button 
            onClick={() => setShowNewField(true)}
            size="sm"
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" />
            Añadir Campo
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Nuevo campo */}
        {showNewField && (
          <div className="border-2 border-dashed border-blue-300 rounded-lg p-4">
            <h3 className="font-semibold mb-4">Nuevo Campo</h3>
            {renderFieldEditor(newField, -1, true)}
            <div className="flex gap-2 mt-4">
              <Button onClick={addField} size="sm">
                <Save className="w-4 h-4 mr-2" />
                Agregar
              </Button>
              <Button 
                onClick={() => setShowNewField(false)} 
                size="sm" 
                variant="outline"
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Campos existentes */}
        {fields.length === 0 && !showNewField ? (
          <div className="text-center py-8 text-gray-500">
            No hay campos personalizados. Añade uno para empezar.
          </div>
        ) : (
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div 
                key={index}
                className="border rounded-lg p-4 bg-white"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                    <div>
                      <h4 className="font-semibold">{field.label}</h4>
                      <p className="text-sm text-gray-500">
                        {field.fieldName} - {fieldTypes.find(t => t.value === field.fieldType)?.label}
                        {field.required && ' (Obligatorio)'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setEditingField(editingField === index ? null : index)}
                      size="sm"
                      variant="ghost"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => removeField(index)}
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {editingField === index && (
                  <div className="mt-4">
                    {renderFieldEditor(field, index)}
                    <Button 
                      onClick={() => setEditingField(null)}
                      size="sm"
                      className="mt-4"
                    >
                      Cerrar
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Botón guardar */}
        {fields.length > 0 && (
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleSaveFields} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar Campos'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}