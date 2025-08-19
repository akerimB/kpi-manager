'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, Target, Calendar, TrendingUp, Settings as SettingsIcon, PieChart, Zap, FileText, ChevronDown, ChevronRight } from 'lucide-react'
import { getCurrentUser, startSessionMonitoring } from '@/lib/user-context'
import { useEffect, useState } from 'react'

export default function Sidebar() {
  const pathname = usePathname()
  const [userContext, setUserContext] = useState<any>(null)
  const [isClient, setIsClient] = useState(false)
  const [analyticsExpanded, setAnalyticsExpanded] = useState(false)

  // Analytics alt menüsünü açık tut
  useEffect(() => {
    if (pathname === '/analytics' || pathname === '/themes') {
      setAnalyticsExpanded(true)
    }
  }, [pathname])

  useEffect(() => {
    setIsClient(true)
    const user = getCurrentUser()
    setUserContext(user)
    
    // Eğer kullanıcı varsa session monitoring başlat
    if (user) {
      startSessionMonitoring()
    }
  }, [])

  // Real-time kullanıcı bilgisi güncelleme
  useEffect(() => {
    if (!isClient) return

    const updateUserContext = () => {
      const currentUser = getCurrentUser()
      setUserContext(currentUser)
    }

    // Her 2 saniyede bir kontrol et
    const interval = setInterval(updateUserContext, 2000)

    // localStorage değişikliklerini dinle
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user' || e.key === 'authToken') {
        updateUserContext()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [isClient])

  const items = [
    { name: 'Dashboard', href: '/', icon: BarChart3, visible: true },
    { 
      name: 'Analitik', 
      icon: TrendingUp, 
      visible: true,
      hasSubMenu: true,
      expanded: analyticsExpanded,
      onClick: () => setAnalyticsExpanded(!analyticsExpanded),
      subItems: [
        { name: 'Genel Analitik', href: '/analytics', icon: TrendingUp, visible: true },
        { name: 'Tema Takibi', href: '/themes', icon: PieChart, visible: true },
      ]
    },
    { name: 'KPI Girişi', href: '/kpi-entry', icon: Target, visible: isClient && userContext?.userRole === 'MODEL_FACTORY' },
    { name: 'Kanıt Yönetimi', href: '/evidence-management', icon: FileText, visible: isClient && userContext?.userRole === 'MODEL_FACTORY' },
    { name: 'Eylem / Faz İzleme', href: '/actions', icon: Calendar, visible: isClient && userContext?.userRole === 'UPPER_MANAGEMENT' },
    { name: 'Strateji İzleme', href: '/strategy', icon: TrendingUp, visible: isClient && userContext?.userRole === 'UPPER_MANAGEMENT' },
    { name: 'Etki Simülasyonu', href: '/simulation', icon: Zap, visible: isClient && !!userContext?.permissions?.canCreateSimulations },
    { name: 'Ayarlar', href: '/settings', icon: SettingsIcon, visible: true },
  ]

  return (
    <aside className="w-64 bg-white shadow-sm h-screen sticky top-0">
      <nav className="p-4 space-y-2">
        <div className="sidebar-nav">
          {items.filter(i => i.visible).map((item, index) => {
            if (item.hasSubMenu) {
              return (
                <div key={`submenu-${index}`}>
                  <button
                    onClick={item.onClick}
                    className={`sidebar-nav-item w-full flex items-center justify-between ${
                      (pathname === '/analytics' || pathname === '/themes') ? 'active' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </div>
                    {item.expanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  {item.expanded && item.subItems && (
                    <div className="ml-6 mt-1 space-y-1">
                      {item.subItems.filter(sub => sub.visible).map((subItem) => {
                        const isActive = pathname === subItem.href
                        return (
                          <Link 
                            key={subItem.href} 
                            href={subItem.href} 
                            className={`sidebar-nav-item ${isActive ? 'active' : ''} text-sm`}
                          >
                            <subItem.icon className="h-4 w-4" />
                            <span>{subItem.name}</span>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            } else {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <Link key={item.href || `item-${index}`} href={item.href || '#'} className={`sidebar-nav-item ${isActive ? 'active' : ''}`}>
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              )
            }
          })}
        </div>
      </nav>
    </aside>
  )
}


