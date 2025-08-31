'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

interface EventImageProps {
  src?: string
  alt: string
  category?: string
  className?: string
  fallbackIcon?: string
}

const categoryIcons = {
  murder: '🕵️',
  escape: '🗝️', 
  detective: '🔍',
  horror: '👻',
}

// Lista de dominios conocidos problemáticos
const problematicDomains = [
  'images.unsplash.com',
  '123actionbarcelona.com',
  'unsplash.com'
]

const isProblematicUrl = (url: string): boolean => {
  return problematicDomains.some(domain => url.includes(domain))
}

// Función para detectar si es una imagen local subida
const isLocalUploadedImage = (url: string): boolean => {
  return url.startsWith('/uploads/events/')
}

export default function EventImage({ 
  src, 
  alt, 
  category, 
  className = '',
  fallbackIcon 
}: EventImageProps) {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [shouldShowFallback, setShouldShowFallback] = useState(false)

  // Verificar URL al montar el componente
  useEffect(() => {
    if (!src) {
      setShouldShowFallback(true)
      setIsLoading(false)
      return
    }

    // Para URLs problemáticas, verificar si están disponibles
    if (isProblematicUrl(src)) {
      const img = new window.Image()
      img.onload = () => {
        setShouldShowFallback(false)
        setIsLoading(false)
      }
      img.onerror = () => {
        console.warn(`Problematic URL failed to load: ${src}`)
        setShouldShowFallback(true)
        setImageError(true)
        setIsLoading(false)
      }
      img.src = src
    } else if (src.startsWith('/uploads/')) {
      // Para imágenes subidas localmente, también verificar
      const img = new window.Image()
      img.onload = () => {
        console.log('✅ Local uploaded image loaded successfully:', src)
        setShouldShowFallback(false)
        setIsLoading(false)
      }
      img.onerror = () => {
        console.warn('❌ Local uploaded image failed to load:', src)
        setShouldShowFallback(true)
        setImageError(true)
        setIsLoading(false)
      }
      img.src = src
    } else {
      // Para URLs confiables externas
      setShouldShowFallback(false)
      setIsLoading(false)
    }
  }, [src])

  // Si no hay src o hay error, mostrar fallback
  if (!src || imageError || shouldShowFallback) {
    return (
      <div className={`bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center ${className}`}>
        <span className="text-6xl">
          {fallbackIcon || categoryIcons[category as keyof typeof categoryIcons] || '🎭'}
        </span>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="text-gray-400">Cargando...</div>
        </div>
      )}
      
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className={`object-cover transition-all duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        onLoad={() => {
          console.log('✅ Next.js Image loaded:', src)
          setIsLoading(false)
        }}
        onError={() => {
          console.warn(`❌ Next.js Image failed to load: ${src}`)
          setImageError(true)
          setIsLoading(false)
        }}
        unoptimized={isProblematicUrl(src) || src.startsWith('/uploads/')}
        loading="lazy"
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
      />
    </div>
  )
}