'use client'

import { useEffect, useState } from 'react'
import { getCurrentUser } from '@/lib/user-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  MapPin,
  Users,
  Target,
  Calendar,
  Search,
  Filter,
  MoreHorizontal,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface Factory {
  id: string
  code: string
  name: string
  city: string
  region?: string
  established?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  // Stats
  userCount?: number
  kpiCount?: number
  lastKPIUpdate?: string
}

export default function FactoryManagementPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [factories, setFactories] = useState<Factory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    const user = getCurrentUser()
    setCurrentUser(user)
    loadFactories()
  }, [])

  const loadFactories = async () => {
    try {
      const response = await fetch('/api/factories')
      if (response.ok) {
        const factoryData = await response.json()
        
        // Enrich with mock stats data
        const enrichedFactories = factoryData.map((factory: any) => ({
          ...factory,
          userCount: Math.floor(Math.random() * 20) + 1,
          kpiCount: Math.floor(Math.random() * 50) + 10,
          lastKPIUpdate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        }))
        
        setFactories(enrichedFactories)
      }
    } catch (error) {
      console.error('Failed to load factories:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!currentUser || currentUser.userRole !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erişim Reddedildi</h2>
          <p className="text-gray-600">Bu sayfaya sadece sistem yöneticileri erişebilir.</p>
        </div>
      </div>
    )
  }

  const filteredFactories = factories.filter(factory => {
    const matchesSearch = factory.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         factory.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         factory.city.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && factory.isActive) ||
                         (statusFilter === 'inactive' && !factory.isActive)
    
    return matchesSearch && matchesStatus
  })

  const factoryStats = {
    total: factories.length,
    active: factories.filter(f => f.isActive).length,
    inactive: factories.filter(f => !f.isActive).length,
    totalUsers: factories.reduce((sum, f) => sum + (f.userCount || 0), 0),
    totalKPIs: factories.reduce((sum, f) => sum + (f.kpiCount || 0), 0)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Building2 className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Fabrika Yönetimi</h1>
                <p className="text-gray-600">
                  Model fabrikalar ve lokasyon yönetimi
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Yeni Fabrika</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Toplam Fabrika</p>
                  <p className="text-2xl font-bold text-gray-900">{factoryStats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Aktif</p>
                  <p className="text-2xl font-bold text-gray-900">{factoryStats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Pasif</p>
                  <p className="text-2xl font-bold text-gray-900">{factoryStats.inactive}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Kullanıcı</p>
                  <p className="text-2xl font-bold text-gray-900">{factoryStats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">KPI</p>
                  <p className="text-2xl font-bold text-gray-900">{factoryStats.totalKPIs}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Fabrika ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Tüm Durumlar</option>
                  <option value="active">Aktif</option>
                  <option value="inactive">Pasif</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Factories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFactories.map((factory) => (
            <Card key={factory.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <span>{factory.name}</span>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      factory.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {factory.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <CardDescription>
                  <div className="flex items-center space-x-1 text-gray-500">
                    <MapPin className="w-4 h-4" />
                    <span>{factory.city}</span>
                    <span className="text-gray-400">•</span>
                    <span className="font-mono text-sm">{factory.code}</span>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <Users className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                      <p className="text-sm font-medium text-gray-900">{factory.userCount || 0}</p>
                      <p className="text-xs text-gray-500">Kullanıcı</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <Target className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                      <p className="text-sm font-medium text-gray-900">{factory.kpiCount || 0}</p>
                      <p className="text-xs text-gray-500">KPI</p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-sm">
                    {factory.established && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Kuruluş:</span>
                        <span className="text-gray-900">{factory.established}</span>
                      </div>
                    )}
                    {factory.lastKPIUpdate && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Son KPI:</span>
                        <span className="text-gray-900">
                          {new Date(factory.lastKPIUpdate).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Güncellenme:</span>
                      <span className="text-gray-900">
                        {new Date(factory.updatedAt).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 pt-4 border-t border-gray-100">
                    <button className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                      <Edit className="w-4 h-4" />
                      <span>Düzenle</span>
                    </button>
                    <button className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                      <Trash2 className="w-4 h-4" />
                      <span>Sil</span>
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredFactories.length === 0 && (
          <Card>
            <CardContent className="pt-8">
              <div className="text-center py-8">
                <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Arama kriterlerinize uygun fabrika bulunamadı.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
