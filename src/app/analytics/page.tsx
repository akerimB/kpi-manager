'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getCurrentUser, getUserApiParams } from '@/lib/user-context'
import FactoryPerformanceCard from '@/components/analytics/FactoryPerformanceCard'
import SectorImpactChart from '@/components/analytics/SectorImpactChart'
import FactoryRankingCard from '@/components/analytics/FactoryRankingCard'
import ThemeComparisonCard from '@/components/analytics/ThemeComparisonCard'
import NotificationPanel from '@/components/notifications/NotificationPanel'
import AIRecommendationsPanel from '@/components/ai/AIRecommendationsPanel'
import ReportExportPanel from '@/components/reports/ReportExportPanel'
import ExecutiveSummaryPanel from '@/components/analytics/ExecutiveSummaryPanel'
import { ChevronRight, BarChart3, TrendingUp, Scale, FileDown } from 'lucide-react'

export default function AnalyticsOverview() {
  const [user, setUser] = useState<any>(null)
  const [isClient, setIsClient] = useState(false)
  const [data, setData] = useState<any>(null)
  const [factoryPerformance, setFactoryPerformance] = useState<any>(null)
  const [sectorImpact, setSectorImpact] = useState<any>(null)
  const [factoryRanking, setFactoryRanking] = useState<any>(null)
  const [themeComparison, setThemeComparison] = useState<any>(null)
  const [themeData, setThemeData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Tab state'leri
  const [activeTab, setActiveTab] = useState('overview')
  
  // Filtreleme state'leri
  const [startPeriod, setStartPeriod] = useState<string>('2024-Q3')
  const [endPeriod, setEndPeriod] = useState<string>('2024-Q4')
  const [selectedFactory, setSelectedFactory] = useState<string>('')
  const [availableFactories, setAvailableFactories] = useState<any[]>([])

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



  // Tab definitions
  const tabs = [
    { 
      id: 'overview', 
      label: 'Genel Bakış', 
      icon: BarChart3, 
      description: 'Ana metrikler ve özet bilgiler' 
    },
    { 
      id: 'performance', 
      label: 'Performans', 
      icon: TrendingUp, 
      description: 'KPI detayları ve sektörel analiz' 
    },
    { 
      id: 'themes', 
      label: 'Tema Takibi', 
      icon: ChevronRight, 
      description: 'LEAN/DIGITAL/GREEN/RESILIENCE tema analizi' 
    },
    { 
      id: 'comparison', 
      label: 'Karşılaştırma', 
      icon: Scale, 
      description: 'Benchmark ve fabrika sıralaması' 
    },
    { 
      id: 'reports', 
      label: 'Raporlar', 
      icon: FileDown, 
      description: 'Export ve AI önerileri' 
    }
  ]

  // Başlangıç ve bitiş periyotlarından seçili periyotları hesapla
  const selectedPeriods = useMemo(() => {
    const startIndex = allPeriods.findIndex(p => p.value === startPeriod)
    const endIndex = allPeriods.findIndex(p => p.value === endPeriod)
    
    if (startIndex === -1 || endIndex === -1) {
      return [startPeriod]
    }
    
    const periods = []
    // startIndex'den endIndex'e kadar git (daha büyük index daha eski dönem)
    const minIndex = Math.min(startIndex, endIndex)
    const maxIndex = Math.max(startIndex, endIndex)
    
    for (let i = minIndex; i <= maxIndex; i++) {
      periods.push(allPeriods[i].value)
    }
    
    return periods
  }, [startPeriod, endPeriod])


  
  const apiParams = useMemo(() => user ? getUserApiParams(user) : '', [user])

  useEffect(() => {
    setIsClient(true)
    setUser(getCurrentUser())
  }, [])

  // Fabrikalari yükle (üst yönetim için)
  useEffect(() => {
    if (!user || user.userRole === 'MODEL_FACTORY') return
    
    const loadFactories = async () => {
      try {
        const response = await fetch('/api/factories')
        const factories = await response.json()
        setAvailableFactories(factories)
      } catch (error) {
        console.error('Factories fetch error:', error)
      }
    }
    
    loadFactories()
  }, [user])

  useEffect(() => {
    if (!user) return
    
    // selectedPeriods boş ise varsayılan değer kullan
    const periodsToUse = selectedPeriods.length === 0 ? ['2024-Q4'] : selectedPeriods
    
    const fetchData = async () => {
      setLoading(true)
      try {
        // Filtreleme parametreleri
        const baseParams = new URLSearchParams()
        baseParams.set('userRole', user.userRole)
        
        // Çoklu dönem desteği
        periodsToUse.forEach(period => {
          baseParams.append('periods', period)
        })
        
        if (user.factoryId) {
          baseParams.set('factoryId', user.factoryId)
        }
        
        // Üst yönetim için seçili fabrika varsa
        if (user.userRole === 'UPPER_MANAGEMENT' && selectedFactory) {
          baseParams.set('factoryId', selectedFactory)
        }

        // Genel analytics
        const overviewRes = await fetch(`/api/analytics/overview?${baseParams.toString()}`)
        const overviewData = await overviewRes.json()
        setData(overviewData)

        // Tema analizi için ayrı API çağrısı
        const themeRes = await fetch(`/api/themes/analytics?${baseParams.toString()}`)
        if (themeRes.ok) {
          const themeAnalytics = await themeRes.json()
          setThemeData(themeAnalytics)
        }

        // Model fabrika kullanıcısı ise özel performans verisi (en son dönem için)
        if (user.userRole === 'MODEL_FACTORY' && user.factoryId) {
          const latestPeriod = selectedPeriods[selectedPeriods.length - 1]
          const [performanceRes, sectorRes, rankingRes, themeRes] = await Promise.all([
            fetch(`/api/analytics/factory-specific/performance-summary?factoryId=${user.factoryId}&period=${latestPeriod}`),
            fetch(`/api/analytics/factory-specific/sector-impact?factoryId=${user.factoryId}&period=${latestPeriod}`),
            fetch(`/api/analytics/benchmark/factory-ranking?period=${latestPeriod}`),
            fetch(`/api/analytics/benchmark/theme-comparison?factoryId=${user.factoryId}&period=${latestPeriod}`)
          ])
          
          const performanceData = await performanceRes.json()
          const sectorData = await sectorRes.json()
          const rankingData = rankingRes.ok ? await rankingRes.json() : null
          const themeData = themeRes.ok ? await themeRes.json() : null
          
          setFactoryPerformance(performanceData)
          setSectorImpact(sectorData)
          setFactoryRanking(rankingData)
          setThemeComparison(themeData)
        }
      } catch (error) {
        console.error('Analytics fetch error:', error)
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, selectedPeriods, selectedFactory])

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-blue-600 text-6xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Giriş Gerekli</h2>
          <p className="text-gray-600 mb-4">Bu sayfayı görüntülemek için giriş yapmanız gerekiyor.</p>
          <a href="/login" className="text-blue-600 hover:text-blue-800">
            Giriş Yap
          </a>
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="p-6 text-gray-600">Analitik veriler yükleniyor...</div>
  }



  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Sticky Header with Filters and Tabs */}
      <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200 -mx-6 px-6 py-4">
        {/* Header and Quick Filters */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          
          {/* Compact Filters */}
          <div className="flex items-center space-x-3">
            {/* Period Range Selection */}
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Başlangıç:</label>
              <select 
                className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white min-w-[100px]"
                value={startPeriod}
                onChange={(e) => setStartPeriod(e.target.value)}
              >
                {allPeriods.map(period => (
                  <option key={period.value} value={period.value}>{period.label}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Bitiş:</label>
              <select 
                className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white min-w-[100px]"
                value={endPeriod}
                onChange={(e) => setEndPeriod(e.target.value)}
              >
                {allPeriods.map(period => (
                  <option key={period.value} value={period.value}>{period.label}</option>
                ))}
              </select>
            </div>

            {/* Factory Filter for Upper Management */}
            {user.userRole === 'UPPER_MANAGEMENT' && (
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600">Fabrika:</label>
                <select 
                  value={selectedFactory}
                  onChange={(e) => setSelectedFactory(e.target.value)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white min-w-[120px]"
                >
                  <option value="">Tüm Fabrikalar</option>
                  {availableFactories.map(factory => (
                    <option key={factory.id} value={factory.id}>{factory.name}</option>
                  ))}
                </select>
              </div>
            )}


          </div>
        </div>


        
        {/* Tab Navigation */}
        <div className="flex space-x-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
        
        {/* Quick Stats */}
        {data && (
          <div className="mt-3 flex items-center space-x-6 text-xs text-gray-500">
            <span><strong>{data.accessibleFactories}</strong> fabrika</span>
            <span><strong>{startPeriod}</strong> - <strong>{endPeriod}</strong> ({selectedPeriods.length} dönem)</span>
            <span><strong>{data.overall.kpiCount}</strong> KPI</span>
            <span className="hidden md:inline">
              {user.userRole === 'MODEL_FACTORY' ? 'Model Fabrika' : 'Üst Yönetim'} görünümü
            </span>
          </div>
        )}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* GENEL BAKIŞ TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Üst Yönetim için Executive Summary */}
            {user.userRole === 'UPPER_MANAGEMENT' && (
              <ExecutiveSummaryPanel period={selectedPeriods[selectedPeriods.length - 1] || '2024-Q4'} userRole={user.userRole} />
            )}

            {/* Ana Metrik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Genel Başarı</CardTitle></CardHeader>
          <CardContent>
                  <div className="text-3xl font-bold">{data?.overall?.avgSuccess || 0}%</div>
                  <CardDescription>Trend: {data?.overall?.trend >= 0 ? '+' : ''}{data?.overall?.trend || 0}</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">KPI</CardTitle></CardHeader>
                <CardContent><div className="text-3xl font-bold">{data?.overall?.kpiCount || 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Eylem</CardTitle></CardHeader>
                <CardContent><div className="text-3xl font-bold">{data?.overall?.actionCount || 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Fabrika</CardTitle></CardHeader>
                <CardContent><div className="text-3xl font-bold">{data?.overall?.factoryCount || 0}</div></CardContent>
        </Card>
      </div>

            {/* Tema Başarıları ve Riskli KPIlar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tema Başarıları</CardTitle>
            <CardDescription>LEAN/DIGITAL/GREEN/RESILIENCE</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
                    {data?.themes?.map((t: any) => (
                <div key={t.name}>
                  <div className="flex justify-between text-sm"><span>{t.name}</span><span>{t.avg}%</span></div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${t.avg}%` }}></div>
                  </div>
                </div>
                    )) || <div className="text-gray-500">Veri yükleniyor...</div>}
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
                    {data?.topRisks?.map((r: any) => (
                <div key={r.id} className="flex justify-between text-sm border-b pb-1">
                  <span>#{r.number} {r.description}</span>
                  <span className={r.success < 40 ? 'text-red-600' : r.success < 60 ? 'text-yellow-600' : 'text-gray-700'}>{r.success}%</span>
                </div>
                    )) || <div className="text-gray-500">Veri yükleniyor...</div>}
            </div>
          </CardContent>
        </Card>
      </div>

            {/* Zaman Çizgisi */}
      <Card>
        <CardHeader>
          <CardTitle>Zaman Çizgisi</CardTitle>
          <CardDescription>Son dönem ortalama</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
                  {data?.timeline?.map((p: any) => (
              <div key={p.period} className="p-3 bg-gray-50 rounded border flex items-center justify-between">
                <span>{p.period}</span>
                <span className="font-medium">{p.avgSuccess}</span>
                    </div>
                  )) || <div className="text-gray-500">Veri yükleniyor...</div>}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* PERFORMANS TAB */}
        {activeTab === 'performance' && (
          <div className="space-y-6">
            {/* Model Fabrika için bildirimler */}
            {user.userRole === 'MODEL_FACTORY' && (
              <NotificationPanel factoryId={user.factoryId} autoRefresh={true} limit={5} />
            )}

            {/* Fabrika Performans Kartı */}
            {user.userRole === 'MODEL_FACTORY' && factoryPerformance && (
              <FactoryPerformanceCard data={factoryPerformance} loading={loading} />
            )}

            {/* Sektörel Etki Analizi */}
            {user.userRole === 'MODEL_FACTORY' && sectorImpact && (
              <SectorImpactChart data={sectorImpact} loading={loading} />
            )}

            {/* Üst Yönetim için Fabrika Performans Karşılaştırması */}
            {user.userRole === 'UPPER_MANAGEMENT' && data?.factoryPerformance?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Fabrika Performans Karşılaştırması</CardTitle>
                  <CardDescription>Seçili dönem aralığındaki ortalama performans skorları</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.factoryPerformance.map((factory: any, index: number) => (
                      <div key={factory.factoryId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                            index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-400' : 'bg-blue-500'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{factory.factoryName}</div>
                            <div className="text-sm text-gray-500">{factory.kpiCount} KPI</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{factory.avgScore}%</div>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${factory.avgScore}%` }}
                            ></div>
                          </div>
                        </div>
              </div>
            ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Performans detaylarını burada gösterebiliriz */}
            <Card>
              <CardHeader>
                <CardTitle>Detaylı Performans Analizi</CardTitle>
                <CardDescription>KPI bazında performans verileri</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-gray-500 text-center py-8">
                  Performans detayları yakında eklenecek...
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TEMA TAKİBİ TAB */}
        {activeTab === 'themes' && (
          <div className="space-y-6">
            {/* Tema Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {['LEAN', 'DIGITAL', 'GREEN', 'RESILIENCE'].map(theme => {
                const themeInfo = data?.themes?.find((t: any) => t.name === theme) || { avg: 0, count: 0 }
                return (
                  <Card key={theme}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{theme}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold mb-2">{themeInfo.avg || 0}%</div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            theme === 'LEAN' ? 'bg-blue-500' :
                            theme === 'DIGITAL' ? 'bg-purple-500' :
                            theme === 'GREEN' ? 'bg-green-500' : 'bg-orange-500'
                          }`}
                          style={{ width: `${themeInfo.avg || 0}%` }}
                        ></div>
                      </div>
                      <CardDescription className="mt-1">{themeInfo.count || 0} KPI</CardDescription>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Tema Detay Analizi */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tema Performans Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Tema Performans Trendleri</CardTitle>
                  <CardDescription>Dönemsel tema başarı oranları</CardDescription>
                </CardHeader>
                <CardContent>
                  {themeData ? (
                    <div className="space-y-4">
                      {themeData.trends?.map((trend: any) => (
                        <div key={trend.theme} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{trend.theme}</span>
                            <span className={`text-sm ${trend.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {trend.change >= 0 ? '+' : ''}{trend.change}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${trend.currentScore}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500">
                            Önceki: {trend.previousScore}% → Mevcut: {trend.currentScore}%
                          </div>
                        </div>
                      )) || <div className="text-gray-500">Trend verisi yükleniyor...</div>}
                    </div>
                  ) : (
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-2 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Fabrika Tema Karşılaştırması */}
              <Card>
                <CardHeader>
                  <CardTitle>Fabrika Tema Dağılımı</CardTitle>
                  <CardDescription>Fabrikalar arası tema performansı</CardDescription>
                </CardHeader>
                <CardContent>
                  {themeData?.factoryComparison ? (
                    <div className="space-y-3">
                      {themeData.factoryComparison.slice(0, 5).map((factory: any, index: number) => (
                        <div key={factory.factoryId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                              index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-blue-500'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium text-sm">{factory.factoryName}</div>
                              <div className="text-xs text-gray-500">En güçlü: {factory.strongestTheme}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">{factory.overallThemeScore}%</div>
                            <div className="text-xs text-gray-500">{factory.completedThemes}/4 tema</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      Fabrika karşılaştırma verisi yükleniyor...
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Tema Hedef vs Gerçekleşen */}
            <Card>
              <CardHeader>
                <CardTitle>Tema Hedefleri vs Gerçekleşen</CardTitle>
                <CardDescription>Tema bazında hedef tutturmada başarı durumu</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {themeData?.targets?.map((target: any) => (
                    <div key={target.theme} className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">{target.theme}</h4>
                        <span className={`text-sm ${target.achievement >= 100 ? 'text-green-600' : target.achievement >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {target.achievement}% başarı
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Hedef: {target.targetValue}</span>
                          <span>Gerçekleşen: {target.actualValue}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full ${
                              target.achievement >= 100 ? 'bg-green-500' : 
                              target.achievement >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(100, target.achievement)}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {target.riskFactors?.length > 0 && (
                        <div className="text-xs text-red-600">
                          Risk: {target.riskFactors.join(', ')}
                        </div>
                      )}
                    </div>
                  )) || (
                    <div className="col-span-2 text-center text-gray-500 py-8">
                      Hedef verisi yükleniyor...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tema Aksiyon Önerileri */}
            <Card>
              <CardHeader>
                <CardTitle>Tema Geliştirme Önerileri</CardTitle>
                <CardDescription>AI destekli tema optimizasyon önerileri</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {themeData?.recommendations?.map((rec: any, index: number) => (
                    <div key={index} className={`p-4 border-l-4 rounded-lg ${
                      rec.priority === 'high' ? 'border-red-500 bg-red-50' :
                      rec.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                      'border-blue-500 bg-blue-50'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{rec.theme}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          rec.priority === 'high' ? 'bg-red-100 text-red-600' :
                          rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {rec.priority}
                        </span>
                      </div>
                      <div className="text-sm text-gray-700 mb-2">{rec.recommendation}</div>
                      <div className="text-xs text-gray-500">
                        Beklenen etki: +{rec.expectedImprovement}%
                      </div>
                    </div>
                  )) || (
                    <div className="col-span-2 text-center text-gray-500 py-8">
                      AI önerileri hazırlanıyor...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* KARŞILAŞTIRMA TAB */}
        {activeTab === 'comparison' && (
          <div className="space-y-6">
            {/* Model Fabrika için karşılaştırma bileşenleri */}
            {user.userRole === 'MODEL_FACTORY' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {factoryRanking && (
                  <FactoryRankingCard 
                    data={factoryRanking} 
                    currentFactoryId={user.factoryId}
                    loading={loading} 
                  />
                )}
                {themeComparison && (
                  <ThemeComparisonCard 
                    data={themeComparison} 
                    loading={loading} 
                  />
                )}
              </div>
            )}
            
            {/* Benchmark analizleri */}
            <Card>
              <CardHeader>
                <CardTitle>Benchmark Analizi</CardTitle>
                <CardDescription>Sektör ve rekabet karşılaştırmaları</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-gray-500 text-center py-8">
                  Benchmark analizleri yakında eklenecek...
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* RAPORLAR TAB */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            {/* AI Önerileri paneli */}
            {user.userRole === 'MODEL_FACTORY' && (
              <AIRecommendationsPanel factoryId={user.factoryId} period="2024-Q4" />
            )}
            
            {/* Rapor İndirme paneli */}
            {user.userRole === 'MODEL_FACTORY' && (
              <ReportExportPanel factoryId={user.factoryId} period="2024-Q4" />
            )}
            
            {/* Genel raporlar */}
            <Card>
              <CardHeader>
                <CardTitle>Rapor Merkezi</CardTitle>
                <CardDescription>Çeşitli analiz raporları ve dışa aktarım seçenekleri</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button className="p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left transition-colors">
                    <div className="font-medium text-sm">Excel Raporu</div>
                    <div className="text-xs text-gray-500 mt-1">Detaylı veri analizi</div>
                  </button>
                  <button className="p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left transition-colors">
                    <div className="font-medium text-sm">PDF Raporu</div>
                    <div className="text-xs text-gray-500 mt-1">Özetli sunum</div>
                  </button>
                  <button className="p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left transition-colors">
                    <div className="font-medium text-sm">Özel Rapor</div>
                    <div className="text-xs text-gray-500 mt-1">Kişiselleştirilmiş analiz</div>
                  </button>
          </div>
        </CardContent>
      </Card>
          </div>
        )}
      </div>

    </div>
  )
}



