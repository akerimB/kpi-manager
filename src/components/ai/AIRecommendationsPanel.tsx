'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bot, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Target, Lightbulb, Brain, Zap } from 'lucide-react'

interface AIRecommendation {
  priority: 'high' | 'medium' | 'low'
  type: 'improvement' | 'maintenance' | 'risk_mitigation'
  title: string
  description: string
  expectedImpact: string
  timeframe: string
  actionItems: string[]
}

interface KPIAnalysis {
  kpiNumber: number
  description: string
  currentValue: number
  targetValue: number
  achievementRate: number
  trend: {
    direction: 'increasing' | 'decreasing' | 'stable'
    changePercent: number
    confidence: number
  }
  forecast: {
    nextPeriod: number
    confidence: number
    methodology: string
  }
  recommendations: AIRecommendation[]
  riskFactors: {
    level: 'high' | 'medium' | 'low'
    description: string
    probability: number
    impact: string
  }[]
}

interface AIRecommendationsPanelProps {
  factoryId: string
  period?: string
}

export default function AIRecommendationsPanel({ factoryId, period = '2024-Q4' }: AIRecommendationsPanelProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'overview' | 'recommendations' | 'forecasts' | 'risks'>('overview')

  const fetchRecommendations = async () => {
    if (!factoryId) return
    
    try {
      setLoading(true)
      const response = await fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factoryId, period })
      })
      
      if (response.ok) {
        const result = await response.json()
        setData(result)
      } else {
        console.error('AI recommendations API error:', response.status)
      }
    } catch (error) {
      console.error('AI recommendations fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecommendations()
  }, [factoryId, period])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'improvement': return <TrendingUp className="h-4 w-4 text-blue-600" />
      case 'risk_mitigation': return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'maintenance': return <CheckCircle className="h-4 w-4 text-green-600" />
      default: return <Target className="h-4 w-4 text-gray-600" />
    }
  }

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'increasing': return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'decreasing': return <TrendingDown className="h-4 w-4 text-red-600" />
      default: return <div className="h-4 w-4 bg-gray-400 rounded-full"></div>
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-purple-600" />
            AI Önerileri ve Tahminler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Brain className="h-12 w-12 text-purple-400 mx-auto mb-4 animate-pulse" />
              <p className="text-gray-600">AI analizi yapılıyor...</p>
            </div>
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
            <Bot className="h-5 w-5 text-purple-600" />
            AI Önerileri ve Tahminler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Bot className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">AI önerileri yüklenemedi</p>
            <button
              onClick={fetchRecommendations}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Tekrar Dene
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-purple-600" />
              AI Önerileri ve Tahminler
            </CardTitle>
            <CardDescription>
              {data.factory.name} • {data.period} dönemi • {data.summary.totalKpis} KPI analizi
            </CardDescription>
          </div>
          <button
            onClick={fetchRecommendations}
            className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800"
          >
            <Zap className="h-4 w-4" />
            Yenile
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'overview', label: 'Özet', icon: Brain },
            { id: 'recommendations', label: 'Öneriler', icon: Lightbulb },
            { id: 'forecasts', label: 'Tahminler', icon: TrendingUp },
            { id: 'risks', label: 'Riskler', icon: AlertTriangle }
          ].map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedTab === tab.id
                    ? 'bg-white text-purple-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </CardHeader>

      <CardContent>
        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{data.summary.totalKpis}</div>
                <div className="text-sm text-blue-800">Analiz Edilen KPI</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{data.summary.highRiskKpis}</div>
                <div className="text-sm text-red-800">Yüksek Risk</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{data.summary.improvingKpis}</div>
                <div className="text-sm text-green-800">İyileşen</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{data.summary.underperformingKpis}</div>
                <div className="text-sm text-orange-800">Düşük Performans</div>
              </div>
            </div>

            {/* Overall Insights */}
            {data.overallInsights && data.overallInsights.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Genel Değerlendirme</h4>
                {data.overallInsights.map((insight: any, index: number) => (
                  <div key={index} className={`p-4 rounded-lg border-l-4 ${
                    insight.type === 'warning' ? 'bg-red-50 border-red-400' :
                    insight.type === 'success' ? 'bg-green-50 border-green-400' :
                    'bg-blue-50 border-blue-400'
                  }`}>
                    <h5 className="font-medium mb-1">{insight.title}</h5>
                    <p className="text-sm text-gray-600">{insight.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recommendations Tab */}
        {selectedTab === 'recommendations' && (
          <div className="space-y-4">
            {data.kpiAnalyses
              .filter((analysis: KPIAnalysis) => analysis.recommendations.length > 0)
              .slice(0, 8)
              .map((analysis: KPIAnalysis) => (
                <div key={analysis.kpiNumber} className="border rounded-lg p-4">
                  <div className="mb-3">
                    <h4 className="font-medium text-gray-900">
                      KPI {analysis.kpiNumber}: {analysis.description.substring(0, 60)}...
                    </h4>
                    <div className="text-sm text-gray-600 mt-1">
                      Mevcut: {analysis.currentValue} / Hedef: {analysis.targetValue} 
                      ({analysis.achievementRate.toFixed(1)}% başarı)
                    </div>
                  </div>
                  
                  {analysis.recommendations.map((rec, index) => (
                    <div key={index} className="mb-4 last:mb-0">
                      <div className="flex items-start gap-3">
                        {getTypeIcon(rec.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h5 className="font-medium text-sm">{rec.title}</h5>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(rec.priority)}`}>
                              {rec.priority.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                          <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 mb-2">
                            <div><strong>Beklenen Etki:</strong> {rec.expectedImpact}</div>
                            <div><strong>Süre:</strong> {rec.timeframe}</div>
                          </div>
                          <div className="text-xs">
                            <strong>Eylem Adımları:</strong>
                            <ul className="mt-1 ml-4 space-y-1">
                              {rec.actionItems.map((item, i) => (
                                <li key={i} className="list-disc">{item}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
          </div>
        )}

        {/* Forecasts Tab */}
        {selectedTab === 'forecasts' && (
          <div className="space-y-4">
            {data.kpiAnalyses.slice(0, 10).map((analysis: KPIAnalysis) => (
              <div key={analysis.kpiNumber} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-sm mb-1">
                    KPI {analysis.kpiNumber}: {analysis.description.substring(0, 50)}...
                  </h4>
                  <div className="text-xs text-gray-600">
                    Mevcut: {analysis.currentValue} → Tahmin: {analysis.forecast.nextPeriod}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    {getTrendIcon(analysis.trend.direction)}
                    <div className="text-xs text-gray-500 mt-1">
                      {analysis.trend.changePercent > 0 ? '+' : ''}{analysis.trend.changePercent.toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium">
                      {analysis.forecast.confidence}%
                    </div>
                    <div className="text-xs text-gray-500">güven</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Risks Tab */}
        {selectedTab === 'risks' && (
          <div className="space-y-4">
            {data.kpiAnalyses
              .filter((analysis: KPIAnalysis) => analysis.riskFactors.length > 0)
              .slice(0, 8)
              .map((analysis: KPIAnalysis) => (
                <div key={analysis.kpiNumber} className="border rounded-lg p-4">
                  <h4 className="font-medium text-sm mb-3">
                    KPI {analysis.kpiNumber}: {analysis.description.substring(0, 60)}...
                  </h4>
                  {analysis.riskFactors.map((risk, index) => (
                    <div key={index} className={`p-3 rounded-lg mb-2 last:mb-0 ${
                      risk.level === 'high' ? 'bg-red-50 border border-red-200' :
                      risk.level === 'medium' ? 'bg-yellow-50 border border-yellow-200' :
                      'bg-green-50 border border-green-200'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-sm">{risk.description}</h5>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          risk.level === 'high' ? 'bg-red-100 text-red-800' :
                          risk.level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {risk.level.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-1">{risk.impact}</p>
                      <div className="text-xs text-gray-500">
                        Olasılık: {risk.probability}%
                      </div>
                    </div>
                  ))}
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
