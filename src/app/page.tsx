'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, TrendingUp, Target, Users, Calendar, Settings, Clock, CheckCircle, Download, RefreshCw, Bell, LogOut } from "lucide-react"
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
      window.location.href = '/login'
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

      setStats(statsData)
      setThemes(themesData)
      setPhases(phasesData)
      setActivities(activitiesData)
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
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">KPI Manager</h1>
                  <p className="text-sm text-gray-500">v2.1.0</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                <span>{userContext.user?.name || 'Kullanıcı'}</span>
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                  {userContext.userRole === 'MODEL_FACTORY' ? 'Model Fabrika' :
                   userContext.userRole === 'UPPER_MANAGEMENT' ? 'Üst Yönetim' : 'Admin'}
                </span>
              </div>
              <div className="flex space-x-2">
                <button className="p-2 text-gray-400 hover:text-gray-600">
                  <Bell className="h-5 w-5" />
                </button>
                <Link href="/settings" className="p-2 text-gray-400 hover:text-gray-600">
                  <Settings className="h-5 w-5" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-red-600"
                  title="Çıkış Yap"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Modern Sidebar */}
        <aside className="w-64 bg-white shadow-sm h-screen sticky top-0">
          <nav className="p-4 space-y-2">
            <div className="sidebar-nav">
              <a href="#" className="sidebar-nav-item active">
                <BarChart3 className="h-5 w-5" />
                <span>Dashboard</span>
              </a>
              
              {/* Model fabrika kullanıcıları için KPI girişi */}
              {userContext.userRole === 'MODEL_FACTORY' && (
                <Link href="/kpi-entry" className="sidebar-nav-item">
                  <Target className="h-5 w-5" />
                  <span>KPI Girişi</span>
                </Link>
              )}
              
              {/* Üst yönetim ve admin için eylem yönetimi */}
              {(userContext.userRole === 'UPPER_MANAGEMENT' || userContext.userRole === 'ADMIN') && (
                <Link href="/actions" className="sidebar-nav-item">
                  <Calendar className="h-5 w-5" />
                  <span>Eylem / Faz İzleme</span>
                </Link>
              )}
              
              {/* Üst yönetim ve admin için strateji izleme */}
              {(userContext.userRole === 'UPPER_MANAGEMENT' || userContext.userRole === 'ADMIN') && (
                <Link href="/strategy" className="sidebar-nav-item">
                  <TrendingUp className="h-5 w-5" />
                  <span>Strateji İzleme</span>
                </Link>
              )}
              
              {/* Tema takibi herkese açık */}
              <Link href="/themes" className="sidebar-nav-item">
                <Settings className="h-5 w-5" />
                <span>Tema Takibi</span>
              </Link>
              
              {/* Etki simülasyonu sadece yetkili kullanıcılar için */}
              {userContext.permissions.canCreateSimulations && (
                <Link href="/simulation" className="sidebar-nav-item">
                  <Target className="h-5 w-5" />
                  <span>Etki Simülasyonu</span>
                </Link>
              )}
              
              {/* Admin ayarları sadece admin için */}
              {userContext.userRole === 'ADMIN' && (
                <Link href="/settings" className="sidebar-nav-item">
                  <Settings className="h-5 w-5" />
                  <span>Yönetici / Ayarlar</span>
                </Link>
              )}
              
              {/* Ayarlar herkese açık */}
              {userContext.userRole !== 'ADMIN' && (
                <Link href="/settings" className="sidebar-nav-item">
                  <Settings className="h-5 w-5" />
                  <span>Ayarlar</span>
                </Link>
              )}
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
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
                    <div className="flex items-center text-sm text-green-600 mt-1">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      +8
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
                    <div className="flex items-center text-sm text-green-600 mt-1">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      +3
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
                    <div className="flex items-center text-sm text-green-600 mt-1">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      +2
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
                    <div className="flex items-center text-sm text-green-600 mt-1">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      +{stats?.successTrend || 0}%
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
              <button className="text-gray-500 pb-2 hover:text-gray-700">
                Trend Analizi
              </button>
              <button className="text-gray-500 pb-2 hover:text-gray-700">
                Departman
              </button>
              <button className="text-gray-500 pb-2 hover:text-gray-700">
                Raporlar
              </button>
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
        </main>
      </div>
    </div>
  )
}
