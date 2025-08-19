'use client'

import Link from 'next/link'
import { BarChart3, Bell, Settings, LogOut, Users } from 'lucide-react'
import { getCurrentUser, logout } from '@/lib/user-context'
import { useCallback, useEffect, useState } from 'react'
import NotificationBell from '@/components/notifications/NotificationBell'

export default function Topbar() {
  const [userContext, setUserContext] = useState<any>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    setUserContext(getCurrentUser())
  }, [])

  // Real-time kullanıcı bilgisi güncelleme
  useEffect(() => {
    if (!isClient) return

    const updateUserContext = () => {
      const currentUser = getCurrentUser()
      setUserContext(currentUser)
    }

    // İlk güncelleme
    updateUserContext()

    // Her 1 saniyede bir kontrol et
    const interval = setInterval(updateUserContext, 1000)

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

  const handleLogout = useCallback(async () => {
    if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
      await logout()
    }
  }, [])

  return (
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
            {isClient && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                <span>{userContext?.user?.name || 'Kullanıcı'}</span>
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                  {userContext?.userRole === 'MODEL_FACTORY' ? 'Model Fabrika' :
                   userContext?.userRole === 'UPPER_MANAGEMENT' ? 'Üst Yönetim' : 'Kullanıcı'}
                </span>
              </div>
            )}
            <div className="flex space-x-2">
              {/* Bildirim Zili - Model Fabrika kullanıcıları için */}
              {isClient && userContext?.userRole === 'MODEL_FACTORY' && (
                <NotificationBell factoryId={userContext.factoryId} />
              )}
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
  )
}


