import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { randomBytes } from 'crypto'

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

export async function uploadEventImage(file: File, eventId?: string): Promise<UploadResult> {
  try {
    // Validar el archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Tipo de archivo no válido. Solo se permiten imágenes JPEG, PNG y WebP.'
      }
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'El archivo es demasiado grande. Máximo 5MB.'
      }
    }

    // Generar nombre único para el archivo
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const randomId = randomBytes(5).toString('hex')
    const fileName = `${randomId}_${Date.now()}.${fileExtension}`
    
    // Crear directorio si no existe
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'events')
    await mkdir(uploadDir, { recursive: true })
    
    // Ruta completa del archivo
    const filePath = path.join(uploadDir, fileName)
    
    // Convertir File a Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Guardar archivo
    await writeFile(filePath, buffer)
    
    // URL pública de la imagen
    const publicUrl = `/uploads/events/${fileName}`

    return {
      success: true,
      url: publicUrl
    }

  } catch (error) {
    console.error('Error in uploadEventImage:', error)
    return {
      success: false,
      error: 'Error inesperado al subir la imagen.'
    }
  }
}

export async function deleteEventImage(imageUrl: string): Promise<boolean> {
  try {
    // Solo eliminar si es una imagen local (no URLs externas)
    if (!imageUrl.startsWith('/uploads/')) {
      return true // No eliminar URLs externas
    }
    
    // Extraer el nombre del archivo
    const fileName = path.basename(imageUrl)
    const filePath = path.join(process.cwd(), 'public', 'uploads', 'events', fileName)
    
    // Eliminar archivo (importar unlink)
    const { unlink } = await import('fs/promises')
    await unlink(filePath)
    
    return true

  } catch (error) {
    console.error('Error in deleteEventImage:', error)
    return false
  }
}

export async function optimizeImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const img = new Image()

    img.onload = () => {
      // Redimensionar si es necesario (máximo 1200px de ancho)
      const maxWidth = 1200
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
      
      canvas.width = img.width * ratio
      canvas.height = img.height * ratio

      // Dibujar imagen redimensionada
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      // Convertir a blob con calidad optimizada
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const optimizedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            })
            resolve(optimizedFile)
          } else {
            resolve(file)
          }
        },
        'image/jpeg',
        0.8 // 80% de calidad
      )
    }

    img.src = URL.createObjectURL(file)
  })
}