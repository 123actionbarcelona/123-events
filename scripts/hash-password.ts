import bcrypt from 'bcryptjs'

async function hashPassword(password: string) {
  const hash = await bcrypt.hash(password, 10)
  console.log(`Password: ${password}`)
  console.log(`Hash: ${hash}`)
  
  // Verificar que el hash funciona
  const isValid = await bcrypt.compare(password, hash)
  console.log(`Verification: ${isValid}`)
}

// Hash para la password admin123
hashPassword('admin123')