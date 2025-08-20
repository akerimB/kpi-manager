'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getCurrentUser } from '@/lib/user-context'

interface Insight {
  level: 'portfolio' | 'strategic_goal' | 'factory' | 'cross_factory'
  title: string
  description: string
  priority: 'immediate' | 'high' | 'medium' | 'low'
  strategicGoal?: { code?: string; name?: string }
  factories?: Array<{ id: string; name: string }>
  kpis?: Array<{ id: string; number?: number; name?: string; achievement?: number; trend?: number }>
  actions?: Array<{ name: string; category: string; owner: string; due: string; effort: 'S'|'M'|'L'; expectedImpact: string }>
  pairings?: Array<{ donorFactory: string; receiverFactory: string; rationale: string }>
}

export default function KnowledgeInsightsPanel({ periods, factoryId }: { periods: string[]; factoryId?: string }) {
  const [data, setData] = useState<{ insights: Insight[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      const res = await fetch('/api/analytics/advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisType: 'knowledge_actions', periods, factoryIds: factoryId ? [factoryId] : [] })
      })
      const json = await res.json()
      setData({ insights: json.results || [] })
      setLoading(false)
    }
    run()
  }, [JSON.stringify(periods), factoryId])

  useEffect(() => {
    setUser(getCurrentUser())
  }, [])

  // Cleanup hook removed after one-time maintenance

  // One-time migrate last 2 plan actions to user-defined actions for current user
  useEffect(() => {
    const migrate = async () => {
      try {
        if (!user?.user?.id) return
        if (typeof window === 'undefined') return
        const flagKey = `ua_migrated_${user.user.id}`
        if (localStorage.getItem(flagKey)) return
        await fetch('/api/user-actions/migrate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.user.id, count: 2 })
        })
        localStorage.setItem(flagKey, '1')
      } catch (e) {
        // ignore
      }
    }
    migrate()
  }, [user?.user?.id])

  const createAction = async (payload: { shCode?: string; saCode?: string; description: string; kpiIds?: string[]; priority?: string }) => {
    try {
      setCreating(payload.description)
      // create as user-defined action to keep separate from plan
      const res = await fetch('/api/user-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.user?.id,
          title: payload.description,
          description: '',
          shCode: payload.shCode,
          saCode: payload.saCode,
          kpiIds: payload.kpiIds || [],
          priority: payload.priority || 'MEDIUM',
          status: 'PLANNED'
        })
      })
      const json = await res.json()
      if (!res.ok) {
        console.error('Eylem oluşturma hatası:', json)
        alert(json.error || 'Eylem oluşturulamadı')
      } else {
        alert('Eylem oluşturuldu')
      }
    } finally {
      setCreating(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI İçgörüleri (Knowledge)</CardTitle>
        <CardDescription>SA/KPI bağlamında eylem planı önerileri</CardDescription>
      </CardHeader>
      <CardContent>
        {loading && <div className="text-gray-500">İçgörüler oluşturuluyor…</div>}
        {!loading && data && (
          <div className="space-y-4">
            {data.insights.map((ins, idx) => (
              <div key={idx} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-gray-900">{ins.title}</div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    ins.priority === 'immediate' ? 'bg-red-100 text-red-700' :
                    ins.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                    ins.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                  }`}>{ins.priority}</span>
                </div>
                <div className="text-sm text-gray-600 mt-1">{ins.description}</div>
                {ins.strategicGoal && (
                  <div className="text-xs text-gray-500 mt-1">SA: {ins.strategicGoal.name || ins.strategicGoal.code}</div>
                )}
                {ins.pairings && ins.pairings.length > 0 && (
                  <div className="mt-2 text-sm">
                    <div className="font-medium">Mentörlük Eşleştirmeleri</div>
                    <div className="space-y-2">
                      {ins.pairings.map((p, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div>{p.donorFactory} → {p.receiverFactory} ({p.rationale})</div>
                          <Button size="sm" onClick={() => createAction({ saCode: ins.strategicGoal?.code, description: `${ins.title}: ${p.donorFactory}→${p.receiverFactory} mentörlük planı`, priority: ins.priority === 'immediate' ? 'HIGH' : 'MEDIUM' })} disabled={!!creating}>
                            {creating === `${ins.title}: ${p.donorFactory}→${p.receiverFactory} mentörlük planı` ? 'Oluşturuluyor…' : 'Eylem oluştur'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {ins.actions && ins.actions.length > 0 && (
                  <div className="mt-2 text-sm">
                    <div className="font-medium">Önerilen Eylemler</div>
                    <div className="space-y-2">
                      {ins.actions.map((a, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div>
                            <div>{a.name} • {a.owner} • {a.due} • Etki: {a.expectedImpact}</div>
                          </div>
                          <Button size="sm" onClick={() => createAction({ saCode: ins.strategicGoal?.code, description: `${ins.title}: ${a.name}`, kpiIds: ins.kpis?.map(k=>k.id), priority: ins.priority === 'immediate' ? 'HIGH' : 'MEDIUM' })} disabled={!!creating || !user?.user?.id}>
                            {creating === `${ins.title}: ${a.name}` ? 'Oluşturuluyor…' : 'Eylem oluştur'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}


