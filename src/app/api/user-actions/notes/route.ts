import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ensureUserActionsTables } from '@/lib/ensure-user-actions-tables'

export async function GET(request: NextRequest) {
  try {
    await ensureUserActionsTables()
    const { searchParams } = request.nextUrl
    const userActionId = searchParams.get('userActionId')
    if (!userActionId) return NextResponse.json({ error: 'userActionId gereklidir' }, { status: 400 })
    const notes = await prisma.$queryRaw<any[]>`
      SELECT id, userActionId, content, createdAt
      FROM user_action_notes WHERE userActionId = ${userActionId} ORDER BY createdAt DESC
    `
    return NextResponse.json(notes)
  } catch (error) {
    console.error('User action notes fetch error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureUserActionsTables()
    const body = await request.json()
    const { userActionId, content } = body
    if (!userActionId || !content) return NextResponse.json({ error: 'userActionId ve content gereklidir' }, { status: 400 })
    const id = (globalThis.crypto && 'randomUUID' in globalThis.crypto
      ? (globalThis.crypto as any).randomUUID()
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`)
    await prisma.$executeRaw`
      INSERT INTO user_action_notes (id, userActionId, content, createdAt)
      VALUES (${id}, ${userActionId}, ${content}, ${new Date().toISOString()})
    `
    const rows = await prisma.$queryRaw<any[]>`SELECT * FROM user_action_notes WHERE id = ${id}`
    return NextResponse.json(rows[0])
  } catch (error) {
    console.error('User action notes create error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}


