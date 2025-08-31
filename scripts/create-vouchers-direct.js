// Script para crear vales via API
const vouchers = [
  {
    code: 'GIFT-TEST-50EU',
    type: 'amount',
    originalAmount: 50,
    currentBalance: 50,
    purchaserName: 'Usuario Test',
    purchaserEmail: 'test@mysteryevents.com',
    status: 'active',
    paymentStatus: 'paid'
  },
  {
    code: 'GIFT-MINI-25EU', 
    type: 'amount',
    originalAmount: 25,
    currentBalance: 25,
    purchaserName: 'Cliente Pequeño',
    purchaserEmail: 'mini@test.com',
    status: 'active',
    paymentStatus: 'paid'
  },
  {
    code: 'GIFT-PREM-100E',
    type: 'amount', 
    originalAmount: 100,
    currentBalance: 100,
    purchaserName: 'Cliente Premium',
    purchaserEmail: 'premium@test.com',
    status: 'active',
    paymentStatus: 'paid'
  },
  {
    code: 'GIFT-GRAN-150E',
    type: 'amount',
    originalAmount: 150,
    currentBalance: 150, 
    purchaserName: 'Gran Regalo',
    purchaserEmail: 'grande@test.com',
    status: 'active',
    paymentStatus: 'paid'
  },
  {
    code: 'GIFT-USED-75EU',
    type: 'amount',
    originalAmount: 100,
    currentBalance: 75,
    purchaserName: 'Vale Parcial', 
    purchaserEmail: 'usado@test.com',
    status: 'active',
    paymentStatus: 'paid'
  }
]

async function createVouchers() {
  for(const voucher of vouchers) {
    try {
      const response = await fetch('http://localhost:3001/api/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...voucher,
          purchaseDate: new Date().toISOString(),
          expiryDate: new Date(Date.now() + 365*24*60*60*1000).toISOString(),
          paidAt: new Date().toISOString(),
          templateUsed: 'elegant'
        })
      })
      
      if(response.ok) {
        console.log(`✅ ${voucher.code} - €${voucher.currentBalance}`)
      } else {
        console.log(`❌ Error: ${voucher.code}`)
      }
    } catch(error) {
      console.log(`❌ ${voucher.code}: ${error.message}`)
    }
  }
}

createVouchers()