#!/usr/bin/env node

/**
 * Script de Reparación Automática - Mystery Events Platform
 * Soluciona problemas comunes de configuración
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🔧 Iniciando reparación automática del sistema...\n')

let fixesApplied = []
let errors = []

// 1. Corregir DATABASE_URL
console.log('1️⃣ Verificando y corrigiendo DATABASE_URL...')
try {
  let envContent = fs.readFileSync('.env.local', 'utf8')
  
  if (envContent.includes('DATABASE_URL="file:../dev.db"')) {
    envContent = envContent.replace('DATABASE_URL="file:../dev.db"', 'DATABASE_URL="file:./dev.db"')
    fs.writeFileSync('.env.local', envContent)
    fixesApplied.push('✅ Corregido DATABASE_URL path')
  } else if (envContent.includes('DATABASE_URL="file:./dev.db"')) {
    console.log('✅ DATABASE_URL ya está correcto')
  } else {
    errors.push('❌ DATABASE_URL no encontrado en .env.local')
  }
} catch (error) {
  errors.push(`❌ Error corrigiendo DATABASE_URL: ${error.message}`)
}

// 2. Remover mode: 'insensitive' de archivos API
console.log('\n2️⃣ Removiendo queries incompatibles con SQLite...')
try {
  const apiFiles = [
    'app/api/vouchers/route.ts',
    'app/api/admin/templates/route.ts',
    'app/api/admin/customers/route.ts',
    'app/api/admin/bookings/route.ts'
  ]
  
  let removedCount = 0
  
  apiFiles.forEach(file => {
    if (fs.existsSync(file)) {
      let content = fs.readFileSync(file, 'utf8')
      const originalContent = content
      
      // Remover mode: 'insensitive'
      content = content.replace(/, mode: 'insensitive'/g, '')
      content = content.replace(/mode: 'insensitive',/g, '')
      content = content.replace(/mode: 'insensitive'/g, '')
      
      if (content !== originalContent) {
        fs.writeFileSync(file, content)
        removedCount++
        console.log(`✅ Limpiado ${file}`)
      }
    }
  })
  
  if (removedCount > 0) {
    fixesApplied.push(`✅ Removidas queries incompatibles de ${removedCount} archivos`)
  } else {
    console.log('✅ No se encontraron queries incompatibles')
  }
} catch (error) {
  errors.push(`❌ Error limpiando queries: ${error.message}`)
}

// 3. Verificar y corregir referencias de tabla incorrectas
console.log('\n3️⃣ Corrigiendo referencias de tabla incorrectas...')
try {
  const dashboardFile = 'app/api/admin/dashboard/route.ts'
  
  if (fs.existsSync(dashboardFile)) {
    let content = fs.readFileSync(dashboardFile, 'utf8')
    const originalContent = content
    
    // Reemplazar db.voucher con db.giftVoucher
    content = content.replace(/db\.voucher\./g, 'db.giftVoucher.')
    
    if (content !== originalContent) {
      fs.writeFileSync(dashboardFile, content)
      fixesApplied.push('✅ Corregidas referencias de tabla en dashboard')
    } else {
      console.log('✅ Referencias de tabla ya están correctas')
    }
  }
} catch (error) {
  errors.push(`❌ Error corrigiendo referencias de tabla: ${error.message}`)
}

// 4. Verificar estructura de directorios
console.log('\n4️⃣ Verificando estructura de directorios...')
try {
  const requiredDirs = [
    'scripts',
    'lib',
    'app/api/vouchers',
    'app/api/admin',
    'app/api/webhooks'
  ]
  
  requiredDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
      fixesApplied.push(`✅ Creado directorio: ${dir}`)
    }
  })
  
  console.log('✅ Estructura de directorios verificada')
} catch (error) {
  errors.push(`❌ Error verificando directorios: ${error.message}`)
}

// 5. Verificar permisos de archivos críticos
console.log('\n5️⃣ Verificando permisos...')
try {
  const criticalFiles = ['dev.db', '.env.local']
  
  criticalFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const stats = fs.statSync(file)
      if (stats.isFile()) {
        console.log(`✅ ${file} accesible`)
      }
    } else {
      errors.push(`❌ Archivo crítico faltante: ${file}`)
    }
  })
} catch (error) {
  errors.push(`❌ Error verificando permisos: ${error.message}`)
}

// 6. Limpiar caché de Next.js
console.log('\n6️⃣ Limpiando caché...')
try {
  if (fs.existsSync('.next')) {
    execSync('rm -rf .next', { stdio: 'pipe' })
    fixesApplied.push('✅ Cache de Next.js limpiado')
  }
  
  if (fs.existsSync('node_modules/.cache')) {
    execSync('rm -rf node_modules/.cache', { stdio: 'pipe' })
    fixesApplied.push('✅ Cache de node_modules limpiado')
  }
  
  console.log('✅ Caché limpiado')
} catch (error) {
  console.log('⚠️  No se pudo limpiar completamente el caché (no crítico)')
}

// Resumen final
console.log('\n' + '='.repeat(50))
console.log('📊 RESUMEN DE REPARACIÓN')
console.log('='.repeat(50))

if (fixesApplied.length > 0) {
  console.log('🔧 Correcciones aplicadas:')
  fixesApplied.forEach(fix => console.log(`  ${fix}`))
}

if (errors.length > 0) {
  console.log('\n❌ Errores que requieren atención manual:')
  errors.forEach(error => console.log(`  ${error}`))
}

if (errors.length === 0) {
  console.log('\n🎉 Sistema reparado exitosamente!')
  console.log('💡 Ejecuta "npm run dev" para reiniciar el servidor')
} else {
  console.log('\n⚠️  Algunos errores requieren atención manual')
}

console.log(`\n📈 Total: ${fixesApplied.length} correcciones, ${errors.length} errores pendientes`)

// Exit code
process.exit(errors.length > 0 ? 1 : 0)