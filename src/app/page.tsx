'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, TrendingUp, TrendingDown, Target, Users, Calendar, Settings, Clock, CheckCircle, Download, RefreshCw, Bell, LogOut } from "lucide-react"
import { useEffect, useState, useMemo, useCallback } from "react"
import Link from "next/link"
import { getCurrentUser, getUserApiParams, logout } from '@/lib/user-context'

interface DashboardStats {
  kpiCount: number
  actionCount: number
  factoryCount: number
  strategicGoalCount: number
  successRate: number
  successTrend: number
  trends: {
    kpiTrend: number
    actionTrend: number
    factoryTrend: number
    recentActivity: {
      kpiEntries: number
      actionUpdates: number
    }
  }
}

interface ThemeData {
  name: string
  score: number
  status: 'excellent' | 'good' | 'at-risk' | 'critical'
  kpiCount: number
}

interface PhaseData {
  phase: string
  count: number
  completionRate: number
}

interface Activity {
  id: string
  type: 'kpi_entry' | 'action_update' | 'simulation'
  description: string
  timestamp: string
  user: string
}

export default function Home() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [themes, setThemes] = useState<ThemeData[]>([])
  const [phases, setPhases] = useState<PhaseData[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  
  // Kullanıcı bağlamını al
  const userContext = getCurrentUser()

  // Memoized values to prevent unnecessary re-renders
  const isAuthenticated = useMemo(() => !!userContext, [userContext])
  const apiParams = useMemo(() => 
    userContext ? getUserApiParams(userContext) : '', 
    [userContext]
  )

  // Authentication kontrolü
  useEffect(() => {
    if (!isAuthenticated) {
      // Hızlı ve geri butonunda döngü yaratmayan yönlendirme
      window.location.replace('/login')
      return
    }
  }, [isAuthenticated])

  // Memoized fetch function
  const fetchData = useCallback(async () => {
    if (!userContext || !apiParams) return

    try {
      const [statsRes, themesRes, phasesRes, activitiesRes] = await Promise.all([
        fetch(`/api/dashboard/stats?${apiParams}`),
        fetch(`/api/dashboard/themes?${apiParams}`),
        fetch(`/api/dashboard/phases?${apiParams}`),
        fetch(`/api/dashboard/activities?${apiParams}`)
      ])

      const [statsData, themesData, phasesData, activitiesData] = await Promise.all([
        statsRes.json(),
        themesRes.json(),
        phasesRes.json(),
        activitiesRes.json()
      ])

      // Dashboard: API'den gelen verileri UI beklentisine dönüştür (hızlı uyum)
      setStats(statsData)

      // Tema verileri: { name, value } -> toplam içindeki yüzde payı
      const mappedThemes: ThemeData[] = Array.isArray(themesData)
        ? (() => {
            const total = themesData.reduce((sum: number, t: any) => sum + (typeof t.value === 'number' ? t.value : 0), 0)
            return themesData.map((t: any) => {
              const count = typeof t.value === 'number' ? t.value : 0
              const score = total > 0 ? Math.round((count / total) * 100) : 0
              const status: ThemeData['status'] = score >= 75
                ? 'excellent'
                : score >= 60
                  ? 'good'
                  : score >= 40
                    ? 'at-risk'
                    : 'critical'
              return {
                name: t.name ?? 'Tema',
                score,
                status,
                kpiCount: count
              }
            })
          })()
        : []
      setThemes(mappedThemes)

      // Faz verileri: { name, completion, actionCount } -> { phase, completionRate, count }
      const mappedPhases: PhaseData[] = Array.isArray(phasesData)
        ? phasesData.map((p: any) => ({
            phase: p.name ?? 'Faz',
            completionRate: typeof p.completion === 'number' ? p.completion : 0,
            count: typeof p.actionCount === 'number' ? p.actionCount : 0
          }))
        : []
      setPhases(mappedPhases)

      // Aktivite verileri: mevcut şemayı UI'ın beklediği şemaya dönüştür
      const mappedActivities: Activity[] = Array.isArray(activitiesData)
        ? activitiesData.map((a: any) => ({
            id: a.id ?? `${a.type}-${a.time}`,
            type: a.type === 'kpi' ? 'kpi_entry' : 'action_update',
            description: a.description || a.title || '',
            timestamp: a.time || a.timestamp || '',
            user: a.user || 'Sistem'
          }))
        : []
      setActivities(mappedActivities)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [userContext, apiParams])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleLogout = useCallback(async () => {
    if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
      await logout()
    }
  }, [])

  // Yetkisiz kullanıcıyı anında yönlendir ve hafif bir ekran göster
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse rounded-full h-6 w-6 bg-blue-600 mx-auto mb-3"></div>
          <p className="mt-1 text-gray-600">Giriş sayfasına yönlendiriliyor...</p>
        </div>
      </div>
    )
  }

  if (!userContext || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Dashboard yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
          {/* Dashboard Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
                <p className="text-gray-600">Model Fabrika stratejik performans izleme</p>
              </div>
              <div className="flex space-x-4">
                <select className="px-4 py-2 border border-gray-300 rounded-md bg-white">
                  <option>Tüm Temalar</option>
                  <option>Yalın</option>
                  <option>Dijital</option>
                  <option>Yeşil</option>
                  <option>Dirençlilik</option>
                </select>
              </div>
            </div>
          </div>

          {/* Modern Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="relative overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Toplam KPI</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-gray-900">{stats?.kpiCount || 0}</div>
                    <div className={`flex items-center text-sm mt-1 ${(stats?.trends?.kpiTrend || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(stats?.trends?.kpiTrend || 0) >= 0 ? 
                        <TrendingUp className="h-4 w-4 mr-1" /> : 
                        <TrendingDown className="h-4 w-4 mr-1" />
                      }
                      {(stats?.trends?.kpiTrend || 0) >= 0 ? '+' : ''}{stats?.trends?.kpiTrend || 0}
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Target className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-3 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full w-fit">
                  4 tema kapsamında
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Aktif Eylem</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-gray-900">{stats?.actionCount || 0}</div>
                    <div className={`flex items-center text-sm mt-1 ${(stats?.trends?.actionTrend || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(stats?.trends?.actionTrend || 0) >= 0 ? 
                        <TrendingUp className="h-4 w-4 mr-1" /> : 
                        <TrendingDown className="h-4 w-4 mr-1" />
                      }
                      {(stats?.trends?.actionTrend || 0) >= 0 ? '+' : ''}{stats?.trends?.actionTrend || 0}
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-3 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full w-fit">
                  Yalın
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Model Fabrika</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-gray-900">{stats?.factoryCount || 0}</div>
                    <div className={`flex items-center text-sm mt-1 ${(stats?.trends?.factoryTrend || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(stats?.trends?.factoryTrend || 0) >= 0 ? 
                        <TrendingUp className="h-4 w-4 mr-1" /> : 
                        <TrendingDown className="h-4 w-4 mr-1" />
                      }
                      {(stats?.trends?.factoryTrend || 0) >= 0 ? '+' : ''}{stats?.trends?.factoryTrend || 0}
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-3 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full w-fit">
                  Dijital
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Genel Başarı</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-gray-900">{stats?.successRate || 0}%</div>
                    <div className={`flex items-center text-sm mt-1 ${(stats?.successTrend || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(stats?.successTrend || 0) >= 0 ? 
                        <TrendingUp className="h-4 w-4 mr-1" /> : 
                        <TrendingDown className="h-4 w-4 mr-1" />
                      }
                      {(stats?.successTrend || 0) >= 0 ? '+' : ''}{stats?.successTrend || 0}%
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
                <div className="mt-3 text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full w-fit">
                  Yeşil
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="flex space-x-8">
              <button className="text-blue-600 border-b-2 border-blue-600 pb-2 font-medium">
                Performans
              </button>
              <Link href="/analytics" className="text-gray-500 pb-2 hover:text-gray-700">
                Trend Analizi
              </Link>
              <Link href="/analytics" className="text-gray-500 pb-2 hover:text-gray-700">
                Departman
              </Link>
              <Link href="/analytics" className="text-gray-500 pb-2 hover:text-gray-700">
                Raporlar
              </Link>
            </div>
          </div>

          {/* Charts and Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Theme Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Tema Dağılımı</span>
                </CardTitle>
                <CardDescription>4 tema bazında KPI performansı</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {themes.map((theme, index) => {
                    const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500']
                    return (
                      <div key={theme.name} className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${colors[index]}`}></div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">{theme.name}</span>
                            <span className="text-sm text-gray-600">{theme.score}%</span>
                          </div>
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                              <span>İlerleme</span>
                              <span>{theme.score}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${theme.score}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Phase Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Faz İlerlemesi</span>
                </CardTitle>
                <CardDescription>Eylem fazlarının tamamlanma durumu</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {phases.map((phase, index) => (
                    <div key={index} className="p-3 border-l-4 border-blue-500 bg-blue-50 rounded-r-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{phase.phase}</span>
                        <span className="text-sm text-gray-600">{phase.completionRate}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${phase.completionRate}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500">{phase.count} eylem</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5" />
                <span>Son Aktiviteler</span>
              </CardTitle>
              <CardDescription>Güncel KPI girişleri ve eylem güncellemeleri</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.type === 'kpi_entry' ? 'bg-blue-500' : 'bg-green-500'
                    }`}></div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium">{activity.description}</p>
                          <p className="text-xs text-gray-600">{activity.timestamp}</p>
                          <p className="text-xs text-gray-500 mt-1">{activity.user}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-gray-500">{activity.timestamp}</span>
                          {/* The original code had activity.progress, activity.value, and activity.target,
                             but they are not defined in the Activity interface.
                             Assuming they were meant to be part of the Activity object or are placeholders.
                             For now, removing them as they are not in the interface. */}
                        </div>
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
