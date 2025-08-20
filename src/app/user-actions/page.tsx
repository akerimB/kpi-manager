'use client'

import { useEffect, useMemo, useState } from 'react'
import { getCurrentUser } from '@/lib/user-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import NotificationPanel from '@/components/notifications/NotificationPanel'

interface UserAction {
  id: string
  title: string
  description?: string
  priority: string
  status: string
  saCode?: string
  shCode?: string
  startDate?: string
  endDate?: string
  createdAt: string
}

interface UserActionEvent {
  id: string
  userActionId: string
  title: string
  description?: string
  start: string
  end?: string
  location?: string
}

interface UserActionNote {
  id: string
  userActionId: string
  content: string
  createdAt: string
}

export default function UserActionsPage() {
  const [user, setUser] = useState<any>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    setUser(getCurrentUser())
  }, [])

  if (!isClient) return null
  if (!user) return <div className="p-6">Giriş gerekli</div>

  // Redirect based on user role
  if (user.userRole === 'MODEL_FACTORY') {
    // For Model Factory users, redirect to specialized user actions
    if (typeof window !== 'undefined') {
      window.location.href = '/user-actions/model-factory'
      return null
    }
  }

  // For other users, show the general user actions
  const [actions, setActions] = useState<UserAction[]>([])
  const [eventsByAction, setEventsByAction] = useState<Record<string, UserActionEvent[]>>({})
  const [notesByAction, setNotesByAction] = useState<Record<string, UserActionNote[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setIsClient(true)
    setUser(getCurrentUser())
  }, [])

  const userId = useMemo(() => (user?.user?.id as string | undefined), [user])

  useEffect(() => {
    const run = async () => {
      if (!userId) return
      setLoading(true)
      const res = await fetch(`/api/user-actions?userId=${userId}`)
      const json = await res.json()
      if (Array.isArray(json)) setActions(json)
      setLoading(false)
    }
    run()
  }, [userId])

  // Fetch events and notes for each action
  useEffect(() => {
    const fetchForAction = async (actionId: string) => {
      try {
        const [evRes, noteRes] = await Promise.all([
          fetch(`/api/user-actions/events?userActionId=${actionId}`),
          fetch(`/api/user-actions/notes?userActionId=${actionId}`)
        ])
        if (evRes.ok) {
          const evJson = await evRes.json()
          setEventsByAction(prev => ({ ...prev, [actionId]: evJson || [] }))
        }
        if (noteRes.ok) {
          const noteJson = await noteRes.json()
          setNotesByAction(prev => ({ ...prev, [actionId]: noteJson || [] }))
        }
      } catch (e) {
        // ignore
      }
    }
    actions.forEach(a => {
      if (!eventsByAction[a.id]) fetchForAction(a.id)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions])

  const createQuickAction = async () => {
    if (!userId) return
    const title = prompt('Eylem başlığı')
    if (!title) return
    const res = await fetch('/api/user-actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, title, description: '', priority: 'MEDIUM' })
    })
    const json = await res.json()
    if (res.ok) setActions([json, ...actions])
  }

  const addEvent = async (actionId: string) => {
    const title = prompt('Etkinlik başlığı')
    if (!title) return
    const start = prompt('Başlangıç (YYYY-MM-DD)')
    if (!start) return
    const res = await fetch('/api/user-actions/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userActionId: actionId, title, start })
    })
    const json = await res.json()
    if (res.ok) {
      setEventsByAction({ ...eventsByAction, [actionId]: [ ...(eventsByAction[actionId]||[]), json ] })
    }
  }

  const addNote = async (actionId: string) => {
    const content = prompt('Not')
    if (!content) return
    const res = await fetch('/api/user-actions/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userActionId: actionId, content })
    })
    if (res.ok) {
      const created = await res.json()
      setNotesByAction({ ...notesByAction, [actionId]: [ created, ...(notesByAction[actionId]||[]) ] })
    } else {
      alert('Not eklenemedi')
    }
  }

  const linkToPlan = async (actionId: string) => {
    const code = prompt('Plan eylem kodu (örn: E1.1.3)')
    if (!code) return
    const res = await fetch('/api/user-actions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: actionId, actionCode: code })
    })
    if (res.ok) {
      alert('Plan eylemine bağlandı')
    } else {
      const j = await res.json()
      alert(j.error || 'Bağlama başarısız')
    }
  }

  const upcomingEvents = useMemo(() => {
    const all: Array<UserActionEvent & { actionTitle?: string }> = []
    actions.forEach(a => {
      (eventsByAction[a.id] || []).forEach(ev => all.push({ ...ev, actionTitle: a.title }))
    })
    const now = new Date()
    return all
      .filter(e => {
        const dt = new Date(e.start)
        return isFinite(dt.getTime()) && dt >= new Date(now.getTime() - 24*60*60*1000)
      })
      .sort((a,b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 10)
  }, [actions, eventsByAction])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Kişisel Eylemler</h1>
        <Button onClick={createQuickAction}>Hızlı eylem oluştur</Button>
      </div>
      {loading && <div>Yükleniyor…</div>}
      {!loading && actions.length === 0 && (
        <div className="text-gray-600">Henüz kişisel eylem yok</div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {actions.map(a => (
          <Card key={a.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{a.title}</span>
                <span className="text-xs text-gray-500">{a.priority}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-700 mb-2">{a.description || 'Açıklama yok'}</div>
              <div className="text-xs text-gray-500 mb-2">Durum: {a.status}</div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => addEvent(a.id)}>Takvime etkinlik ekle</Button>
                <Button size="sm" variant="secondary" onClick={() => addNote(a.id)}>Not ekle</Button>
                <Button size="sm" variant="outline" onClick={() => linkToPlan(a.id)}>Plan eylemine bağla</Button>
              </div>
              {eventsByAction[a.id]?.length ? (
                <div className="mt-3 text-sm">
                  <div className="font-medium">Etkinlikler</div>
                  <ul className="list-disc ml-5">
                    {eventsByAction[a.id].map(e => (
                      <li key={e.id}>{e.title} • {e.start}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {notesByAction[a.id]?.length ? (
                <div className="mt-3 text-sm">
                  <div className="font-medium">Notlar</div>
                  <ul className="list-disc ml-5">
                    {notesByAction[a.id].map(n => (
                      <li key={n.id}>{n.content} • {new Date(n.createdAt).toLocaleString('tr-TR')}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Notifications (optional) */}
      {user?.factoryId && (
        <div className="mt-6">
          <NotificationPanel factoryId={user.factoryId} autoRefresh={true} limit={5} />
        </div>
      )}

      {/* Simple upcoming events */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Yaklaşan Etkinlikler</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <div className="text-sm text-gray-600">Henüz etkinlik yok. Eylem kartlarındaki "+ Takvime etkinlik ekle" ile etkinlik oluşturabilirsiniz.</div>
            ) : (
              <ul className="text-sm space-y-2">
                {upcomingEvents.map(ev => (
                  <li key={ev.id} className="flex items-center justify-between">
                    <span className="text-gray-700">{ev.actionTitle} • {ev.title}</span>
                    <span className="text-gray-500">{new Date(ev.start).toLocaleString('tr-TR')}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


