#!/usr/bin/env node
/**
 * 🔧 Database Setup Script
 * Ensures the app always uses the main dev.db file
 * Prevents Prisma from creating duplicate databases
 */

const fs = require('fs')
const path = require('path')

const MAIN_DB = path.join(__dirname, '../dev.db')
const PRISMA_DB = path.join(__dirname, '../prisma/dev.db')

console.log('🔧 Setting up database configuration...')

// Check if main database exists
if (!fs.existsSync(MAIN_DB)) {
  console.error('❌ Main database not found at:', MAIN_DB)
  console.log('💡 Make sure to copy your production database to the root directory')
  process.exit(1)
}

// Remove any existing prisma database
if (fs.existsSync(PRISMA_DB)) {
  console.log('🗑️ Removing existing prisma database...')
  fs.unlinkSync(PRISMA_DB)
}

// Create symbolic link
try {
  fs.symlinkSync('../dev.db', PRISMA_DB)
  console.log('✅ Created symbolic link: prisma/dev.db -> ../dev.db')
} catch (error) {
  console.error('❌ Failed to create symbolic link:', error.message)
  process.exit(1)
}

// Verify the setup
const stats = fs.lstatSync(PRISMA_DB)
if (stats.isSymbolicLink()) {
  const target = fs.readlinkSync(PRISMA_DB)
  console.log('✅ Database setup complete!')
  console.log(`   Link: ${PRISMA_DB}`)
  console.log(`   Target: ${target}`)
  console.log('🚀 Your app will now always use the main production database')
} else {
  console.error('❌ Setup verification failed')
  process.exit(1)
}