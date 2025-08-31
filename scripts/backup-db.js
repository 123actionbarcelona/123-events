#!/usr/bin/env node
/**
 * Script de backup automático de base de datos
 * Ejecutar antes de cualquier operación crítica
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const DB_PATH = './dev.db'
const BACKUP_DIR = './backups'

function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupFile = path.join(BACKUP_DIR, `dev-backup-${timestamp}.db`)
  
  try {
    // Crear directorio de backups si no existe
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true })
    }
    
    // Verificar que existe la BD original
    if (!fs.existsSync(DB_PATH)) {
      console.log('⚠️  Base de datos no encontrada en', DB_PATH)
      return false
    }
    
    // Crear backup usando SQLite .backup command
    execSync(`sqlite3 "${DB_PATH}" ".backup '${backupFile}'"`)
    
    // Verificar el backup
    const stats = fs.statSync(backupFile)
    console.log(`✅ Backup creado: ${backupFile} (${stats.size} bytes)`)
    
    // Mantener solo los últimos 10 backups
    const backups = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('dev-backup-'))
      .sort()
    
    while (backups.length > 10) {
      const oldBackup = path.join(BACKUP_DIR, backups.shift())
      fs.unlinkSync(oldBackup)
      console.log(`🗑️  Backup antiguo eliminado: ${oldBackup}`)
    }
    
    return backupFile
    
  } catch (error) {
    console.error('❌ Error creando backup:', error.message)
    return false
  }
}

function verifyData() {
  try {
    const result = execSync(`sqlite3 "${DB_PATH}" "SELECT COUNT(*) FROM events; SELECT COUNT(*) FROM bookings;"`, { encoding: 'utf8' })
    const [events, bookings] = result.trim().split('\n')
    console.log(`📊 Datos verificados: ${events} eventos, ${bookings} reservas`)
    return { events: parseInt(events), bookings: parseInt(bookings) }
  } catch (error) {
    console.error('❌ Error verificando datos:', error.message)
    return null
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  console.log('🔄 Iniciando backup de base de datos...')
  const backup = createBackup()
  const data = verifyData()
  
  if (backup && data) {
    console.log('✅ Backup completado exitosamente')
  } else {
    console.log('⚠️  Backup completado con advertencias')
    process.exit(1)
  }
}

module.exports = { createBackup, verifyData }