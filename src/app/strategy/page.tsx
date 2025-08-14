'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Target, TrendingUp, TrendingDown, BarChart3, Download, RefreshCw, Bell, Users, Calendar } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
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
  const [budgetImpact, setBudgetImpact] = useState<{period: string, targets: any[], goals: any[] } | null>(null)
  const [factories, setFactories] = useState<{id: string, name: string, code: string}[]>([])
  const [selectedGoal, setSelectedGoal] = useState<string>('')
  const [selectedFactory, setSelectedFactory] = useState<string>('')
  const [selectedPeriod, setSelectedPeriod] = useState<string>('2024-Q4')
  const [budgetMode, setBudgetMode] = useState<'gap' | 'delta'>('gap')
  const [loading, setLoading] = useState(true)
  const [trendSeries, setTrendSeries] = useState<Array<{ code: string; name: string; values: number[]; change: number }>>([])
  const [weights, setWeights] = useState<{ shWeights: any[]; kpiWeights: any[] } | null>(null)

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
        
        const [goalsRes, targetsRes, factoriesRes, budgetImpactRes, weightsRes] = await Promise.all([
          fetch(`/api/strategy/overview?${apiParams}&period=${selectedPeriod}&factory=${selectedFactory}`),
          fetch(`/api/strategy/targets?${apiParams}&period=${selectedPeriod}&factory=${selectedFactory}`),
          fetch(`/api/factories?${apiParams}`),
          fetch(`/api/strategy/budget-impact?${apiParams}&period=${selectedPeriod}&factory=${selectedFactory}&mode=${budgetMode}`),
          fetch(`/api/strategy/weights`)
        ])

        const [goalsData, targetsData, factoriesData, budgetImpactData, weightsData] = await Promise.all([
          goalsRes.json(),
          targetsRes.json(),
          factoriesRes.json(),
          budgetImpactRes.json(),
          weightsRes.json()
        ])

        setStrategicGoals(goalsData)
        setStrategicTargets(targetsData)
        setFactories(factoriesData)
        setBudgetImpact(budgetImpactData)
        setWeights(weightsData)
        
        if (goalsData.length > 0) {
          setSelectedGoal(goalsData[0].id)
        }

        // İlk fabrikayı seç
        if (factoriesData.length > 0 && !selectedFactory) {
          setSelectedFactory(factoriesData[0].id)
        }

        // Trend analizi için son 4 dönem SH başarı serileri
        const computePrev = (p: string) => {
          const [y, q] = p.split('-Q')
          let year = parseInt(y)
          let quarter = parseInt(q)
          quarter -= 1
          if (quarter < 1) { year -= 1; quarter = 4 }
          return `${year}-Q${quarter}`
        }
        const p1 = selectedPeriod
        const p2 = computePrev(p1)
        const p3 = computePrev(p2)
        const p4 = computePrev(p3)
        const periods = [p4, p3, p2, p1]
        const targetsByPeriod = await Promise.all(periods.map(p => 
          fetch(`/api/strategy/targets?${apiParams}&period=${p}&factory=${selectedFactory}`).then(r => r.json()).catch(() => [])
        ))
        const seriesMap = new Map<string, { name: string; values: number[] }>()
        targetsByPeriod.forEach(list => {
          (Array.isArray(list) ? list : []).forEach((t: any) => {
            const key = t.code
            if (!seriesMap.has(key)) {
              seriesMap.set(key, { name: t.name || key, values: [] })
            }
          })
        })
        for (const [key, obj] of seriesMap.entries()) {
          obj.values = periods.map((p, idx) => {
            const list = targetsByPeriod[idx] || []
            const item = (Array.isArray(list) ? list : []).find((t: any) => t.code === key)
            return item ? Number(item.successRate || 0) : 0
          })
        }
        const trend = Array.from(seriesMap.entries()).map(([code, obj]) => {
          const vals = obj.values
          const change = (vals[vals.length - 1] || 0) - (vals[0] || 0)
          return { code, name: obj.name, values: vals, change }
        })
        setTrendSeries(trend)
      } catch (error) {
        console.error('Error fetching strategy data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [userContext, selectedPeriod, selectedFactory, budgetMode])

  const refreshData = async () => {
    if (!userContext) return
    
    setLoading(true)
    try {
      const apiParams = getUserApiParams(userContext)
      
        const [goalsRes, targetsRes, budgetImpactRes, weightsRes] = await Promise.all([
        fetch(`/api/strategy/overview?${apiParams}&period=${selectedPeriod}&factory=${selectedFactory}`),
        fetch(`/api/strategy/targets?${apiParams}&period=${selectedPeriod}&factory=${selectedFactory}`),
          fetch(`/api/strategy/budget-impact?${apiParams}&period=${selectedPeriod}&factory=${selectedFactory}&mode=${budgetMode}`),
          fetch(`/api/strategy/weights`)
      ])

      const [goalsData, targetsData, budgetImpactData, weightsData] = await Promise.all([
        goalsRes.json(),
        targetsRes.json(),
        budgetImpactRes.json(),
        weightsRes.json()
      ])

      setStrategicGoals(goalsData)
      setStrategicTargets(targetsData)
      setBudgetImpact(budgetImpactData)
      setWeights(weightsData)
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
            <div className="flex flex-wrap gap-3 items-center">
              <select
                className="px-3 py-2 border border-gray-300 rounded-md bg-white"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
              >
                <option value="2024-Q4">2024 - 4. Çeyrek</option>
                <option value="2024-Q3">2024 - 3. Çeyrek</option>
                <option value="2024-Q2">2024 - 2. Çeyrek</option>
                <option value="2024-Q1">2024 - 1. Çeyrek</option>
              </select>
              <select
                className="px-3 py-2 border border-gray-300 rounded-md bg-white"
                value={selectedFactory}
                onChange={(e) => setSelectedFactory(e.target.value)}
              >
                <option value="">Tüm Fabrikalar</option>
                {factories.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
              <select
                className="px-3 py-2 border border-gray-300 rounded-md bg-white"
                value={budgetMode}
                onChange={(e) => setBudgetMode(e.target.value as 'gap' | 'delta')}
                title="Bütçe Etkisi Modu"
              >
                <option value="gap">Boşluk (Hedefe Uzaklık)</option>
                <option value="delta">Gelişim (Delta)</option>
              </select>
              <select 
                className="px-3 py-2 border border-gray-300 rounded-md bg-white"
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
            <a href="#kpi" className="text-gray-500 pb-2 hover:text-gray-700">KPI Detayları</a>
            <a href="#trend" className="text-gray-500 pb-2 hover:text-gray-700">Trend Analizi</a>
            <a href="#risk" className="text-gray-500 pb-2 hover:text-gray-700">Risk Analizi</a>
            <a href="#budget" className="text-gray-500 pb-2 hover:text-gray-700">Bütçe Etkinliği</a>
          </div>
        </div>
        {/* Budget Impact Overview */}
        {budgetImpact && (
          <div className="mb-8">
            <a id="budget" />
            <h3 className="text-xl font-semibold text-gray-900 mb-1">Bütçe Etkinliği (SA)</h3>
            <p className="text-xs text-gray-500 mb-3">Mod: {budgetMode === 'delta' ? 'Gelişim (Delta)' : 'Boşluk (Hedefe Uzaklık)'} • Dönem: {selectedPeriod} • {selectedFactory ? (factories.find(f => f.id === selectedFactory)?.name || '') : 'Tüm Fabrikalar'}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {budgetImpact.goals.map((g: any) => (
                <Card key={g.saCode}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">{g.saCode}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span>Plan</span><span className="font-medium">{Math.round(g.totalPlanned).toLocaleString('tr-TR')}</span></div>
                      <div className="flex justify-between"><span>Gerçek</span><span className="font-medium">{Math.round(g.totalActual).toLocaleString('tr-TR')}</span></div>
                      <div className="flex justify-between"><span>Etki Skoru</span><span className="font-medium">{g.totalEffectScore.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span>Verimlilik</span><span className="font-medium">{g.efficiency ? g.efficiency.toFixed(2) : '-'}</span></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">Bütçe Etkinliği (SH)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {budgetImpact.targets.map((t: any) => (
                <Card key={t.shCode}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">{t.shCode}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span>Plan</span><span className="font-medium">{Math.round(t.totalPlanned).toLocaleString('tr-TR')}</span></div>
                      <div className="flex justify-between"><span>Gerçek</span><span className="font-medium">{Math.round(t.totalActual).toLocaleString('tr-TR')}</span></div>
                      <div className="flex justify-between"><span>Etki Skoru</span><span className="font-medium">{t.effectScore.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span>Verimlilik</span><span className="font-medium">{t.efficiency ? t.efficiency.toFixed(2) : '-'}</span></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

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

        {/* Trend Analizi */}
        <div className="mt-10">
          <a id="trend" />
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Trend Analizi</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">En Çok İyileşen SH (Top 5)</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {trendSeries
                    .filter(s => s.change > 0)
                    .sort((a, b) => b.change - a.change)
                    .slice(0, 5)
                    .map((s) => (
                      <div key={s.code} className="flex items-center justify-between">
                        <div className="min-w-[110px]"><span className="font-medium text-sm">{s.code}</span></div>
                        <Sparkline values={s.values} />
                        <div className="text-sm font-medium text-green-600 ml-3">+{Math.round(s.change)}%</div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Gerileyen SH (Top 5)</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {trendSeries
                    .filter(s => s.change < 0)
                    .sort((a, b) => a.change - b.change)
                    .slice(0, 5)
                    .map((s) => (
                      <div key={s.code} className="flex items-center justify-between">
                        <div className="min-w-[110px]"><span className="font-medium text-sm">{s.code}</span></div>
                        <Sparkline values={s.values} />
                        <div className="text-sm font-medium text-red-600 ml-3">{Math.round(s.change)}%</div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Risk Analizi */}
        <div className="mt-10">
          <a id="risk" />
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Risk Analizi</h3>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Düşük Performanslı SH (Top 10)</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {strategicTargets
                  .slice()
                  .sort((a, b) => a.successRate - b.successRate)
                  .slice(0, 10)
                  .map((t) => (
                    <div key={t.id} className="flex items-center space-x-3">
                      <div className="w-20 text-sm font-medium">{t.code}</div>
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className={`${t.successRate >= 60 ? 'bg-blue-500' : t.successRate >= 40 ? 'bg-yellow-500' : 'bg-red-500'} h-2 rounded-full`} style={{ width: `${t.successRate}%` }}></div>
                        </div>
                      </div>
                      <div className="w-12 text-right text-sm">{t.successRate}%</div>
                      <div className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(t.status)}`}>{getStatusText(t.status)}</div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ağırlıklar */}
        {weights && (
          <div className="mt-10">
            <a id="weights" />
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Ağırlıklandırma Şeması</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">SH Ağırlıkları (SA içinde)</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {weights.shWeights.slice(0, 12).map((w: any, idx: number) => (
                      <div key={`${w.saCode}-${w.shCode}-${idx}`} className="flex items-center space-x-3">
                        <div className="w-28 font-medium">{w.saCode} / {w.shCode}</div>
                        <div className="flex-1">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.round((w.weight || 0) * 100)}%` }}></div>
                          </div>
                        </div>
                        <div className="w-12 text-right">{Math.round((w.weight || 0) * 100)}%</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">KPI Ağırlıkları (SH içinde)</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {weights.kpiWeights.slice(0, 12).map((w: any, idx: number) => (
                      <div key={`${w.shCode}-${w.kpiNumber}-${idx}`} className="flex items-center space-x-3">
                        <div className="w-28 font-medium">{w.shCode} / KPI #{w.kpiNumber}</div>
                        <div className="flex-1">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${Math.round((w.weight || 0) * 100)}%` }}></div>
                          </div>
                        </div>
                        <div className="w-12 text-right">{Math.round((w.weight || 0) * 100)}%</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
    </div>
  )
} 

function Sparkline({ values }: { values: number[] }) {
  const width = 120
  const height = 28
  const padding = 4
  const pts = useMemo(() => {
    if (!values || values.length === 0) return ''
    const min = Math.min(...values, 0)
    const max = Math.max(...values, 100)
    const span = Math.max(1, max - min)
    const dx = (width - padding * 2) / Math.max(1, values.length - 1)
    return values
      .map((v, i) => {
        const x = padding + dx * i
        const y = height - padding - ((v - min) / span) * (height - padding * 2)
        return `${x},${y}`
      })
      .join(' ')
  }, [values])
  const last = values && values.length > 1 ? values[values.length - 1] - values[values.length - 2] : 0
  const color = last >= 0 ? '#16a34a' : '#dc2626'
  return (
    <svg width={width} height={height} className="flex-shrink-0">
      <polyline fill="none" stroke={color} strokeWidth="2" points={pts} />
    </svg>
  )
}