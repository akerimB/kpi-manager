'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Target, TrendingUp, TrendingDown, BarChart3, Download, RefreshCw, Bell, Users, Calendar } from "lucide-react"
import { useEffect, useState } from "react"
import Link from "next/link"

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
  const [selectedGoal, setSelectedGoal] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [goalsRes, targetsRes] = await Promise.all([
          fetch('/api/strategy/overview'),
          fetch('/api/strategy/targets')
        ])

        const [goalsData, targetsData] = await Promise.all([
          goalsRes.json(),
          targetsRes.json()
        ])

        setStrategicGoals(goalsData)
        setStrategicTargets(targetsData)
        
        if (goalsData.length > 0) {
          setSelectedGoal(goalsData[0].id)
        }
      } catch (error) {
        console.error('Error fetching strategy data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

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
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-4 w-4" />
                <span>Dashboard'a Dön</span>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Strateji İzleme</h1>
                  <p className="text-sm text-gray-500">SA → SH → KPI hiyerarşik analiz</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Ana Tesis - İstanbul</span>
                <select className="text-sm border border-gray-300 rounded-md px-3 py-1 bg-white">
                  <option>Ana Tesis - İstanbul</option>
                  <option>Fabrika 2 - Ankara</option>
                  <option>Fabrika 3 - İzmir</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Bu Çeyrek</span>
                <select className="text-sm border border-gray-300 rounded-md px-3 py-1 bg-white">
                  <option>Bu Çeyrek</option>
                  <option>Geçen Çeyrek</option>
                  <option>Bu Yıl</option>
                  <option>Geçen Yıl</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Bell className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Yenile
                </Button>
                <Button size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Strateji Raporu
                </Button>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">AY</span>
                </div>
                <span className="text-sm font-medium text-gray-900">Ahmet Yılmaz</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Strateji İzleme Paneli</h2>
              <p className="text-gray-600">Stratejik amaç ve hedeflerin KPI bazlı performans analizi</p>
            </div>
            <div className="flex space-x-4">
              <select className="px-4 py-2 border border-gray-300 rounded-md bg-white">
                <option>Tüm Stratejik Amaçlar</option>
                <option>SA01 - Operasyonel Mükemmellik</option>
                <option>SA02 - Dijital Dönüşüm</option>
                <option>SA03 - Sürdürülebilirlik</option>
                <option>SA04 - İnovasyon</option>
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
    </div>
  )
} 