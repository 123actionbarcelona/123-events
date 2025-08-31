import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    console.log('=== TEST LOGIN DEBUG ===')
    console.log('Input email:', email)
    console.log('Input password:', password)
    console.log('Env email:', process.env.ADMIN_EMAIL)
    console.log('Env hash exists:', !!process.env.ADMIN_PASSWORD_HASH)
    console.log('Env hash:', process.env.ADMIN_PASSWORD_HASH)
    
    // Generar nuevo hash en tiempo real
    const newHash = await bcrypt.hash(password, 10)
    console.log('New hash for password:', newHash)
    
    // Probar con el hash del .env
    if (process.env.ADMIN_PASSWORD_HASH) {
      const isValid = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH)
      console.log('Hash validation with env:', isValid)
    }
    
    // Probar con hash temporal hardcodeado
    const tempHash = await bcrypt.hash('admin123', 10)
    const tempValid = await bcrypt.compare(password, tempHash)
    console.log('Temp hash validation:', tempValid)
    
    return NextResponse.json({
      success: true,
      email,
      envEmail: process.env.ADMIN_EMAIL,
      hasEnvHash: !!process.env.ADMIN_PASSWORD_HASH,
      newHash,
      tempValid
    })
    
  } catch (error) {
    console.error('Test login error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}