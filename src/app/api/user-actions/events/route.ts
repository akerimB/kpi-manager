import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ensureUserActionsTables } from '@/lib/ensure-user-actions-tables'

export async function GET(request: NextRequest) {
  try {
    await ensureUserActionsTables()
    const { searchParams } = request.nextUrl
    const userActionId = searchParams.get('userActionId')
    if (!userActionId) return NextResponse.json({ error: 'userActionId gereklidir' }, { status: 400 })
    const events = await prisma.$queryRaw<any[]>`
      SELECT id, userActionId, title, description, start, end, location, createdAt
      FROM user_action_events WHERE userActionId = ${userActionId} ORDER BY start ASC
    `
    return NextResponse.json(events)
  } catch (error) {
    console.error('User action events fetch error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureUserActionsTables()
    const body = await request.json()
    const { userActionId, title, description, start, end, location } = body
    if (!userActionId || !title || !start) return NextResponse.json({ error: 'userActionId, title ve start gereklidir' }, { status: 400 })
    const id = (globalThis.crypto && 'randomUUID' in globalThis.crypto
      ? (globalThis.crypto as any).randomUUID()
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`)
    await prisma.$executeRaw`
      INSERT INTO user_action_events (id, userActionId, title, description, start, end, location, createdAt)
      VALUES (${id}, ${userActionId}, ${title}, ${description || null}, ${new Date(start).toISOString()}, ${end ? new Date(end).toISOString() : null}, ${location || null}, ${new Date().toISOString()})
    `
    const rows = await prisma.$queryRaw<any[]>`SELECT * FROM user_action_events WHERE id = ${id}`
    return NextResponse.json(rows[0])
  } catch (error) {
    console.error('User action events create error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}


