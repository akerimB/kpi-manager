'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Factory, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Target, 
  Award,
  BarChart3,
  PieChart,
  MapPin,
  Users,
  Zap,
  Leaf,
  Shield,
  Clock,
  DollarSign
} from 'lucide-react'

interface IndustryAnalysisPanelProps {
  userRole: string
  factoryId?: string
  period: string
}

export default function IndustryAnalysisPanel({ 
  userRole, 
  factoryId, 
  period 
}: IndustryAnalysisPanelProps) {
  const [industryData, setIndustryData] = useState<any>(null)
  const [sectorData, setSectorData] = useState<any>(null)
  const [regionalData, setRegionalData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSector, setSelectedSector] = useState<string>('all')
  const [selectedRegion, setSelectedRegion] = useState<string>('all')

  // Sanayi sektörleri
  const sectors = [
    { id: 'automotive', name: 'Otomotiv', icon: Car, color: 'bg-blue-500' },
    { id: 'textile', name: 'Tekstil', icon: Scissors, color: 'bg-purple-500' },
    { id: 'food', name: 'Gıda/İçecek', icon: Coffee, color: 'bg-green-500' },
    { id: 'machinery', name: 'Makine', icon: Settings, color: 'bg-orange-500' },
    { id: 'electronics', name: 'Elektrik-Elektronik', icon: Zap, color: 'bg-yellow-500' },
    { id: 'chemical', name: 'Kimya', icon: Beaker, color: 'bg-red-500' },
    { id: 'metal', name: 'Metal', icon: HardHat, color: 'bg-gray-500' },
    { id: 'plastic', name: 'Plastik/Kauçuk', icon: Package, color: 'bg-pink-500' }
  ]

  // Bölgeler
  const regions = [
    { id: 'marmara', name: 'Marmara', factories: ['İstanbul', 'Bursa', 'Kocaeli', 'Tekirdağ'] },
    { id: 'ic-anadolu', name: 'İç Anadolu', factories: ['Ankara', 'Kayseri', 'Konya', 'Eskişehir'] },
    { id: 'ege', name: 'Ege', factories: ['İzmir', 'Denizli'] },
    { id: 'akdeniz', name: 'Akdeniz', factories: ['Antalya', 'Mersin', 'Adana'] },
    { id: 'karadeniz', name: 'Karadeniz', factories: ['Samsun', 'Trabzon'] },
    { id: 'dogu-anadolu', name: 'Doğu Anadolu', factories: ['Erzurum', 'Malatya'] },
    { id: 'guneydogu', name: 'Güneydoğu', factories: ['Gaziantep'] }
  ]

  useEffect(() => {
    fetchIndustryData()
  }, [userRole, factoryId, period, selectedSector, selectedRegion])

  // Periyot ve fabrika filtrelerini props'tan al
  const currentPeriod = period || '2024-Q4'
  const currentFactoryId = factoryId || ''

  const fetchIndustryData = async () => {
    setLoading(true)
    console.log('🏭 Fetching industry data with:', { 
      currentPeriod, 
      currentFactoryId, 
      selectedSector, 
      selectedRegion,
      userRole,
      isFactorySelected: !!currentFactoryId
    })
    try {
      // Eğer belirli bir fabrika seçilmişse, o fabrikanın kendi analiz verilerini kullan
      if (currentFactoryId && userRole === 'UPPER_MANAGEMENT') {
        // Model fabrika kullanıcısının gördüğü verilerle aynı endpoint'leri kullan
        const industryResponse = await fetch(`/api/analytics/industry/overview?period=${currentPeriod}&factoryId=${currentFactoryId}`)
        const industryResult = await industryResponse.json()
        setIndustryData(industryResult)

        const sectorResponse = await fetch(`/api/analytics/industry/sectors?period=${currentPeriod}&sector=${selectedSector}&factoryId=${currentFactoryId}`)
        const sectorResult = await sectorResponse.json()
        setSectorData(sectorResult)

        const regionalResponse = await fetch(`/api/analytics/industry/regions?period=${currentPeriod}&region=${selectedRegion}&factoryId=${currentFactoryId}`)
        const regionalResult = await regionalResponse.json()
        setRegionalData(regionalResult)
      } else {
        // Genel sanayi analizi (tüm fabrikalar)
        const industryResponse = await fetch(`/api/analytics/industry/overview?period=${currentPeriod}&factoryId=${currentFactoryId}`)
        const industryResult = await industryResponse.json()
        setIndustryData(industryResult)

        const sectorResponse = await fetch(`/api/analytics/industry/sectors?period=${currentPeriod}&sector=${selectedSector}&factoryId=${currentFactoryId}`)
        const sectorResult = await sectorResponse.json()
        setSectorData(sectorResult)

        const regionalResponse = await fetch(`/api/analytics/industry/regions?period=${currentPeriod}&region=${selectedRegion}&factoryId=${currentFactoryId}`)
        const regionalResult = await regionalResponse.json()
        setRegionalData(regionalResult)
      }

    } catch (error) {
      console.error('Industry data fetch error:', error)
      // Mock data for development
      setIndustryData({
        totalFactories: 15,
        activeFactories: 14,
        avgKPIScore: 78.5,
        sectorDistribution: [
          { sector: 'Otomotiv', count: 3, performance: 82.3 },
          { sector: 'Tekstil', count: 2, performance: 75.8 },
          { sector: 'Gıda/İçecek', count: 3, performance: 79.2 },
          { sector: 'Makine', count: 2, performance: 81.1 },
          { sector: 'Elektrik-Elektronik', count: 2, performance: 76.9 },
          { sector: 'Kimya', count: 1, performance: 77.4 },
          { sector: 'Metal', count: 1, performance: 80.2 },
          { sector: 'Plastik/Kauçuk', count: 1, performance: 74.6 }
        ],
        regionalPerformance: [
          { region: 'Marmara', factories: 4, avgScore: 80.1 },
          { region: 'İç Anadolu', factories: 4, avgScore: 78.9 },
          { region: 'Ege', factories: 2, avgScore: 77.2 },
          { region: 'Akdeniz', factories: 3, avgScore: 76.8 },
          { region: 'Karadeniz', factories: 2, avgScore: 79.5 }
        ]
      })
    } finally {
      setLoading(false)
    }
  }

  const getPerformanceColor = (score: number) => {
    if (score >= 85) return 'text-green-600'
    if (score >= 75) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPerformanceIcon = (score: number) => {
    if (score >= 85) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (score >= 75) return <Activity className="h-4 w-4 text-yellow-500" />
    return <TrendingDown className="h-4 w-4 text-red-500" />
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Sanayi analizi yükleniyor...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Model Fabrika Kullanıcısı için Özel Görünüm */}
      {userRole === 'MODEL_FACTORY' ? (
        <>
          {/* Model Fabrika Performans Özeti */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Factory className="h-5 w-5" />
                Model Fabrika Performans Özeti
              </CardTitle>
              <CardDescription>
                {factoryId ? 'Seçili model fabrikanın performans durumu ve sektörel analizi' : 'Model fabrika performans durumu'}
              </CardDescription>
            </CardHeader>
        <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">
                  {industryData?.totalFactories || 1}
                </div>
                <div className="text-sm text-gray-600">Model Fabrika</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">
                  {industryData?.avgKPIScore?.toFixed(1) || '0.0'}%
                </div>
                <div className="text-sm text-gray-600">KPI Başarı Oranı</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">
                  {industryData?.sectorDistribution?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Aktif Sektör</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-3xl font-bold text-orange-600">
                  {industryData?.regionalPerformance?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Bölge Kapsamı</div>
              </div>
            </div>

                      {/* Sektörel Dağılım */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Sektörel Performans Analizi
              </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {industryData?.sectorDistribution?.map((sector: any, index: number) => (
                <div key={index} className="p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{sector.sector}</h4>
                    {getPerformanceIcon(sector.performance)}
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{sector.count} fabrika</span>
                    <span className={getPerformanceColor(sector.performance || 0)}>
                      {(sector.performance || 0).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${Math.min(100, sector.performance || 0)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

                      {/* Bölgesel Performans */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Bölgesel Etki Analizi
              </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {industryData?.regionalPerformance?.map((region: any, index: number) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{region.region}</h4>
                    {getPerformanceIcon(region.avgScore)}
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">{region.factories} fabrika</span>
                    <span className={getPerformanceColor(region.avgScore || 0)}>
                      {(region.avgScore || 0).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${Math.min(100, region.avgScore || 0)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sektörel Detay Analizi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Sektörel Detay Analizi
          </CardTitle>
          <CardDescription>
            Seçili sektörün detaylı performans analizi ve trendleri
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Sektör Filtresi */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sektör Seçin
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
              <Button
                variant={selectedSector === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedSector('all')}
                className="text-xs"
              >
                Tümü
              </Button>
              {sectors.map((sector) => (
                <Button
                  key={sector.id}
                  variant={selectedSector === sector.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedSector(sector.id)}
                  className="text-xs"
                >
                  {sector.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Sektör Detayları */}
          {selectedSector !== 'all' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Katılımcı Sayısı</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">1,247</div>
                  <div className="text-sm text-gray-600">+12% geçen aya göre</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Hedef Başarısı</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">87.3%</div>
                  <div className="text-sm text-gray-600">+5.2% geçen aya göre</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="h-4 w-4 text-purple-600" />
                    <span className="font-medium">Sektör Sıralaması</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">#2</div>
                  <div className="text-sm text-gray-600">8 sektör arasında</div>
                </div>
              </div>

              {/* Sektör KPI'ları */}
              <div>
                <h4 className="font-medium mb-3">Sektör KPI Performansı</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { name: 'Teknoloji Transferi', score: 84.2, trend: '+3.1%' },
                    { name: 'Eğitim Katılımı', score: 91.5, trend: '+7.8%' },
                    { name: 'Sürdürülebilirlik', score: 76.8, trend: '+2.4%' },
                    { name: 'İnovasyon', score: 79.3, trend: '+5.6%' }
                  ].map((kpi, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                                             <div className="flex justify-between items-center mb-2">
                         <span className="font-medium">{kpi.name}</span>
                         <span className={getPerformanceColor(kpi.score || 0)}>
                           {(kpi.score || 0).toFixed(1)}%
                         </span>
                       </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Trend</span>
                        <span className="text-green-600">{kpi.trend}</span>
                      </div>
                                             <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                         <div 
                           className="bg-blue-600 h-2 rounded-full" 
                           style={{ width: `${Math.min(100, kpi.score || 0)}%` }}
                         ></div>
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sanayi Trendleri */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Sanayi Trendleri ve Öngörüler
          </CardTitle>
          <CardDescription>
            Sektörel gelişim trendleri ve gelecek dönem öngörüleri
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Dijital Dönüşüm</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">+23%</div>
              <div className="text-sm text-gray-600">Son 6 ay</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Leaf className="h-4 w-4 text-green-600" />
                <span className="font-medium">Yeşil Dönüşüm</span>
              </div>
              <div className="text-2xl font-bold text-green-600">+18%</div>
              <div className="text-sm text-gray-600">Son 6 ay</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-purple-600" />
                <span className="font-medium">Dayanıklılık</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">+15%</div>
              <div className="text-sm text-gray-600">Son 6 ay</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <span className="font-medium">Verimlilik</span>
              </div>
              <div className="text-2xl font-bold text-orange-600">+12%</div>
              <div className="text-sm text-gray-600">Son 6 ay</div>
            </div>
          </div>

          {/* Trend Grafiği */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-3">6 Aylık Trend Analizi</h4>
            <div className="h-32 flex items-end justify-between gap-2">
              {[65, 72, 68, 75, 78, 82].map((value, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-blue-600 rounded-t"
                    style={{ height: `${value}%` }}
                  ></div>
                  <span className="text-xs text-gray-600 mt-1">
                    {['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz'][index]}
                  </span>
                </div>
              ))}
            </div>
                      </div>
          </CardContent>
        </Card>
        </>
      ) : (
        <>
          {/* Üst Yönetim için Sanayi Genel Bakış */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Factory className="h-5 w-5" />
                {currentFactoryId ? 'Seçili Model Fabrika Analizi' : 'Sanayi Genel Bakış'}
              </CardTitle>
              <CardDescription>
                {currentFactoryId 
                  ? `Seçili model fabrikanın performans durumu ve sektörel analizi (Fabrika ID: ${currentFactoryId})`
                  : 'Model fabrika ekosisteminin genel performans durumu ve sektörel dağılımı'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">
                    {currentFactoryId ? (industryData?.totalFactories || 1) : (industryData?.totalFactories || 0)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {currentFactoryId ? 'Model Fabrika' : 'Toplam Model Fabrika'}
                  </div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">
                    {currentFactoryId ? (industryData?.avgKPIScore?.toFixed(1) || '0.0') : (industryData?.activeFactories || 0)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {currentFactoryId ? 'KPI Başarı Oranı' : 'Aktif Fabrika'}
                  </div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600">
                    {currentFactoryId ? (industryData?.sectorDistribution?.length || 0) : (industryData?.avgKPIScore?.toFixed(1) || '0.0')}%
                  </div>
                  <div className="text-sm text-gray-600">
                    {currentFactoryId ? 'Aktif Sektör' : 'Ortalama KPI Skoru'}
                  </div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-3xl font-bold text-orange-600">
                    {currentFactoryId ? (industryData?.regionalPerformance?.length || 0) : sectors.length}
                  </div>
                  <div className="text-sm text-gray-600">
                    {currentFactoryId ? 'Bölge Kapsamı' : 'Sektör Çeşitliliği'}
                  </div>
                </div>
              </div>

              {/* Sektörel Dağılım */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  {currentFactoryId ? 'Sektörel Performans Analizi' : 'Sektörel Dağılım ve Performans'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {industryData?.sectorDistribution?.map((sector: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{sector.sector}</h4>
                        {getPerformanceIcon(sector.performance)}
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{sector.count} fabrika</span>
                        <span className={getPerformanceColor(sector.performance || 0)}>
                          {(sector.performance || 0).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${Math.min(100, sector.performance || 0)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bölgesel Performans */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  {currentFactoryId ? 'Bölgesel Etki Analizi' : 'Bölgesel Performans Analizi'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {industryData?.regionalPerformance?.map((region: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{region.region}</h4>
                        {getPerformanceIcon(region.avgScore)}
                      </div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">{region.factories} fabrika</span>
                        <span className={getPerformanceColor(region.avgScore || 0)}>
                          {(region.avgScore || 0).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${Math.min(100, region.avgScore || 0)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
                 </>
       )}

      {/* Sektörel Detay Analizi - Her iki kullanıcı için */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Sektörel Detay Analizi
          </CardTitle>
          <CardDescription>
            {userRole === 'MODEL_FACTORY' || currentFactoryId
              ? 'Model fabrikanın sektörel performans detayları' 
              : 'Seçili sektörün detaylı performans analizi ve trendleri'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Sektör Filtresi */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sektör Seçin
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
              <Button
                variant={selectedSector === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedSector('all')}
                className="text-xs"
              >
                Tümü
              </Button>
              {sectors.map((sector) => (
                <Button
                  key={sector.id}
                  variant={selectedSector === sector.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedSector(sector.id)}
                  className="text-xs"
                >
                  {sector.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Sektör Detayları */}
          {selectedSector !== 'all' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Katılımcı Sayısı</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">1,247</div>
                  <div className="text-sm text-gray-600">+12% geçen aya göre</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Hedef Başarısı</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">87.3%</div>
                  <div className="text-sm text-gray-600">+5.2% geçen aya göre</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="h-4 w-4 text-purple-600" />
                    <span className="font-medium">Sektör Sıralaması</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">#2</div>
                  <div className="text-sm text-gray-600">8 sektör arasında</div>
                </div>
              </div>

              {/* Sektör KPI'ları */}
              <div>
                <h4 className="font-medium mb-3">Sektör KPI Performansı</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { name: 'Teknoloji Transferi', score: 84.2, trend: '+3.1%' },
                    { name: 'Eğitim Katılımı', score: 91.5, trend: '+7.8%' },
                    { name: 'Sürdürülebilirlik', score: 76.8, trend: '+2.4%' },
                    { name: 'İnovasyon', score: 79.3, trend: '+5.6%' }
                  ].map((kpi, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{kpi.name}</span>
                        <span className={getPerformanceColor(kpi.score || 0)}>
                          {(kpi.score || 0).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Trend</span>
                        <span className="text-green-600">{kpi.trend}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${Math.min(100, kpi.score || 0)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sanayi Trendleri - Her iki kullanıcı için */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {userRole === 'MODEL_FACTORY' || currentFactoryId ? 'Model Fabrika Trendleri' : 'Sanayi Trendleri ve Öngörüler'}
          </CardTitle>
          <CardDescription>
            {userRole === 'MODEL_FACTORY' || currentFactoryId
              ? 'Model fabrikanın gelişim trendleri ve öngörüleri' 
              : 'Sektörel gelişim trendleri ve gelecek dönem öngörüleri'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Dijital Dönüşüm</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">+23%</div>
              <div className="text-sm text-gray-600">Son 6 ay</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Leaf className="h-4 w-4 text-green-600" />
                <span className="font-medium">Yeşil Dönüşüm</span>
              </div>
              <div className="text-2xl font-bold text-green-600">+18%</div>
              <div className="text-sm text-gray-600">Son 6 ay</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-purple-600" />
                <span className="font-medium">Dayanıklılık</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">+15%</div>
              <div className="text-sm text-gray-600">Son 6 ay</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <span className="font-medium">Verimlilik</span>
              </div>
              <div className="text-2xl font-bold text-orange-600">+12%</div>
              <div className="text-sm text-gray-600">Son 6 ay</div>
            </div>
          </div>

          {/* Trend Grafiği */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-3">6 Aylık Trend Analizi</h4>
            <div className="h-32 flex items-end justify-between gap-2">
              {[65, 72, 68, 75, 78, 82].map((value, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-blue-600 rounded-t"
                    style={{ height: `${value}%` }}
                  ></div>
                  <span className="text-xs text-gray-600 mt-1">
                    {['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz'][index]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Icon components for sectors
const Car = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const Scissors = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const Coffee = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const Settings = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const HardHat = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
)

const Package = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
)

const Beaker = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
)
