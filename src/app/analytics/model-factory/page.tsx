'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getCurrentUser, getUserApiParams } from '@/lib/user-context'
import { useAnalyticsWebSocket } from '@/hooks/useWebSocket'
import FactoryPerformanceCard from '@/components/analytics/FactoryPerformanceCard'
import SectorImpactChart from '@/components/analytics/SectorImpactChart'
import FactoryRankingCard from '@/components/analytics/FactoryRankingCard'
import ThemeComparisonCard from '@/components/analytics/ThemeComparisonCard'
import KPIPerformanceTable from '@/components/analytics/KPIPerformanceTable'
import KnowledgeInsightsPanel from '@/components/analytics/KnowledgeInsightsPanel'
import IndustryAnalysisPanel from '@/components/analytics/IndustryAnalysisPanel'
import { ChevronRight, BarChart3, TrendingUp, Scale, FileDown, Factory, Target, Award, Users, Clock } from 'lucide-react'

export default function ModelFactoryAnalytics() {
  const [user, setUser] = useState<any>(null)
  const [isClient, setIsClient] = useState(false)
  const [data, setData] = useState<any>(null)
  const [factoryPerformance, setFactoryPerformance] = useState<any>(null)
  const [sectorImpact, setSectorImpact] = useState<any>(null)
  const [factoryRanking, setFactoryRanking] = useState<any>(null)
  const [themeComparison, setThemeComparison] = useState<any>(null)
  const [kpiPerformance, setKpiPerformance] = useState<any>(null)
  const [themeData, setThemeData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Real-time WebSocket connection
  const webSocket = useAnalyticsWebSocket()
  const [realTimeUpdates, setRealTimeUpdates] = useState(0)
  const [lastUpdateTime, setLastUpdateTime] = useState<string | null>(null)
  
  // Tab state'leri
  const [activeTab, setActiveTab] = useState('overview')
  
  // Filtreleme state'leri
  const [selectedPeriod, setSelectedPeriod] = useState<string>('2024-Q4')

  const allPeriods = [
    { value: '2024-Q4', label: '2024 4. Çeyrek' },
    { value: '2024-Q3', label: '2024 3. Çeyrek' },
    { value: '2024-Q2', label: '2024 2. Çeyrek' },
    { value: '2024-Q1', label: '2024 1. Çeyrek' },
    { value: '2023-Q4', label: '2023 4. Çeyrek' },
    { value: '2023-Q3', label: '2023 3. Çeyrek' },
    { value: '2023-Q2', label: '2023 2. Çeyrek' },
    { value: '2023-Q1', label: '2023 1. Çeyrek' },
    { value: '2022-Q4', label: '2022 4. Çeyrek' },
    { value: '2022-Q3', label: '2022 3. Çeyrek' },
  ]

  // Tab definitions - Model Fabrika özelinde
  const tabs = [
    { 
      id: 'overview', 
      label: 'Genel Bakış', 
      icon: BarChart3, 
      description: 'Model fabrika performans özeti' 
    },
    { 
      id: 'kpi_performance', 
      label: 'KPI Performansı', 
      icon: Target, 
      description: 'KPI detayları ve başarı oranları' 
    },
    { 
      id: 'sector_analysis', 
      label: 'Sektör Analizi', 
      icon: Factory, 
      description: 'Sektördeki konum ve karşılaştırma' 
    },
    { 
      id: 'theme_tracking', 
      label: 'Tema Takibi', 
      icon: Award, 
      description: 'LEAN/DIGITAL/GREEN/RESILIENCE tema analizi' 
    },
    { 
      id: 'knowledge_insights', 
      label: 'AI İçgörüleri', 
      icon: TrendingUp, 
      description: 'KPI tabanlı eylem önerileri' 
    },
    { 
      id: 'trends', 
      label: 'Trend Analizi', 
      icon: Clock, 
      description: 'Zaman bazlı performans analizi' 
    }
  ]

  const apiParams = useMemo(() => user ? getUserApiParams(user) : '', [user])

  useEffect(() => {
    setIsClient(true)
    setUser(getCurrentUser())
  }, [])

  // Real-time update handlers
  useEffect(() => {
    if (!isClient || !user) return

    // KPI değeri güncellendiğinde
    const cleanupKPI = webSocket.onKPIValueUpdated((payload) => {
      console.log('📊 Real-time KPI update received:', payload)
      setRealTimeUpdates(prev => prev + 1)
      setLastUpdateTime(new Date().toLocaleTimeString('tr-TR'))
      
      // Auto-refresh data if it affects current user's view
      if (user.userRole === 'MODEL_FACTORY' && payload.factoryId === user.factoryId) {
        fetchData()
      }
    })

    return () => {
      cleanupKPI()
    }
  }, [isClient, user, webSocket])

  const fetchData = async () => {
    if (!user || user.userRole !== 'MODEL_FACTORY' || !user.factoryId) return

    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('factoryId', user.factoryId)
      params.set('period', selectedPeriod)

      const [overviewRes, performanceRes, rankingRes, themeRes, kpiRes] = await Promise.all([
        fetch(`/api/analytics/executive-summary?${params.toString()}`),
        fetch(`/api/analytics/factory-performance?${params.toString()}`),
        fetch(`/api/analytics/benchmark/factory-ranking?${params.toString()}`),
        fetch(`/api/analytics/benchmark/theme-comparison?${params.toString()}`),
        fetch(`/api/analytics/kpi-performance?${params.toString()}`)
      ])

      const [overviewData, performanceData, rankingData, themeData, kpiData] = await Promise.all([
        overviewRes.json(),
        performanceRes.json(),
        rankingRes.json(),
        themeData.json(),
        kpiRes.json()
      ])

      setData(overviewData)
      setFactoryPerformance(performanceData)
      setFactoryRanking(rankingData)
      setThemeComparison(themeData)
      setKpiPerformance(kpiData)
    } catch (error) {
      console.error('Analytics data fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [user, selectedPeriod])

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user || user.userRole !== 'MODEL_FACTORY') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Erişim Engellendi</h1>
          <p className="text-gray-600">Bu sayfa sadece Model Fabrika kullanıcıları için erişilebilir.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {user.factoryName || 'Model Fabrika'} Analitik
              </h1>
              <p className="text-gray-600">
                Model fabrika performansınızı detaylı olarak analiz edin
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Period Filter */}
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {allPeriods.map((period) => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </select>
              
              {/* Real-time indicator */}
              {realTimeUpdates > 0 && (
                <div className="flex items-center space-x-2 text-sm text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Canlı güncelleme</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-white p-1 rounded-lg shadow-sm">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FactoryPerformanceCard data={factoryPerformance} />
              <SectorImpactChart data={sectorImpact} />
            </div>
          )}

          {activeTab === 'kpi_performance' && (
            <div className="space-y-6">
              <KPIPerformanceTable data={kpiPerformance} />
            </div>
          )}

          {activeTab === 'sector_analysis' && (
            <div className="space-y-6">
              <FactoryRankingCard data={factoryRanking} />
              <IndustryAnalysisPanel 
                userRole={user.userRole}
                factoryId={user.factoryId}
                period={selectedPeriod}
              />
            </div>
          )}

          {activeTab === 'theme_tracking' && (
            <div className="space-y-6">
              <ThemeComparisonCard data={themeComparison} />
            </div>
          )}

          {activeTab === 'knowledge_insights' && (
            <div className="space-y-6">
              <KnowledgeInsightsPanel />
            </div>
          )}

          {activeTab === 'trends' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Trend Analizi</CardTitle>
                  <CardDescription>
                    Zaman içindeki performans değişimleri
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-gray-500">
                    Trend analizi grafikleri burada gösterilecek
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Veriler yükleniyor...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
