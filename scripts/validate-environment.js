#!/usr/bin/env node

/**
 * Script de Validación de Entorno - Mystery Events Platform
 * Previene errores de configuración antes del deploy
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🔍 Iniciando validación de entorno...\n')

const errors = []
const warnings = []

// 1. Verificar archivos críticos
console.log('📁 Verificando archivos críticos...')
const criticalFiles = [
  '.env.local',
  'dev.db',
  'package.json',
  'prisma/schema.prisma'
]

criticalFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    errors.push(`❌ Archivo crítico faltante: ${file}`)
  } else {
    console.log(`✅ ${file}`)
  }
})

// 2. Verificar configuración de base de datos
console.log('\n🗄️ Verificando configuración de base de datos...')
try {
  const envContent = fs.readFileSync('.env.local', 'utf8')
  
  if (envContent.includes('DATABASE_URL="file:./dev.db"')) {
    console.log('✅ DATABASE_URL correctamente configurada')
  } else if (envContent.includes('DATABASE_URL="file:../dev.db"')) {
    errors.push('❌ DATABASE_URL incorrecta: debe ser "file:./dev.db" no "file:../dev.db"')
  } else {
    warnings.push('⚠️  DATABASE_URL no encontrada en .env.local')
  }
} catch (error) {
  errors.push('❌ No se puede leer .env.local')
}

// 3. Verificar dependencias críticas
console.log('\n📦 Verificando dependencias críticas...')
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies }
  
  const criticalDeps = ['puppeteer', '@prisma/client', 'prisma', 'next', 'googleapis']
  
  criticalDeps.forEach(dep => {
    if (dependencies[dep]) {
      console.log(`✅ ${dep}: ${dependencies[dep]}`)
    } else {
      errors.push(`❌ Dependencia crítica faltante: ${dep}`)
    }
  })
} catch (error) {
  errors.push('❌ Error leyendo package.json')
}

// 4. Verificar variables de entorno críticas
console.log('\n🔑 Verificando variables de entorno...')
try {
  const envContent = fs.readFileSync('.env.local', 'utf8')
  const requiredEnvs = [
    'NEXTAUTH_SECRET',
    'GOOGLE_CLIENT_ID', 
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_REFRESH_TOKEN',
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'
  ]
  
  requiredEnvs.forEach(envVar => {
    if (envContent.includes(envVar)) {
      console.log(`✅ ${envVar}`)
    } else {
      warnings.push(`⚠️  Variable de entorno faltante: ${envVar}`)
    }
  })
} catch (error) {
  errors.push('❌ Error verificando variables de entorno')
}

// 5. Test de conexión a base de datos
console.log('\n🔌 Probando conexión a base de datos...')
try {
  // Verificar que el archivo de base de datos existe y es accesible
  const dbStats = fs.statSync('dev.db')
  if (dbStats.size > 0) {
    console.log(`✅ Base de datos accesible (${(dbStats.size / 1024).toFixed(1)} KB)`)
  } else {
    warnings.push('⚠️  Base de datos vacía')
  }
} catch (error) {
  errors.push('❌ No se puede acceder a la base de datos')
}

// 6. Verificar archivos API críticos
console.log('\n🌐 Verificando APIs críticas...')
const criticalAPIs = [
  'app/api/vouchers/route.ts',
  'app/api/admin/dashboard/route.ts', 
  'app/api/stripe/webhook/route.ts',
  'lib/pdf-generator.tsx',
  'lib/voucher-email-service.ts'
]

criticalAPIs.forEach(apiFile => {
  if (fs.existsSync(apiFile)) {
    console.log(`✅ ${apiFile}`)
    
    // Verificar que no tiene syntax problemática
    try {
      const content = fs.readFileSync(apiFile, 'utf8')
      // Solo buscar mode: 'insensitive' fuera de comentarios
      const lines = content.split('\n')
      for (let line of lines) {
        const trimmedLine = line.trim()
        if (!trimmedLine.startsWith('//') && !trimmedLine.startsWith('*') && 
            line.includes("mode: 'insensitive'")) {
          errors.push(`❌ ${apiFile} contiene "mode: 'insensitive'" (incompatible con SQLite)`)
          break
        }
      }
      if (apiFile.includes('dashboard') && content.includes('db.voucher.')) {
        errors.push(`❌ ${apiFile} usa "db.voucher" en lugar de "db.giftVoucher"`)
      }
    } catch (readError) {
      warnings.push(`⚠️  No se puede leer ${apiFile}`)
    }
  } else {
    errors.push(`❌ API crítica faltante: ${apiFile}`)
  }
})

// Resumen final
console.log('\n' + '='.repeat(50))
console.log('📊 RESUMEN DE VALIDACIÓN')
console.log('='.repeat(50))

if (errors.length === 0) {
  console.log('🎉 ¡Validación exitosa! El entorno está listo para deploy.')
} else {
  console.log('❌ Se encontraron errores críticos que deben solucionarse:')
  errors.forEach(error => console.log(`  ${error}`))
}

if (warnings.length > 0) {
  console.log('\n⚠️  Advertencias que deberían revisarse:')
  warnings.forEach(warning => console.log(`  ${warning}`))
}

console.log(`\n📈 Total: ${errors.length} errores, ${warnings.length} advertencias`)

// Exit code
process.exit(errors.length > 0 ? 1 : 0)