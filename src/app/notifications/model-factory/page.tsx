'use client'

import { useEffect, useMemo, useState } from 'react'
import { getCurrentUser } from '@/lib/user-context'
import NotificationPanel from '@/components/notifications/NotificationPanel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, AlertTriangle, CheckCircle, Clock, Target, Users, Award, FileText, TrendingUp, TrendingDown } from 'lucide-react'

interface Notification {
  id: string
  type: 'KPI_ALERT' | 'DEADLINE' | 'PERFORMANCE' | 'TRAINING' | 'MENTORING' | 'KNOWLEDGE_SHARING' | 'INNOVATION' | 'SUSTAINABILITY'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  title: string
  message: string
  period: string
  factoryId: string
  factoryName: string
  createdAt: string
  read: boolean
  actionRequired: boolean
  relatedKPI?: string
  relatedAction?: string
}

export default function ModelFactoryNotifications() {
  const [user, setUser] = useState<any>(null)
  const [isClient, setIsClient] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [onlyUnread, setOnlyUnread] = useState(false)
  const [filterType, setFilterType] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [limit, setLimit] = useState(20)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setIsClient(true)
    setUser(getCurrentUser())
  }, [])

  const factoryId = useMemo(() => user?.factoryId as string | undefined, [user])

  useEffect(() => {
    if (!factoryId) return

    const fetchNotifications = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('factoryId', factoryId)
        params.set('limit', limit.toString())
        if (onlyUnread) params.set('unread', 'true')
        if (filterType !== 'all') params.set('type', filterType)
        if (filterPriority !== 'all') params.set('priority', filterPriority)

        const response = await fetch(`/api/notifications?${params.toString()}`)
        const data = await response.json()
        setNotifications(data.notifications || [])
      } catch (error) {
        console.error('Notifications fetch error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [factoryId, onlyUnread, filterType, filterPriority, limit])

  const generateNotifications = async () => {
    try {
      if (!factoryId) return
      
      // Get current period (latest quarter)
      const currentYear = new Date().getFullYear()
      const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3)
      const periods = [
        `${currentYear}-Q${currentQuarter}`,
        `${currentYear}-Q${Math.max(1, currentQuarter - 1)}`,
        '2024-Q4',
        '2024-Q3'
      ]
      
      for (const period of periods) {
        const response = await fetch('/api/notifications/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ factoryId, period })
        })
        
        if (response.ok) {
          const result = await response.json()
          if (result.notifications?.length > 0) {
            break // Found data for this period, move to next period
          }
        }
      }
      
      // Refresh the notifications display
      window.location.reload()
    } catch (error) {
      console.error('Bildirim oluşturma hatası:', error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST'
      })
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
    } catch (error) {
      console.error('Mark as read error:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factoryId })
      })
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch (error) {
      console.error('Mark all as read error:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'KPI_ALERT':
        return <Target className="h-5 w-5 text-red-500" />
      case 'DEADLINE':
        return <Clock className="h-5 w-5 text-orange-500" />
      case 'PERFORMANCE':
        return <TrendingUp className="h-5 w-5 text-blue-500" />
      case 'TRAINING':
        return <Users className="h-5 w-5 text-green-500" />
      case 'MENTORING':
        return <Award className="h-5 w-5 text-purple-500" />
      case 'KNOWLEDGE_SHARING':
        return <FileText className="h-5 w-5 text-indigo-500" />
      case 'INNOVATION':
        return <TrendingUp className="h-5 w-5 text-yellow-500" />
      case 'SUSTAINABILITY':
        return <CheckCircle className="h-5 w-5 text-emerald-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case 'KPI_ALERT':
        return 'KPI Uyarısı'
      case 'DEADLINE':
        return 'Son Tarih'
      case 'PERFORMANCE':
        return 'Performans'
      case 'TRAINING':
        return 'Eğitim'
      case 'MENTORING':
        return 'Mentörlük'
      case 'KNOWLEDGE_SHARING':
        return 'Bilgi Paylaşımı'
      case 'INNOVATION':
        return 'İnovasyon'
      case 'SUSTAINABILITY':
        return 'Sürdürülebilirlik'
      default:
        return 'Genel'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800'
      case 'HIGH':
        return 'bg-orange-100 text-orange-800'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800'
      case 'LOW':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length
  const actionRequiredCount = notifications.filter(n => n.actionRequired && !n.read).length

  if (!isClient) return null
  if (!user) return <div className="p-6">Giriş gerekli</div>

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Model Fabrika Bildirimleri</h1>
          <p className="text-gray-600 mt-1">
            Model fabrika performansınızla ilgili önemli bildirimler
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={generateNotifications}>
            Bildirimler Oluştur
          </Button>
          {unreadCount > 0 && (
            <Button size="sm" variant="outline" onClick={markAllAsRead}>
              Tümünü Okundu İşaretle
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam Bildirim</p>
                <p className="text-2xl font-bold">{notifications.length}</p>
              </div>
              <Bell className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Okunmamış</p>
                <p className="text-2xl font-bold text-blue-600">{unreadCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Eylem Gerekli</p>
                <p className="text-2xl font-bold text-orange-600">{actionRequiredCount}</p>
              </div>
              <Target className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Bu Hafta</p>
                <p className="text-2xl font-bold text-green-600">
                  {notifications.filter(n => {
                    const weekAgo = new Date()
                    weekAgo.setDate(weekAgo.getDate() - 7)
                    return new Date(n.createdAt) > weekAgo
                  }).length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtreler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2">
              <input 
                type="checkbox" 
                checked={onlyUnread} 
                onChange={e => setOnlyUnread(e.target.checked)} 
              />
              <span className="text-sm">Sadece okunmamış</span>
            </label>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">Tüm Türler</option>
              <option value="KPI_ALERT">KPI Uyarısı</option>
              <option value="DEADLINE">Son Tarih</option>
              <option value="PERFORMANCE">Performans</option>
              <option value="TRAINING">Eğitim</option>
              <option value="MENTORING">Mentörlük</option>
              <option value="KNOWLEDGE_SHARING">Bilgi Paylaşımı</option>
              <option value="INNOVATION">İnovasyon</option>
              <option value="SUSTAINABILITY">Sürdürülebilirlik</option>
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">Tüm Öncelikler</option>
              <option value="CRITICAL">Kritik</option>
              <option value="HIGH">Yüksek</option>
              <option value="MEDIUM">Orta</option>
              <option value="LOW">Düşük</option>
            </select>

            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value={10}>10 göster</option>
              <option value={20}>20 göster</option>
              <option value={50}>50 göster</option>
              <option value={100}>100 göster</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.map((notification) => (
          <Card key={notification.id} className={`${!notification.read ? 'border-l-4 border-l-blue-500 bg-blue-50' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className={`font-medium ${!notification.read ? 'text-blue-900' : 'text-gray-900'}`}>
                          {notification.title}
                        </h3>
                        <Badge className={`text-xs ${getPriorityColor(notification.priority)}`}>
                          {notification.priority === 'CRITICAL' ? 'Kritik' :
                           notification.priority === 'HIGH' ? 'Yüksek' :
                           notification.priority === 'MEDIUM' ? 'Orta' : 'Düşük'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {getNotificationTypeLabel(notification.type)}
                        </Badge>
                        {notification.actionRequired && (
                          <Badge className="text-xs bg-red-100 text-red-800">
                            Eylem Gerekli
                          </Badge>
                        )}
                      </div>
                      <p className={`text-sm ${!notification.read ? 'text-blue-700' : 'text-gray-600'}`}>
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>{notification.period}</span>
                        <span>{new Date(notification.createdAt).toLocaleString('tr-TR')}</span>
                        {notification.relatedKPI && (
                          <span>KPI: {notification.relatedKPI}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!notification.read && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => markAsRead(notification.id)}
                        >
                          Okundu
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {notifications.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz bildirim bulunmuyor</h3>
            <p className="text-gray-600 mb-4">
              Model fabrika performansınızla ilgili bildirimler burada görünecek
            </p>
            <Button onClick={generateNotifications} className="flex items-center gap-2 mx-auto">
              <Bell className="h-4 w-4" />
              Bildirimler Oluştur
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Bildirimler yükleniyor...</p>
        </div>
      )}
    </div>
  )
}
