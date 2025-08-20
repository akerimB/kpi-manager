'use client'

import { useEffect, useMemo, useState } from 'react'
import { getCurrentUser } from '@/lib/user-context'
import NotificationPanel from '@/components/notifications/NotificationPanel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function NotificationsPage() {
  const [user, setUser] = useState<any>(null)
  const [isClient, setIsClient] = useState(false)
  const [onlyUnread, setOnlyUnread] = useState(false)
  const [limit, setLimit] = useState(20)

  useEffect(() => {
    setIsClient(true)
    setUser(getCurrentUser())
  }, [])

  const factoryId = useMemo(() => user?.factoryId as string | undefined, [user])



  const generateNotifications = async () => {
    try {
      const factoriesRes = await fetch('/api/factories')
      const factoriesData = await factoriesRes.json()
      const factories = factoriesData.factories || []
      
      // Get current period (latest quarter)
      const currentYear = new Date().getFullYear()
      const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3)
      const periods = [
        `${currentYear}-Q${currentQuarter}`,
        `${currentYear}-Q${Math.max(1, currentQuarter - 1)}`,
        '2024-Q4',
        '2024-Q3'
      ]
      
      for (const factory of factories) {
        for (const period of periods) {
          const response = await fetch('/api/notifications/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ factoryId: factory.id, period })
          })
          
          if (response.ok) {
            const result = await response.json()
            if (result.notifications?.length > 0) {
              break // Found data for this factory, move to next factory
            }
          }
        }
      }
      
      // Refresh the notifications display
      window.location.reload()
    } catch (error) {
      console.error('Bildirim oluşturma hatası:', error)
    }
  }

  const exportCSV = async () => {
    const res = await fetch(`/api/notifications?limit=${limit}${onlyUnread ? '&unread=true' : ''}`)
    const j = await res.json()
    const rows = (j.notifications || []).map((n: any) => ({
      id: n.id,
      priority: n.priority,
      type: n.type,
      title: n.title,
      message: n.message,
      period: n.period,
      createdAt: n.createdAt
    }))
    const header = Object.keys(rows[0] || { id: '', title: '', createdAt: '' })
    const csv = [header.join(','), ...rows.map((r: any) => header.map(h => JSON.stringify(r[h] ?? '')).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `notifications_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!isClient) return null
  if (!user) return <div className="p-6">Giriş gerekli</div>
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Bildirimler</h1>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={generateNotifications}>
            Bildirimler Oluştur
          </Button>
          <label className="text-sm flex items-center gap-1">
            <input type="checkbox" checked={onlyUnread} onChange={e => setOnlyUnread(e.target.checked)} /> Sadece okunmamış
          </label>
          <select className="text-sm border rounded px-2 py-1" value={limit} onChange={e => setLimit(Number(e.target.value))}>
            {[10,20,50,100].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <Button size="sm" onClick={exportCSV}>CSV Dışa Aktar</Button>
        </div>
      </div>

      <NotificationPanel key={`${factoryId || 'ALL'}-${onlyUnread}-${limit}`} factoryId={factoryId || ''} autoRefresh={true} limit={limit} />
    </div>
  )
}


