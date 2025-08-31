import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    console.log('=== DATABASE DEBUG START ===')
    
    // Check database connection and get counts
    const [eventCount, bookingCount, voucherCount, customerCount] = await Promise.all([
      db.event.count(),
      db.booking.count(), 
      db.giftVoucher.count(),
      db.customer.count()
    ])
    
    console.log('Database counts:', {
      events: eventCount,
      bookings: bookingCount, 
      vouchers: voucherCount,
      customers: customerCount
    })
    
    // Get actual event data to see if it's real or mockup
    const events = await db.event.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        status: true,
        createdAt: true
      },
      take: 5
    })
    
    console.log('Events found:', events)
    
    // Get actual bookings
    const bookings = await db.booking.findMany({
      select: {
        id: true,
        customerName: true,
        customerEmail: true,
        totalAmount: true,
        paymentStatus: true,
        createdAt: true
      },
      take: 5
    })
    
    console.log('Bookings found:', bookings)
    
    // Get vouchers
    const vouchers = await db.giftVoucher.findMany({
      select: {
        id: true,
        recipientName: true,
        recipientEmail: true,
        amount: true,
        status: true,
        createdAt: true
      },
      take: 5
    })
    
    console.log('Vouchers found:', vouchers)
    
    // Check database file info
    const databaseUrl = process.env.DATABASE_URL
    console.log('DATABASE_URL:', databaseUrl)
    
    console.log('=== DATABASE DEBUG END ===')
    
    return NextResponse.json({
      success: true,
      message: 'Database debug completed',
      counts: {
        events: eventCount,
        bookings: bookingCount,
        vouchers: voucherCount,
        customers: customerCount
      },
      sampleData: {
        events: events,
        bookings: bookings,
        vouchers: vouchers
      },
      environment: {
        databaseUrl: databaseUrl,
        nodeEnv: process.env.NODE_ENV
      }
    })
    
  } catch (error: any) {
    console.error('=== DATABASE DEBUG ERROR ===')
    console.error('Error details:', error)
    console.error('Error message:', error.message)
    console.error('=== DATABASE DEBUG ERROR END ===')
    
    return NextResponse.json({
      error: 'Database debug failed',
      message: error.message,
      details: error
    }, { status: 500 })
  }
}