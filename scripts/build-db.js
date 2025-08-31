#!/usr/bin/env node

/**
 * Script para construir la base de datos SQLite para deployment
 * Se ejecuta durante el build en Vercel
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🏗️  Building SQLite database for production...');
console.log('📍 Current working directory:', process.cwd());
console.log('📍 Environment DATABASE_URL:', process.env.DATABASE_URL);

// Listar archivos en el directorio actual para debug
try {
  const files = require('fs').readdirSync(process.cwd());
  console.log('📁 Files in current directory:', files.filter(f => f.includes('.db') || f === 'prisma').join(', '));
} catch (e) {
  console.log('📁 Could not list files:', e.message);
}

// Crear directorio prisma si no existe
const prismaDir = path.join(process.cwd(), 'prisma');
if (!fs.existsSync(prismaDir)) {
  fs.mkdirSync(prismaDir, { recursive: true });
}

// Función para ejecutar comandos
function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    const childProcess = spawn(command, args, { 
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: "file:./dev.db"
      }
    });
    
    childProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
  });
}

async function buildDatabase() {
  try {
    console.log('📦 Generating Prisma Client...');
    await runCommand('npx', ['prisma', 'generate']);
    
    // Verificar múltiples ubicaciones posibles de la base de datos
    const possiblePaths = [
      path.join(process.cwd(), 'dev.db'),
      path.join(process.cwd(), 'prisma', 'dev.db'),
      './dev.db',
      'dev.db'
    ];
    
    let dbPath = null;
    let dbExists = false;
    
    for (const pathToCheck of possiblePaths) {
      if (fs.existsSync(pathToCheck)) {
        dbPath = pathToCheck;
        dbExists = true;
        const stats = fs.statSync(pathToCheck);
        console.log(`🗄️  Existing database found at: ${pathToCheck} (${(stats.size / 1024).toFixed(2)}KB)`);
        break;
      }
    }
    
    if (dbExists && dbPath) {
      // Copiar la base de datos existente a la ubicación correcta si no está ahí
      const targetPath = path.join(process.cwd(), 'dev.db');
      if (dbPath !== targetPath) {
        console.log(`📋 Copying database from ${dbPath} to ${targetPath}`);
        fs.copyFileSync(dbPath, targetPath);
      }
      console.log('⚡ Skipping migration and seed - using existing data');
    } else {
      console.log('🗄️  No existing database found. Creating new database...');
      console.log('🗄️  Deploying migrations...');
      await runCommand('npx', ['prisma', 'migrate', 'deploy']);
      
      console.log('🌱 Seeding database...');
      await runCommand('npx', ['tsx', 'prisma/seed.ts']);
    }
    
    console.log('✅ Database built successfully!');
    
    // Verificar tamaño final de la base de datos
    const finalDbPath = path.join(process.cwd(), 'dev.db');
    if (fs.existsSync(finalDbPath)) {
      const stats = fs.statSync(finalDbPath);
      console.log(`📊 Final database size: ${(stats.size / 1024).toFixed(2)}KB`);
    } else {
      console.log('⚠️  Warning: Final database not found at expected location');
    }
    
  } catch (error) {
    console.error('❌ Failed to build database:', error.message);
    process.exit(1);
  }
}

buildDatabase();