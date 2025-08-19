'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Users, TrendingUp, MapPin, Factory } from 'lucide-react'

interface SectorData {
  sectorName: string
  metrics: {
    evidenceCount: number
    firmCount: number
    totalEmployees: number
    totalRevenue: number
    exportCount: number
    avgKpiScore: number
    factoryWeight: number
  }
  geographic: {
    provinces: string[]
    zoneTypes: string[]
  }
}

interface SectorImpactData {
  factory: {
    id: string
    name: string
    code: string
  }
  summary: {
    totalSectors: number
    totalEvidences: number
    totalFirms: number
    totalEmployees: number
    totalRevenue: number
    exportingFirms: number
    avgFactoryWeight: number
  }
  sectorImpact: SectorData[]
  metadata: {
    period: string
    calculatedAt: string
  }
}

interface Props {
  data: SectorImpactData | null
  loading?: boolean
}

export default function SectorImpactChart({ data, loading }: Props) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="w-48 h-6 bg-gray-300 rounded animate-pulse"></div>
          <div className="w-64 h-4 bg-gray-200 rounded animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-full h-24 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getImpactColor = (weight: number) => {
    if (weight >= 0.3) return 'bg-green-500'
    if (weight >= 0.15) return 'bg-yellow-500'
    if (weight >= 0.05) return 'bg-orange-500'
    return 'bg-gray-400'
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100'
    if (score >= 70) return 'text-yellow-600 bg-yellow-100'
    if (score > 0) return 'text-red-600 bg-red-100'
    return 'text-gray-600 bg-gray-100'
  }

  if (!data || !data.summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-500" />
            Sektörel Etki Analizi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">Sektörel etki verisi yüklenemedi</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Özet Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{data.summary.totalSectors}</p>
                <p className="text-xs text-gray-600">Dokunulan Sektör</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Factory className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{data.summary.totalFirms}</p>
                <p className="text-xs text-gray-600">Firma</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{formatNumber(data.summary.totalEmployees)}</p>
                <p className="text-xs text-gray-600">Çalışan</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{formatNumber(data.summary.totalRevenue / 1000000)}M</p>
                <p className="text-xs text-gray-600">Ciro (TL)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sektörel Etki Detayı */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>Sektörel Etki Analizi</span>
          </CardTitle>
          <CardDescription>
            {data.factory.name} Model Fabrika'nın sektörel dokunuş analizi • Dönem: {data.metadata.period}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.sectorImpact.length > 0 ? (
            <div className="space-y-4">
              {data.sectorImpact.map((sector, index) => (
                <div key={sector.sectorName} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="font-medium text-gray-900">{sector.sectorName}</span>
                        <div className="flex items-center space-x-2">
                          <div 
                            className={`w-3 h-3 rounded-full ${getImpactColor(sector.metrics.factoryWeight)}`}
                            title={`Fabrika ağırlığı: ${(sector.metrics.factoryWeight * 100).toFixed(1)}%`}
                          ></div>
                          <span className="text-xs text-gray-500">
                            %{(sector.metrics.factoryWeight * 100).toFixed(1)} ağırlık
                          </span>
                        </div>
                      </div>
                      
                      {/* Coğrafi Bilgi */}
                      {sector.geographic.provinces.length > 0 && (
                        <div className="flex items-center space-x-1 mb-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="text-xs text-gray-600">
                            {sector.geographic.provinces.slice(0, 3).join(', ')}
                            {sector.geographic.provinces.length > 3 && ` +${sector.geographic.provinces.length - 3}`}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* KPI Skoru */}
                    {sector.metrics.avgKpiScore > 0 && (
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(sector.metrics.avgKpiScore)}`}>
                        KPI: {sector.metrics.avgKpiScore}%
                      </div>
                    )}
                  </div>

                  {/* Metrikler Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="bg-blue-50 p-3 rounded">
                      <p className="text-lg font-bold text-blue-700">{sector.metrics.evidenceCount}</p>
                      <p className="text-xs text-blue-600">Kanıt</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded">
                      <p className="text-lg font-bold text-green-700">{sector.metrics.firmCount}</p>
                      <p className="text-xs text-green-600">Firma</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded">
                      <p className="text-lg font-bold text-purple-700">{formatNumber(sector.metrics.totalEmployees)}</p>
                      <p className="text-xs text-purple-600">Çalışan</p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded">
                      <p className="text-lg font-bold text-orange-700">
                        {sector.metrics.totalRevenue > 0 ? formatNumber(sector.metrics.totalRevenue / 1000000) + 'M' : '-'}
                      </p>
                      <p className="text-xs text-orange-600">Ciro (TL)</p>
                    </div>
                  </div>

                  {/* İhracat Bilgisi */}
                  {sector.metrics.exportCount > 0 && (
                    <div className="mt-3 flex items-center justify-between bg-yellow-50 p-2 rounded">
                      <span className="text-sm text-yellow-700">📦 İhracat Yapan Firmalar</span>
                      <span className="text-sm font-medium text-yellow-800">
                        {sector.metrics.exportCount}/{sector.metrics.firmCount}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Building2 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Henüz Sektörel Veri Yok</h3>
              <p className="text-sm">
                Bu dönem için sektörel etki verisi bulunmuyor. 
                KPI kanıtları yüklendikçe sektörel analiz otomatik oluşacak.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sektör Ağırlık Dağılımı */}
      <Card>
        <CardHeader>
          <CardTitle>Fabrika Sektör Odağı</CardTitle>
          <CardDescription>Model fabrikasının hedef sektör ağırlık dağılımı</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.sectorImpact
              .sort((a, b) => b.metrics.factoryWeight - a.metrics.factoryWeight)
              .slice(0, 8)
              .map((sector) => (
                <div key={sector.sectorName} className="flex items-center space-x-3">
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        {sector.sectorName}
                      </span>
                      <span className="text-sm text-gray-500">
                        %{(sector.metrics.factoryWeight * 100).toFixed(1)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getImpactColor(sector.metrics.factoryWeight)}`}
                        style={{ width: `${sector.metrics.factoryWeight * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
