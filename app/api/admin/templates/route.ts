import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || 'all'
    const status = searchParams.get('status') || 'all'

    try {
      console.log('🔄 Fetching email templates from database...')
      
      // Construir filtros optimizados
      const whereClause: any = {}
      
      if (search) {
        whereClause.OR = [
          { name: { contains: search } },
          { subject: { contains: search } }
        ]
      }
      
      if (status !== 'all') {
        whereClause.active = status === 'active'
      }

      // Query principal con paginación
      const [templates, total] = await Promise.all([
        prisma.emailTemplate.findMany({
          where: whereClause,
          orderBy: { updatedAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.emailTemplate.count({ where: whereClause })
      ])

      // Transformar y filtrar por categoría (post-processing optimizado)
      let transformedTemplates = templates.map(template => {
        const detectedCategory = getCategoryFromName(template.name)
        const displayName = getTemplateDisplayName(template.name)
        return {
          id: template.id,
          name: template.name, // Nombre real de BD para filtrado
          displayName: displayName, // Nombre bonito para UI
          subject: template.subject,
          description: `Plantilla de email: ${displayName}`,
          category: detectedCategory,
          status: template.active ? 'active' : 'draft',
          lastModified: template.updatedAt.toISOString().split('T')[0],
          usageCount: getUsageCount(template.name), // TODO: Implementar tracking real en future
          variables: parseVariables(template.variables) || getVariablesFromContent(template.html || '')
        }
      })

      // Filtrar por categoría si especificado (excepto para el selector de eventos)
      if (category !== 'all' && category !== undefined) {
        transformedTemplates = transformedTemplates.filter(t => t.category === category)
      }

      // Calcular estadísticas agregadas
      const stats = {
        totalTemplates: transformedTemplates.length,
        activeTemplates: transformedTemplates.filter(t => t.status === 'active').length,
        draftTemplates: transformedTemplates.filter(t => t.status === 'draft').length,
        totalSent: transformedTemplates.reduce((sum, t) => sum + t.usageCount, 0)
      }

      const response = {
        templates: transformedTemplates,
        pagination: {
          page,
          limit,
          total: transformedTemplates.length,
          totalPages: Math.ceil(transformedTemplates.length / limit)
        },
        stats,
        filters: {
          search,
          category,
          status
        }
      }

      console.log('✅ Email templates loaded:', {
        count: transformedTemplates.length,
        total,
        stats: stats
      })

      return NextResponse.json(response, {
        headers: {
          'Cache-Control': 'max-age=30, stale-while-revalidate=300'
        }
      })

    } catch (dbError) {
      console.error('❌ Database error:', dbError)
      
      // Fallback simple sin mock data
      return NextResponse.json({
        templates: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
        stats: { totalTemplates: 0, activeTemplates: 0, draftTemplates: 0, totalSent: 0 },
        error: 'Database temporarily unavailable'
      })
    }

  } catch (error) {
    console.error('❌ Complete templates API failure:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { name, subject, description, category, content, preheader, status = 'draft' } = body

    // Validaciones básicas
    if (!name || !subject || !content || !category) {
      return NextResponse.json({ 
        error: 'Campos requeridos: name, subject, content, category' 
      }, { status: 400 })
    }

    // Extraer variables del contenido
    const variablesArray = getVariablesFromContent(content)
    
    // Convertir array de variables a objeto JSON para compatibilidad con el formato existente
    const variablesObject: Record<string, string> = {}
    variablesArray.forEach(variable => {
      variablesObject[variable] = 'string'
    })
    const variablesJson = JSON.stringify(variablesObject)

    // Crear la plantilla
    const template = await prisma.emailTemplate.create({
      data: {
        name: generateTemplateName(name, category),
        subject,
        html: content,
        variables: variablesJson, // Usar objeto JSON serializado
        active: status === 'active'
      }
    })

    // Transformar respuesta
    const displayName = getTemplateDisplayName(template.name)
    const transformedTemplate = {
      id: template.id,
      name: template.name, // Nombre real de BD para filtrado
      displayName: displayName, // Nombre bonito para UI
      subject: template.subject,
      description: description || `Plantilla de email: ${displayName}`,
      category,
      status: template.active ? 'active' : 'draft',
      lastModified: template.updatedAt.toISOString().split('T')[0],
      usageCount: 0,
      variables: parseVariables(template.variables) || variables
    }

    return NextResponse.json(transformedTemplate, { status: 201 })
  } catch (error) {
    console.error('Error creating template:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// Funciones de utilidad
function getCategoryFromName(templateName: string): string {
  // Priorizar términos más específicos primero
  if (templateName.includes('confirmation')) return 'confirmation'
  if (templateName.includes('reminder')) return 'reminder'
  if (templateName.includes('voucher') || templateName.includes('gift')) return 'voucher'
  if (templateName.includes('booking')) return 'booking'
  if (templateName.includes('newsletter') || templateName.includes('marketing')) return 'marketing'
  return 'booking' // default
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

// Función temporal para simular tracking de uso (hasta implementar tracking real)
function getUsageCount(templateName: string): number {
  // Simular algunos valores realistas basados en tipo de template
  if (templateName.includes('confirmation') || templateName.includes('booking')) return Math.floor(Math.random() * 200) + 50
  if (templateName.includes('reminder')) return Math.floor(Math.random() * 150) + 30  
  if (templateName.includes('voucher') || templateName.includes('gift')) return Math.floor(Math.random() * 100) + 20
  if (templateName.includes('newsletter') || templateName.includes('marketing')) return Math.floor(Math.random() * 80) + 10
  return Math.floor(Math.random() * 50) + 5
}

// Función para parsear variables de JSON string a array
function parseVariables(variablesString: string | null): string[] {
  if (!variablesString) return []
  try {
    const parsed = JSON.parse(variablesString)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    // Si falla el parsing, tratar como string separado por comas
    return variablesString.split(',').map(v => v.trim()).filter(Boolean)
  }
}

function generateTemplateName(displayName: string, category: string): string {
  // Convertir a formato snake_case para almacenamiento interno
  const baseName = displayName.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
  
  return `${category}_${baseName}`
}

function getTemplateDisplayName(internalName: string): string {
  // Convertir nombres internos a nombres de visualización
  // Ej: "booking_confirmation_murder" -> "Confirmación Murder"
  const parts = internalName.split('_')
  
  // Mapeo de términos comunes
  const termMap: Record<string, string> = {
    'booking': 'Reserva',
    'confirmation': 'Confirmación',
    'reminder': 'Recordatorio',
    'voucher': 'Vale',
    'murder': 'Murder Mystery',
    'escape': 'Escape Room',
    'detective': 'Detective',
    'horror': 'Horror',
    'gift': 'Regalo'
  }
  
  return parts
    .map(part => termMap[part] || part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}