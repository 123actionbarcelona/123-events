import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface RouteParams {
  params: { id: string }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Buscar la plantilla original
    const originalTemplate = await prisma.emailTemplate.findUnique({
      where: { id: params.id }
    })

    if (!originalTemplate) {
      return NextResponse.json({ error: 'Plantilla no encontrada' }, { status: 404 })
    }

    // Generar nuevo nombre único
    const originalDisplayName = getDisplayName(originalTemplate.name)
    const newDisplayName = `${originalDisplayName} (Copia)`
    const category = getCategoryFromName(originalTemplate.name)
    
    // Asegurar nombre único en la base de datos
    let newInternalName = generateTemplateName(newDisplayName, category)
    let counter = 1
    
    while (await prisma.emailTemplate.findFirst({ where: { name: newInternalName } })) {
      const copyName = `${originalDisplayName} (Copia ${counter})`
      newInternalName = generateTemplateName(copyName, category)
      counter++
    }

    // Crear la copia
    const duplicatedTemplate = await prisma.emailTemplate.create({
      data: {
        name: newInternalName,
        subject: `${originalTemplate.subject} (Copia)`,
        html: originalTemplate.html,
        variables: originalTemplate.variables,
        active: false // Las copias empiezan como borrador
      }
    })

    // Transformar respuesta
    const transformedTemplate = {
      id: duplicatedTemplate.id,
      name: getDisplayName(duplicatedTemplate.name),
      subject: duplicatedTemplate.subject,
      description: `Copia de plantilla: ${originalDisplayName}`,
      category: getCategoryFromName(duplicatedTemplate.name),
      status: duplicatedTemplate.active ? 'active' : 'draft',
      lastModified: duplicatedTemplate.updatedAt.toISOString().split('T')[0],
      usageCount: 0,
      variables: Array.isArray(duplicatedTemplate.variables) ? duplicatedTemplate.variables : []
    }

    return NextResponse.json(transformedTemplate, { status: 201 })
  } catch (error) {
    console.error('Error duplicating template:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// Funciones de utilidad
function getCategoryFromName(templateName: string): string {
  if (templateName.includes('booking') || templateName.includes('confirmation')) return 'booking'
  if (templateName.includes('voucher') || templateName.includes('gift')) return 'voucher'
  if (templateName.includes('reminder') || templateName.includes('event')) return 'reminder'
  if (templateName.includes('newsletter') || templateName.includes('marketing')) return 'marketing'
  return 'booking' // default
}

function getDisplayName(templateName: string): string {
  // Convertir de snake_case a formato legible
  return templateName
    .replace(/^(booking|voucher|reminder|marketing)_/, '') // Quitar prefijo de categoría
    .replace(/_/g, ' ') // Reemplazar guiones bajos con espacios
    .replace(/\b\w/g, l => l.toUpperCase()) // Capitalizar primera letra de cada palabra
}

function generateTemplateName(displayName: string, category: string): string {
  // Convertir a formato snake_case para almacenamiento interno
  const baseName = displayName.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
  
  return `${category}_${baseName}`
}