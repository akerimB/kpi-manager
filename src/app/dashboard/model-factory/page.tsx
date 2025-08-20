'use client'

import { useEffect, useState } from 'react'
import { getCurrentUser } from '@/lib/user-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, Target, Calendar, AlertTriangle, CheckCircle, Clock, Factory, Users, Award } from 'lucide-react'
import Link from 'next/link'

interface FactoryStats {
  kpiCount: number
  completedKPIs: number
  pendingKPIs: number
  overdueKPIs: number
  avgScore: number
  trend: 'up' | 'down' | 'stable'
  recentActivities: Array<{
    id: string
    type: 'kpi_entry' | 'evidence_upload' | 'action_completed'
    title: string
    timestamp: string
  }>
  upcomingDeadlines: Array<{
    id: string
    kpiName: string
    deadline: string
    priority: 'high' | 'medium' | 'low'
  }>
  sectorRanking: {
    position: number
    totalFactories: number
    score: number
  }
}

export default function ModelFactoryDashboard() {
  const [user, setUser] = useState<any>(null)
  const [isClient, setIsClient] = useState(false)
  const [stats, setStats] = useState<FactoryStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setIsClient(true)
    setUser(getCurrentUser())
  }, [])

  useEffect(() => {
    if (!user || user.userRole !== 'MODEL_FACTORY' || !user.factoryId) return

    const fetchDashboardData = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/dashboard/model-factory?factoryId=${user.factoryId}`)
        const data = await response.json()
        setStats(data)
      } catch (error) {
        console.error('Dashboard data fetch error:', error)
        // Fallback data
        setStats({
          kpiCount: 25,
          completedKPIs: 18,
          pendingKPIs: 5,
          overdueKPIs: 2,
          avgScore: 78.5,
          trend: 'up',
          recentActivities: [
            {
              id: '1',
              type: 'kpi_entry',
              title: 'KPI-001 değeri güncellendi',
              timestamp: new Date().toISOString()
            },
            {
              id: '2',
              type: 'evidence_upload',
              title: 'Yeni kanıt dosyası yüklendi',
              timestamp: new Date(Date.now() - 3600000).toISOString()
            }
          ],
          upcomingDeadlines: [
            {
              id: '1',
              kpiName: 'KPI-003 Eğitim Katılım Oranı',
              deadline: new Date(Date.now() + 86400000).toISOString(),
              priority: 'high'
            }
          ],
          sectorRanking: {
            position: 3,
            totalFactories: 15,
            score: 78.5
          }
        })
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [user])

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user || user.userRole !== 'MODEL_FACTORY') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Erişim Engellendi</h1>
          <p className="text-gray-600">Bu sayfa sadece Model Fabrika kullanıcıları için erişilebilir.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {user.factoryName || 'Model Fabrika'} Dashboard
          </h1>
          <p className="text-gray-600">
            Model fabrika performansınızı takip edin ve iyileştirme fırsatlarını keşfedin
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam KPI</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.kpiCount || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.completedKPIs || 0} tamamlandı
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ortalama Skor</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.avgScore?.toFixed(1) || '0'}%</div>
              <p className="text-xs text-muted-foreground flex items-center">
                {stats?.trend === 'up' ? (
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                ) : stats?.trend === 'down' ? (
                  <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                ) : (
                  <Clock className="h-3 w-3 text-gray-500 mr-1" />
                )}
                Geçen aya göre
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sektör Sıralaması</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.sectorRanking?.position || 0}/{stats?.sectorRanking?.totalFactories || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.sectorRanking?.score?.toFixed(1) || '0'} puan
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bekleyen Görevler</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.pendingKPIs || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.overdueKPIs || 0} gecikmiş
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activities */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Son Aktiviteler</CardTitle>
                <CardDescription>
                  Son KPI girişleri ve kanıt yüklemeleri
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.recentActivities?.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {activity.type === 'kpi_entry' && <Target className="h-5 w-5 text-blue-500" />}
                        {activity.type === 'evidence_upload' && <CheckCircle className="h-5 w-5 text-green-500" />}
                        {activity.type === 'action_completed' && <Award className="h-5 w-5 text-purple-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {activity.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(activity.timestamp).toLocaleString('tr-TR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & Deadlines */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Hızlı İşlemler</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/kpi-entry">
                  <Button className="w-full justify-start" variant="outline">
                    <Target className="mr-2 h-4 w-4" />
                    KPI Değeri Gir
                  </Button>
                </Link>
                <Link href="/evidence-management">
                  <Button className="w-full justify-start" variant="outline">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Kanıt Yükle
                  </Button>
                </Link>
                <Link href="/user-actions">
                  <Button className="w-full justify-start" variant="outline">
                    <Calendar className="mr-2 h-4 w-4" />
                    Kişisel Eylem Ekle
                  </Button>
                </Link>
                <Link href="/analytics">
                  <Button className="w-full justify-start" variant="outline">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Performans Analizi
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Upcoming Deadlines */}
            <Card>
              <CardHeader>
                <CardTitle>Yaklaşan Son Tarihler</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats?.upcomingDeadlines?.map((deadline) => (
                    <div key={deadline.id} className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {deadline.kpiName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(deadline.deadline).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs ${
                        deadline.priority === 'high' ? 'bg-red-100 text-red-800' :
                        deadline.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {deadline.priority === 'high' ? 'Yüksek' :
                         deadline.priority === 'medium' ? 'Orta' : 'Düşük'}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
