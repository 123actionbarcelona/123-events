import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    const template = await prisma.emailTemplate.findUnique({
      where: { id }
    })

    if (!template) {
      return NextResponse.json({ error: 'Plantilla no encontrada' }, { status: 404 })
    }

    // Transformar para la UI
    const transformedTemplate = {
      id: template.id,
      name: getDisplayName(template.name),
      subject: template.subject,
      description: `Plantilla de email: ${getDisplayName(template.name)}`,
      category: getCategoryFromName(template.name),
      content: template.html,
      status: template.active ? 'active' : 'draft',
      lastModified: template.updatedAt.toISOString().split('T')[0],
      usageCount: 0, // TODO: Implementar tracking real
      variables: Array.isArray(template.variables) ? template.variables : getVariablesFromContent(template.html)
    }

    return NextResponse.json(transformedTemplate)
  } catch (error) {
    console.error('Error fetching template:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, subject, description, category, content, status = 'draft' } = body

    // Validaciones básicas
    if (!name || !subject || !content || !category) {
      return NextResponse.json({ 
        error: 'Campos requeridos: name, subject, content, category' 
      }, { status: 400 })
    }

    // Verificar que la plantilla existe
    const existingTemplate = await prisma.emailTemplate.findUnique({
      where: { id }
    })

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Plantilla no encontrada' }, { status: 404 })
    }

    // Extraer variables del contenido
    const variablesArray = getVariablesFromContent(content)
    
    // Convertir array de variables a objeto JSON para compatibilidad con el formato existente
    const variablesObject: Record<string, string> = {}
    variablesArray.forEach(variable => {
      variablesObject[variable] = 'string'
    })
    const variablesJson = JSON.stringify(variablesObject)

    // Actualizar la plantilla
    const template = await prisma.emailTemplate.update({
      where: { id },
      data: {
        name: generateTemplateName(name, category),
        subject,
        html: content,
        variables: variablesJson,
        active: status === 'active',
        updatedAt: new Date()
      }
    })

    // Transformar respuesta
    const transformedTemplate = {
      id: template.id,
      name: name,
      subject: template.subject,
      description: description || `Plantilla de email: ${name}`,
      category,
      status: template.active ? 'active' : 'draft',
      lastModified: template.updatedAt.toISOString().split('T')[0],
      usageCount: 0,
      variables: Array.isArray(template.variables) ? template.variables : variablesArray
    }

    return NextResponse.json(transformedTemplate)
  } catch (error) {
    console.error('Error updating template:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Verificar que la plantilla existe
    const existingTemplate = await prisma.emailTemplate.findUnique({
      where: { id }
    })

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Plantilla no encontrada' }, { status: 404 })
    }

    // Eliminar la plantilla
    await prisma.emailTemplate.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Plantilla eliminada correctamente' })
  } catch (error) {
    console.error('Error deleting template:', error)
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

function getVariablesFromContent(content: string): string[] {
  const variableRegex = /\{\{(\w+)\}\}/g
  const variables = new Set<string>()
  let match

  while ((match = variableRegex.exec(content)) !== null) {
    variables.add(match[1])
  }

  return Array.from(variables)
}

function generateTemplateName(displayName: string, category: string): string {
  // Convertir a formato snake_case para almacenamiento interno
  const baseName = displayName.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
  
  return `${category}_${baseName}`
}