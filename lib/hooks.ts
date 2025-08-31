import { useState, useEffect, useCallback, useRef } from 'react'

// Hook para debounce - optimiza búsquedas
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Hook para fetch con cache optimizado
export function useCachedFetch<T>(url: string, options?: RequestInit) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Intentar obtener desde cache del navegador primero
      const cachedResponse = await caches.match(url)
      if (cachedResponse && cachedResponse.headers.get('date')) {
        const cacheDate = new Date(cachedResponse.headers.get('date')!)
        const isStale = Date.now() - cacheDate.getTime() > 30000 // 30 segundos
        
        if (!isStale) {
          const cachedData = await cachedResponse.json()
          setData(cachedData)
          setLoading(false)
          return cachedData
        }
      }

      // Fetch fresh data
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options?.headers,
          'Cache-Control': 'max-age=30, stale-while-revalidate=300'
        }
      })
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      
      const freshData = await response.json()
      
      // Cache la respuesta
      if ('caches' in window) {
        const cache = await caches.open('dashboard-cache')
        cache.put(url, response.clone())
      }
      
      setData(freshData)
      setError(null)
      return freshData
      
    } catch (err) {
      setError(err as Error)
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [url, options])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

// Hook para prefetching inteligente de datos
export function usePrefetch() {
  const prefetchCache = useRef<Map<string, Promise<any>>>(new Map())

  const prefetchData = useCallback(async (url: string) => {
    // Evitar prefetch duplicado
    if (prefetchCache.current.has(url)) {
      return prefetchCache.current.get(url)
    }

    console.log(`🚀 Prefetching: ${url}`)
    const fetchPromise = fetch(url, {
      headers: {
        'Cache-Control': 'max-age=60, stale-while-revalidate=300'
      }
    }).then(res => res.json())

    prefetchCache.current.set(url, fetchPromise)

    // Limpiar cache después de 5 minutos
    setTimeout(() => {
      prefetchCache.current.delete(url)
    }, 5 * 60 * 1000)

    return fetchPromise
  }, [])

  const prefetchRoute = useCallback((href: string) => {
    // Mapear rutas a sus APIs correspondientes
    const routeToApiMap: Record<string, string[]> = {
      '/admin/dashboard': ['/api/admin/dashboard'],
      '/admin/events': ['/api/events'],
      '/admin/bookings': ['/api/admin/bookings?limit=50'],
      '/admin/vouchers': ['/api/vouchers'],
      '/admin/customers': ['/api/admin/customers'],
      '/admin/settings': ['/api/admin/settings']
    }

    const apis = routeToApiMap[href]
    if (apis) {
      apis.forEach(api => {
        prefetchData(api).catch(() => {
          // Silenciar errores de prefetch
        })
      })
    }
  }, [prefetchData])

  return { prefetchRoute, prefetchData }
}