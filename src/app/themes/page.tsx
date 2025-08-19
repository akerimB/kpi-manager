'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, PieChart, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from "lucide-react"
import { useState, useEffect, useMemo, useCallback } from "react"
import Link from "next/link"
import { getCurrentUser, getUserApiParams } from '@/lib/user-context'

interface ThemeData {
  theme: string
  name: string
  description: string
  color: string
  totalKpis: number
  avgAchievement: number
  distribution: {
    excellent: number
    good: number
    atRisk: number
    critical: number
  }
  status: 'excellent' | 'good' | 'at-risk' | 'critical'
}

interface RadarMetric {
  metric: string
  value: number
}

interface ThemeResponse {
  themes: ThemeData[]
  radarMetrics: RadarMetric[]
  summary: {
    totalKpis: number
    avgOverallAchievement: number
    bestPerformingTheme: ThemeData
    worstPerformingTheme: ThemeData
  }
}

export default function ThemeTracking() {
  const [data, setData] = useState<ThemeResponse | null>(null)
  const [loading, setLoading] = useState(true)

  // Kullanıcı bağlamını al
  const [userContext, setUserContext] = useState<any>(null)
  const [isClient, setIsClient] = useState(false)

  // Memoized values to prevent unnecessary re-renders
  const isAuthenticated = useMemo(() => !!userContext, [userContext])
  const apiParams = useMemo(() => 
    userContext ? getUserApiParams(userContext) : '', 
    [userContext]
  )

  useEffect(() => {
    setIsClient(true)
    setUserContext(getCurrentUser())
  }, [])

  // Authentication kontrolü - only after userContext is properly set
  useEffect(() => {
    if (isClient && userContext === null) {
      // Only redirect if we've checked and userContext is definitely null
      setTimeout(() => {
        const user = getCurrentUser()
        if (!user) {
          window.location.href = '/login'
        }
      }, 100)
      return
    }
  }, [isClient, userContext])

  // Memoized fetch function
  const fetchData = useCallback(async () => {
    if (!userContext || !apiParams) return

    try {
      const response = await fetch(`/api/themes?${apiParams}`)
      const themeData = await response.json()
      // API Türkçe durum döndürebilir; UI İngilizce enum bekliyor. Hızlı dönüşüm uygula.
      if (themeData && Array.isArray(themeData.themes)) {
        themeData.themes = themeData.themes.map((t: any) => ({
          ...t,
          status: (t.status || '').toLowerCase() === 'mükemmel' ? 'excellent' :
                  (t.status || '').toLowerCase() === 'iyi' ? 'good' :
                  (t.status || '').toLowerCase().includes('risk') ? 'at-risk' :
                  (t.status || '').toLowerCase() === 'kritik' ? 'critical' : t.status
        }))
      }
      setData(themeData)
    } catch (error) {
      console.error('Error fetching theme data:', error)
    } finally {
      setLoading(false)
    }
  }, [userContext, apiParams])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100'
      case 'good': return 'text-blue-600 bg-blue-100'
      case 'at-risk': return 'text-yellow-600 bg-yellow-100'
      case 'critical': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle2 className="h-4 w-4" />
      case 'good': return <TrendingUp className="h-4 w-4" />
      case 'at-risk': return <AlertTriangle className="h-4 w-4" />
      case 'critical': return <TrendingDown className="h-4 w-4" />
      default: return <PieChart className="h-4 w-4" />
    }
  }

  // Basit radar chart SVG
  const RadarChart = ({ metrics }: { metrics: RadarMetric[] }) => {
    const size = 200
    const center = size / 2
    const radius = 80
    const maxValue = 100

    const angleStep = (2 * Math.PI) / metrics.length
    
    const points = metrics.map((metric, index) => {
      const angle = (index * angleStep) - (Math.PI / 2) // Start from top
      const value = (metric.value / maxValue) * radius
      const x = center + value * Math.cos(angle)
      const y = center + value * Math.sin(angle)
      return { x, y, angle, value: metric.value, label: metric.metric }
    })

    const pathData = points.map((point, index) => 
      `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ') + ' Z'

    return (
      <div className="flex items-center justify-center">
        <svg width={size} height={size} className="border rounded-lg bg-gray-50">
          {/* Grid circles */}
          {[0.2, 0.4, 0.6, 0.8, 1].map((ratio) => (
            <circle
              key={ratio}
              cx={center}
              cy={center}
              r={radius * ratio}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          ))}
          
          {/* Grid lines */}
          {points.map((point, index) => {
            const endX = center + radius * Math.cos(point.angle)
            const endY = center + radius * Math.sin(point.angle)
            return (
              <line
                key={index}
                x1={center}
                y1={center}
                x2={endX}
                y2={endY}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
            )
          })}
          
          {/* Data polygon */}
          <path
            d={pathData}
            fill="rgba(59, 130, 246, 0.2)"
            stroke="#3b82f6"
            strokeWidth="2"
          />
          
          {/* Data points */}
          {points.map((point, index) => (
            <g key={index}>
              <circle
                cx={point.x}
                cy={point.y}
                r="4"
                fill="#3b82f6"
                stroke="white"
                strokeWidth="2"
              />
              <text
                x={center + (radius + 20) * Math.cos(point.angle)}
                y={center + (radius + 20) * Math.sin(point.angle)}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-xs font-medium fill-gray-700"
              >
                {point.label}
              </text>
              <text
                x={center + (radius + 35) * Math.cos(point.angle)}
                y={center + (radius + 35) * Math.sin(point.angle)}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-xs fill-gray-500"
              >
                {point.value}%
              </text>
            </g>
          ))}
        </svg>
      </div>
    )
  }

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!userContext) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-blue-600 text-6xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Giriş Gerekli</h2>
          <p className="text-gray-600 mb-4">Bu sayfayı görüntülemek için giriş yapmanız gerekiyor.</p>
          <a href="/login" className="text-blue-600 hover:text-blue-800">Giriş Yap</a>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Tema verileri yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Veri yüklenemedi</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Özet Kartlar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Genel Başarım</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.summary.avgOverallAchievement}%</div>
              <p className="text-xs text-gray-500">{data.summary.totalKpis} KPI ortalaması</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">En İyi Tema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-green-600">{data.summary.bestPerformingTheme.name}</div>
              <p className="text-xs text-gray-500">{data.summary.bestPerformingTheme.avgAchievement}% başarım</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Gelişim Alanı</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-red-600">{data.summary.worstPerformingTheme.name}</div>
              <p className="text-xs text-gray-500">{data.summary.worstPerformingTheme.avgAchievement}% başarım</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Kapsamlı Analiz</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{data.themes.length}</div>
              <p className="text-xs text-gray-500">Tema kategorisi</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Radar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Tema Radar Analizi</CardTitle>
              <CardDescription>
                4 ana tema boyutunda genel performans değerlendirmesi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadarChart metrics={data.radarMetrics} />
            </CardContent>
          </Card>

          {/* Tema Detayları */}
          <Card>
            <CardHeader>
              <CardTitle>Tema Detay Performansı</CardTitle>
              <CardDescription>
                Her tema için KPI dağılımı ve başarım durumu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {data.themes.map((theme) => (
                  <div key={theme.theme} className="border-b pb-4 last:border-b-0">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: theme.color }}
                        ></div>
                        <div>
                          <h3 className="font-medium">{theme.name}</h3>
                          <p className="text-xs text-gray-500">{theme.description}</p>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs ${getStatusColor(theme.status)}`}>
                        {getStatusIcon(theme.status)}
                        <span className="ml-1">
                          {theme.status === 'excellent' ? 'Mükemmel' :
                           theme.status === 'good' ? 'İyi' :
                           theme.status === 'at-risk' ? 'Risk' : 'Kritik'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Ortalama Başarım</span>
                      <span className="text-sm font-medium">{theme.avgAchievement}%</span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                      <div 
                        className="h-2 rounded-full"
                        style={{ 
                          width: `${theme.avgAchievement}%`,
                          backgroundColor: theme.color
                        }}
                      ></div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="block text-green-600">✓ {theme.distribution.excellent} Mükemmel</span>
                        <span className="block text-blue-600">→ {theme.distribution.good} İyi</span>
                      </div>
                      <div>
                        <span className="block text-yellow-600">⚠ {theme.distribution.atRisk} Risk</span>
                        <span className="block text-red-600">✗ {theme.distribution.critical} Kritik</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
    </div>
  )
} 