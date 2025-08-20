'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Row {
  id: string
  number: number
  description: string
  unit?: string | null
  themes?: string
  strategicGoal?: string
  strategicTarget?: string
  achievement: number
  trend: number
  byPeriod: { period: string; value: number }[]
}

interface Props {
  data: { rows: Row[]; periods: string[] } | null
  loading?: boolean
}

export default function KPIPerformanceTable({ data, loading }: Props) {
  const columns = useMemo(() => {
    const base = [
      { key: 'number', label: 'KPI No' },
      { key: 'description', label: 'Açıklama' },
      { key: 'strategicGoal', label: 'Stratejik Amaç' },
      { key: 'strategicTarget', label: 'Stratejik Hedef' },
      { key: 'themes', label: 'Tema' },
      { key: 'achievement', label: 'Başarı (%)' },
      { key: 'trend', label: 'Değişim (puan)' }
    ] as const
    return base
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Detaylı Performans Analizi</CardTitle>
          <CardDescription>KPI bazında veriler yükleniyor…</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-24 bg-gray-50 rounded animate-pulse" />
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Detaylı Performans Analizi</CardTitle>
          <CardDescription>KPI bazında veriler</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-gray-500">Veri bulunamadı</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detaylı Performans Analizi</CardTitle>
        <CardDescription>KPI bazında performans, {data.periods[0]} → {data.periods[data.periods.length-1]}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {columns.map(c => (
                  <th key={c.key as string} className="text-left py-2 px-3 font-medium text-gray-900">{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map(r => (
                <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 px-3 font-medium">{r.number}</td>
                  <td className="py-2 px-3">{r.description}</td>
                  <td className="py-2 px-3">{r.strategicGoal || '-'}</td>
                  <td className="py-2 px-3">{r.strategicTarget || '-'}</td>
                  <td className="py-2 px-3">{r.themes || '-'}</td>
                  <td className="py-2 px-3 font-semibold">{r.achievement.toFixed(1)}%</td>
                  <td className={`py-2 px-3 ${r.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>{r.trend >= 0 ? '+' : ''}{r.trend.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}


