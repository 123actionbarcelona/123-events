import { NextRequest, NextResponse } from 'next/server'
import { processScheduledVouchers, sendExpirationReminders } from '@/lib/voucher-email-service'

// Endpoint para testing de cron jobs de vales regalo
// Solo disponible en desarrollo
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Only available in development' },
      { status: 403 }
    )
  }

  try {
    const url = new URL(request.url)
    const action = url.searchParams.get('action')

    switch (action) {
      case 'scheduled':
        console.log('Testing scheduled vouchers processing...')
        const scheduledCount = await processScheduledVouchers()
        return NextResponse.json({
          success: true,
          action: 'scheduled_vouchers',
          processed: scheduledCount,
          message: `Processed ${scheduledCount} scheduled vouchers`,
          timestamp: new Date().toISOString()
        })

      case 'expiration':
        console.log('Testing expiration reminders...')
        const reminderCount = await sendExpirationReminders()
        return NextResponse.json({
          success: true,
          action: 'expiration_reminders', 
          sent: reminderCount,
          message: `Sent ${reminderCount} expiration reminders`,
          timestamp: new Date().toISOString()
        })

      case 'all':
        console.log('Testing all voucher cron jobs...')
        const [scheduled, reminders] = await Promise.all([
          processScheduledVouchers(),
          sendExpirationReminders()
        ])
        return NextResponse.json({
          success: true,
          action: 'all_cron_jobs',
          results: {
            scheduled_processed: scheduled,
            reminders_sent: reminders
          },
          message: `Processed ${scheduled} scheduled vouchers and sent ${reminders} reminders`,
          timestamp: new Date().toISOString()
        })

      default:
        return NextResponse.json({
          error: 'Invalid action',
          available_actions: ['scheduled', 'expiration', 'all'],
          usage: 'GET /api/test/vouchers/cron?action=<action>'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Error in voucher cron testing:', error)
    
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// También permitir POST para casos específicos
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Only available in development' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const { action } = body

    // Aquí se podría agregar lógica para casos específicos
    // Por ejemplo, procesar un vale específico
    
    return NextResponse.json({
      message: 'POST endpoint ready for specific voucher testing',
      received: body
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    )
  }
}