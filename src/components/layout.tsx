'use client'

import { ReactNode, useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  BarChart3, 
  Target, 
  Calendar, 
  TrendingUp, 
  Settings, 
  Users, 
  PieChart, 
  Brain,
  AlertTriangle,
  FileText,
  Shield,
  Building2,
  LogOut
} from 'lucide-react'
import { getCurrentUser } from '@/lib/user-context'

interface LayoutProps {
  children: ReactNode
}

interface NavigationItem {
  name: string
  href: string
  icon: any
  roles: string[]
  description?: string
}

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    setUser(getCurrentUser())
  }, [])

  // Navigation items with role-based access
  const allNavigationItems: NavigationItem[] = [
    { 
      name: 'Dashboard', 
      href: '/', 
      icon: BarChart3, 
      roles: ['ADMIN', 'UPPER_MANAGEMENT', 'MODEL_FACTORY'],
      description: 'Ana sayfa ve özet bilgiler'
    },
    { 
      name: 'Kişisel Eylemler', 
      href: '/user-actions', 
      icon: Calendar, 
      roles: ['ADMIN', 'UPPER_MANAGEMENT', 'MODEL_FACTORY'],
      description: 'Kullanıcı tanımlı eylemler ve takvim'
    },
    { 
      name: 'Analitik', 
      href: '/analytics', 
      icon: TrendingUp, 
      roles: ['ADMIN', 'UPPER_MANAGEMENT', 'MODEL_FACTORY'],
      description: 'Detaylı performans analizi'
    },
    { 
      name: 'KPI Girişi', 
      href: '/kpi-entry', 
      icon: Target, 
      roles: ['MODEL_FACTORY'],
      description: 'KPI değer girişi'
    },
    { 
      name: 'Eylem / Faz İzleme', 
      href: '/actions', 
      icon: Calendar, 
      roles: ['ADMIN', 'UPPER_MANAGEMENT', 'MODEL_FACTORY'],
      description: 'Aksiyon planı takibi'
    },
    { 
      name: 'Strateji İzleme', 
      href: '/strategy', 
      icon: TrendingUp, 
      roles: ['ADMIN', 'UPPER_MANAGEMENT'],
      description: 'Stratejik hedef izleme'
    },
    { 
      name: 'Tema Takibi', 
      href: '/themes', 
      icon: PieChart, 
      roles: ['ADMIN', 'UPPER_MANAGEMENT', 'MODEL_FACTORY'],
      description: 'LEAN/DIGITAL/GREEN/RESILIENCE takibi'
    },
    { 
      name: 'ML Analiz', 
      href: '/ml', 
      icon: Brain, 
      roles: ['ADMIN', 'UPPER_MANAGEMENT'],
      description: 'Makine öğrenmesi ve tahmin'
    },
    { 
      name: 'Uyarılar', 
      href: '/alerts', 
      icon: AlertTriangle, 
      roles: ['ADMIN', 'UPPER_MANAGEMENT', 'MODEL_FACTORY'],
      description: 'Sistem uyarıları'
    },
    { 
      name: 'Rapor İndirme', 
      href: '/export', 
      icon: FileText, 
      roles: ['ADMIN', 'UPPER_MANAGEMENT', 'MODEL_FACTORY'],
      description: 'Excel/PDF rapor dışa aktarım'
    },
    { 
      name: 'Kullanıcı Yönetimi', 
      href: '/admin/users', 
      icon: Users, 
      roles: ['ADMIN'],
      description: 'Kullanıcı ve rol yönetimi'
    },
    { 
      name: 'Fabrika Yönetimi', 
      href: '/admin/factories', 
      icon: Building2, 
      roles: ['ADMIN'],
      description: 'Fabrika tanımları'
    },
    { 
      name: 'Sistem Ayarları', 
      href: '/admin', 
      icon: Settings, 
      roles: ['ADMIN', 'UPPER_MANAGEMENT'],
      description: 'Genel sistem ayarları'
    }
  ]

  // Filter navigation based on user role
  const navigation = isClient && user 
    ? allNavigationItems.filter(item => item.roles.includes(user.userRole))
    : []

  const getRoleDisplayName = (role: string): string => {
    switch (role) {
      case 'ADMIN': return 'Sistem Yöneticisi'
      case 'UPPER_MANAGEMENT': return 'Üst Yönetim'
      case 'MODEL_FACTORY': return 'Model Fabrika'
      default: return 'Kullanıcı'
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout error:', error)
      window.location.href = '/login'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">KPI Manager</h1>
                  <p className="text-sm text-gray-500">v2.1.0</p>
                </div>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              {isClient && user && (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Shield className="h-4 w-4" />
                    <span>{getRoleDisplayName(user.userRole)}</span>
                    {user.factoryName && (
                      <>
                        <span className="text-gray-400">•</span>
                        <Building2 className="h-3 w-3" />
                        <span className="text-xs">{user.factoryName}</span>
                      </>
                    )}
                  </div>
                  <button
                    onClick={logout}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Çıkış Yap"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              )}</div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm h-screen sticky top-0">
          <nav className="p-4 space-y-1">
            {isClient && user && (
              <>
                {/* User Info Section */}
                <div className="mb-6 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-900">
                      {user.userName || user.email}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {getRoleDisplayName(user.userRole)}
                    {user.factoryName && (
                      <div className="flex items-center space-x-1 mt-1">
                        <Building2 className="h-3 w-3" />
                        <span>{user.factoryName}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Navigation Items - Grouped by functionality */}
                <div className="space-y-1">
                  {/* Core Features */}
                  <div className="space-y-1">
                    {navigation.filter(item => ['Dashboard', 'Analitik', 'KPI Girişi'].includes(item.name)).map((item) => {
                      const isActive = pathname === item.href
                      const Icon = item.icon
                      
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={`
                            flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                            ${isActive 
                              ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700' 
                              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            }
                          `}
                          title={item.description}
                        >
                          <Icon className="h-5 w-5 flex-shrink-0" />
                          <span className="truncate">{item.name}</span>
                        </Link>
                      )
                    })}
                  </div>

                  {/* Tracking & Management */}
                  {navigation.filter(item => ['Eylem / Faz İzleme', 'Kişisel Eylemler', 'Strateji İzleme', 'Tema Takibi'].includes(item.name)).length > 0 && (
                    <>
                      <div className="pt-3 mt-3">
                        <div className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Takip & Yönetim
                        </div>
                      </div>
                      <div className="space-y-1">
                        {navigation.filter(item => ['Eylem / Faz İzleme', 'Kişisel Eylemler', 'Strateji İzleme', 'Tema Takibi'].includes(item.name)).map((item) => {
                          const isActive = pathname === item.href
                          const Icon = item.icon
                          
                          return (
                            <Link
                              key={item.name}
                              href={item.href}
                              className={`
                                flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                                ${isActive 
                                  ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700' 
                                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                }
                              `}
                              title={item.description}
                            >
                              <Icon className="h-5 w-5 flex-shrink-0" />
                              <span className="truncate">{item.name}</span>
                            </Link>
                          )
                        })}
                      </div>
                    </>
                  )}

                  {/* Advanced Features */}
                  {navigation.filter(item => ['ML Analiz', 'Uyarılar', 'Rapor İndirme'].includes(item.name)).length > 0 && (
                    <>
                      <div className="pt-3 mt-3">
                        <div className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Gelişmiş Özellikler
                        </div>
                      </div>
                      <div className="space-y-1">
                        {navigation.filter(item => ['ML Analiz', 'Uyarılar', 'Rapor İndirme'].includes(item.name)).map((item) => {
                          const isActive = pathname === item.href
                          const Icon = item.icon
                          
                          return (
                            <Link
                              key={item.name}
                              href={item.href}
                              className={`
                                flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                                ${isActive 
                                  ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700' 
                                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                }
                              `}
                              title={item.description}
                            >
                              <Icon className="h-5 w-5 flex-shrink-0" />
                              <span className="truncate">{item.name}</span>
                            </Link>
                          )
                        })}
                      </div>
                    </>
                  )}

                  {/* Admin Features */}
                  {navigation.filter(item => ['Kullanıcı Yönetimi', 'Fabrika Yönetimi', 'Sistem Ayarları'].includes(item.name)).length > 0 && (
                    <>
                      <div className="pt-3 mt-3 border-t border-gray-200">
                        <div className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Yönetici İşlemleri
                        </div>
                      </div>
                      <div className="space-y-1">
                        {navigation.filter(item => ['Kullanıcı Yönetimi', 'Fabrika Yönetimi', 'Sistem Ayarları'].includes(item.name)).map((item) => {
                          const isActive = pathname === item.href
                          const Icon = item.icon
                          
                          return (
                            <Link
                              key={item.name}
                              href={item.href}
                              className={`
                                flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                                ${isActive 
                                  ? 'bg-red-100 text-red-700 border-r-2 border-red-700' 
                                  : 'text-gray-600 hover:bg-red-50 hover:text-red-700'
                                }
                              `}
                              title={item.description}
                            >
                              <Icon className="h-5 w-5 flex-shrink-0" />
                              <span className="truncate">{item.name}</span>
                            </Link>
                          )
                        })}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
} 