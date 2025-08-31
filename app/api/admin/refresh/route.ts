import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación admin
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Este endpoint simplemente devuelve OK para indicar que se debe refrescar
    // El frontend lo usará para limpiar caché y recargar datos
    return NextResponse.json({ 
      success: true, 
      message: 'Datos refrescados',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error refreshing admin data:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}