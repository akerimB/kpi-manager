'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Medal, Award, TrendingUp, TrendingDown } from 'lucide-react'

interface RankingData {
  factoryId: string
  factoryCode: string
  factoryName: string
  averageScore: number
  rank: number
  percentile: number
  performanceLevel: 'platinum' | 'gold' | 'silver' | 'bronze'
  achievedKpis: number
  totalKpis: number
  region: string
}

interface FactoryRankingCardProps {
  data: {
    ranking: RankingData[]
    stats: {
      totalFactories: number
      averageScore: number
      topPerformers: number
      period: string
      theme: string
      kpiCount: number
    }
  } | null
  currentFactoryId?: string
  loading?: boolean
}

export default function FactoryRankingCard({ data, currentFactoryId, loading }: FactoryRankingCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Fabrika Sıralaması
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="w-16 h-6 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Fabrika Sıralaması
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">Sıralama verisi yüklenemedi</p>
        </CardContent>
      </Card>
    )
  }

  const getPerformanceIcon = (level: string) => {
    switch (level) {
      case 'platinum': return <Trophy className="h-5 w-5 text-purple-500" />
      case 'gold': return <Medal className="h-5 w-5 text-yellow-500" />
      case 'silver': return <Award className="h-5 w-5 text-gray-400" />
      default: return <Award className="h-5 w-5 text-amber-600" />
    }
  }

  const getPerformanceColor = (level: string) => {
    switch (level) {
      case 'platinum': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'gold': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'silver': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-amber-100 text-amber-800 border-amber-200'
    }
  }

  const currentFactory = data.ranking.find(f => f.factoryId === currentFactoryId)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Fabrika Performans Sıralaması
        </CardTitle>
        <CardDescription>
          {data.stats.period} dönemi - {data.stats.totalFactories} fabrika karşılaştırması
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Genel İstatistikler */}
        <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{data.stats.averageScore.toFixed(1)}%</div>
            <div className="text-sm text-gray-600">Ortalama Skor</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{data.stats.topPerformers}</div>
            <div className="text-sm text-gray-600">Başarılı Fabrika</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{data.stats.kpiCount}</div>
            <div className="text-sm text-gray-600">KPI Sayısı</div>
          </div>
        </div>

        {/* Mevcut Fabrika Durumu (eğer varsa) */}
        {currentFactory && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full font-bold">
                  {currentFactory.rank}
                </div>
                <div>
                  <div className="font-semibold text-blue-900">Sizin Sıralamanız</div>
                  <div className="text-sm text-blue-700">
                    {currentFactory.factoryName} - {currentFactory.averageScore.toFixed(1)}% skor
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPerformanceColor(currentFactory.performanceLevel)}`}>
                  {currentFactory.performanceLevel.toUpperCase()}
                </span>
                <div className="text-sm text-blue-600">
                  %{currentFactory.percentile} dilim
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sıralama Listesi */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900 mb-3">Top 10 Fabrika</h4>
          {data.ranking.slice(0, 10).map((factory) => {
            const isCurrentFactory = factory.factoryId === currentFactoryId
            
            return (
              <div 
                key={factory.factoryId} 
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  isCurrentFactory 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                {/* Sıra */}
                <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                  factory.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                  factory.rank === 2 ? 'bg-gray-100 text-gray-800' :
                  factory.rank === 3 ? 'bg-amber-100 text-amber-800' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {factory.rank}
                </div>

                {/* Performans Seviyesi */}
                <div className="flex items-center gap-1">
                  {getPerformanceIcon(factory.performanceLevel)}
                </div>

                {/* Fabrika Bilgileri */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {factory.factoryName}
                    {isCurrentFactory && <span className="ml-2 text-blue-600 text-sm">(Siz)</span>}
                  </div>
                  <div className="text-sm text-gray-500">
                    {factory.region} • {factory.achievedKpis}/{factory.totalKpis} KPI
                  </div>
                </div>

                {/* Skor */}
                <div className="text-right">
                  <div className="font-bold text-lg text-gray-900">
                    {factory.averageScore.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500">
                    %{factory.percentile} dilim
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Daha fazla göster butonu */}
        {data.ranking.length > 10 && (
          <div className="mt-4 text-center">
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Tüm Sıralamayı Göster ({data.ranking.length} fabrika)
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
