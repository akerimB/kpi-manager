'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, Filter, Search, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Clock, Target as TargetIcon } from "lucide-react"
import { useState, useEffect, useMemo, useCallback } from "react"
import Link from "next/link"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { getCurrentUser, getUserApiParams } from '@/lib/user-context'

interface Action {
  id: string
  code: string
  title: string
  description: string
  completionPercent: number
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  strategicTarget: {
    code: string
    title: string
    strategicGoal: {
      code: string
      title: string
    }
  }
  phase: {
    id: string
    name: string
  }
  themes: string[]
  stepCompletion: number
  totalSteps: number
  completedSteps: number
  isOverdue: boolean
}

interface PhaseStats {
  id: string
  name: string
  description: string
  totalActions: number
  completedActions: number
  inProgressActions: number
  notStartedActions: number
  avgCompletion: number
  completionRate: number
  highPriorityActions: number
  criticalActions: number
  status: 'completed' | 'on-track' | 'at-risk' | 'behind'
}

export default function ActionManagement() {
  const [actions, setActions] = useState<Action[]>([])
  const [phaseStats, setPhaseStats] = useState<PhaseStats[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    phase: '',
    priority: '',
    search: ''
  })

  // Kullanıcı bağlamını al
  const userContext = getCurrentUser()

  // Memoized values to prevent unnecessary re-renders
  const isAuthenticated = useMemo(() => !!userContext, [userContext])
  const apiParams = useMemo(() => 
    userContext ? getUserApiParams(userContext) : '', 
    [userContext]
  )

  // Authentication ve rol kontrolü
  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = '/login'
      return
    }
  }, [isAuthenticated])

  // Rol kontrolü - sadece üst yönetim ve admin erişebilir
  if (userContext && userContext.userRole === 'MODEL_FACTORY') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erişim Reddedildi</h2>
          <p className="text-gray-600 mb-4">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            Dashboard'a Dön
          </Link>
        </div>
      </div>
    )
  }

  // Memoized fetch function
  const fetchData = useCallback(async () => {
    if (!userContext || !apiParams) return

    try {
      const [actionsRes, phasesRes] = await Promise.all([
        fetch(`/api/actions?${apiParams}`),
        fetch(`/api/actions/phases?${apiParams}`)
      ])

      const [actionsData, phasesData] = await Promise.all([
        actionsRes.json(),
        phasesRes.json()
      ])

      setActions(actionsData)
      setPhaseStats(phasesData)
    } catch (error) {
      console.error('Error fetching action data:', error)
    } finally {
      setLoading(false)
    }
  }, [userContext, apiParams])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const updateActionProgress = async (actionId: string, newProgress: number) => {
    try {
      const response = await fetch('/api/actions', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          actionId,
          completionPercent: newProgress
        })
      })

      if (response.ok) {
        setActions(prev => prev.map(action => 
          action.id === actionId 
            ? { ...action, completionPercent: newProgress }
            : action
        ))
      }
    } catch (error) {
      console.error('Error updating action:', error)
    }
  }

  const filteredActions = actions.filter(action => {
    const matchesPhase = !filters.phase || (action.phase && action.phase.id === filters.phase)
    const matchesPriority = !filters.priority || action.priority === filters.priority
    const matchesSearch = !filters.search || 
      action.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      action.code.toLowerCase().includes(filters.search.toLowerCase()) ||
      action.description.toLowerCase().includes(filters.search.toLowerCase())
    
    return matchesPhase && matchesPriority && matchesSearch
  })

  // Group actions by strategic target
  const groupedActions = filteredActions.reduce((acc, action) => {
    const key = action.strategicTarget.code
    if (!acc[key]) {
      acc[key] = {
        code: key,
        title: action.strategicTarget.title,
        actions: []
      }
    }
    acc[key].actions.push(action)
    return acc
  }, {} as Record<string, { code: string; title: string; actions: typeof filteredActions }>)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'text-red-600 bg-red-100'
      case 'HIGH': return 'text-orange-600 bg-orange-100'
      case 'MEDIUM': return 'text-blue-600 bg-blue-100'
      case 'LOW': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100'
      case 'on-track': return 'text-blue-600 bg-blue-100'
      case 'at-risk': return 'text-yellow-600 bg-yellow-100'
      case 'behind': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4" />
      case 'on-track': return <TrendingUp className="h-4 w-4" />
      case 'at-risk': return <AlertTriangle className="h-4 w-4" />
      case 'behind': return <TrendingDown className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Eylem verileri yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Faz İstatistikleri */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Faz Bazlı İlerleme</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {phaseStats.map((phase) => (
              <Card key={phase.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{phase.name}</CardTitle>
                    <div className={`p-1 rounded-full ${getStatusColor(phase.status)}`}>
                      {getStatusIcon(phase.status)}
                    </div>
                  </div>
                  <CardDescription className="text-xs">{phase.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Ortalama İlerleme</span>
                      <span className="font-medium">{phase.avgCompletion}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          phase.avgCompletion >= 90 ? 'bg-green-500' :
                          phase.avgCompletion >= 70 ? 'bg-blue-500' :
                          phase.avgCompletion >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${phase.avgCompletion}%` }}
                      ></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="block text-green-600">✓ {phase.completedActions} Tamamlandı</span>
                        <span className="block text-blue-600">→ {phase.inProgressActions} Devam Eden</span>
                      </div>
                      <div>
                        <span className="block text-gray-600">○ {phase.notStartedActions} Başlamadı</span>
                        <span className="block text-red-600">! {phase.criticalActions} Kritik</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Filtreler */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filtreler</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Faz</label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={filters.phase}
                  onChange={(e) => setFilters(prev => ({ ...prev, phase: e.target.value }))}
                >
                  <option value="">Tüm Fazlar</option>
                  {phaseStats.map(phase => (
                    <option key={phase.id} value={phase.id}>{phase.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Öncelik</label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={filters.priority}
                  onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                >
                  <option value="">Tüm Öncelikler</option>
                  <option value="CRITICAL">Kritik</option>
                  <option value="HIGH">Yüksek</option>
                  <option value="MEDIUM">Orta</option>
                  <option value="LOW">Düşük</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Arama</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Eylem kodu, başlık veya açıklama ara..."
                    className="w-full pl-10 p-2 border border-gray-300 rounded-md"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grouped Actions List */}
        <Card>
          <CardHeader>
            <CardTitle>
              Eylemler ({filteredActions.length} / {actions.length})
            </CardTitle>
            <CardDescription>
              Stratejik hedeflere göre gruplandırılmış eylemler ve ilerleme durumları
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="space-y-4">
              {Object.values(groupedActions).map((group) => (
                <AccordionItem key={group.code} value={group.code} className="border rounded-lg">
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-4">
                        <span className="font-medium">{group.code}</span>
                        <span className="text-gray-600">{group.title}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500">
                          {group.actions.length} Eylem
                        </span>
                        <span className="text-sm text-gray-500">
                          {Math.round(
                            group.actions.reduce((sum, action) => sum + action.completionPercent, 0) /
                              group.actions.length
                          )}% Tamamlanma
                        </span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4">
                    <div className="space-y-4">
                      {group.actions.map((action) => (
                        <div key={action.id} className="border rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <span className="font-medium text-sm">{action.code}</span>
                                <div className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(action.priority)}`}>
                                  {action.priority === 'CRITICAL' ? 'Kritik' :
                                   action.priority === 'HIGH' ? 'Yüksek' :
                                   action.priority === 'MEDIUM' ? 'Orta' : 'Düşük'}
                                </div>
                                {action.isOverdue && (
                                  <div className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-600">
                                    <AlertTriangle className="h-3 w-3 inline mr-1" />
                                    Gecikmiş
                                  </div>
                                )}
                              </div>
                              <h3 className="font-medium text-gray-900 mb-1">{action.title}</h3>
                              <p className="text-sm text-gray-600 mb-2">{action.description}</p>
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <span>Faz: {action.phase?.name || 'Atanmamış'}</span>
                                <span>Adım: {action.completedSteps}/{action.totalSteps}</span>
                              </div>
                            </div>
                            <div className="ml-6 min-w-[200px]">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">İlerleme</span>
                                <span className="text-sm">{action.completionPercent}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                                <div 
                                  className={`h-2 rounded-full ${
                                    action.completionPercent >= 100 ? 'bg-green-500' :
                                    action.completionPercent >= 75 ? 'bg-blue-500' :
                                    action.completionPercent >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${action.completionPercent}%` }}
                                ></div>
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateActionProgress(action.id, Math.max(0, action.completionPercent - 10))}
                                  disabled={action.completionPercent <= 0}
                                >
                                  -10%
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateActionProgress(action.id, Math.min(100, action.completionPercent + 10))}
                                  disabled={action.completionPercent >= 100}
                                >
                                  +10%
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {filteredActions.length === 0 && (
              <div className="text-center py-12">
                <TargetIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Eylem Bulunamadı</h3>
                <p className="text-gray-600">Seçilen filtrelere uygun eylem bulunmamaktadır.</p>
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  )
} 