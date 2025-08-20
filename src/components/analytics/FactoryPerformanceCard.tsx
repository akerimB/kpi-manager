'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle } from 'lucide-react'

interface PerformanceData {
  factory: {
    id: string
    name: string
    code: string
    city: string
    isActive: boolean
  }
  performance: {
    currentScore: number
    previousScore: number
    trend: number
    trendDirection: 'up' | 'down' | 'stable'
    totalKPIs: number
  }
  timeline: Array<{
    period: string
    average: number
    kpiCount: number
  }>
  highlights: {
    critical: Array<{
      number: string
      name: string
      current: number
      target: number
      score: number
      strategicGoal?: string
    }>
    topPerforming: Array<{
      number: string
      name: string
      current: number
      target: number
      score: number
      strategicGoal?: string
    }>
    sectorFocus: Array<{
      sector: string
      weight: number
    }>
  }
  metadata: {
    period: string
    lastUpdate?: string
  }
}

interface Props {
  data: PerformanceData
  loading?: boolean
}

export default function FactoryPerformanceCard({ data, loading }: Props) {
  if (loading) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gray-300 rounded animate-pulse"></div>
            <div className="w-32 h-6 bg-gray-300 rounded animate-pulse"></div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="w-full h-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="w-full h-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-full h-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-full h-20 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getTrendIcon = () => {
    switch (data.performance.trendDirection) {
      case 'up':
        return <TrendingUp className="h-5 w-5 text-green-600" />
      case 'down':
        return <TrendingDown className="h-5 w-5 text-red-600" />
      default:
        return <Minus className="h-5 w-5 text-gray-600" />
    }
  }

  const getTrendColor = () => {
    switch (data.performance.trendDirection) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-100'
    if (score >= 70) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  return (
    <div className="space-y-6">
      {/* Ana Performans Kartı */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <span className="text-lg font-bold">🏭 {data.factory.name} Model Fabrika</span>
                {data.factory.isActive ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                )}
              </CardTitle>
              <CardDescription>
                📍 {data.factory.city} • 📊 {data.performance.totalKPIs} KPI İzleniyor
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Dönem: {data.metadata.period}</div>
              {data.metadata.lastUpdate && (
                <div className="text-xs text-gray-500">
                  Son Güncelleme: {new Date(data.metadata.lastUpdate).toLocaleDateString('tr-TR')}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Genel Skor */}
            <div className={`p-6 rounded-lg ${getScoreBgColor(data.performance.currentScore)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Genel Başarım</p>
                  <p className={`text-3xl font-bold ${getScoreColor(data.performance.currentScore)}`}>
                    {data.performance.currentScore}%
                  </p>
                </div>
                <div className="text-right">
                  <div className={`flex items-center space-x-1 ${getTrendColor()}`}>
                    {getTrendIcon()}
                    <span className="text-sm font-medium">
                      {Math.abs(data.performance.trend)}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Önceki dönem: {data.performance.previousScore}%
                  </p>
                </div>
              </div>
            </div>

            {/* Trend Analizi */}
            <div className="p-6 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600 mb-3">Son 6 Dönem Trendi</p>
              <div className="flex items-end space-x-1 h-20">
                {data.timeline.slice(0, 6).reverse().map((period, index) => (
                  <div key={period.period} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
                      style={{ height: `${Math.max(4, period.average)}%` }}
                      title={`${period.period}: ${period.average}%`}
                    ></div>
                    <span className="text-xs text-gray-500 mt-1">
                      {period.period.split('-')[1]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sektör Odağı */}
            <div className="p-6 bg-purple-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600 mb-3">Sektör Odağı</p>
              <div className="space-y-2">
                {data.highlights.sectorFocus.slice(0, 3).map((sector, index) => (
                  <div key={`sector-${sector.sector}-${index}`} className="flex items-center justify-between">
                    <span className="text-xs text-gray-700 truncate">
                      {sector.sector}
                    </span>
                    <span className="text-xs font-medium text-purple-600">
                      {Math.round(sector.weight * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kritik ve Başarılı KPI'lar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kritik KPI'lar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>Dikkat Gereken KPI'lar</span>
            </CardTitle>
            <CardDescription>Hedefin altında performans gösteren KPI'lar</CardDescription>
          </CardHeader>
          <CardContent>
            {data.highlights.critical.length > 0 ? (
              <div className="space-y-3">
                {data.highlights.critical.slice(0, 5).map((kpi, index) => (
                  <div key={`critical-${kpi.number}-${index}`} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        KPI {kpi.number}: {kpi.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {kpi.strategicGoal}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-600">{kpi.score}%</p>
                      <p className="text-xs text-gray-500">
                        {kpi.current}/{kpi.target}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p>Tüm KPI'lar hedeflerin üzerinde!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Başarılı KPI'lar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span>Öne Çıkan Başarılar</span>
            </CardTitle>
            <CardDescription>Hedefi aşan yüksek performanslı KPI'lar</CardDescription>
          </CardHeader>
          <CardContent>
            {data.highlights.topPerforming.length > 0 ? (
              <div className="space-y-3">
                {data.highlights.topPerforming.slice(0, 5).map((kpi, index) => (
                  <div key={`top-performing-${kpi.number}-${index}`} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        KPI {kpi.number}: {kpi.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {kpi.strategicGoal}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">{kpi.score}%</p>
                      <p className="text-xs text-gray-500">
                        {kpi.current}/{kpi.target}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="h-12 w-12 mx-auto mb-2 text-blue-500" />
                <p>Henüz hedefi aşan KPI yok</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
