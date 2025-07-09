'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, Target, Calendar, TrendingUp, Settings, Users, PieChart } from 'lucide-react'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname()

  const navigation = [
    { name: 'Dashboard', href: '/', icon: BarChart3 },
    { name: 'KPI Girişi', href: '/kpi-entry', icon: Target },
    { name: 'Eylem / Faz İzleme', href: '/actions', icon: Calendar },
    { name: 'Strateji İzleme', href: '/strategy', icon: TrendingUp },
    { name: 'Tema Takibi', href: '/themes', icon: PieChart },
    { name: 'Yönetici / Ayarlar', href: '/admin', icon: Settings }
  ]

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
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                <span>Model Fabrika Kullanıcısı</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm h-screen sticky top-0">
          <nav className="p-4 space-y-2">
            <div className="sidebar-nav">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>
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