'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Clock, DollarSign, Target, AlertTriangle, CheckCircle, TrendingUp, PlayCircle } from 'lucide-react'

interface ActionStep {
  id: string
  title: string
  description: string
  stepOrder: number
  completionPercent: number
  plannedCost?: number
  actualCost?: number
  currency?: string
}

interface KpiImpact {
  kpiNumber: string
  kpiName: string
  impactScore: number
  currentAchievement: number
  target: number
  currentValue: number
}

interface Action {
  id: string
  title: string
  description: string
  phase: string
  status: 'on-track' | 'at-risk' | 'delayed' | 'completed'
  progress: {
    completion: number
    timeProgress: number
    totalSteps: number
    completedSteps: number
  }
  budget: {
    planned: number
    actual: number
    utilization: number
    currency: string
  }
  kpiImpacts: KpiImpact[]
  timeline: {
    plannedStart?: string
    plannedEnd?: string
    actualStart?: string
    actualEnd?: string
  }
  priority: string
}

interface ActionTrackingData {
  summary: {
    totalActions: number
    completedActions: number
    atRiskActions: number
    delayedActions: number
    avgCompletion: number
    budget: {
      totalPlanned: number
      totalActual: number
      utilization: number
    }
  }
  actions: Action[]
  phaseAnalysis: Array<{
    phaseName: string
    actionCount: number
    avgCompletion: number
    budget: {
      planned: number
      actual: number
    }
    statusDistribution: {
      completed: number
      onTrack: number
      atRisk: number
      delayed: number
    }
  }>
  criticalActions: Action[]
  metadata: {
    period: string
    factoryId: string
    calculatedAt: string
  }
}

interface Props {
  data: ActionTrackingData
  loading?: boolean
}

export default function ActionTrackingDashboard({ data, loading }: Props) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="w-48 h-6 bg-gray-300 rounded animate-pulse"></div>
          <div className="w-64 h-4 bg-gray-200 rounded animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-full h-32 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'on-track':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'at-risk':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'delayed':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'on-track':
        return <PlayCircle className="h-4 w-4" />
      case 'at-risk':
        return <AlertTriangle className="h-4 w-4" />
      case 'delayed':
        return <Clock className="h-4 w-4" />
      default:
        return <PlayCircle className="h-4 w-4" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Tamamlandı'
      case 'on-track':
        return 'Yolunda'
      case 'at-risk':
        return 'Risk Altında'
      case 'delayed':
        return 'Gecikmiş'
      default:
        return 'Bilinmiyor'
    }
  }

  const formatCurrency = (amount: number, currency: string = 'TRY'): string => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'text-red-600'
      case 'medium':
        return 'text-yellow-600'
      case 'low':
        return 'text-green-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="space-y-6">
      {/* Özet Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{data.summary.totalActions}</p>
                <p className="text-xs text-gray-600">Toplam Eylem</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{data.summary.avgCompletion}%</p>
                <p className="text-xs text-gray-600">Ortalama İlerleme</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{data.summary.budget.utilization}%</p>
                <p className="text-xs text-gray-600">Bütçe Kullanımı</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{data.summary.atRiskActions + data.summary.delayedActions}</p>
                <p className="text-xs text-gray-600">Riskli Eylem</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Faz Bazında Analiz */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Faz Bazında İlerleme</span>
          </CardTitle>
          <CardDescription>Proje fazlarının detaylı analizi ve bütçe takibi</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.phaseAnalysis.map((phase) => (
              <div key={phase.phaseName} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium">{phase.phaseName}</h3>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">
                      {phase.actionCount} eylem
                    </span>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">{phase.avgCompletion}%</p>
                      <p className="text-xs text-gray-500">ortalama ilerleme</p>
                    </div>
                  </div>
                </div>

                {/* İlerleme Çubuğu */}
                <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                  <div 
                    className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${phase.avgCompletion}%` }}
                  ></div>
                </div>

                {/* Durum Dağılımı */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  <div className="text-center">
                    <p className="text-lg font-bold text-green-600">{phase.statusDistribution.completed}</p>
                    <p className="text-xs text-gray-600">Tamamlandı</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-blue-600">{phase.statusDistribution.onTrack}</p>
                    <p className="text-xs text-gray-600">Yolunda</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-yellow-600">{phase.statusDistribution.atRisk}</p>
                    <p className="text-xs text-gray-600">Risk Altında</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-red-600">{phase.statusDistribution.delayed}</p>
                    <p className="text-xs text-gray-600">Gecikmiş</p>
                  </div>
                </div>

                {/* Bütçe Bilgisi */}
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded">
                  <div>
                    <p className="text-sm text-gray-600">Bütçe</p>
                    <p className="font-medium">
                      {formatCurrency(phase.budget.actual)} / {formatCurrency(phase.budget.planned)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Kullanım Oranı</p>
                    <p className="font-medium">
                      {phase.budget.planned > 0 
                        ? Math.round((phase.budget.actual / phase.budget.planned) * 100)
                        : 0}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Kritik Eylemler */}
      {data.criticalActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>Acil Müdahale Gereken Eylemler</span>
            </CardTitle>
            <CardDescription>Risk altında olan veya gecikmiş eylemler</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.criticalActions.map((action) => (
                <div key={action.id} className="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-medium text-gray-900">{action.title}</h3>
                        <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs border ${getStatusColor(action.status)}`}>
                          {getStatusIcon(action.status)}
                          <span>{getStatusText(action.status)}</span>
                        </span>
                        <span className={`text-xs font-medium ${getPriorityColor(action.priority)}`}>
                          {action.priority} öncelik
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{action.description}</p>
                      <p className="text-xs text-gray-500">Faz: {action.phase}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-600">{action.progress.completion}%</p>
                      <p className="text-xs text-gray-500">
                        {action.progress.completedSteps}/{action.progress.totalSteps} adım
                      </p>
                    </div>
                  </div>

                  {/* KPI Etkileri */}
                  {action.kpiImpacts.length > 0 && (
                    <div className="mt-3 border-t pt-3">
                      <p className="text-xs font-medium text-gray-700 mb-2">Etkilenen KPI'lar:</p>
                      <div className="flex flex-wrap gap-2">
                        {action.kpiImpacts.slice(0, 3).map((kpi) => (
                          <span key={kpi.kpiNumber} className="inline-flex items-center px-2 py-1 bg-white border rounded text-xs">
                            KPI {kpi.kpiNumber}: {kpi.currentAchievement}%
                          </span>
                        ))}
                        {action.kpiImpacts.length > 3 && (
                          <span className="text-xs text-gray-500">+{action.kpiImpacts.length - 3} daha</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tüm Eylemler Listesi */}
      <Card>
        <CardHeader>
          <CardTitle>Tüm Eylemler</CardTitle>
          <CardDescription>Detaylı eylem listesi ve durum takibi</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.actions.map((action) => (
              <div key={action.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-medium text-gray-900">{action.title}</h4>
                    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs border ${getStatusColor(action.status)}`}>
                      {getStatusIcon(action.status)}
                      <span>{getStatusText(action.status)}</span>
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{action.phase}</p>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900">{action.progress.completion}%</p>
                    <p className="text-xs text-gray-500">İlerleme</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900">{action.budget.utilization}%</p>
                    <p className="text-xs text-gray-500">Bütçe</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900">{action.kpiImpacts.length}</p>
                    <p className="text-xs text-gray-500">KPI</p>
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
