import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { settingsService } from '@/lib/settings'
import { z } from 'zod'

// Schema para actualizar configuraciones
const UpdateSettingsSchema = z.object({
  settings: z.array(z.object({
    key: z.string(),
    value: z.string(),
    type: z.enum(['string', 'number', 'boolean', 'json', 'template']),
    description: z.string().optional(),
    category: z.string()
  }))
})

// GET - Obtener configuraciones por categoría
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación de admin
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'vouchers'

    // Inicializar configuraciones por defecto si es necesario
    await settingsService.initializeDefaultSettings()

    // Obtener configuraciones de la categoría
    const settings = await settingsService.getSettingsByCategory(category)

    return NextResponse.json({ settings })

  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Actualizar configuraciones
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación de admin
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = UpdateSettingsSchema.parse(body)

    // Actualizar cada configuración
    for (const setting of validatedData.settings) {
      await settingsService.setSetting(
        setting.key,
        setting.value,
        setting.type,
        setting.description,
        setting.category
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Configuraciones actualizadas correctamente',
      updated: validatedData.settings.length
    })

  } catch (error) {
    console.error('Error updating settings:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}