'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export type CalendarEvent = {
  id: string
  type: 'user_action_event' | 'action_step' | 'phase'
  title: string
  start: string
  end?: string | null
  url?: string | null
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1)
}

function formatMonthLabel(date: Date): string {
  return date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function getEventColor(type: CalendarEvent['type']): string {
  switch (type) {
    case 'user_action_event': return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'action_step': return 'bg-purple-100 text-purple-700 border-purple-200'
    case 'phase': return 'bg-orange-100 text-orange-700 border-orange-200'
    default: return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

export default function CalendarView({ events, initialMonth }: { events: CalendarEvent[]; initialMonth?: Date }) {
  const [month, setMonth] = useState<Date>(initialMonth ? new Date(initialMonth) : startOfMonth(new Date()))
  const today = new Date()

  const { weeks, eventMap } = useMemo(() => {
    const first = startOfMonth(month)
    const last = endOfMonth(month)
    const firstWeekday = new Date(first.getFullYear(), first.getMonth(), 1).getDay() // 0=Sun
    // Locale Monday-first grid: compute offset (Mon=1)
    const offset = (firstWeekday + 6) % 7 // shift to Mon=0
    const days: Date[] = []
    // 6 weeks grid
    const gridStart = new Date(first)
    gridStart.setDate(first.getDate() - offset)
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart)
      d.setDate(gridStart.getDate() + i)
      days.push(d)
    }
    const weeks: Date[][] = []
    for (let w = 0; w < 6; w++) weeks.push(days.slice(w * 7, (w + 1) * 7))
    const eventMap: Record<string, CalendarEvent[]> = {}
    events.forEach(ev => {
      const start = new Date(ev.start)
      const key = start.toISOString().slice(0, 10)
      if (!eventMap[key]) eventMap[key] = []
      eventMap[key].push(ev)
    })
    return { weeks, eventMap }
  }, [month, events])

  return (
    <div className="border rounded-lg bg-white">
      <div className="flex items-center justify-between p-3 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <button
            className="px-2 py-1 rounded hover:bg-gray-200"
            onClick={() => setMonth(prev => addMonths(prev, -1))}
            aria-label="Önceki Ay"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="text-lg font-semibold">{formatMonthLabel(month)}</div>
          <button
            className="px-2 py-1 rounded hover:bg-gray-200"
            onClick={() => setMonth(prev => addMonths(prev, 1))}
            aria-label="Sonraki Ay"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <button
          className="text-sm px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
          onClick={() => setMonth(startOfMonth(new Date()))}
        >
          Bugün
        </button>
      </div>
      <div className="grid grid-cols-7 gap-px bg-gray-200 text-xs font-medium text-gray-600">
        {['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'].map(d => (
          <div key={d} className="bg-gray-50 p-2 text-center">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {weeks.flat().map((day, idx) => {
          const inMonth = day.getMonth() === month.getMonth()
          const isToday = sameDay(day, today)
          const key = day.toISOString().slice(0, 10)
          const dayEvents = (eventMap[key] || []).slice(0, 3)
          const moreCount = (eventMap[key] || []).length - dayEvents.length
          return (
            <div key={`${key}-${idx}`} className={`bg-white min-h-[90px] p-2 ${inMonth ? '' : 'bg-gray-50'}`}>
              <div className={`text-xs mb-1 ${isToday ? 'text-white bg-blue-600 rounded px-2 py-0.5 inline-block' : 'text-gray-700'}`}>
                {day.getDate()}
              </div>
              <div className="space-y-1">
                {dayEvents.map(ev => (
                  <a key={ev.id} href={ev.url || '#'} className={`block border rounded px-1 py-0.5 text-[11px] truncate ${getEventColor(ev.type)}`} title={ev.title}>
                    {ev.title}
                  </a>
                ))}
                {moreCount > 0 && (
                  <div className="text-[11px] text-gray-500">+{moreCount} daha</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}


