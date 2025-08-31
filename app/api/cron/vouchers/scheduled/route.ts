import { NextRequest, NextResponse } from 'next/server'
import { processScheduledVouchers } from '@/lib/voucher-email-service'

// Cron job para procesar vales programados
// Ejecutar cada 15 minutos: */15 * * * *
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

    console.log('Running scheduled vouchers cron job...')
    
    const sentCount = await processScheduledVouchers()
    
    console.log(`Scheduled vouchers cron completed. Sent: ${sentCount}`)
    
    return NextResponse.json({
      success: true,
      processed: sentCount,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in scheduled vouchers cron:', error)
    
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
      const sentCount = await processScheduledVouchers()
      
      return NextResponse.json({
        success: true,
        processed: sentCount,
        message: 'Manual execution completed',
        timestamp: new Date().toISOString()
      })
    }
    
    return NextResponse.json(
      { error: 'Method not allowed in production' },
      { status: 405 }
    )

  } catch (error) {
    console.error('Error in manual scheduled vouchers execution:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}