'use client'

import { useEffect, useState } from 'react'
import { getCurrentUser } from '@/lib/user-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Users, 
  UserPlus, 
  Edit, 
  Trash2, 
  Shield, 
  Building2,
  Mail,
  Calendar,
  Search,
  Filter,
  MoreHorizontal
} from 'lucide-react'

interface User {
  id: string
  email: string
  name?: string
  role: 'ADMIN' | 'UPPER_MANAGEMENT' | 'MODEL_FACTORY'
  factoryId?: string
  factoryName?: string
  createdAt: string
  lastLogin?: string
  isActive: boolean
}

export default function UserManagementPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    const user = getCurrentUser()
    setCurrentUser(user)
    
    // Mock data for now - in real app, fetch from API
    setUsers([
      {
        id: '1',
        email: 'admin@kpimanager.com',
        name: 'Sistem Yöneticisi',
        role: 'ADMIN',
        createdAt: '2024-01-01T00:00:00Z',
        lastLogin: '2024-08-20T10:00:00Z',
        isActive: true
      },
      {
        id: '2',
        email: 'director@kpimanager.com',
        name: 'Genel Müdür',
        role: 'UPPER_MANAGEMENT',
        createdAt: '2024-01-02T00:00:00Z',
        lastLogin: '2024-08-19T15:30:00Z',
        isActive: true
      },
      {
        id: '3',
        email: 'bursa.manager@kpimanager.com',
        name: 'Bursa Fabrika Müdürü',
        role: 'MODEL_FACTORY',
        factoryId: 'cmebmec060001gpved4wzoa1i',
        factoryName: 'Bursa',
        createdAt: '2024-01-03T00:00:00Z',
        lastLogin: '2024-08-20T09:15:00Z',
        isActive: true
      },
      {
        id: '4',
        email: 'ankara.manager@kpimanager.com',
        name: 'Ankara Fabrika Müdürü',
        role: 'MODEL_FACTORY',
        factoryId: 'cmebmec020000gpveb9ewqio0',
        factoryName: 'Ankara',
        createdAt: '2024-02-01T00:00:00Z',
        lastLogin: '2024-08-18T14:20:00Z',
        isActive: true
      },
      {
        id: '5',
        email: 'old.user@kpimanager.com',
        name: 'Eski Kullanıcı',
        role: 'MODEL_FACTORY',
        createdAt: '2023-12-01T00:00:00Z',
        lastLogin: '2024-07-15T10:00:00Z',
        isActive: false
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

  const getRoleDisplayName = (role: string): string => {
    switch (role) {
      case 'ADMIN': return 'Sistem Yöneticisi'
      case 'UPPER_MANAGEMENT': return 'Üst Yönetim'
      case 'MODEL_FACTORY': return 'Model Fabrika'
      default: return 'Kullanıcı'
    }
  }

  const getRoleColor = (role: string): string => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800'
      case 'UPPER_MANAGEMENT': return 'bg-blue-100 text-blue-800'
      case 'MODEL_FACTORY': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.factoryName?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    
    return matchesSearch && matchesRole
  })

  const userStats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    admin: users.filter(u => u.role === 'ADMIN').length,
    upperManagement: users.filter(u => u.role === 'UPPER_MANAGEMENT').length,
    factory: users.filter(u => u.role === 'MODEL_FACTORY').length
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Kullanıcı Yönetimi</h1>
                <p className="text-gray-600">
                  Sistem kullanıcıları ve rol yönetimi
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <UserPlus className="w-5 h-5" />
              <span>Yeni Kullanıcı</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Toplam</p>
                  <p className="text-2xl font-bold text-gray-900">{userStats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Aktif</p>
                  <p className="text-2xl font-bold text-gray-900">{userStats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Admin</p>
                  <p className="text-2xl font-bold text-gray-900">{userStats.admin}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Üst Yönetim</p>
                  <p className="text-2xl font-bold text-gray-900">{userStats.upperManagement}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Fabrika</p>
                  <p className="text-2xl font-bold text-gray-900">{userStats.factory}</p>
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
                    placeholder="Kullanıcı ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Tüm Roller</option>
                  <option value="ADMIN">Sistem Yöneticisi</option>
                  <option value="UPPER_MANAGEMENT">Üst Yönetim</option>
                  <option value="MODEL_FACTORY">Model Fabrika</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Kullanıcı Listesi ({filteredUsers.length})</CardTitle>
            <CardDescription>
              Sistem kullanıcılarının detaylı listesi ve yönetim seçenekleri
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Kullanıcı</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Rol</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Fabrika</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Son Giriş</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Durum</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-700">
                              {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.name || 'İsimsiz'}</p>
                            <p className="text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                          {getRoleDisplayName(user.role)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {user.factoryName ? (
                          <div className="flex items-center space-x-1 text-gray-600">
                            <Building2 className="w-4 h-4" />
                            <span>{user.factoryName}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {user.lastLogin ? (
                          <div className="text-gray-600">
                            {new Date(user.lastLogin).toLocaleDateString('tr-TR')}
                            <div className="text-xs text-gray-400">
                              {new Date(user.lastLogin).toLocaleTimeString('tr-TR')}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Hiç giriş yapmamış</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Düzenle"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Daha fazla"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredUsers.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Arama kriterlerinize uygun kullanıcı bulunamadı.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
