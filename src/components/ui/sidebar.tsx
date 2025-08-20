'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, Target, Calendar, TrendingUp, Settings as SettingsIcon, PieChart, Zap, FileText, Bell } from 'lucide-react'
import { getCurrentUser, startSessionMonitoring } from '@/lib/user-context'
import { useEffect, useState } from 'react'

export default function Sidebar() {
  const pathname = usePathname()
  const [userContext, setUserContext] = useState<any>(null)
  const [isClient, setIsClient] = useState(false)


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
    // Model Fabrika özel menüler
    { 
      name: 'Dashboard', 
      href: userContext?.userRole === 'MODEL_FACTORY' ? '/dashboard/model-factory' : '/', 
      icon: BarChart3, 
      visible: true 
    },
    { 
      name: 'Analitik', 
      href: userContext?.userRole === 'MODEL_FACTORY' ? '/analytics/model-factory' : '/analytics', 
      icon: TrendingUp, 
      visible: true 
    },
    { name: 'KPI Girişi', href: '/kpi-entry', icon: Target, visible: isClient && userContext?.userRole === 'MODEL_FACTORY' },
    { name: 'Kanıt Yönetimi', href: '/evidence-management', icon: FileText, visible: isClient && userContext?.userRole === 'MODEL_FACTORY' },
    { name: 'Eylem / Faz İzleme', href: '/actions', icon: Calendar, visible: isClient && userContext?.userRole === 'UPPER_MANAGEMENT' },
    { 
      name: 'Kişisel Eylemler', 
      href: userContext?.userRole === 'MODEL_FACTORY' ? '/user-actions/model-factory' : '/user-actions', 
      icon: Calendar, 
      visible: isClient && !!userContext 
    },
    // Place Takvim and Uyarılar right above Ayarlar
    { name: 'Strateji İzleme', href: '/strategy', icon: TrendingUp, visible: isClient && userContext?.userRole === 'UPPER_MANAGEMENT' },
    { name: 'Etki Simülasyonu', href: '/simulation', icon: Zap, visible: isClient && !!userContext?.permissions?.canCreateSimulations },
    { name: 'Takvim', href: '/calendar', icon: Calendar, visible: isClient && !!userContext },
    { 
      name: 'Bildirimler', 
      href: userContext?.userRole === 'MODEL_FACTORY' ? '/notifications/model-factory' : '/notifications', 
      icon: Bell, 
      visible: isClient && !!userContext 
    },
    // Move Settings below Takvim and Uyarılar by ordering items earlier
    { name: 'Ayarlar', href: '/settings', icon: SettingsIcon, visible: true },
  ]

  return (
    <aside className="w-64 bg-white shadow-sm h-screen sticky top-0">
      <nav className="p-4 space-y-2">
        <div className="sidebar-nav">
          {items.filter(i => i.visible).map((item, index) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link key={item.href || `item-${index}`} href={item.href || '#'} className={`sidebar-nav-item ${isActive ? 'active' : ''}`}>
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


