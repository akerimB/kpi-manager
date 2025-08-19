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
import { ChevronRight, BarChart3, TrendingUp, Scale, FileDown, Filter, X } from 'lucide-react'

export default function AnalyticsOverview() {
  const [user, setUser] = useState<any>(null)
  const [isClient, setIsClient] = useState(false)
  const [data, setData] = useState<any>(null)
  const [factoryPerformance, setFactoryPerformance] = useState<any>(null)
  const [sectorImpact, setSectorImpact] = useState<any>(null)
  const [factoryRanking, setFactoryRanking] = useState<any>(null)
  const [themeComparison, setThemeComparison] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Tab state'leri
  const [activeTab, setActiveTab] = useState('overview')
  const [showFilters, setShowFilters] = useState(false)
  
  // Filtreleme state'leri
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>(['2024-Q4'])
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

  // Hızlı dönem seçimi presetleri
  const quickSelections = [
    { 
      label: 'Son Çeyrek', 
      periods: ['2024-Q4'],
      description: 'Sadece mevcut çeyrek'
    },
    { 
      label: 'Son 2 Çeyrek', 
      periods: ['2024-Q3', '2024-Q4'],
      description: 'Q3 + Q4 2024'
    },
    { 
      label: 'Son 4 Çeyrek', 
      periods: ['2024-Q1', '2024-Q2', '2024-Q3', '2024-Q4'],
      description: 'Tüm 2024 yılı'
    },
    { 
      label: 'Son 8 Çeyrek', 
      periods: ['2023-Q1', '2023-Q2', '2023-Q3', '2023-Q4', '2024-Q1', '2024-Q2', '2024-Q3', '2024-Q4'],
      description: '2023-2024 (2 yıl)'
    }
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

  const handleQuickSelection = (periods: string[]) => {
    setSelectedPeriods([...periods])
  }

  const togglePeriod = (period: string) => {
    setSelectedPeriods(prev => 
      prev.includes(period) 
        ? prev.filter(p => p !== period)
        : [...prev, period].sort((a, b) => a.localeCompare(b))
    )
  }
  
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
    if (!user || selectedPeriods.length === 0) return
    
    const fetchData = async () => {
      setLoading(true)
      try {
        // Filtreleme parametreleri
        const baseParams = new URLSearchParams()
        baseParams.set('userRole', user.userRole)
        
        // Çoklu dönem desteği
        selectedPeriods.forEach(period => {
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

  // Filter component
  const FilterPanel = () => (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Analytics Filtreleri</span>
          </span>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              {data?.analysisScope === 'single_factory' ? 'Tekil Fabrika Analizi' : 'Çoklu Fabrika Analizi'}
            </span>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden p-1 rounded hover:bg-gray-100"
            >
              {showFilters ? <X className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
            </button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className={`${showFilters ? 'block' : 'hidden lg:block'}`}>
        {/* Hızlı Dönem Seçimi */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Hızlı Seçim</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickSelections.map((quick) => (
              <button
                key={quick.label}
                onClick={() => handleQuickSelection(quick.periods)}
                className={`p-3 text-left border rounded-lg transition-colors ${
                  JSON.stringify(selectedPeriods.sort()) === JSON.stringify(quick.periods.sort())
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="font-medium text-sm">{quick.label}</div>
                <div className="text-xs text-gray-500 mt-1">{quick.description}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Dönem Detay Seçimi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Dönem Seçimi ({selectedPeriods.length} seçili)
            </label>
            <div className="border border-gray-300 rounded-md p-3 max-h-48 overflow-y-auto">
              {allPeriods.map(period => (
                <label key={period.value} className="flex items-center space-x-2 py-1">
                  <input
                    type="checkbox"
                    checked={selectedPeriods.includes(period.value)}
                    onChange={() => togglePeriod(period.value)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{period.label}</span>
                </label>
              ))}
            </div>
            <div className="mt-2 flex space-x-2">
              <button
                onClick={() => setSelectedPeriods(allPeriods.map(p => p.value))}
                className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
              >
                Tümünü Seç
              </button>
              <button
                onClick={() => setSelectedPeriods([])}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
              >
                Tümünü Kaldır
              </button>
            </div>
          </div>

          {/* Fabrika Seçimi (Sadece Üst Yönetim) */}
          <div>
            {user.userRole === 'UPPER_MANAGEMENT' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Fabrika Filtresi</label>
                <select 
                  value={selectedFactory}
                  onChange={(e) => setSelectedFactory(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Tüm Fabrikalar ({availableFactories.length})</option>
                  {availableFactories.map(factory => (
                    <option key={factory.id} value={factory.id}>{factory.name}</option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Seçili Dönemlerin Özeti */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Seçili Dönemler</label>
              <div className="p-3 bg-gray-50 rounded-md text-sm">
                {selectedPeriods.length === 0 ? (
                  <span className="text-gray-500">Hiç dönem seçilmedi</span>
                ) : (
                  <div>
                    <div className="font-medium mb-1">
                      {selectedPeriods.length} dönem seçili:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {selectedPeriods.slice(0, 6).map(period => (
                        <span key={period} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          {period}
                        </span>
                      ))}
                      {selectedPeriods.length > 6 && (
                        <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">
                          +{selectedPeriods.length - 6} daha
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* İstatistikler */}
        {data && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">Analiz Kapsamı:</span>
                <div>{data.accessibleFactories} fabrika</div>
              </div>
              <div>
                <span className="font-medium">Dönem Aralığı:</span>
                <div>{selectedPeriods.length} çeyrek</div>
              </div>
              <div>
                <span className="font-medium">KPI Sayısı:</span>
                <div>{data.overall.kpiCount}</div>
              </div>
              <div>
                <span className="font-medium">Kullanıcı Tipi:</span>
                <div>{user.userRole === 'MODEL_FACTORY' ? 'Model Fabrika' : 'Üst Yönetim'}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Sticky Tab Navigation */}
      <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200 -mx-6 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden flex items-center space-x-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Filter className="h-4 w-4" />
            <span>Filtreler</span>
          </button>
        </div>
        
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
        
        {/* Tab description */}
        <div className="mt-2 text-sm text-gray-500">
          {tabs.find(tab => tab.id === activeTab)?.description}
        </div>
      </div>

      {/* Filter Panel */}
      <FilterPanel />

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



