import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/gmail'
import { google } from 'googleapis'
import Stripe from 'stripe'
import { db } from '@/lib/db'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

export async function GET() {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    tests: {}
  }

  // 1. Test Gmail API
  try {
    const testEmailResult = await sendEmail({
      to: 'test@example.com',
      subject: 'Test Email - API Testing',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Test Email from Mystery Events Platform</h2>
          <p>This is a test email sent at ${new Date().toLocaleString('es-ES')}</p>
          <p>If you receive this, Gmail API is working correctly!</p>
        </div>
      `
    })
    
    results.tests.gmail = {
      status: testEmailResult ? 'success' : 'failed',
      message: testEmailResult ? 'Gmail API configured correctly' : 'Failed to send test email',
      credentials: {
        hasClientId: !!process.env.GOOGLE_CLIENT_ID,
        hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        hasRefreshToken: !!process.env.GOOGLE_REFRESH_TOKEN,
        fromEmail: process.env.GMAIL_FROM_EMAIL
      }
    }
  } catch (error: any) {
    results.tests.gmail = {
      status: 'error',
      message: error.message,
      details: error.response?.data || error
    }
  }

  // 2. Test Google Calendar API
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'urn:ietf:wg:oauth:2.0:oob'
    )
    
    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    })

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
    
    // Try to get the primary calendar info (menos permisos que list)
    try {
      const calendarInfo = await calendar.calendars.get({
        calendarId: 'primary'
      })
      
      results.tests.googleCalendar = {
        status: 'success',
        message: 'Google Calendar API configured correctly',
        calendarId: 'primary',
        timeZone: calendarInfo.data.timeZone,
        summary: calendarInfo.data.summary
      }
    } catch {
      // Si falla, intentar listar eventos (esto sí debería funcionar con los permisos actuales)
      const events = await calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        maxResults: 1,
        singleEvents: true,
        orderBy: 'startTime',
      })
      
      results.tests.googleCalendar = {
        status: 'success',
        message: 'Google Calendar API configured correctly (events access)',
        canAccessEvents: true,
        nextEvent: events.data.items?.[0]?.summary || 'No upcoming events'
      }
    }
  } catch (error: any) {
    results.tests.googleCalendar = {
      status: 'error',
      message: error.message,
      details: error.response?.data || error
    }
  }

  // 3. Test Stripe API
  try {
    // Try to retrieve account details
    const account = await stripe.accounts.retrieve()
    
    results.tests.stripe = {
      status: 'success',
      message: 'Stripe API configured correctly',
      mode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ? 'TEST MODE' : 'LIVE MODE',
      accountCountry: account.country,
      accountEmail: account.email,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled
    }
  } catch (error: any) {
    results.tests.stripe = {
      status: 'error',
      message: error.message,
      mode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ? 'TEST MODE' : 'LIVE MODE',
      hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
      hasPublishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    }
  }

  // 4. Test Database Connection
  try {
    const eventCount = await db.event.count()
    const bookingCount = await db.booking.count()
    const voucherCount = await db.giftVoucher.count()
    
    results.tests.database = {
      status: 'success',
      message: 'Database connected successfully',
      stats: {
        events: eventCount,
        bookings: bookingCount,
        vouchers: voucherCount
      }
    }
  } catch (error: any) {
    results.tests.database = {
      status: 'error',
      message: error.message
    }
  }

  // 5. Check Environment Variables
  results.environment = {
    nodeEnv: process.env.NODE_ENV,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    hasAdminCredentials: !!process.env.ADMIN_EMAIL && !!process.env.ADMIN_PASSWORD_HASH
  }

  // Summary
  const allTests = Object.values(results.tests) as any[]
  const successCount = allTests.filter(t => t.status === 'success').length
  const failedCount = allTests.filter(t => t.status === 'error' || t.status === 'failed').length
  
  results.summary = {
    totalTests: allTests.length,
    passed: successCount,
    failed: failedCount,
    status: failedCount === 0 ? 'All tests passed!' : `${failedCount} test(s) failed`
  }

  return NextResponse.json(results, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    }
  })
}

export async function POST(request: Request) {
  const { testType } = await request.json()
  
  switch(testType) {
    case 'sendTestEmail':
      try {
        const result = await sendEmail({
          to: process.env.ADMIN_EMAIL || 'admin@mysteryevents.com',
          subject: `Test Email - ${new Date().toLocaleString('es-ES')}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #8B5CF6;">Mystery Events Platform</h1>
              <h2>Test Email Successful!</h2>
              <p>This email confirms that your Gmail API integration is working correctly.</p>
              <hr />
              <p><strong>Sent at:</strong> ${new Date().toLocaleString('es-ES')}</p>
              <p><strong>From:</strong> ${process.env.GMAIL_FROM_EMAIL}</p>
              <p><strong>To:</strong> ${process.env.ADMIN_EMAIL}</p>
            </div>
          `
        })
        
        return NextResponse.json({
          success: result,
          message: result ? 'Test email sent successfully' : 'Failed to send test email'
        })
      } catch (error: any) {
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 500 })
      }
      
    case 'createTestEvent':
      try {
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          'urn:ietf:wg:oauth:2.0:oob'
        )
        
        oauth2Client.setCredentials({
          refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
        })
        
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
        
        // Crear un evento de prueba mañana a las 18:00
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(18, 0, 0, 0)
        
        const endTime = new Date(tomorrow)
        endTime.setHours(20, 0, 0, 0)
        
        const event = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: {
            summary: '🧪 TEST - Mystery Events Platform',
            description: `Este es un evento de prueba creado por el sistema de testing.
            
📊 Información del test:
- Creado: ${new Date().toLocaleString('es-ES')}
- Sistema: Mystery Events Platform
- Tipo: Test de integración con Google Calendar
            
⚠️ Este evento puede ser eliminado.`,
            location: 'Barcelona, España',
            start: {
              dateTime: tomorrow.toISOString(),
              timeZone: 'Europe/Madrid',
            },
            end: {
              dateTime: endTime.toISOString(),
              timeZone: 'Europe/Madrid',
            },
            colorId: '5', // Color amarillo para destacar que es un test
            reminders: {
              useDefault: false,
              overrides: [
                { method: 'popup', minutes: 10 },
              ],
            },
          },
        })
        
        return NextResponse.json({
          success: true,
          eventId: event.data.id,
          htmlLink: event.data.htmlLink,
          message: `Test event created successfully! Check your calendar tomorrow at 18:00`,
          eventDetails: {
            title: event.data.summary,
            start: event.data.start?.dateTime,
            end: event.data.end?.dateTime,
            link: event.data.htmlLink
          }
        })
      } catch (error: any) {
        return NextResponse.json({
          success: false,
          error: error.message,
          details: error.response?.data || error
        }, { status: 500 })
      }
      
    case 'createTestCheckout':
      try {
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: 'eur',
                product_data: {
                  name: 'Test Event Ticket',
                  description: 'This is a test checkout session',
                },
                unit_amount: 1000, // 10€ in cents
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          success_url: `${process.env.NEXT_PUBLIC_APP_URL}/test/success`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/test/cancel`,
        })
        
        return NextResponse.json({
          success: true,
          checkoutUrl: session.url,
          sessionId: session.id,
          message: 'Test checkout session created'
        })
      } catch (error: any) {
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 500 })
      }
      
    default:
      return NextResponse.json({
        error: 'Invalid test type'
      }, { status: 400 })
  }
}