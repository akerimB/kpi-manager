import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ensureUserActionsTables } from '@/lib/ensure-user-actions-tables'

export async function GET(request: NextRequest) {
  try {
    await ensureUserActionsTables()
    const { searchParams } = request.nextUrl
    const userId = searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'userId gereklidir' }, { status: 400 })
    const actions = await prisma.$queryRaw<any[]>`
      SELECT id, userId, title, description, saCode, shCode, kpiIds, priority, status, linkedActionId, startDate, endDate, createdAt, updatedAt
      FROM user_actions
      WHERE userId = ${userId}
      ORDER BY createdAt DESC
    `
    // Parse kpiIds JSON
    const parsed = actions.map(a => ({ ...a, kpiIds: a.kpiIds ? JSON.parse(a.kpiIds) : null }))
    return NextResponse.json(parsed)
  } catch (error) {
    console.error('User actions fetch error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureUserActionsTables()
    const body = await request.json()
    const { userId, title, description, saCode, shCode, kpiIds, priority, status, startDate, endDate } = body
    if (!userId || !title) return NextResponse.json({ error: 'userId ve title gereklidir' }, { status: 400 })
    const id = (globalThis.crypto && 'randomUUID' in globalThis.crypto ? (globalThis.crypto as any).randomUUID() : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`)
    const now = new Date().toISOString()
    const kpiJson = Array.isArray(kpiIds) ? JSON.stringify(kpiIds) : null
    await prisma.$executeRaw`
      INSERT INTO user_actions (
        id, userId, title, description, saCode, shCode, kpiIds, priority, status, startDate, endDate, createdAt, updatedAt
      ) VALUES (
        ${id}, ${userId}, ${title}, ${description || null}, ${saCode || null}, ${shCode || null}, ${kpiJson}, ${priority || 'MEDIUM'}, ${status || 'PLANNED'}, ${startDate ? new Date(startDate).toISOString() : null}, ${endDate ? new Date(endDate).toISOString() : null}, ${now}, ${now}
      )
    `
    const rows = await prisma.$queryRaw<any[]>`SELECT * FROM user_actions WHERE id = ${id}`
    const created = rows[0]
    if (created && created.kpiIds) created.kpiIds = JSON.parse(created.kpiIds)
    return NextResponse.json(created)
  } catch (error) {
    console.error('User action create error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await ensureUserActionsTables()
    const body = await request.json()
    const { id, ...rest } = body
    if (!id) return NextResponse.json({ error: 'id gereklidir' }, { status: 400 })
    // Optional: link by action code
    let linkedActionIdToSet: string | undefined
    if (rest.actionCode) {
      const action = await prisma.action.findUnique({ where: { code: rest.actionCode } })
      if (!action) return NextResponse.json({ error: 'Eylem kodu bulunamadı' }, { status: 400 })
      linkedActionIdToSet = action.id
    }
    const now = new Date().toISOString()
    const sets: string[] = []
    const params: any[] = []
    const setField = (field: string, value: any) => { sets.push(`${field} = ?`); params.push(value) }
    if (rest.title !== undefined) setField('title', rest.title)
    if (rest.description !== undefined) setField('description', rest.description)
    if (rest.priority !== undefined) setField('priority', rest.priority)
    if (rest.status !== undefined) setField('status', rest.status)
    if (rest.saCode !== undefined) setField('saCode', rest.saCode)
    if (rest.shCode !== undefined) setField('shCode', rest.shCode)
    if (rest.kpiIds !== undefined) setField('kpiIds', Array.isArray(rest.kpiIds) ? JSON.stringify(rest.kpiIds) : null)
    if (rest.startDate !== undefined) setField('startDate', rest.startDate ? new Date(rest.startDate).toISOString() : null)
    if (rest.endDate !== undefined) setField('endDate', rest.endDate ? new Date(rest.endDate).toISOString() : null)
    if (rest.linkedActionId !== undefined) setField('linkedActionId', rest.linkedActionId || null)
    if (linkedActionIdToSet !== undefined) setField('linkedActionId', linkedActionIdToSet)
    setField('updatedAt', now)
    if (!sets.length) return NextResponse.json({ error: 'Güncellenecek alan yok' }, { status: 400 })
    const query = `UPDATE user_actions SET ${sets.join(', ')} WHERE id = ?`
    params.push(id)
    // @ts-ignore
    await prisma.$executeRawUnsafe(query, ...params)
    const rows = await prisma.$queryRaw<any[]>`SELECT * FROM user_actions WHERE id = ${id}`
    const updated = rows[0]
    if (updated && updated.kpiIds) updated.kpiIds = JSON.parse(updated.kpiIds)
    return NextResponse.json(updated)
  } catch (error) {
    console.error('User action update error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await ensureUserActionsTables()
    const { searchParams } = request.nextUrl
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id gereklidir' }, { status: 400 })
    await prisma.$executeRaw`DELETE FROM user_actions WHERE id = ${id}`
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('User action delete error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}


