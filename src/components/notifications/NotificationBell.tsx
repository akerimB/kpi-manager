'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, AlertTriangle, CheckCircle, X } from 'lucide-react'
import Link from 'next/link'

interface NotificationBellProps {
  factoryId: string
}

export default function NotificationBell({ factoryId }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Bildirimleri yükle
  const fetchNotifications = async () => {
    if (!factoryId) {
      console.log('❌ NotificationBell: factoryId yok')
      return
    }
    
    try {
      setLoading(true)
      console.log('🔔 NotificationBell: Bildirimler yükleniyor...', factoryId)
      const response = await fetch(`/api/notifications?factoryId=${factoryId}&limit=5&unread=true`)
      if (response.ok) {
        const data = await response.json()
        console.log('✅ NotificationBell: Bildirimler yüklendi:', data.stats?.unread || 0)
        setNotifications(data.notifications || [])
        setUnreadCount(data.stats?.unread || 0)
      } else {
        console.error('❌ NotificationBell API error:', response.status)
      }
    } catch (error) {
      console.error('❌ NotificationBell fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Bildirim işaretle
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications?factoryId=${factoryId}&notificationId=${notificationId}&action=read`, {
        method: 'PATCH'
      })
      if (response.ok) {
        fetchNotifications()
      }
    } catch (error) {
      console.error('Bildirim güncellenemedi:', error)
    }
  }

  // Dropdown dışında tıklama kontrolü
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // İlk yükleme ve otomatik yenileme
  useEffect(() => {
    if (factoryId) {
      fetchNotifications()
      
      const interval = setInterval(fetchNotifications, 60000) // 1 dakikada bir
      return () => clearInterval(interval)
    }
  }, [factoryId])

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-3 w-3 text-red-500" />
      case 'medium':
        return <Bell className="h-3 w-3 text-blue-500" />
      default:
        return <CheckCircle className="h-3 w-3 text-green-500" />
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)

    if (diffMins < 60) return `${diffMins}dk`
    if (diffHours < 24) return `${diffHours}sa`
    return '1g+'
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bildirim Zili */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <Bell className="h-5 w-5" />
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        
        {/* Pulse Animation for New Notifications */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 rounded-full px-1.5 py-0.5 min-w-[18px] animate-ping opacity-75"></span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Bildirimler</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  {unreadCount} okunmamış
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                Yükleniyor...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p>Yeni bildirim yok</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getPriorityIcon(notification.priority)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </h4>
                          <span className="text-xs text-gray-500 ml-2">
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        
                        {/* KPI Info */}
                        {notification.kpiNumber && (
                          <div className="text-xs text-gray-500 mt-2">
                            KPI {notification.kpiNumber}: {notification.currentValue}
                            {notification.changePercent && (
                              <span className={`ml-1 ${notification.changePercent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ({notification.changePercent > 0 ? '+' : ''}{notification.changePercent}%)
                              </span>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between mt-2">
                          {notification.actionUrl && (
                            <Link
                              href={notification.actionUrl}
                              className="text-xs text-blue-600 hover:text-blue-800"
                              onClick={() => setIsOpen(false)}
                            >
                              Detay Gör →
                            </Link>
                          )}
                          
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >
                            Okundu işaretle
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <Link
              href="/analytics"
              className="block text-center text-sm text-blue-600 hover:text-blue-800"
              onClick={() => setIsOpen(false)}
            >
              Tüm bildirimleri görüntüle
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
