import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET /api/admin/events/[id]/form-fields
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    
    const fields = await db.eventFormField.findMany({
      where: {
        eventId: id,
        active: true,
      },
      orderBy: {
        order: 'asc',
      },
    })

    // Parse options from JSON string to array
    const parsedFields = fields.map(field => ({
      ...field,
      options: field.options ? JSON.parse(field.options) : null,
    }))

    return NextResponse.json({
      fields: parsedFields,
    })
  } catch (error) {
    console.error('Error fetching form fields:', error)
    return NextResponse.json(
      { error: 'Error al obtener los campos del formulario' },
      { status: 500 }
    )
  }
}

// POST /api/admin/events/[id]/form-fields
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: eventId } = await params
    const { fields } = await request.json()

    // Verificar que el evento existe
    const event = await db.event.findUnique({
      where: { id: eventId },
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      )
    }

    // Eliminar campos existentes
    await db.eventFormField.deleteMany({
      where: { eventId },
    })

    // Crear nuevos campos
    if (fields && fields.length > 0) {
      const fieldsToCreate = fields.map((field: any, index: number) => ({
        eventId,
        label: field.label,
        fieldName: field.fieldName,
        fieldType: field.fieldType,
        placeholder: field.placeholder || null,
        required: field.required || false,
        options: field.options ? JSON.stringify(field.options) : null,
        minLength: field.minLength || null,
        maxLength: field.maxLength || null,
        minValue: field.minValue || null,
        maxValue: field.maxValue || null,
        pattern: field.pattern || null,
        order: index,
        active: field.active !== false,
      }))

      await db.eventFormField.createMany({
        data: fieldsToCreate,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Campos guardados correctamente',
    })
  } catch (error) {
    console.error('Error saving form fields:', error)
    return NextResponse.json(
      { error: 'Error al guardar los campos del formulario' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/events/[id]/form-fields
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: eventId } = await params

    await db.eventFormField.deleteMany({
      where: { eventId },
    })

    return NextResponse.json({
      success: true,
      message: 'Campos eliminados correctamente',
    })
  } catch (error) {
    console.error('Error deleting form fields:', error)
    return NextResponse.json(
      { error: 'Error al eliminar los campos' },
      { status: 500 }
    )
  }
}