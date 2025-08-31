export const isDemoMode = process.env.DEMO_MODE === 'true'

export const demoConfig = {
  // En demo mode, simular pagos sin cobrar
  skipRealPayments: isDemoMode,
  
  // En demo mode, simular emails sin enviar
  skipRealEmails: isDemoMode,
  
  // Mostrar banners de "DEMO"
  showDemoBanner: isDemoMode,
  
  // Datos demo
  demoSuccessUrl: '/booking/success?demo=true',
  demoBookingCode: 'DEMO-12345'
}

export const getDemoMessage = () => {
  if (!isDemoMode) return null
  
  return {
    title: "🎭 MODO DEMO",
    message: "Esta es una demostración. No se realizarán cobros ni envíos reales.",
    style: "bg-yellow-100 text-yellow-800 border-yellow-300"
  }
}