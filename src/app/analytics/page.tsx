'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Target, TrendingUp, Download, RefreshCw, BarChart3, PieChart, Radar, Users } from "lucide-react"
import { useEffect, useState } from "react"
import Link from "next/link"

interface AnalyticsData {
  totalKpis: number
  activeActions: number
  completedActions: number
  overallSuccess: number
  kpiChange: number
  actionChange: number
  completionChange: number
  successChange: number
}

interface ThemeAnalytics {
  name: string
  kpiCount: number
  percentage: number
  color: string
  performance: number
}

interface RadarData {
  theme: string
  operationalEfficiency: number
  riskManagement: number
  costOptimization: number
  qualityImprovement: number
  innovation: number
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [themeData, setThemeData] = useState<ThemeAnalytics[]>([])
  const [radarData, setRadarData] = useState<RadarData[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState('Bu Ay')
  const [selectedThemes, setSelectedThemes] = useState('Tüm Temalar')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Simulated data - gerçek API'lerden veri çekebilirsiniz
        const mockAnalytics: AnalyticsData = {
          totalKpis: 80,
          activeActions: 24,
          completedActions: 56,
          overallSuccess: 91,
          kpiChange: 8,
          actionChange: 3,
          completionChange: 12,
          successChange: 4
        }

        const mockThemeData: ThemeAnalytics[] = [
          { name: 'Yalın', kpiCount: 28, percentage: 35, color: '#3B82F6', performance: 88 },
          { name: 'Dijital', kpiCount: 22, percentage: 28, color: '#10B981', performance: 92 },
          { name: 'Yeşil', kpiCount: 18, percentage: 22, color: '#F59E0B', performance: 76 },
          { name: 'Dirençlilik', kpiCount: 12, percentage: 15, color: '#EF4444', performance: 85 }
        ]

        const mockRadarData: RadarData[] = [
          {
            theme: 'Yalın',
            operationalEfficiency: 85,
            riskManagement: 78,
            costOptimization: 92,
            qualityImprovement: 80,
            innovation: 75
          },
          {
            theme: 'Dijital',
            operationalEfficiency: 90,
            riskManagement: 88,
            costOptimization: 85,
            qualityImprovement: 95,
            innovation: 92
          },
          {
            theme: 'Yeşil',
            operationalEfficiency: 75,
            riskManagement: 85,
            costOptimization: 80,
            qualityImprovement: 78,
            innovation: 70
          },
          {
            theme: 'Dirençlilik',
            operationalEfficiency: 82,
            riskManagement: 95,
            costOptimization: 75,
            qualityImprovement: 85,
            innovation: 80
          }
        ]

        setAnalytics(mockAnalytics)
        setThemeData(mockThemeData)
        setRadarData(mockRadarData)
      } catch (error) {
        console.error('Error fetching analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [selectedPeriod, selectedThemes])

  const RadarChart = ({ data }: { data: RadarData }) => {
    const size = 300
    const center = size / 2
    const radius = 100
    const angles = [0, 72, 144, 216, 288] // 5 points for pentagon

    const getPoint = (angle: number, value: number) => {
      const radian = (angle - 90) * (Math.PI / 180)
      const r = (value / 100) * radius
      return {
        x: center + r * Math.cos(radian),
        y: center + r * Math.sin(radian)
      }
    }

    const values = [
      data.operationalEfficiency,
      data.riskManagement,
      data.costOptimization,
      data.qualityImprovement,
      data.innovation
    ]

    const labels = [
      'Operasyonel Verimlilik',
      'Risk Yönetimi',
      'Maliyet Optimizasyonu',
      'Kalite İyileştirme',
      'İnovasyon'
    ]

    const pathData = values
      .map((value, index) => {
        const point = getPoint(angles[index], value)
        return `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
      })
      .join(' ') + ' Z'

    return (
      <div className="relative">
        <svg width={size} height={size} className="mx-auto">
          {/* Grid circles */}
          {[20, 40, 60, 80, 100].map((percent) => (
            <circle
              key={percent}
              cx={center}
              cy={center}
              r={(percent / 100) * radius}
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="1"
            />
          ))}

          {/* Grid lines */}
          {angles.map((angle, index) => {
            const point = getPoint(angle, 100)
            return (
              <line
                key={angle}
                x1={center}
                y1={center}
                x2={point.x}
                y2={point.y}
                stroke="#E5E7EB"
                strokeWidth="1"
              />
            )
          })}

          {/* Data area */}
          <path
            d={pathData}
            fill="rgba(59, 130, 246, 0.3)"
            stroke="#3B82F6"
            strokeWidth="2"
          />

          {/* Data points */}
          {values.map((value, index) => {
            const point = getPoint(angles[index], value)
            return (
              <circle
                key={index}
                cx={point.x}
                cy={point.y}
                r="4"
                fill="#3B82F6"
              />
            )
          })}

          {/* Labels */}
          {labels.map((label, index) => {
            const point = getPoint(angles[index], 120)
            return (
              <text
                key={index}
                x={point.x}
                y={point.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-xs fill-gray-600"
              >
                {label}
              </text>
            )
          })}
        </svg>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Analitik veriler yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-4 w-4" />
                <span>Dashboard'a Dön</span>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Analitik Panolar</h1>
                  <p className="text-sm text-gray-500">Detaylı performans analizi ve raporlama</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Ana Tesis - İstanbul</span>
                <select className="text-sm border border-gray-300 rounded-md px-3 py-1">
                  <option>Ana Tesis - İstanbul</option>
                  <option>Fabrika 2 - Ankara</option>
                  <option>Fabrika 3 - İzmir</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Bu Ay</span>
                <select 
                  className="text-sm border border-gray-300 rounded-md px-3 py-1"
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                >
                  <option>Bu Ay</option>
                  <option>Geçen Ay</option>
                  <option>Bu Çeyrek</option>
                  <option>Bu Yıl</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Yenile
                </Button>
                <Button size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Rapor İndir
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Main Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold text-gray-900">Analitik Panolar</h2>
            <div className="flex space-x-4">
              <select 
                className="px-4 py-2 border border-gray-300 rounded-md bg-white"
                value={selectedThemes}
                onChange={(e) => setSelectedThemes(e.target.value)}
              >
                <option>Tüm Temalar</option>
                <option>Yalın</option>
                <option>Dijital</option>
                <option>Yeşil</option>
                <option>Dirençlilik</option>
              </select>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Toplam KPI</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-gray-900">{analytics?.totalKpis}</div>
                  <div className="flex items-center text-sm text-green-600 mt-1">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    +{analytics?.kpiChange}
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-3 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full w-fit">
                Yalın
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Aktif Eylemler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-gray-900">{analytics?.activeActions}</div>
                  <div className="flex items-center text-sm text-green-600 mt-1">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    +{analytics?.actionChange}
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-3 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full w-fit">
                Yalın
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Tamamlanan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-gray-900">{analytics?.completedActions}</div>
                  <div className="flex items-center text-sm text-green-600 mt-1">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    +{analytics?.completionChange}
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-3 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full w-fit">
                Dijital
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Ortalama Başarı</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-gray-900">{analytics?.overallSuccess}%</div>
                  <div className="flex items-center text-sm text-green-600 mt-1">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    +{analytics?.successChange}%
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-3 text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full w-fit">
                Yeşil
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex space-x-8">
            <button className="text-blue-600 border-b-2 border-blue-600 pb-2 font-medium">
              Tema Analizi
            </button>
            <button className="text-gray-500 pb-2 hover:text-gray-700">
              Performans
            </button>
            <button className="text-gray-500 pb-2 hover:text-gray-700">
              Trend Analizi
            </button>
            <button className="text-gray-500 pb-2 hover:text-gray-700">
              Departman
            </button>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Radar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Tema Olgunluk Radarı</CardTitle>
              <CardDescription>Tema bazlı performans analizi</CardDescription>
            </CardHeader>
            <CardContent>
              <RadarChart data={radarData[0]} />
            </CardContent>
          </Card>

          {/* Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Tema Dağılımı ve KPI Sayıları</CardTitle>
              <CardDescription>Tema bazlı KPI dağılımı ve performans</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <div className="relative w-64 h-64">
                  <svg width="256" height="256" className="transform -rotate-90">
                    {themeData.map((theme, index) => {
                      const total = themeData.reduce((sum, t) => sum + t.percentage, 0)
                      let cumulativePercentage = 0
                      for (let i = 0; i < index; i++) {
                        cumulativePercentage += themeData[i].percentage
                      }
                      const startAngle = (cumulativePercentage / total) * 360
                      const endAngle = ((cumulativePercentage + theme.percentage) / total) * 360
                      const largeArcFlag = theme.percentage > 50 ? 1 : 0

                      const x1 = 128 + 100 * Math.cos((startAngle * Math.PI) / 180)
                      const y1 = 128 + 100 * Math.sin((startAngle * Math.PI) / 180)
                      const x2 = 128 + 100 * Math.cos((endAngle * Math.PI) / 180)
                      const y2 = 128 + 100 * Math.sin((endAngle * Math.PI) / 180)

                      return (
                        <path
                          key={theme.name}
                          d={`M 128 128 L ${x1} ${y1} A 100 100 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                          fill={theme.color}
                        />
                      )
                    })}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">80</div>
                      <div className="text-sm text-gray-600">Toplam KPI</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {themeData.map((theme) => (
                  <div key={theme.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: theme.color }}
                      ></div>
                      <span className="text-sm font-medium">{theme.name} {theme.percentage}% {theme.kpiCount} KPI</span>
                    </div>
                    <div className="text-sm text-gray-600">{theme.performance}%</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 