import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// List: /api/actions/steps?actionId=...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const actionId = searchParams.get('actionId') || undefined
    const period = searchParams.get('period') || undefined
    const where: any = actionId ? { actionId } : {}
    if (period) where.period = period
    const steps = await prisma.actionStep.findMany({
      where,
      orderBy: { createdAt: 'asc' }
    })
    return NextResponse.json(steps)
  } catch (error) {
    console.error('Action steps fetch error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

// Create
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { actionId, title, description, dueDate, status, period, plannedCost, actualCost, currency, capexOpex } = body
    if (!actionId || !title) return NextResponse.json({ error: 'actionId ve title gereklidir' }, { status: 400 })
    const step = await prisma.actionStep.create({
      data: {
        actionId,
        title,
        description: description || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: status || 'PENDING',
        period: period || null,
        plannedCost: typeof plannedCost === 'number' ? plannedCost : 0,
        actualCost: typeof actualCost === 'number' ? actualCost : 0,
        currency: currency || 'TRY',
        capexOpex: capexOpex || 'OPEX'
      }
    })
    return NextResponse.json(step)
  } catch (error) {
    console.error('Action step create error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

// Update
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...rest } = body
    if (!id) return NextResponse.json({ error: 'id gereklidir' }, { status: 400 })
    const step = await prisma.actionStep.update({
      where: { id },
      data: {
        ...(rest.title !== undefined ? { title: rest.title } : {}),
        ...(rest.description !== undefined ? { description: rest.description } : {}),
        ...(rest.dueDate !== undefined ? { dueDate: rest.dueDate ? new Date(rest.dueDate) : null } : {}),
        ...(rest.status !== undefined ? { status: rest.status } : {}),
        ...(rest.period !== undefined ? { period: rest.period } : {}),
        ...(rest.plannedCost !== undefined ? { plannedCost: Number(rest.plannedCost) } : {}),
        ...(rest.actualCost !== undefined ? { actualCost: Number(rest.actualCost) } : {}),
        ...(rest.currency !== undefined ? { currency: rest.currency } : {}),
        ...(rest.capexOpex !== undefined ? { capexOpex: rest.capexOpex } : {})
      }
    })
    return NextResponse.json(step)
  } catch (error) {
    console.error('Action step update error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

// Delete
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id gereklidir' }, { status: 400 })
    await prisma.actionStep.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Action step delete error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}


