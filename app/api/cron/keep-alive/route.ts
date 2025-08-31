import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Keep-alive endpoint para mantener la base de datos activa
export async function GET(request: NextRequest) {
  try {
    // Verificar que el request viene con la clave secreta
    const authHeader = request.headers.get('authorization')
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`
    
    if (!process.env.CRON_SECRET || authHeader !== expectedAuth) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    console.log('🔄 Keep-alive: Checking database connection...')
    
    // Hacer una query simple para mantener la conexión activa
    const result = await db.$queryRaw`SELECT 1 as alive, NOW() as timestamp`
    
    console.log('✅ Keep-alive: Database is alive', result)
    
    return NextResponse.json({ 
      success: true, 
      timestamp: new Date().toISOString(),
      database: 'active',
      result
    })
    
  } catch (error) {
    console.error('❌ Keep-alive: Database error:', error)
    
    return NextResponse.json({ 
      success: false, 
      error: 'Database connection failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}