'use client'

import { useState, useRef } from 'react'
import { Upload, X, Loader2, Image as ImageIcon, Link } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import toast from 'react-hot-toast'
import EventImage from '@/components/public/event-image'

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  category?: string
  label?: string
}

export function ImageUpload({ value, onChange, category, label = 'Imagen del evento' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlValue, setUrlValue] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar archivo localmente
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast.error('Tipo de archivo no válido. Solo se permiten imágenes JPEG, PNG y WebP.')
      return
    }

    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toast.error('El archivo es demasiado grande. Máximo 5MB.')
      return
    }

    // Subir archivo al servidor
    setUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al subir la imagen')
      }

      const result = await response.json()
      onChange(result.url)
      toast.success('Imagen subida correctamente')
      
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error(error instanceof Error ? error.message : 'Error al subir la imagen')
    } finally {
      setUploading(false)
    }

    // Limpiar input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleUrlSubmit = () => {
    if (urlValue.trim()) {
      onChange(urlValue.trim())
      setShowUrlInput(false)
      setUrlValue('')
      toast.success('URL de imagen aplicada')
    }
  }

  const handleRemove = () => {
    onChange('')
    toast.success('Imagen eliminada')
  }

  const openFileDialog = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (fileInputRef.current && !uploading) {
      fileInputRef.current.click()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">{label}</label>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Vista previa de imagen */}
      {value ? (
        <div className="space-y-3">
          <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
            <EventImage
              src={value}
              alt="Vista previa del evento"
              category={category}
              className="w-full h-full"
            />
            
            {uploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="bg-white rounded-lg p-4 flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm font-medium">Subiendo imagen...</span>
                </div>
              </div>
            )}
          </div>

          {/* Botones siempre visibles */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => openFileDialog(e)}
              disabled={uploading}
              className="flex-1"
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? 'Subiendo...' : 'Cambiar imagen'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemove}
              disabled={uploading}
              className="px-3"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={(e) => openFileDialog(e)}
          className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
        >
          <ImageIcon className="w-12 h-12 text-gray-400 mb-4" />
          <div className="text-center">
            <p className="text-sm font-medium text-gray-900">Subir imagen del evento</p>
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG, WebP hasta 5MB
            </p>
          </div>
          <Button 
            type="button" 
            variant="outline" 
            className="mt-4" 
            disabled={uploading}
            onClick={(e) => {
              e.stopPropagation()
              openFileDialog(e)
            }}
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? 'Subiendo...' : 'Seleccionar archivo'}
          </Button>
        </div>
      )}

      {/* Opciones adicionales */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowUrlInput(!showUrlInput)}
          disabled={uploading}
          className="flex-1"
        >
          <Link className="w-4 h-4 mr-2" />
          {showUrlInput ? 'Cancelar URL' : 'Usar URL externa'}
        </Button>
      </div>

      {/* Input de URL */}
      {showUrlInput && (
        <div className="space-y-2">
          <Input
            placeholder="https://ejemplo.com/imagen.jpg"
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
          />
          <div className="flex gap-2">
            <Button 
              type="button" 
              size="sm"
              onClick={handleUrlSubmit}
              disabled={!urlValue.trim()}
              className="flex-1"
            >
              Aplicar URL
            </Button>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500">
        Recomendado: 1200x600px. Formatos: JPEG, PNG, WebP. Máximo: 5MB
      </p>
    </div>
  )
}