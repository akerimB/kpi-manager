'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Target, TrendingUp, TrendingDown, BarChart3, Download, RefreshCw, Bell, Users, Calendar } from "lucide-react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { getCurrentUser, getUserApiParams } from '@/lib/user-context'

interface StrategicGoal {
  id: string
  code: string
  title: string
  description: string
  successRate: number
  trend: number
  status: 'excellent' | 'good' | 'at-risk' | 'critical'
}

interface StrategicTarget {
  id: string
  code: string
  name: string
  description: string
  strategicGoalId: string
  successRate: number
  kpiCount: number
  trend: number
  status: 'excellent' | 'good' | 'at-risk' | 'critical'
}

export default function StrategyPage() {
  const [strategicGoals, setStrategicGoals] = useState<StrategicGoal[]>([])
  const [strategicTargets, setStrategicTargets] = useState<StrategicTarget[]>([])
  const [factories, setFactories] = useState<{id: string, name: string, code: string}[]>([])
  const [selectedGoal, setSelectedGoal] = useState<string>('')
  const [selectedFactory, setSelectedFactory] = useState<string>('')
  const [selectedPeriod, setSelectedPeriod] = useState<string>('2024-Q4')
  const [loading, setLoading] = useState(true)

  // Kullanıcı bağlamını al
  const userContext = getCurrentUser()

  // Authentication ve rol kontrolü
  useEffect(() => {
    if (!userContext) {
      window.location.href = '/login'
      return
    }
  }, [userContext])

  // Rol kontrolü - sadece üst yönetim ve admin erişebilir
  if (userContext && userContext.userRole === 'MODEL_FACTORY') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erişim Reddedildi</h2>
          <p className="text-gray-600 mb-4">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            Dashboard'a Dön
          </Link>
        </div>
      </div>
    )
  }

  useEffect(() => {
    if (!userContext) return

    const fetchData = async () => {
      try {
        const apiParams = getUserApiParams(userContext)
        
        const [goalsRes, targetsRes, factoriesRes] = await Promise.all([
          fetch(`/api/strategy/overview?${apiParams}&period=${selectedPeriod}&factory=${selectedFactory}`),
          fetch(`/api/strategy/targets?${apiParams}&period=${selectedPeriod}&factory=${selectedFactory}`),
          fetch(`/api/factories?${apiParams}`)
        ])

        const [goalsData, targetsData, factoriesData] = await Promise.all([
          goalsRes.json(),
          targetsRes.json(),
          factoriesRes.json()
        ])

        setStrategicGoals(goalsData)
        setStrategicTargets(targetsData)
        setFactories(factoriesData)
        
        if (goalsData.length > 0) {
          setSelectedGoal(goalsData[0].id)
        }

        // İlk fabrikayı seç
        if (factoriesData.length > 0 && !selectedFactory) {
          setSelectedFactory(factoriesData[0].id)
        }
      } catch (error) {
        console.error('Error fetching strategy data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [userContext, selectedPeriod, selectedFactory])

  const refreshData = async () => {
    if (!userContext) return
    
    setLoading(true)
    try {
      const apiParams = getUserApiParams(userContext)
      
      const [goalsRes, targetsRes] = await Promise.all([
        fetch(`/api/strategy/overview?${apiParams}&period=${selectedPeriod}&factory=${selectedFactory}`),
        fetch(`/api/strategy/targets?${apiParams}&period=${selectedPeriod}&factory=${selectedFactory}`)
      ])

      const [goalsData, targetsData] = await Promise.all([
        goalsRes.json(),
        targetsRes.json()
      ])

      setStrategicGoals(goalsData)
      setStrategicTargets(targetsData)
    } catch (error) {
      console.error('Error refreshing data:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadStrategyReport = () => {
    const selectedFactoryName = factories.find(f => f.id === selectedFactory)?.name || 'Tüm Fabrikalar'
    const reportData = {
      period: selectedPeriod,
      factory: selectedFactoryName,
      generatedAt: new Date().toISOString(),
      strategicGoals: strategicGoals,
      strategicTargets: filteredTargets
    }
    
    const dataStr = JSON.stringify(reportData, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `strateji-raporu-${selectedPeriod}-${selectedFactoryName.replace(/\s+/g, '-')}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800 border-green-200'
      case 'good': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'at-risk': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'excellent': return 'Mükemmel'
      case 'good': return 'İyi'
      case 'at-risk': return 'Risk Altında'
      case 'critical': return 'Kritik'
      default: return 'Bilinmiyor'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return '🟢'
      case 'good': return '🔵'
      case 'at-risk': return '🟡'
      case 'critical': return '🔴'
      default: return '⚪'
    }
  }

  const filteredTargets = selectedGoal 
    ? strategicTargets.filter(target => target.strategicGoalId === selectedGoal)
    : strategicTargets

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Strateji verileri yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Strateji İzleme Paneli</h2>
              <p className="text-gray-600">Stratejik amaç ve hedeflerin KPI bazlı performans analizi</p>
            </div>
            <div className="flex space-x-4">
              <select 
                className="px-4 py-2 border border-gray-300 rounded-md bg-white"
                value={selectedGoal}
                onChange={(e) => setSelectedGoal(e.target.value)}
              >
                <option value="">Tüm Stratejik Amaçlar</option>
                {strategicGoals.map(goal => (
                  <option key={goal.id} value={goal.id}>
                    {goal.code} - {goal.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Strategic Goals Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {strategicGoals.map((goal) => (
            <Card 
              key={goal.id} 
              className={`relative overflow-hidden cursor-pointer transition-all duration-200 ${
                selectedGoal === goal.id ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'
              }`}
              onClick={() => setSelectedGoal(goal.id)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{goal.code}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-gray-900">{goal.successRate}%</div>
                    <div className="flex items-center text-sm mt-1">
                      {goal.trend > 0 ? (
                        <div className="flex items-center text-green-600">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          +{goal.trend}%
                        </div>
                      ) : goal.trend < 0 ? (
                        <div className="flex items-center text-red-600">
                          <TrendingDown className="h-4 w-4 mr-1" />
                          {goal.trend}%
                        </div>
                      ) : (
                        <div className="text-gray-600">Değişim yok</div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl mb-1">{getStatusIcon(goal.status)}</div>
                    <div className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(goal.status)}`}>
                      {getStatusText(goal.status)}
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-900 line-clamp-1">{goal.title}</p>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{goal.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex space-x-8">
            <button className="text-blue-600 border-b-2 border-blue-600 pb-2 font-medium">
              Stratejik Hedefler
            </button>
            <button className="text-gray-500 pb-2 hover:text-gray-700">
              KPI Detayları
            </button>
            <button className="text-gray-500 pb-2 hover:text-gray-700">
              Trend Analizi
            </button>
            <button className="text-gray-500 pb-2 hover:text-gray-700">
              Risk Analizi
            </button>
          </div>
        </div>

        {/* Strategic Targets Detail */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Stratejik Hedefler (SH) Detay Analizi</span>
              </div>
              <span className="text-sm font-normal text-gray-500">
                {selectedGoal ? strategicGoals.find(g => g.id === selectedGoal)?.title : 'Tüm Amaçlar'}
              </span>
            </CardTitle>
            <CardDescription>
              Her stratejik hedefin KPI bazlı performans durumu ve trend analizi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredTargets.map((target) => (
                <Card key={target.id} className="hover:shadow-md transition-shadow duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold">{target.code}</CardTitle>
                      <div className="text-xl">{getStatusIcon(target.status)}</div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 line-clamp-1">{target.name}</h4>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-3">{target.description}</p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold text-gray-900">{target.successRate}%</div>
                          <div className="text-xs text-gray-500">Başarı Oranı</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-gray-700">{target.kpiCount}</div>
                          <div className="text-xs text-gray-500">KPI Sayısı</div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span>Performans</span>
                          <span>{target.successRate}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              target.successRate >= 80 ? 'bg-green-500' :
                              target.successRate >= 60 ? 'bg-blue-500' :
                              target.successRate >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${target.successRate}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div className="flex items-center space-x-2">
                          {target.trend > 0 ? (
                            <div className="flex items-center text-green-600 text-sm">
                              <TrendingUp className="h-4 w-4 mr-1" />
                              +{target.trend}%
                            </div>
                          ) : target.trend < 0 ? (
                            <div className="flex items-center text-red-600 text-sm">
                              <TrendingDown className="h-4 w-4 mr-1" />
                              {target.trend}%
                            </div>
                          ) : (
                            <div className="text-gray-600 text-sm">Stabil</div>
                          )}
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(target.status)}`}>
                          {getStatusText(target.status)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredTargets.length === 0 && (
              <div className="text-center py-12">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Stratejik Hedef Bulunamadı</h3>
                <p className="text-gray-600">Seçilen stratejik amaç için henüz hedef tanımlanmamış.</p>
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  )
} 