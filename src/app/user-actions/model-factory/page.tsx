'use client'

import { useEffect, useMemo, useState } from 'react'
import { getCurrentUser } from '@/lib/user-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Calendar, Target, CheckCircle, Clock, AlertTriangle, Edit, Trash2, FileText, Users, Award } from 'lucide-react'
import Link from 'next/link'

interface UserAction {
  id: string
  title: string
  description?: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD'
  saCode?: string
  shCode?: string
  startDate?: string
  endDate?: string
  createdAt: string
  category?: 'TRAINING' | 'MENTORING' | 'KNOWLEDGE_SHARING' | 'INNOVATION' | 'SUSTAINABILITY' | 'DIGITALIZATION'
}

interface UserActionEvent {
  id: string
  userActionId: string
  title: string
  description?: string
  start: string
  end?: string
  location?: string
  participants?: number
}

interface UserActionNote {
  id: string
  userActionId: string
  content: string
  createdAt: string
}

export default function ModelFactoryUserActions() {
  const [user, setUser] = useState<any>(null)
  const [isClient, setIsClient] = useState(false)
  const [actions, setActions] = useState<UserAction[]>([])
  const [eventsByAction, setEventsByAction] = useState<Record<string, UserActionEvent[]>>({})
  const [notesByAction, setNotesByAction] = useState<Record<string, UserActionNote[]>>({})
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  useEffect(() => {
    setIsClient(true)
    setUser(getCurrentUser())
  }, [])

  const userId = useMemo(() => (user?.user?.id as string | undefined), [user])

  useEffect(() => {
    const run = async () => {
      if (!userId) return
      setLoading(true)
      const res = await fetch(`/api/user-actions?userId=${userId}`)
      const json = await res.json()
      if (Array.isArray(json)) setActions(json)
      setLoading(false)
    }
    run()
  }, [userId])

  // Fetch events and notes for each action
  useEffect(() => {
    const fetchForAction = async (actionId: string) => {
      try {
        const [evRes, noteRes] = await Promise.all([
          fetch(`/api/user-actions/events?userActionId=${actionId}`),
          fetch(`/api/user-actions/notes?userActionId=${actionId}`)
        ])
        if (evRes.ok) {
          const evJson = await evRes.json()
          setEventsByAction(prev => ({ ...prev, [actionId]: evJson || [] }))
        }
        if (noteRes.ok) {
          const noteJson = await noteRes.json()
          setNotesByAction(prev => ({ ...prev, [actionId]: noteJson || [] }))
        }
      } catch (e) {
        // ignore
      }
    }
    actions.forEach(a => {
      if (!eventsByAction[a.id]) fetchForAction(a.id)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions])

  const createQuickAction = async () => {
    if (!userId) return
    const title = prompt('Eylem başlığı')
    if (!title) return
    const res = await fetch('/api/user-actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        userId, 
        title, 
        description: '', 
        priority: 'MEDIUM',
        category: 'KNOWLEDGE_SHARING'
      })
    })
    if (res.ok) {
      window.location.reload()
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'IN_PROGRESS':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'ON_HOLD':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <Target className="h-4 w-4 text-gray-500" />
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

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'TRAINING':
        return <Users className="h-4 w-4" />
      case 'MENTORING':
        return <Award className="h-4 w-4" />
      case 'KNOWLEDGE_SHARING':
        return <FileText className="h-4 w-4" />
      case 'INNOVATION':
        return <Target className="h-4 w-4" />
      case 'SUSTAINABILITY':
        return <CheckCircle className="h-4 w-4" />
      case 'DIGITALIZATION':
        return <Calendar className="h-4 w-4" />
      default:
        return <Target className="h-4 w-4" />
    }
  }

  const getCategoryLabel = (category?: string) => {
    switch (category) {
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
      case 'DIGITALIZATION':
        return 'Dijitalleşme'
      default:
        return 'Genel'
    }
  }

  const filteredActions = actions.filter(action => {
    if (filterStatus !== 'all' && action.status !== filterStatus) return false
    if (filterPriority !== 'all' && action.priority !== filterPriority) return false
    if (filterCategory !== 'all' && action.category !== filterCategory) return false
    return true
  })

  if (!isClient) return null
  if (!user) return <div className="p-6">Giriş gerekli</div>

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Model Fabrika Kişisel Eylemler</h1>
          <p className="text-gray-600 mt-1">
            Model fabrika misyonunuza uygun kişisel eylemlerinizi yönetin
          </p>
        </div>
        <Button onClick={createQuickAction} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Hızlı Eylem Ekle
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtreler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="NOT_STARTED">Başlanmadı</option>
              <option value="IN_PROGRESS">Devam Ediyor</option>
              <option value="COMPLETED">Tamamlandı</option>
              <option value="ON_HOLD">Beklemede</option>
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
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">Tüm Kategoriler</option>
              <option value="TRAINING">Eğitim</option>
              <option value="MENTORING">Mentörlük</option>
              <option value="KNOWLEDGE_SHARING">Bilgi Paylaşımı</option>
              <option value="INNOVATION">İnovasyon</option>
              <option value="SUSTAINABILITY">Sürdürülebilirlik</option>
              <option value="DIGITALIZATION">Dijitalleşme</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Actions List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredActions.map((action) => (
          <Card key={action.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(action.category)}
                  <Badge variant="outline" className="text-xs">
                    {getCategoryLabel(action.category)}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  {getStatusIcon(action.status)}
                  <Badge className={`text-xs ${getPriorityColor(action.priority)}`}>
                    {action.priority === 'CRITICAL' ? 'Kritik' :
                     action.priority === 'HIGH' ? 'Yüksek' :
                     action.priority === 'MEDIUM' ? 'Orta' : 'Düşük'}
                  </Badge>
                </div>
              </div>
              <CardTitle className="text-lg">{action.title}</CardTitle>
              {action.description && (
                <p className="text-sm text-gray-600">{action.description}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Dates */}
              {(action.startDate || action.endDate) && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {action.startDate && new Date(action.startDate).toLocaleDateString('tr-TR')}
                    {action.endDate && ` - ${new Date(action.endDate).toLocaleDateString('tr-TR')}`}
                  </span>
                </div>
              )}

              {/* Strategic Codes */}
              {(action.saCode || action.shCode) && (
                <div className="flex items-center gap-2 text-sm">
                  {action.saCode && (
                    <Badge variant="secondary" className="text-xs">
                      SA: {action.saCode}
                    </Badge>
                  )}
                  {action.shCode && (
                    <Badge variant="secondary" className="text-xs">
                      SH: {action.shCode}
                    </Badge>
                  )}
                </div>
              )}

              {/* Events Count */}
              {eventsByAction[action.id]?.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>{eventsByAction[action.id].length} etkinlik</span>
                </div>
              )}

              {/* Notes Count */}
              {notesByAction[action.id]?.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <FileText className="h-4 w-4" />
                  <span>{notesByAction[action.id].length} not</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <Button size="sm" variant="outline" className="flex-1">
                  <Edit className="h-3 w-3 mr-1" />
                  Düzenle
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  <Calendar className="h-3 w-3 mr-1" />
                  Etkinlik
                </Button>
                <Button size="sm" variant="outline">
                  <FileText className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredActions.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz eylem bulunmuyor</h3>
            <p className="text-gray-600 mb-4">
              Model fabrika misyonunuza uygun kişisel eylemler ekleyerek başlayın
            </p>
            <Button onClick={createQuickAction} className="flex items-center gap-2 mx-auto">
              <Plus className="h-4 w-4" />
              İlk Eylemi Ekle
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Eylemler yükleniyor...</p>
        </div>
      )}
    </div>
  )
}
