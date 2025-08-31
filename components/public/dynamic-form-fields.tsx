'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

interface FormField {
  id: string
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

interface DynamicFormFieldsProps {
  eventId: string
  values: Record<string, any>
  errors: Record<string, string>
  onChange: (fieldName: string, value: any) => void
}

export default function DynamicFormFields({
  eventId,
  values,
  errors,
  onChange,
}: DynamicFormFieldsProps) {
  const [fields, setFields] = useState<FormField[]>([])
  const [loading, setLoading] = useState(true)

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
    } finally {
      setLoading(false)
    }
  }

  const renderField = (field: FormField) => {
    const value = values[field.fieldName] || ''
    const error = errors[field.fieldName]

    switch (field.fieldType) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.fieldName}>
              {field.label} {field.required && '*'}
            </Label>
            <Input
              id={field.fieldName}
              name={field.fieldName}
              type={field.fieldType === 'email' ? 'email' : 'text'}
              value={value}
              onChange={(e) => onChange(field.fieldName, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              minLength={field.minLength}
              maxLength={field.maxLength}
              className={error ? 'border-red-500' : ''}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        )

      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.fieldName}>
              {field.label} {field.required && '*'}
            </Label>
            <Textarea
              id={field.fieldName}
              name={field.fieldName}
              value={value}
              onChange={(e) => onChange(field.fieldName, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              minLength={field.minLength}
              maxLength={field.maxLength}
              rows={3}
              className={error ? 'border-red-500' : ''}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        )

      case 'number':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.fieldName}>
              {field.label} {field.required && '*'}
            </Label>
            <Input
              id={field.fieldName}
              name={field.fieldName}
              type="number"
              value={value}
              onChange={(e) => onChange(field.fieldName, parseFloat(e.target.value))}
              placeholder={field.placeholder}
              required={field.required}
              min={field.minValue}
              max={field.maxValue}
              className={error ? 'border-red-500' : ''}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        )

      case 'date':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.fieldName}>
              {field.label} {field.required && '*'}
            </Label>
            <Input
              id={field.fieldName}
              name={field.fieldName}
              type="date"
              value={value}
              onChange={(e) => onChange(field.fieldName, e.target.value)}
              required={field.required}
              className={error ? 'border-red-500' : ''}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        )

      case 'dropdown':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.fieldName}>
              {field.label} {field.required && '*'}
            </Label>
            <Select
              value={value}
              onValueChange={(val) => onChange(field.fieldName, val)}
              required={field.required}
            >
              <SelectTrigger className={error ? 'border-red-500' : ''}>
                <SelectValue placeholder={field.placeholder || 'Selecciona una opción'} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        )

      case 'radio':
        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.label} {field.required && '*'}
            </Label>
            <RadioGroup
              value={value}
              onValueChange={(val) => onChange(field.fieldName, val)}
              required={field.required}
            >
              {field.options?.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${field.fieldName}-${option}`} />
                  <Label htmlFor={`${field.fieldName}-${option}`}>{option}</Label>
                </div>
              ))}
            </RadioGroup>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        )

      case 'checkbox':
        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.label} {field.required && '*'}
            </Label>
            <div className="space-y-2">
              {field.options?.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.fieldName}-${option}`}
                    checked={(value as string[])?.includes(option) || false}
                    onCheckedChange={(checked) => {
                      const currentValues = (value as string[]) || []
                      if (checked) {
                        onChange(field.fieldName, [...currentValues, option])
                      } else {
                        onChange(field.fieldName, currentValues.filter(v => v !== option))
                      }
                    }}
                  />
                  <Label htmlFor={`${field.fieldName}-${option}`}>{option}</Label>
                </div>
              ))}
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        )

      default:
        return null
    }
  }

  if (loading) {
    return null
  }

  if (fields.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Información Adicional</h3>
      {fields.map(field => renderField(field))}
    </div>
  )
}