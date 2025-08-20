'use client'

import { useEffect, useState } from 'react'
import { getCurrentUser } from '@/lib/user-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Users, 
  Building2, 
  Target, 
  Settings, 
  Database, 
  TrendingUp, 
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react'

interface SystemStats {
  totalUsers: number
  totalFactories: number
  totalKPIs: number
  activeKPIValues: number
  lastDataUpdate: string
  systemHealth: 'healthy' | 'warning' | 'critical'
}

interface RecentActivity {
  id: string
  type: 'user_login' | 'kpi_update' | 'factory_added' | 'system_alert'
  user: string
  description: string
  timestamp: string
  status: 'success' | 'warning' | 'error'
}

export default function AdminPage() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentUser = getCurrentUser()
    setUser(currentUser)
    
    // Mock data for now - in real app, fetch from API
    setStats({
      totalUsers: 25,
      totalFactories: 12,
      totalKPIs: 156,
      activeKPIValues: 1247,
      lastDataUpdate: new Date().toISOString(),
      systemHealth: 'healthy'
    })

    setActivities([
      {
        id: '1',
        type: 'user_login',
        user: 'admin@example.com',
        description: 'Üst yönetim kullanıcısı sisteme giriş yaptı',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        status: 'success'
      },
      {
        id: '2',
        type: 'kpi_update',
        user: 'factory.manager@example.com',
        description: 'Bursa fabrikası için KPI değerleri güncellendi',
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        status: 'success'
      },
      {
        id: '3',
        type: 'system_alert',
        user: 'system',
        description: 'Redis cache bağlantı uyarısı',
        timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        status: 'warning'
      }
    ])

    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user || (user.userRole !== 'ADMIN' && user.userRole !== 'UPPER_MANAGEMENT')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erişim Reddedildi</h2>
          <p className="text-gray-600">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
        </div>
      </div>
    )
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_login': return <Users className="w-4 h-4" />
      case 'kpi_update': return <Target className="w-4 h-4" />
      case 'factory_added': return <Building2 className="w-4 h-4" />
      case 'system_alert': return <AlertTriangle className="w-4 h-4" />
      default: return <Settings className="w-4 h-4" />
    }
  }

  const getActivityColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50'
      case 'warning': return 'text-yellow-600 bg-yellow-50'
      case 'error': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'critical': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return <CheckCircle className="w-5 h-5" />
      case 'warning': return <AlertTriangle className="w-5 h-5" />
      case 'critical': return <AlertTriangle className="w-5 h-5" />
      default: return <Clock className="w-5 h-5" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Settings className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Yönetici Paneli</h1>
              <p className="text-gray-600">
                Sistem yönetimi ve izleme araçları
              </p>
            </div>
          </div>

          {/* System Health Badge */}
          <div className="flex items-center space-x-2">
            <div className={`flex items-center space-x-1 ${getHealthColor(stats?.systemHealth || 'healthy')}`}>
              {getHealthIcon(stats?.systemHealth || 'healthy')}
              <span className="text-sm font-medium">
                Sistem Durumu: {stats?.systemHealth === 'healthy' ? 'Sağlıklı' : 
                                stats?.systemHealth === 'warning' ? 'Uyarı' : 'Kritik'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <Users className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Toplam Kullanıcı</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <Building2 className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Aktif Fabrika</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalFactories}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <Target className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Tanımlı KPI</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalKPIs}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <Database className="w-8 h-8 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Aktif Veri</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.activeKPIValues}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Hızlı İşlemler</CardTitle>
              <CardDescription>
                Sık kullanılan yönetici işlemlerine hızlı erişim
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <button className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-blue-600" />
                    <div>
                      <h3 className="font-medium">Kullanıcı Yönetimi</h3>
                      <p className="text-sm text-gray-500">Kullanıcı ekleme, düzenleme ve rol atama</p>
                    </div>
                  </div>
                </button>

                <button className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <Building2 className="w-5 h-5 text-green-600" />
                    <div>
                      <h3 className="font-medium">Fabrika Yönetimi</h3>
                      <p className="text-sm text-gray-500">Fabrika ekleme ve konfigürasyon</p>
                    </div>
                  </div>
                </button>

                <button className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <Target className="w-5 h-5 text-purple-600" />
                    <div>
                      <h3 className="font-medium">KPI Tanımları</h3>
                      <p className="text-sm text-gray-500">KPI ekleme, hedef belirleme ve kategoriler</p>
                    </div>
                  </div>
                </button>

                <button className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <BarChart3 className="w-5 h-5 text-orange-600" />
                    <div>
                      <h3 className="font-medium">Sistem Raporları</h3>
                      <p className="text-sm text-gray-500">Performans ve kullanım raporları</p>
                    </div>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Son Aktiviteler</CardTitle>
              <CardDescription>
                Sistemdeki son işlemler ve güncellemeler
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`p-2 rounded-full ${getActivityColor(activity.status)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.description}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-xs text-gray-500">{activity.user}</p>
                        <span className="text-xs text-gray-400">•</span>
                        <p className="text-xs text-gray-500">
                          {new Date(activity.timestamp).toLocaleString('tr-TR')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Information */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Sistem Bilgileri</CardTitle>
            <CardDescription>
              Uygulama versiyonu ve teknik detaylar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Uygulama</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Version: 2.1.0</p>
                  <p>Build: {process.env.NODE_ENV}</p>
                  <p>Son Güncelleme: {stats?.lastDataUpdate ? new Date(stats.lastDataUpdate).toLocaleString('tr-TR') : 'Bilinmiyor'}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Database</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Status: Connected</p>
                  <p>Type: PostgreSQL</p>
                  <p>Cache: Redis</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Özellikler</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Real-time Updates: Aktif</p>
                  <p>ML Analytics: Aktif</p>
                  <p>Export: Excel/PDF</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
