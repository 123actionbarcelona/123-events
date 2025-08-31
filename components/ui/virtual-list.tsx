'use client'

import { useState, useEffect, useMemo, useRef } from 'react'

interface VirtualListProps<T> {
  items: T[]
  height: number // Altura total del contenedor
  itemHeight: number // Altura de cada elemento
  renderItem: (item: T, index: number) => React.ReactNode
  className?: string
  overscan?: number // Elementos extra a renderizar fuera del viewport
}

export function VirtualList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  className = '',
  overscan = 5
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const scrollElementRef = useRef<HTMLDivElement>(null)

  // Calcular qué elementos son visibles
  const { startIndex, endIndex, offsetY } = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + height) / itemHeight) + overscan
    )
    const offsetY = startIndex * itemHeight

    return { startIndex, endIndex, offsetY }
  }, [scrollTop, height, itemHeight, items.length, overscan])

  // Elementos visibles
  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex + 1)
  }, [items, startIndex, endIndex])

  const totalHeight = items.length * itemHeight

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }

  return (
    <div
      ref={scrollElementRef}
      className={`overflow-auto ${className}`}
      style={{ height }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) =>
            renderItem(item, startIndex + index)
          )}
        </div>
      </div>
    </div>
  )
}

// Hook para detectar si necesitamos virtual scrolling
export function useVirtualScrolling<T>(items: T[], threshold: number = 50) {
  return {
    shouldUseVirtualScrolling: items.length > threshold,
    itemCount: items.length
  }
}