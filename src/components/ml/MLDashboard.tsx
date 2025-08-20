'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, ScatterChart, Scatter, ReferenceLine
} from 'recharts'
import { 
  TrendingUp, Brain, Target, AlertTriangle, Play, Download,
  Activity, Zap, BarChart3, Calendar
} from 'lucide-react'

interface MLDashboardProps {
  kpiId: string
  factoryId?: string
}

interface ForecastData {
  predictions: Array<{
    period: string
    predicted: number
    confidence: { low: number; high: number }
    probability: number
  }>
  modelAccuracy: number
  modelType: string
  trainingData: {
    samples: number
    periods: number
    features: number
  }
}

interface SeasonalityData {
  hasSeasonality: boolean
  seasonalPeriod: number
  seasonalStrength: number
  seasonalPattern: Array<{
    period: string
    multiplier: number
  }>
  trendComponent: number[]
  seasonalComponent: number[]
  residualComponent: number[]
}

interface ModelInfo {
  id: string
  type: string
  performance: number
  trainedAt: string
}

export default function MLDashboard({ kpiId, factoryId }: MLDashboardProps) {
  const [forecast, setForecast] = useState<ForecastData | null>(null)
  const [seasonality, setSeasonality] = useState<SeasonalityData | null>(null)
  const [models, setModels] = useState<ModelInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [forecastHorizon, setForecastHorizon] = useState(4)

  useEffect(() => {
    loadModels()
  }, [])

  const loadModels = async () => {
    try {
      const response = await fetch('/api/ml?action=models')
      if (response.ok) {
        const data = await response.json()
        setModels(data.models || [])
      }
    } catch (error) {
      console.error('Failed to load models:', error)
    }
  }

  const generateForecast = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/ml?action=forecast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          kpiId,
          factoryId,
          periodsAhead: forecastHorizon,
          includeSeasonality: true
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Forecast generation failed')
      }

      const data = await response.json()
      setForecast(data.forecast)
      setSeasonality(data.seasonality)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const trainModel = async (modelType: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/ml?action=train', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          kpiId,
          factoryId,
          modelType,
          parameters: modelType === 'polynomial_regression' ? { order: 2 } : undefined
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Model training failed')
      }

      const data = await response.json()
      await loadModels() // Refresh models list
      setSelectedModel(data.modelId)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const exportForecast = () => {
    if (!forecast) return

    const data = forecast.predictions.map(p => ({
      Period: p.period,
      Predicted: p.predicted,
      'Lower Bound': p.confidence.low,
      'Upper Bound': p.confidence.high,
      'Confidence': `${Math.round(p.probability * 100)}%`
    }))

    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kpi-forecast-${kpiId}-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatChartData = () => {
    if (!forecast) return []
    
    return forecast.predictions.map(p => ({
      period: p.period,
      predicted: p.predicted,
      lower: p.confidence.low,
      upper: p.confidence.high,
      confidence: Math.round(p.probability * 100)
    }))
  }

  const formatSeasonalityData = () => {
    if (!seasonality) return []
    
    return seasonality.seasonalPattern.map(p => ({
      period: p.period,
      multiplier: p.multiplier,
      strength: seasonality.seasonalStrength * 100
    }))
  }

  const getModelTypeColor = (type: string) => {
    const colors = {
      'linear_regression': 'bg-blue-500',
      'polynomial_regression': 'bg-green-500',
      'exponential_smoothing': 'bg-purple-500',
      'ensemble': 'bg-orange-500'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-500'
  }

  const getPerformanceColor = (performance: number) => {
    if (performance >= 0.8) return 'text-green-600'
    if (performance >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">ML Analytics Dashboard</h2>
          <p className="text-gray-600">Predictive modeling and forecasting for KPI: {kpiId}</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={generateForecast} 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            {loading ? 'Generating...' : 'Generate Forecast'}
          </Button>
          {forecast && (
            <Button onClick={exportForecast} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-red-700">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="forecast" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="seasonality">Seasonality</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Forecast Tab */}
        <TabsContent value="forecast" className="space-y-4">
          {forecast ? (
            <>
              {/* Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Model Accuracy</p>
                        <p className="text-lg font-bold text-gray-900">{forecast.modelAccuracy}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center space-x-2">
                      <Brain className="w-4 h-4 text-purple-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Model Type</p>
                        <p className="text-lg font-bold text-gray-900 capitalize">
                          {forecast.modelType.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="w-4 h-4 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Training Samples</p>
                        <p className="text-lg font-bold text-gray-900">{forecast.trainingData.samples}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-orange-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Forecast Periods</p>
                        <p className="text-lg font-bold text-gray-900">{forecast.predictions.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Forecast Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>KPI Forecast with Confidence Intervals</CardTitle>
                  <CardDescription>
                    Predicted values with 95% confidence intervals
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={formatChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name) => [
                          typeof value === 'number' ? value.toFixed(2) : value,
                          name === 'predicted' ? 'Predicted' :
                          name === 'lower' ? 'Lower Bound' :
                          name === 'upper' ? 'Upper Bound' : name
                        ]}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="predicted" 
                        stroke="#2563eb" 
                        strokeWidth={3}
                        name="Predicted"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="lower" 
                        stroke="#94a3b8" 
                        strokeDasharray="5 5"
                        name="Lower Bound"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="upper" 
                        stroke="#94a3b8" 
                        strokeDasharray="5 5"
                        name="Upper Bound"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Predictions Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Predictions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Period</th>
                          <th className="text-right p-2">Predicted</th>
                          <th className="text-right p-2">Lower Bound</th>
                          <th className="text-right p-2">Upper Bound</th>
                          <th className="text-right p-2">Confidence</th>
                        </tr>
                      </thead>
                      <tbody>
                        {forecast.predictions.map((pred, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-2 font-medium">{pred.period}</td>
                            <td className="p-2 text-right font-bold">
                              {pred.predicted.toFixed(2)}
                            </td>
                            <td className="p-2 text-right text-gray-600">
                              {pred.confidence.low.toFixed(2)}
                            </td>
                            <td className="p-2 text-right text-gray-600">
                              {pred.confidence.high.toFixed(2)}
                            </td>
                            <td className="p-2 text-right">
                              <Badge variant="secondary">
                                {Math.round(pred.probability * 100)}%
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Click "Generate Forecast" to start predictive analysis</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Models Tab */}
        <TabsContent value="models" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Available Models</h3>
            <div className="flex space-x-2">
              <Button 
                onClick={() => trainModel('linear_regression')} 
                disabled={loading}
                variant="outline"
                size="sm"
              >
                <Play className="w-4 h-4 mr-1" />
                Linear
              </Button>
              <Button 
                onClick={() => trainModel('polynomial_regression')} 
                disabled={loading}
                variant="outline"
                size="sm"
              >
                <Play className="w-4 h-4 mr-1" />
                Polynomial
              </Button>
              <Button 
                onClick={() => trainModel('exponential_smoothing')} 
                disabled={loading}
                variant="outline"
                size="sm"
              >
                <Play className="w-4 h-4 mr-1" />
                Exponential
              </Button>
              <Button 
                onClick={() => trainModel('ensemble')} 
                disabled={loading}
                variant="outline"
                size="sm"
              >
                <Play className="w-4 h-4 mr-1" />
                Ensemble
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {models.map((model) => (
              <Card 
                key={model.id} 
                className={`cursor-pointer transition-all ${
                  selectedModel === model.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedModel(model.id)}
              >
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-3 h-3 rounded-full ${getModelTypeColor(model.type)}`}></div>
                    <Badge variant="secondary">
                      {model.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Performance (R²)</p>
                      <p className={`text-lg font-bold ${getPerformanceColor(model.performance)}`}>
                        {(model.performance * 100).toFixed(1)}%
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-600">Trained</p>
                      <p className="text-sm text-gray-900">
                        {new Date(model.trainedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {models.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No trained models available. Train a model to get started.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Seasonality Tab */}
        <TabsContent value="seasonality" className="space-y-4">
          {seasonality ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center space-x-2">
                      <Activity className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Has Seasonality</p>
                        <p className="text-lg font-bold text-gray-900">
                          {seasonality.hasSeasonality ? 'Yes' : 'No'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center space-x-2">
                      <Zap className="w-4 h-4 text-purple-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Seasonal Strength</p>
                        <p className="text-lg font-bold text-gray-900">
                          {(seasonality.seasonalStrength * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Period</p>
                        <p className="text-lg font-bold text-gray-900">
                          {seasonality.seasonalPeriod} quarters
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Seasonal Pattern</CardTitle>
                  <CardDescription>
                    Quarterly seasonal multipliers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={formatSeasonalityData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="multiplier" fill="#8884d8" />
                      <ReferenceLine y={0} stroke="red" strokeDasharray="2 2" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Generate a forecast to analyze seasonality patterns</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Forecast Settings</CardTitle>
              <CardDescription>
                Configure prediction parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Forecast Horizon (periods)
                </label>
                <select 
                  value={forecastHorizon}
                  onChange={(e) => setForecastHorizon(parseInt(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value={1}>1 period</option>
                  <option value={2}>2 periods</option>
                  <option value={4}>4 periods</option>
                  <option value={6}>6 periods</option>
                  <option value={8}>8 periods</option>
                  <option value={12}>12 periods</option>
                </select>
              </div>

              <div className="pt-4">
                <Button onClick={generateForecast} disabled={loading} className="w-full">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  {loading ? 'Generating...' : 'Apply Settings & Generate Forecast'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
