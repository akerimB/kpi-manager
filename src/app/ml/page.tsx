'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import MLDashboard from '@/components/ml/MLDashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, TrendingUp, Target, Zap } from 'lucide-react'

interface KPI {
  id: string
  name: string
  description: string
  unit: string
}

interface Factory {
  id: string
  name: string
}

export default function MLPage() {
  const { data: session, status } = useSession()
  const [kpis, setKPIs] = useState<KPI[]>([])
  const [factories, setFactories] = useState<Factory[]>([])
  const [selectedKPI, setSelectedKPI] = useState<string>('')
  const [selectedFactory, setSelectedFactory] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      redirect('/auth/signin')
    }
    
    loadData()
  }, [session, status])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load KPIs
      const kpiResponse = await fetch('/api/kpis')
      if (kpiResponse.ok) {
        const kpiData = await kpiResponse.json()
        setKPIs(kpiData.kpis || [])
        if (kpiData.kpis && kpiData.kpis.length > 0) {
          setSelectedKPI(kpiData.kpis[0].id)
        }
      }

      // Load factories (if user is admin)
      if (session?.user?.role === 'ADMIN') {
        const factoryResponse = await fetch('/api/factories')
        if (factoryResponse.ok) {
          const factoryData = await factoryResponse.json()
          setFactories(factoryData.factories || [])
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Brain className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Machine Learning Analytics</h1>
              <p className="text-gray-600">
                Predictive modeling and forecasting for KPI performance
              </p>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Forecasting</p>
                    <p className="text-xs text-gray-500">Predict future values</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Trend Analysis</p>
                    <p className="text-xs text-gray-500">Identify patterns</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Seasonality</p>
                    <p className="text-xs text-gray-500">Detect seasonal patterns</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center space-x-2">
                  <Brain className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ensemble Models</p>
                    <p className="text-xs text-gray-500">Multiple algorithms</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select KPI
              </label>
              <select
                value={selectedKPI}
                onChange={(e) => setSelectedKPI(e.target.value)}
                className="min-w-[200px] p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Choose a KPI...</option>
                {kpis.map((kpi) => (
                  <option key={kpi.id} value={kpi.id}>
                    {kpi.name}
                  </option>
                ))}
              </select>
            </div>

            {session.user.role === 'ADMIN' && factories.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Factory (Optional)
                </label>
                <select
                  value={selectedFactory}
                  onChange={(e) => setSelectedFactory(e.target.value)}
                  className="min-w-[200px] p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Factories</option>
                  {factories.map((factory) => (
                    <option key={factory.id} value={factory.id}>
                      {factory.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        {selectedKPI ? (
          <MLDashboard 
            kpiId={selectedKPI} 
            factoryId={selectedFactory || undefined}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="w-5 h-5" />
                <span>Get Started with ML Analytics</span>
              </CardTitle>
              <CardDescription>
                Select a KPI to begin predictive analysis and forecasting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold">Forecasting</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Generate accurate predictions for future KPI values using machine learning algorithms.
                  </p>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li>• Linear & Polynomial Regression</li>
                    <li>• Exponential Smoothing</li>
                    <li>• Ensemble Methods</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold">Pattern Recognition</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Identify trends, cycles, and anomalies in your KPI data automatically.
                  </p>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li>• Trend Analysis</li>
                    <li>• Anomaly Detection</li>
                    <li>• Correlation Analysis</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold">Seasonality Analysis</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Decompose time series data to understand seasonal patterns and their impact.
                  </p>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li>• Seasonal Decomposition</li>
                    <li>• Periodic Pattern Detection</li>
                    <li>• Seasonal Strength Measurement</li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">
                  How Machine Learning Analytics Works
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-blue-600 font-bold">1</span>
                    </div>
                    <p className="font-medium">Data Collection</p>
                    <p className="text-xs text-gray-600">Historical KPI values</p>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-blue-600 font-bold">2</span>
                    </div>
                    <p className="font-medium">Model Training</p>
                    <p className="text-xs text-gray-600">Algorithm learning</p>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-blue-600 font-bold">3</span>
                    </div>
                    <p className="font-medium">Prediction</p>
                    <p className="text-xs text-gray-600">Future value forecasts</p>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-blue-600 font-bold">4</span>
                    </div>
                    <p className="font-medium">Analysis</p>
                    <p className="text-xs text-gray-600">Insights & patterns</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
