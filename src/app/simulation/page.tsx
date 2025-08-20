'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BarChart3, Settings, Sparkles, Brain, Target } from "lucide-react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { getCurrentUser, getUserApiParams } from '@/lib/user-context'
import dynamic from 'next/dynamic'

const AdvancedSimulationDashboard = dynamic(
  () => import('@/components/simulation/AdvancedSimulationDashboard'),
  { ssr: false, loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded"></div> }
)

const SimulationCharts = dynamic(
  () => import('@/components/simulation/SimulationCharts'), 
  { ssr: false, loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded"></div> }
)

const ScenarioBuilder = dynamic(
  () => import('@/components/simulation/ScenarioBuilder'),
  { ssr: false, loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded"></div> }
)

const KPIFocusedDashboard = dynamic(
  () => import('@/components/simulation/KPIFocusedDashboard'),
  { ssr: false, loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded"></div> }
)

interface Action {
  id: string
  code: string
  description: string
  strategicTarget: {
    id: string
    code: string
    description: string
    strategicGoal: {
      id: string
      code: string
      description: string
    }
  }
}



export default function SimulationPage() {
  const [actions, setActions] = useState<Action[]>([])
  const [advancedResults, setAdvancedResults] = useState<any>(null)
  const [kpiResults, setKpiResults] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [activeTab, setActiveTab] = useState<'kpi' | 'advanced' | 'scenarios' | 'charts' | 'ai'>('kpi')
  const [useSimpleTest, setUseSimpleTest] = useState(false)
  const [useMockKPI, setUseMockKPI] = useState(true) // Default olarak mock kullan
  const [scenarios, setScenarios] = useState<any[]>([
    {
      id: 'scenario_1',
      name: 'Temel Senaryo',
      description: 'Standart uygulama yaklaşımı',
      probability: 60,
      actions: [],
      assumptions: []
    },
    {
      id: 'scenario_2', 
      name: 'Optimistik Senaryo',
      description: 'En iyi durum senaryosu',
      probability: 40,
      actions: [],
      assumptions: []
    }
  ])
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([])

  // Kullanıcı bağlamını al
  const [userContext, setUserContext] = useState<any>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    setUserContext(getCurrentUser())
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userParams = getUserApiParams(userContext)
        
        // Tüm eylemleri fetch et
        const actionsRes = await fetch(`/api/actions?${userParams}&limit=1000`)
        const actionsData = await actionsRes.json()
        setActions(actionsData) // Tüm eylemler

      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (isClient && userContext) {
      fetchData()
    }
  }, [isClient, userContext])

  const runAdvancedSimulation = async (config: any) => {
    setRunning(true)
    try {
      const response = await fetch('/api/simulation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
      })

      if (response.ok) {
        const data = await response.json()
        if (data.type === 'advanced') {
          setAdvancedResults(data.results)
          // Generate AI recommendations
          await generateAIRecommendations(data.results)
        }
      }
    } catch (error) {
      console.error('Error running advanced simulation:', error)
    } finally {
      setRunning(false)
    }
  }

  const generateAIRecommendations = async (simulationResults: any) => {
    try {
      const response = await fetch('/api/simulation/ai-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scenarios,
          simulationResults,
          actions
        })
      })

      if (response.ok) {
        const data = await response.json()
        setAiRecommendations(data.recommendations || [])
      }
    } catch (error) {
      console.error('Error generating AI recommendations:', error)
    }
  }



  const runKPISimulation = async (scenarios: any[]) => {
    setRunning(true)
    
    try {
      console.log('🚀 Starting KPI simulation with scenarios:', scenarios)
      
      // Request body'yi güvenli şekilde hazırla
      const requestBody = { scenarios: scenarios || [] }
      
      console.log('📤 Sending request body:', requestBody)
      
      // Endpoint seçimi
      const endpoint = useSimpleTest ? '/api/simulation/simple-test' : 
                      useMockKPI ? '/api/simulation/mock-kpi' : 
                      '/api/simulation/kpi-test'
      console.log('🎯 Using endpoint:', endpoint)
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      console.log('📥 Response status:', response.status, response.statusText)

      if (response.ok) {
        try {
          const data = await response.json()
          console.log('✅ KPI Simulation Response:', data)
          
          if (data.success && data.type === 'kpi-focused') {
            setKpiResults(data.results)
            console.log('✅ KPI Results set successfully')
          } else {
            console.warn('⚠️ Unexpected response format:', data)
          }
        } catch (jsonError) {
          console.error('❌ JSON parse error in response:', jsonError)
          // Try to get response as text for debugging
          const responseText = await response.text()
          console.log('Raw response text:', responseText)
        }
      } else {
        const responseText = await response.text()
        console.error('❌ API Error Response:', response.status, responseText)
      }
    } catch (networkError) {
      console.error('❌ Network/Request Error:', networkError)
    } finally {
      setRunning(false)
    }
  }

  const tabs = [
    { id: 'kpi', name: 'KPI Odaklı Analiz', icon: Target },
    { id: 'advanced', name: 'Monte Carlo Analizi', icon: Sparkles },
    { id: 'scenarios', name: 'Senaryo Yönetimi', icon: Settings },
    { id: 'charts', name: 'Görselleştirme', icon: BarChart3 },
    { id: 'ai', name: 'AI Önerileri', icon: Brain }
  ]

  if (!isClient || loading) {
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
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">KPI Odaklı Etki Simülasyonu</h1>
            <p className="text-gray-600 mt-1">
              Eylemlerinizin KPI'lara etkisini analiz edin, fabrika performanslarını karşılaştırın ve olasılıksal sonuçları görün
            </p>
          </div>
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" />
            Ana Sayfa
          </Link>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.name}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'kpi' && (
        <KPIFocusedDashboard 
          scenarios={scenarios}
          onRunKPISimulation={runKPISimulation}
          results={kpiResults}
          loading={running}
          useSimpleTest={useSimpleTest}
          onToggleSimpleTest={setUseSimpleTest}
          useMockKPI={useMockKPI}
          onToggleMockKPI={setUseMockKPI}
        />
      )}

      {activeTab === 'advanced' && (
        <AdvancedSimulationDashboard 
          scenarios={scenarios}
          onRunAdvancedSimulation={runAdvancedSimulation}
          results={advancedResults}
          loading={running}
        />
      )}

      {activeTab === 'scenarios' && (
        <ScenarioBuilder 
          actions={actions}
          scenarios={scenarios}
          onScenariosChange={setScenarios}
        />
      )}

      {activeTab === 'charts' && (
        <SimulationCharts results={advancedResults} />
      )}

      {activeTab === 'ai' && (
        <div className="space-y-6">
          {/* AI Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Destekli Öneriler
              </CardTitle>
              <CardDescription>
                Simülasyon sonuçlarına dayalı yapay zeka önerileri
              </CardDescription>
            </CardHeader>
            <CardContent>
              {aiRecommendations.length > 0 ? (
                <div className="space-y-4">
                  {aiRecommendations.map((rec: any) => (
                    <div key={rec.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{rec.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                          rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {rec.priority === 'high' ? 'Yüksek' : 
                           rec.priority === 'medium' ? 'Orta' : 'Düşük'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-600">Beklenen Etki:</span>
                          <span className="ml-2 font-medium">{rec.expectedImpact}%</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Uygulama Efortu:</span>
                          <span className="ml-2 font-medium">{rec.implementationEffort}%</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Güven:</span>
                          <span className="ml-2 font-medium">{rec.confidence}%</span>
                        </div>
                      </div>

                      <div className="text-sm">
                        <p className="font-medium">Gerekçe:</p>
                        <p className="text-gray-600">{rec.rationale}</p>
                      </div>

                      {rec.benefits && rec.benefits.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-green-700">Faydalar:</p>
                          <ul className="text-sm text-green-600 list-disc list-inside">
                            {rec.benefits.map((benefit: string, index: number) => (
                              <li key={index}>{benefit}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {rec.risks && rec.risks.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-red-700">Riskler:</p>
                          <ul className="text-sm text-red-600 list-disc list-inside">
                            {rec.risks.map((risk: string, index: number) => (
                              <li key={index}>{risk}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>AI önerileri için gelişmiş simülasyon çalıştırın</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}