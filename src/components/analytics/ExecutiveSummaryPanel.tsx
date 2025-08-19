'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react'

interface ExecutiveSummaryPanelProps {
  period?: string
  userRole: string
}

interface ExecutiveSummaryData {
  overallHealth: {
    score: number
    status: 'excellent' | 'good' | 'warning' | 'critical'
    trend: number
  }
  keyFindings: Array<{
    category: string
    finding: string
    impact: 'high' | 'medium' | 'low'
    recommendation: string
  }>
  strategicAlignment: {
    sa1: { name: string; score: number; trend: number }
    sa2: { name: string; score: number; trend: number }
    sa3: { name: string; score: number; trend: number }
    sa4: { name: string; score: number; trend: number }
  }
  riskAreas: Array<{
    area: string
    risk: string
    factories: string[]
    severity: 'high' | 'medium' | 'low'
  }>
  topPerformers: Array<{
    factory: string
    score: number
    improvement: number
  }>
}

export default function ExecutiveSummaryPanel({ period = '2024-Q4', userRole }: ExecutiveSummaryPanelProps) {
  const [data, setData] = useState<ExecutiveSummaryData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/analytics/executive-summary?period=${period}&userRole=${userRole}`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const summaryData = await response.json()
        
        // Validate data structure
        if (summaryData && summaryData.overallHealth && summaryData.overallHealth.status) {
          setData(summaryData)
        } else {
          console.error('Invalid data structure received:', summaryData)
          setData(null)
        }
      } catch (error) {
        console.error('Executive summary fetch error:', error)
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    if (userRole === 'UPPER_MANAGEMENT' || userRole === 'ADMIN') {
      fetchData()
    }
  }, [period, userRole])

  if (userRole !== 'UPPER_MANAGEMENT' && userRole !== 'ADMIN') {
    return null
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Yönetici Özeti</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return null
  }

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100'
      case 'good': return 'text-blue-600 bg-blue-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      case 'critical': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'medium': return <TrendingUp className="h-4 w-4 text-yellow-500" />
      case 'low': return <CheckCircle className="h-4 w-4 text-green-500" />
      default: return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Genel Sağlık Durumu */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Genel Sistem Sağlığı</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getHealthColor(data.overallHealth.status)}`}>
              {data.overallHealth.score}% - {data.overallHealth.status.toUpperCase()}
            </span>
          </CardTitle>
          <CardDescription>
            Tüm model fabrikalar genelinde sistemik performans değerlendirmesi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full ${
                    data.overallHealth.score >= 80 ? 'bg-green-500' :
                    data.overallHealth.score >= 60 ? 'bg-blue-500' :
                    data.overallHealth.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${data.overallHealth.score}%` }}
                ></div>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              {data.overallHealth.trend >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-sm font-medium ${data.overallHealth.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.overallHealth.trend >= 0 ? '+' : ''}{data.overallHealth.trend}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stratejik Amaç Hizalaması */}
      <Card>
        <CardHeader>
          <CardTitle>Stratejik Amaç Performansı</CardTitle>
          <CardDescription>SA bazında başarım durumu</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(data.strategicAlignment).map(([saCode, sa]) => (
              <div key={saCode} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{sa.name}</span>
                  <div className="flex items-center space-x-1">
                    {sa.trend >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    <span className={`text-xs ${sa.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {sa.trend >= 0 ? '+' : ''}{sa.trend}%
                    </span>
                  </div>
                </div>
                <div className="text-2xl font-bold mb-1">{sa.score}%</div>
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div 
                    className="bg-blue-500 h-1 rounded-full" 
                    style={{ width: `${sa.score}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Anahtar Bulgular */}
      <Card>
        <CardHeader>
          <CardTitle>Anahtar Bulgular ve Öneriler</CardTitle>
          <CardDescription>Kritik konular ve aksiyon önerileri</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.keyFindings.map((finding, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="flex items-center space-x-2 mb-1">
                  {getImpactIcon(finding.impact)}
                  <span className="font-medium text-sm text-gray-600">{finding.category}</span>
                </div>
                <div className="font-medium mb-1">{finding.finding}</div>
                <div className="text-sm text-gray-600">
                  <strong>Öneri:</strong> {finding.recommendation}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Alanları */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Alanları</CardTitle>
            <CardDescription>Dikkat gerektiren konular</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.riskAreas.map((risk, index) => (
                <div key={index} className={`p-3 rounded-lg border-l-4 ${
                  risk.severity === 'high' ? 'border-red-500 bg-red-50' :
                  risk.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                  'border-blue-500 bg-blue-50'
                }`}>
                  <div className="font-medium text-sm">{risk.area}</div>
                  <div className="text-sm text-gray-600 mb-2">{risk.risk}</div>
                  <div className="text-xs text-gray-500">
                    Etkilenen: {risk.factories.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* En İyi Performans Gösterenler */}
        <Card>
          <CardHeader>
            <CardTitle>Öne Çıkan Fabrikalar</CardTitle>
            <CardDescription>En iyi performans gösteren model fabrikalar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topPerformers.map((performer, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{performer.factory}</div>
                      <div className="text-sm text-green-600">
                        +{performer.improvement}% iyileşme
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">{performer.score}%</div>
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
