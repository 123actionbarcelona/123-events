const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createGiftFormatVouchers() {
  console.log('🎁 Creating GIFT format vouchers for testing...')
  
  try {
    console.log('🔍 Checking database connection...')
    await prisma.$connect()
    console.log('✅ Database connected successfully')

    // Create GIFT format test vouchers
    const giftVouchers = [
      {
        code: 'GIFT-2025-TEST',
        type: 'amount',
        originalAmount: 50.0,
        currentBalance: 50.0,
        purchaserName: 'Admin Test',
        purchaserEmail: 'admin@mysteryevents.com',
        paymentStatus: 'completed',
        status: 'active',
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        paidAt: new Date(),
        activatedAt: new Date(),
      },
      {
        code: 'GIFT-DEMO-FULL',
        type: 'amount',
        originalAmount: 100.0,
        currentBalance: 100.0,
        purchaserName: 'Demo User',
        purchaserEmail: 'demo@mysteryevents.com',
        paymentStatus: 'completed',
        status: 'active',
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        paidAt: new Date(),
        activatedAt: new Date(),
      },
      {
        code: 'GIFT-ABC1-DEF2',
        type: 'amount',
        originalAmount: 75.0,
        currentBalance: 30.0,
        purchaserName: 'Test User',
        purchaserEmail: 'test@mysteryevents.com',
        paymentStatus: 'completed',
        status: 'active',
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        paidAt: new Date(),
        activatedAt: new Date(),
      }
    ]

    console.log('🚀 Creating GIFT format vouchers...')
    
    for (const voucherData of giftVouchers) {
      try {
        const voucher = await prisma.giftVoucher.create({
          data: voucherData
        })
        console.log(`✅ Created voucher: ${voucher.code} - €${voucher.currentBalance}`)
      } catch (error) {
        console.error(`❌ Error creating voucher ${voucherData.code}:`, error.message)
      }
    }

    console.log('📊 All vouchers in database:')
    const allVouchers = await prisma.giftVoucher.findMany({
      select: {
        id: true,
        code: true,
        type: true,
        originalAmount: true,
        currentBalance: true,
        status: true
      }
    })
    
    console.table(allVouchers)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createGiftFormatVouchers()
  .then(() => {
    console.log('🎉 GIFT format vouchers created successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Failed:', error)
    process.exit(1)
  })