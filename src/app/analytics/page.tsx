'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getCurrentUser, getUserApiParams } from '@/lib/user-context'

export default function AnalyticsOverview() {
  const user = getCurrentUser()
  const apiParams = useMemo(() => user ? getUserApiParams(user) : '', [user])
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    if (!user || !apiParams) return
    fetch(`/api/analytics/overview?${apiParams}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => setData(null))
  }, [apiParams, user])

  if (!user || !data) {
    return <div className="p-6 text-gray-600">Yükleniyor...</div>
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Genel Başarı</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.overall.avgSuccess}%</div>
            <CardDescription>Trend: {data.overall.trend >= 0 ? '+' : ''}{data.overall.trend}</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">KPI</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{data.overall.kpiCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Eylem</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{data.overall.actionCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Fabrika</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{data.overall.factoryCount}</div></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tema Başarıları</CardTitle>
            <CardDescription>LEAN/DIGITAL/GREEN/RESILIENCE</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.themes.map((t: any) => (
                <div key={t.name}>
                  <div className="flex justify-between text-sm"><span>{t.name}</span><span>{t.avg}%</span></div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${t.avg}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Riskli KPI'lar</CardTitle>
            <CardDescription>En düşük 10 başarı</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.topRisks.map((r: any) => (
                <div key={r.id} className="flex justify-between text-sm border-b pb-1">
                  <span>#{r.number} {r.description}</span>
                  <span className={r.success < 40 ? 'text-red-600' : r.success < 60 ? 'text-yellow-600' : 'text-gray-700'}>{r.success}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Zaman Çizgisi</CardTitle>
          <CardDescription>Son dönem ortalama</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {data.timeline.map((p: any) => (
              <div key={p.period} className="p-3 bg-gray-50 rounded border flex items-center justify-between">
                <span>{p.period}</span>
                <span className="font-medium">{p.avgSuccess}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



