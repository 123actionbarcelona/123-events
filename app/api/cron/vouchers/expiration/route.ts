import { NextRequest, NextResponse } from 'next/server'
import { sendExpirationReminders } from '@/lib/voucher-email-service'

// Cron job para recordatorios de expiración
// Ejecutar diariamente: 0 9 * * * (9 AM todos los días)
export async function GET(request: NextRequest) {
  try {
    // Verificar token de autorización para cron jobs
    const authHeader = request.headers.get('authorization')
    const cronToken = process.env.CRON_SECRET
    
    if (!cronToken || authHeader !== `Bearer ${cronToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Running expiration reminders cron job...')
    
    const sentCount = await sendExpirationReminders()
    
    console.log(`Expiration reminders cron completed. Sent: ${sentCount}`)
    
    return NextResponse.json({
      success: true,
      reminders_sent: sentCount,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in expiration reminders cron:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// También permitir POST para testing manual
export async function POST(request: NextRequest) {
  try {
    // En desarrollo, permitir sin token para testing
    if (process.env.NODE_ENV === 'development') {
      const sentCount = await sendExpirationReminders()
      
      return NextResponse.json({
        success: true,
        reminders_sent: sentCount,
        message: 'Manual execution completed',
        timestamp: new Date().toISOString()
      })
    }
    
    return NextResponse.json(
      { error: 'Method not allowed in production' },
      { status: 405 }
    )

  } catch (error) {
    console.error('Error in manual expiration reminders execution:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}