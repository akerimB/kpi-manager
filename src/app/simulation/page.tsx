'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Zap, Play, Save, AlertTriangle, TrendingUp, BarChart3, Target } from "lucide-react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { getCurrentUser, getUserApiParams } from '@/lib/user-context'

interface Action {
  id: string
  code: string
  description: string
  strategicTarget: {
    code: string
    strategicGoal: {
      code: string
    }
  }
}

interface SimulationItem {
  actionId: string
  assumedCompletion: number
  estimatedImpact: number
  estimatedImpactCategory: 'LOW' | 'MEDIUM' | 'HIGH'
}

interface SimulationResults {
  totalItems: number
  avgCompletion: number
  avgImpact: number
  overallScore: number
  riskScore: number
  items: any[]
}

interface Simulation {
  id: string
  name: string
  description: string
  createdAt: string
  simulationItems: any[]
}

export default function SimulationPage() {
  const [actions, setActions] = useState<Action[]>([])
  const [simulations, setSimulations] = useState<Simulation[]>([])
  const [selectedActions, setSelectedActions] = useState<SimulationItem[]>([])
  const [simulationName, setSimulationName] = useState('')
  const [simulationDescription, setSimulationDescription] = useState('')
  const [results, setResults] = useState<SimulationResults | null>(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)

  // Kullanıcı bağlamını al
  const [userContext, setUserContext] = useState<any>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    setUserContext(getCurrentUser())
  }, [])

  // Authentication ve rol kontrolü
  useEffect(() => {
    if (isClient && !userContext) {
      window.location.href = '/login'
      return
    }
  }, [isClient, userContext])

  useEffect(() => {
    if (!userContext) return

    const fetchData = async () => {
      try {
        const apiParams = getUserApiParams(userContext)
        
        const [actionsRes, simulationsRes] = await Promise.all([
          fetch(`/api/actions?${apiParams}`),
          fetch(`/api/simulation?${apiParams}`)
        ])

        const [actionsData, simulationsData] = await Promise.all([
          actionsRes.json(),
          simulationsRes.json()
        ])

        setActions(actionsData.slice(0, 20)) // İlk 20 eylem
        setSimulations(simulationsData)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [userContext])

  // Loading durumları
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!userContext) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-blue-600 text-6xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Giriş Gerekli</h2>
          <p className="text-gray-600 mb-4">Bu sayfayı görüntülemek için giriş yapmanız gerekiyor.</p>
          <a href="/login" className="text-blue-600 hover:text-blue-800">Giriş Yap</a>
        </div>
      </div>
    )
  }

  // Rol kontrolü - sadece simülasyon yetkisi olanlar erişebilir
  if (!userContext.permissions?.canCreateSimulations) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erişim Reddedildi</h2>
          <p className="text-gray-600 mb-4">Etki simülasyonu oluşturma yetkiniz bulunmamaktadır.</p>
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            Dashboard'a Dön
          </Link>
        </div>
      </div>
    )
  }

  const addActionToSimulation = (action: Action) => {
    if (selectedActions.find(item => item.actionId === action.id)) return

    const newItem: SimulationItem = {
      actionId: action.id,
      assumedCompletion: 50,
      estimatedImpact: 0,
      estimatedImpactCategory: 'MEDIUM'
    }

    setSelectedActions([...selectedActions, newItem])
  }

  const updateSimulationItem = (actionId: string, field: keyof SimulationItem, value: any) => {
    setSelectedActions(prev => 
      prev.map(item => 
        item.actionId === actionId 
          ? { ...item, [field]: value }
          : item
      )
    )
  }

  const removeFromSimulation = (actionId: string) => {
    setSelectedActions(prev => prev.filter(item => item.actionId !== actionId))
  }

  const runSimulation = async () => {
    if (!simulationName || selectedActions.length === 0) return

    setRunning(true)
    try {
      const response = await fetch('/api/simulation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: simulationName,
          description: simulationDescription,
          scenarioItems: selectedActions
        })
      })

      if (response.ok) {
        const data = await response.json()
        setResults(data.results)
        
        // Simülasyon listesini güncelle
        const simulationsRes = await fetch('/api/simulation')
        const simulationsData = await simulationsRes.json()
        setSimulations(simulationsData)
      }
    } catch (error) {
      console.error('Error running simulation:', error)
    } finally {
      setRunning(false)
    }
  }

  const getImpactColor = (category: string) => {
    switch (category) {
      case 'HIGH': return 'text-red-600 bg-red-100'
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100'
      case 'LOW': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getImpactLabel = (category: string) => {
    switch (category) {
      case 'HIGH': return 'Yüksek'
      case 'MEDIUM': return 'Orta'
      case 'LOW': return 'Düşük'
      default: return 'Bilinmiyor'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Simülasyon verileri yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sol Panel - Eylem Seçimi */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Mevcut Eylemler</span>
                </CardTitle>
                <CardDescription>
                  Simülasyona eklemek için eylem seçin (İlk 20 eylem)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {actions.map((action) => (
                    <div 
                      key={action.id} 
                      className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => addActionToSimulation(action)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{action.code}</p>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {action.description}
                          </p>
                          <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
                            <span>SH: {action.strategicTarget.code}</span>
                            <span>SA: {action.strategicTarget.strategicGoal.code}</span>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          disabled={selectedActions.some(item => item.actionId === action.id)}
                        >
                          {selectedActions.some(item => item.actionId === action.id) ? 'Eklendi' : 'Ekle'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Orta Panel - Simülasyon Kurulumu */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Play className="h-5 w-5" />
                  <span>Simülasyon Kurulumu</span>
                </CardTitle>
                <CardDescription>
                  Senaryo parametrelerini ayarlayın
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Simülasyon Adı
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="Örn: Q1 2024 İyileştirme Senaryosu"
                      value={simulationName}
                      onChange={(e) => setSimulationName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Açıklama
                    </label>
                    <textarea
                      className="w-full p-2 border border-gray-300 rounded-md"
                      rows={3}
                      placeholder="Simülasyon hakkında açıklama..."
                      value={simulationDescription}
                      onChange={(e) => setSimulationDescription(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Seçili Eylemler ({selectedActions.length})
                    </label>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {selectedActions.map((item) => {
                        const action = actions.find(a => a.id === item.actionId)
                        if (!action) return null

                        return (
                          <div key={item.actionId} className="p-3 border rounded-lg bg-blue-50">
                            <div className="flex justify-between items-start mb-2">
                              <p className="font-medium text-sm">{action.code}</p>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => removeFromSimulation(item.actionId)}
                              >
                                Çıkar
                              </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs text-gray-600">Tamamlanma %</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  className="w-full p-1 text-sm border border-gray-300 rounded"
                                  value={item.assumedCompletion}
                                  onChange={(e) => updateSimulationItem(
                                    item.actionId, 
                                    'assumedCompletion', 
                                    parseInt(e.target.value) || 0
                                  )}
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600">Etki Skoru</label>
                                <input
                                  type="number"
                                  step="0.1"
                                  className="w-full p-1 text-sm border border-gray-300 rounded"
                                  value={item.estimatedImpact}
                                  onChange={(e) => updateSimulationItem(
                                    item.actionId, 
                                    'estimatedImpact', 
                                    parseFloat(e.target.value) || 0
                                  )}
                                />
                              </div>
                            </div>

                            <div className="mt-2">
                              <label className="block text-xs text-gray-600">Etki Kategorisi</label>
                              <select
                                className="w-full p-1 text-sm border border-gray-300 rounded"
                                value={item.estimatedImpactCategory}
                                onChange={(e) => updateSimulationItem(
                                  item.actionId, 
                                  'estimatedImpactCategory', 
                                  e.target.value as 'LOW' | 'MEDIUM' | 'HIGH'
                                )}
                              >
                                <option value="LOW">Düşük</option>
                                <option value="MEDIUM">Orta</option>
                                <option value="HIGH">Yüksek</option>
                              </select>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <Button 
                    onClick={runSimulation}
                    disabled={!simulationName || selectedActions.length === 0 || running}
                    className="w-full"
                  >
                    {running ? 'Simülasyon Çalıştırılıyor...' : 'Simülasyonu Çalıştır'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sağ Panel - Sonuçlar */}
          <div className="lg:col-span-1">
            {results && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Simülasyon Sonuçları</span>
                  </CardTitle>
                  <CardDescription>
                    Senaryo analizi çıktıları
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{results.totalItems}</div>
                        <div className="text-xs text-gray-600">Toplam Eylem</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{results.avgCompletion}%</div>
                        <div className="text-xs text-gray-600">Ort. Tamamlanma</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">{results.overallScore}</div>
                        <div className="text-xs text-gray-600">Genel Skor</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{results.riskScore}</div>
                        <div className="text-xs text-gray-600">Risk Skoru</div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Ortalama Etki</h4>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full ${
                              Math.abs(results.avgImpact) > 5 ? 'bg-red-500' :
                              Math.abs(results.avgImpact) > 2 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.abs(results.avgImpact) * 10)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{results.avgImpact}</span>
                      </div>
                    </div>

                    {results.riskScore > 70 && (
                      <div className="flex items-start space-x-2 p-3 bg-red-50 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-red-700">
                          <p className="font-medium">Yüksek Risk Uyarısı</p>
                          <p>Bu senaryo yüksek risk taşıyor. Dikkatli değerlendirme önerilir.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Geçmiş Simülasyonlar */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Save className="h-5 w-5" />
                  <span>Geçmiş Simülasyonlar</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {simulations.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Henüz simülasyon yok
                    </p>
                  ) : (
                    simulations.map((sim) => (
                      <div key={sim.id} className="p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">{sim.name}</p>
                            <p className="text-xs text-gray-600">{sim.description}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(sim.createdAt).toLocaleDateString('tr-TR')} - 
                              {sim.simulationItems.length} eylem
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
    </div>
  )
} 