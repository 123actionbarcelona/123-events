import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function GET() {
  try {
    console.log('=== STRIPE DEBUG START ===')
    
    // Check environment variables
    const hasSecretKey = !!process.env.STRIPE_SECRET_KEY
    const hasPublishableKey = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    const secretKeyPrefix = process.env.STRIPE_SECRET_KEY?.substring(0, 12)
    const publishableKeyPrefix = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.substring(0, 12)
    
    console.log('Environment check:', {
      hasSecretKey,
      hasPublishableKey,
      secretKeyPrefix,
      publishableKeyPrefix,
      appUrl: process.env.NEXT_PUBLIC_APP_URL
    })
    
    if (!stripe) {
      return NextResponse.json({
        error: 'Stripe not initialized',
        details: {
          hasSecretKey,
          hasPublishableKey,
          secretKeyPrefix,
          publishableKeyPrefix
        }
      }, { status: 500 })
    }
    
    // Test Stripe account access
    console.log('Testing Stripe account access...')
    const account = await stripe.accounts.retrieve()
    console.log('Account retrieved successfully:', {
      id: account.id,
      country: account.country,
      email: account.email,
      charges_enabled: account.charges_enabled
    })
    
    // Test creating a simple checkout session
    console.log('Testing checkout session creation...')
    const testSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Test Product',
              description: 'This is a test checkout session'
            },
            unit_amount: 1000, // 10€ in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/debug/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/debug/cancel`,
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
    })
    
    console.log('Test session created successfully:', {
      id: testSession.id,
      url: testSession.url
    })
    
    console.log('=== STRIPE DEBUG END ===')
    
    return NextResponse.json({
      success: true,
      message: 'Stripe is working correctly',
      details: {
        account: {
          id: account.id,
          country: account.country,
          email: account.email,
          charges_enabled: account.charges_enabled
        },
        testSession: {
          id: testSession.id,
          url: testSession.url
        },
        environment: {
          hasSecretKey,
          hasPublishableKey,
          secretKeyPrefix,
          publishableKeyPrefix,
          appUrl: process.env.NEXT_PUBLIC_APP_URL
        }
      }
    })
    
  } catch (error: any) {
    console.error('=== STRIPE DEBUG ERROR ===')
    console.error('Error details:', error)
    console.error('Error message:', error.message)
    console.error('Error type:', error.type)
    console.error('Error code:', error.code)
    console.error('=== STRIPE DEBUG ERROR END ===')
    
    return NextResponse.json({
      error: 'Stripe debug failed',
      message: error.message,
      type: error.type,
      code: error.code,
      details: error
    }, { status: 500 })
  }
}