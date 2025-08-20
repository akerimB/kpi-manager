import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ensureUserActionsTables } from '@/lib/ensure-user-actions-tables'

type CalendarEvent = {
  id: string
  type: 'user_action_event' | 'action_step' | 'phase'
  title: string
  start: string
  end?: string | null
  url?: string | null
  meta?: Record<string, any>
}

function parsePeriodToDate(period?: string | null): string | null {
  if (!period) return null
  const m = String(period).match(/^(\d{4})-Q([1-4])$/)
  if (!m) return null
  const year = parseInt(m[1], 10)
  const q = parseInt(m[2], 10)
  const monthEnd = q * 3
  const date = new Date(year, monthEnd, 0) // last day of quarter
  return date.toISOString()
}

export async function GET(request: NextRequest) {
  try {
    await ensureUserActionsTables()
    const search = request.nextUrl.searchParams
    const start = search.get('start')
    const end = search.get('end')

    const events: CalendarEvent[] = []

    // 1) User-defined action events
    const userEvents = await prisma.$queryRaw<any[]>`
      SELECT e.id, e.userActionId, e.title, e.description, e.start, e.end, a.title as actionTitle
      FROM user_action_events e
      LEFT JOIN user_actions a ON a.id = e.userActionId
      ORDER BY e.start ASC
    `
    userEvents.forEach(e => {
      const startIso = new Date(e.start).toISOString()
      const endIso = e.end ? new Date(e.end).toISOString() : null
      if (start && new Date(startIso) < new Date(start)) return
      if (end && new Date(startIso) > new Date(end)) return
      events.push({
        id: `uae:${e.id}`,
        type: 'user_action_event',
        title: e.title || e.actionTitle || 'Etkinlik',
        start: startIso,
        end: endIso,
        url: `/user-actions`,
        meta: { userActionId: e.userActionId, actionTitle: e.actionTitle }
      })
    })

    // 2) Action steps (dueDate or period)
    const steps = await prisma.actionStep.findMany({
      select: { id: true, title: true, dueDate: true, period: true, actionId: true }
    })
    steps.forEach(s => {
      const due = s.dueDate ? new Date(s.dueDate).toISOString() : parsePeriodToDate(s.period)
      if (!due) return
      if (start && new Date(due) < new Date(start)) return
      if (end && new Date(due) > new Date(end)) return
      events.push({
        id: `step:${s.id}`,
        type: 'action_step',
        title: s.title || 'Eylem Aktivitesi',
        start: due,
        url: `/actions`,
        meta: { actionId: s.actionId }
      })
    })

    // 3) Phases (range)
    const phases = await prisma.phase.findMany({ select: { id: true, name: true, startDate: true, endDate: true } })
    phases.forEach(p => {
      const s = p.startDate ? new Date(p.startDate).toISOString() : null
      const e = p.endDate ? new Date(p.endDate).toISOString() : null
      if (!s && !e) return
      // If filtering by start/end, include if overlaps window
      if (start && e && new Date(e) < new Date(start)) return
      if (end && s && new Date(s) > new Date(end)) return
      events.push({ id: `phase:${p.id}`, type: 'phase', title: `Faz: ${p.name}`, start: s || e!, end: e, url: '/actions' })
    })

    // Sort by start
    events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())

    return NextResponse.json({ events })
  } catch (error) {
    console.error('Calendar events error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}


