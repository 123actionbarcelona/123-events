import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Configuración optimizada para SQLite
    errorFormat: 'minimal',
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Helper para manejar JSON serializado en SQLite
export const serializeJson = (obj: any): string => JSON.stringify(obj)
export const parseJson = (str: string | null): any => {
  if (!str) return null
  try {
    return JSON.parse(str)
  } catch {
    return null
  }
}