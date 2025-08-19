'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Palette, TrendingUp, TrendingDown, Target } from 'lucide-react'

interface ThemeData {
  theme: string
  themeName: string
  color: string
  factoryScore: number
  industryAverage: number
  percentile: number
  kpiCount: number
  performance: 'above' | 'below'
  gap: number
}

interface ThemeComparisonCardProps {
  data: {
    themeComparison: ThemeData[]
    summary: {
      overallScore: number
      industryAverage: number
      overallPerformance: 'above' | 'below'
      strongestTheme: { code: string; name: string; score: number }
      weakestTheme: { code: string; name: string; score: number }
    }
    period: string
  } | null
  loading?: boolean
}

export default function ThemeComparisonCard({ data, loading }: ThemeComparisonCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-purple-500" />
            Tema Bazlı Performans
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="p-4 bg-gray-50 rounded-lg animate-pulse">
                <div className="flex justify-between items-center mb-3">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
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
            <Palette className="h-5 w-5 text-purple-500" />
            Tema Bazlı Performans
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">Tema karşılaştırma verisi yüklenemedi</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-purple-500" />
          Tema Bazlı Performans Karşılaştırması
        </CardTitle>
        <CardDescription>
          {data.period} dönemi - Sektör ortalaması ile karşılaştırma
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Genel Durum */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900">Genel Performans</h4>
            <div className="flex items-center gap-1">
              {data.summary.overallPerformance === 'above' ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span className={`text-sm font-medium ${
                data.summary.overallPerformance === 'above' ? 'text-green-600' : 'text-red-600'
              }`}>
                {data.summary.overallPerformance === 'above' ? 'Sektör Üstü' : 'Sektör Altı'}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold text-blue-600">{data.summary.overallScore.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Sizin Skorunuz</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-600">{data.summary.industryAverage.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Sektör Ortalaması</div>
            </div>
          </div>
        </div>

        {/* En İyi/En Kötü Temalar */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-900">En Güçlü Tema</span>
            </div>
            <div className="font-semibold text-green-800">{data.summary.strongestTheme.name}</div>
            <div className="text-sm text-green-600">{data.summary.strongestTheme.score.toFixed(1)}% başarı</div>
          </div>
          
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-orange-600" />
              <span className="font-medium text-orange-900">Gelişim Alanı</span>
            </div>
            <div className="font-semibold text-orange-800">{data.summary.weakestTheme.name}</div>
            <div className="text-sm text-orange-600">{data.summary.weakestTheme.score.toFixed(1)}% başarı</div>
          </div>
        </div>

        {/* Tema Detayları */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900">Tema Bazlı Detaylar</h4>
          
          {data.themeComparison.map((theme) => (
            <div key={theme.theme} className="p-4 border rounded-lg">
              {/* Tema Başlığı */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: theme.color }}
                  ></div>
                  <span className="font-medium text-gray-900">{theme.themeName}</span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {theme.kpiCount} KPI
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">{theme.factoryScore.toFixed(1)}%</div>
                  <div className="text-xs text-gray-500">%{theme.percentile} dilim</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className="h-2 rounded-full"
                    style={{ 
                      width: `${Math.min(theme.factoryScore, 100)}%`,
                      backgroundColor: theme.color
                    }}
                  ></div>
                </div>
                
                {/* Sektör Ortalaması İşareti */}
                <div 
                  className="absolute top-0 h-2 w-0.5 bg-gray-600"
                  style={{ left: `${Math.min(theme.industryAverage, 100)}%` }}
                ></div>
              </div>

              {/* Karşılaştırma */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-gray-600">
                    Sektör Ort: {theme.industryAverage.toFixed(1)}%
                  </span>
                  <div className="flex items-center gap-1">
                    {theme.performance === 'above' ? (
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-600" />
                    )}
                    <span className={`font-medium ${
                      theme.performance === 'above' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {theme.gap > 0 ? '+' : ''}{theme.gap.toFixed(1)} puan
                    </span>
                  </div>
                </div>
                
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  theme.performance === 'above' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {theme.performance === 'above' ? 'Sektör Üstü' : 'Sektör Altı'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Öneriler */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h5 className="font-medium text-blue-900 mb-2">💡 Öneriler</h5>
          <ul className="text-sm text-blue-800 space-y-1">
            {data.summary.overallPerformance === 'below' && (
              <li>• Genel performansı artırmak için en zayıf temaya odaklanın</li>
            )}
            <li>• {data.summary.weakestTheme.name} alanında KPI'larınızı gözden geçirin</li>
            <li>• {data.summary.strongestTheme.name} alanındaki başarıyı diğer temalara aktarın</li>
            <li>• Sektör ortalamasının üstünde olan temalardan benchmark alın</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
