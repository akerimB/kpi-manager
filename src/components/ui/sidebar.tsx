'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, Target, Calendar, TrendingUp, Settings as SettingsIcon, PieChart, Zap } from 'lucide-react'
import { getCurrentUser } from '@/lib/user-context'

export default function Sidebar() {
  const pathname = usePathname()
  const userContext = getCurrentUser()

  const items = [
    { name: 'Dashboard', href: '/', icon: BarChart3, visible: true },
    { name: 'KPI Girişi', href: '/kpi-entry', icon: Target, visible: userContext?.userRole === 'MODEL_FACTORY' },
    { name: 'Eylem / Faz İzleme', href: '/actions', icon: Calendar, visible: userContext?.userRole === 'UPPER_MANAGEMENT' || userContext?.userRole === 'ADMIN' },
    { name: 'Strateji İzleme', href: '/strategy', icon: TrendingUp, visible: userContext?.userRole === 'UPPER_MANAGEMENT' || userContext?.userRole === 'ADMIN' },
    { name: 'Tema Takibi', href: '/themes', icon: PieChart, visible: true },
    { name: 'Etki Simülasyonu', href: '/simulation', icon: Zap, visible: !!userContext?.permissions?.canCreateSimulations },
    { name: 'Ayarlar', href: '/settings', icon: SettingsIcon, visible: true },
  ]

  return (
    <aside className="w-64 bg-white shadow-sm h-screen sticky top-0">
      <nav className="p-4 space-y-2">
        <div className="sidebar-nav">
          {items.filter(i => i.visible).map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href} className={`sidebar-nav-item ${isActive ? 'active' : ''}`}>
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </aside>
  )
}


