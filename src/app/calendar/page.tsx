'use client'

import { useEffect, useMemo, useState } from 'react'
import { getCurrentUser } from '@/lib/user-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import CalendarView from '@/components/calendar/CalendarView'

interface EventItem {
  id: string
  userActionId: string
  title: string
  start: string
  end?: string
}

export default function CalendarPage() {
  const [user, setUser] = useState<any>(null)
  const [isClient, setIsClient] = useState(false)
  const [events, setEvents] = useState<EventItem[]>([])

  useEffect(() => {
    setIsClient(true)
    setUser(getCurrentUser())
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/calendar/events')
        if (!res.ok) return
        const json = await res.json()
        setEvents(json.events || [])
      } catch (e) {
        // noop
      }
    }
    load()
  }, [])

  const upcoming = useMemo(() => {
    const now = new Date()
    return events
      .filter(e => new Date(e.start).getTime() >= now.getTime() - 24*60*60*1000)
      .sort((a,b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 50)
  }, [events])

  if (!isClient) return null

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Takvim</h1>
      <div className="mb-6">
        <CalendarView events={events as any} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Yaklaşan Etkinlikler</CardTitle>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <div className="text-sm text-gray-600">Yaklaşan etkinlik bulunamadı.</div>
          ) : (
            <ul className="space-y-2 text-sm">
              {upcoming.map(e => (
                <li key={e.id} className="flex items-center justify-between">
                  <span>{e.title}</span>
                  <span className="text-gray-500">{new Date(e.start).toLocaleString('tr-TR')}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


