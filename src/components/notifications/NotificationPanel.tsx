'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bell, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Clock, X, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface Notification {
  id: string
  type: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  actionUrl?: string
  kpiNumber?: number
  currentValue?: number
  targetValue?: number
  changePercent?: number
  period: string
  createdAt: string
  isRead: boolean
  isActive: boolean
}

interface NotificationPanelProps {
  factoryId: string
  autoRefresh?: boolean
  limit?: number
}

export default function NotificationPanel({ factoryId, autoRefresh = true, limit = 10 }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  // Bildirimleri yükle
  const fetchNotifications = async () => {
    try {
      const response = await fetch(`/api/notifications?factoryId=${factoryId}&limit=${limit}`)
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setStats(data.stats || {})
      }
    } catch (error) {
      console.error('Bildirimler yüklenemedi:', error)
    } finally {
      setLoading(false)
    }
  }

  // Bildirim işaretle (okundu/okunmadı/sil)
  const markNotification = async (notificationId: string, action: 'read' | 'unread' | 'delete') => {
    try {
      const response = await fetch(`/api/notifications?factoryId=${factoryId}&notificationId=${notificationId}&action=${action}`, {
        method: 'PATCH'
      })
      
      if (response.ok) {
        fetchNotifications() // Yeniden yükle
      }
    } catch (error) {
      console.error('Bildirim güncellenemedi:', error)
    }
  }

  // Otomatik yenileme
  useEffect(() => {
    fetchNotifications()
    
    if (autoRefresh) {
      const interval = setInterval(fetchNotifications, 30000) // 30 saniyede bir
      return () => clearInterval(interval)
    }
  }, [factoryId, autoRefresh])

  // Yeni bildirimler oluştur (demo için)
  const generateNotifications = async () => {
    try {
      const response = await fetch('/api/notifications/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factoryId, period: '2024-Q4' })
      })
      
      if (response.ok) {
        const data = await response.json()
        
        // Oluşturulan bildirimleri kaydet
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            factoryId, 
            notifications: data.notifications 
          })
        })
        
        // Panel'i yenile
        fetchNotifications()
      }
    } catch (error) {
      console.error('Bildirimler oluşturulamadı:', error)
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-600" />
      case 'medium': return <Bell className="h-4 w-4 text-blue-600" />
      case 'low': return <Bell className="h-4 w-4 text-gray-600" />
      default: return <Bell className="h-4 w-4 text-gray-600" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-l-red-500 bg-red-50'
      case 'high': return 'border-l-orange-500 bg-orange-50'
      case 'medium': return 'border-l-blue-500 bg-blue-50'
      case 'low': return 'border-l-gray-500 bg-gray-50'
      default: return 'border-l-gray-500 bg-gray-50'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS_ACHIEVEMENT': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'TREND_CHANGE': return <TrendingUp className="h-4 w-4 text-purple-600" />
      case 'KPI_ENTRY_REMINDER': return <Clock className="h-4 w-4 text-yellow-600" />
      default: return <Bell className="h-4 w-4 text-blue-600" />
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}dk önce`
    if (diffHours < 24) return `${diffHours}sa önce`
    return `${diffDays}g önce`
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-500" />
            Bildirimler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-3 bg-gray-50 rounded-lg animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-500" />
            Bildirimler
            {stats && stats.unread > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                {stats.unread}
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <button
              onClick={generateNotifications}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              🔄 Yenile
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              {expanded ? 'Küçült' : 'Genişlet'}
            </button>
          </div>
        </div>
        
        {stats && (
          <CardDescription className="flex items-center gap-4 text-sm">
            <span>Toplam: {stats.total}</span>
            {stats.critical > 0 && <span className="text-red-600">Kritik: {stats.critical}</span>}
            {stats.high > 0 && <span className="text-orange-600">Yüksek: {stats.high}</span>}
            {stats.medium > 0 && <span className="text-blue-600">Orta: {stats.medium}</span>}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p>Henüz bildirim yok</p>
            <button
              onClick={generateNotifications}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
            >
              Bildirimler oluştur
            </button>
          </div>
        ) : (
          <div className={`space-y-3 ${expanded ? 'max-h-none' : 'max-h-96 overflow-y-auto'}`}>
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 border-l-4 rounded-lg ${getPriorityColor(notification.priority)} ${
                  notification.isRead ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex items-center gap-2">
                      {getPriorityIcon(notification.priority)}
                      {getTypeIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 mb-1">
                        {notification.title}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {notification.message}
                      </p>
                      
                      {/* KPI Detayları */}
                      {notification.kpiNumber && (
                        <div className="text-xs text-gray-500 bg-white rounded px-2 py-1 inline-block">
                          KPI {notification.kpiNumber}: {notification.currentValue}
                          {notification.targetValue && ` / ${notification.targetValue}`}
                          {notification.changePercent && (
                            <span className={`ml-2 ${notification.changePercent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ({notification.changePercent > 0 ? '+' : ''}{notification.changePercent}%)
                            </span>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span>{formatTimeAgo(notification.createdAt)}</span>
                        <span>•</span>
                        <span>{notification.period}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 ml-2">
                    {notification.actionUrl && (
                      <Link href={notification.actionUrl}>
                        <ExternalLink className="h-4 w-4 text-blue-600 hover:text-blue-800" />
                      </Link>
                    )}
                    
                    <button
                      onClick={() => markNotification(notification.id, notification.isRead ? 'unread' : 'read')}
                      className="text-gray-400 hover:text-gray-600"
                      title={notification.isRead ? 'Okunmadı olarak işaretle' : 'Okundu olarak işaretle'}
                    >
                      {notification.isRead ? '📖' : '📬'}
                    </button>
                    
                    <button
                      onClick={() => markNotification(notification.id, 'delete')}
                      className="text-gray-400 hover:text-red-600"
                      title="Sil"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
