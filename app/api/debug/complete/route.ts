import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { existsSync, statSync } from 'fs'
import { join } from 'path'

export async function GET() {
  try {
    console.log('=== COMPLETE SYSTEM DEBUG START ===')
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        databaseUrl: process.env.DATABASE_URL,
        vercelEnv: process.env.VERCEL_ENV,
        pwd: process.cwd()
      },
      database: {
        connection: null,
        counts: null,
        sampleData: null,
        fileSystem: null,
        errors: []
      },
      system: {
        cwd: process.cwd(),
        files: []
      }
    }

    // 1. Check file system
    console.log('Checking file system...')
    try {
      const dbPath = join(process.cwd(), 'dev.db')
      const prismaPath = join(process.cwd(), 'prisma')
      
      debugInfo.database.fileSystem = {
        dbExists: existsSync(dbPath),
        dbPath: dbPath,
        dbSize: existsSync(dbPath) ? statSync(dbPath).size : 0,
        prismaExists: existsSync(prismaPath),
        cwd: process.cwd()
      }
      
      // List files in root directory
      const rootFiles = require('fs').readdirSync(process.cwd())
        .filter(f => f.includes('.db') || f.includes('prisma') || f.includes('package'))
      debugInfo.system.files = rootFiles
      
    } catch (fsError: any) {
      debugInfo.database.errors.push(`File system error: ${fsError.message}`)
    }

    // 2. Test database connection
    console.log('Testing database connection...')
    try {
      // Try to connect and get counts
      const [eventCount, bookingCount, voucherCount, customerCount] = await Promise.all([
        db.event.count(),
        db.booking.count(), 
        db.giftVoucher.count(),
        db.customer.count()
      ])
      
      debugInfo.database.counts = {
        events: eventCount,
        bookings: bookingCount,
        vouchers: voucherCount,
        customers: customerCount
      }
      
      debugInfo.database.connection = 'SUCCESS'
      console.log('Database connection successful, counts:', debugInfo.database.counts)
      
    } catch (dbError: any) {
      debugInfo.database.connection = 'FAILED'
      debugInfo.database.errors.push(`Database connection error: ${dbError.message}`)
      console.error('Database connection failed:', dbError.message)
    }

    // 3. Get sample data (only if connection works)
    if (debugInfo.database.connection === 'SUCCESS') {
      try {
        const [events, bookings, vouchers] = await Promise.all([
          db.event.findMany({ take: 3, select: { id: true, title: true, description: true, price: true, createdAt: true } }),
          db.booking.findMany({ take: 3, select: { id: true, customerName: true, totalAmount: true, createdAt: true } }),
          db.giftVoucher.findMany({ take: 3, select: { id: true, recipientName: true, amount: true, createdAt: true } })
        ])
        
        debugInfo.database.sampleData = {
          events: events,
          bookings: bookings,
          vouchers: vouchers
        }
        
      } catch (sampleError: any) {
        debugInfo.database.errors.push(`Sample data error: ${sampleError.message}`)
      }
    }

    // 4. Test basic write operation
    if (debugInfo.database.connection === 'SUCCESS') {
      try {
        console.log('Testing write operation...')
        
        // Try to create and delete a test record
        const testCustomer = await db.customer.create({
          data: {
            email: `test-${Date.now()}@example.com`,
            name: 'Test Customer',
            phone: '+1234567890'
          }
        })
        
        // Immediately delete it
        await db.customer.delete({
          where: { id: testCustomer.id }
        })
        
        debugInfo.database.writeTest = 'SUCCESS'
        console.log('Write test successful')
        
      } catch (writeError: any) {
        debugInfo.database.writeTest = 'FAILED'
        debugInfo.database.errors.push(`Write test error: ${writeError.message}`)
        console.error('Write test failed:', writeError.message)
      }
    }

    console.log('=== COMPLETE SYSTEM DEBUG END ===')
    
    return NextResponse.json(debugInfo, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
  } catch (error: any) {
    console.error('=== COMPLETE DEBUG FAILED ===', error)
    return NextResponse.json({
      error: 'Complete debug failed',
      message: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}