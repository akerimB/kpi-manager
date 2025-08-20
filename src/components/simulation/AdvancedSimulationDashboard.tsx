'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Target, 
  BarChart3,
  PieChart,
  Activity,
  Clock,
  DollarSign,
  Shield,
  Zap,
  Settings
} from "lucide-react"

interface AdvancedSimulationProps {
  scenarios: any[]
  onRunAdvancedSimulation: (config: any) => void
  results?: any
  loading?: boolean
}

export default function AdvancedSimulationDashboard({ 
  scenarios, 
  onRunAdvancedSimulation, 
  results, 
  loading = false 
}: AdvancedSimulationProps) {
  const [config, setConfig] = useState({
    analysisType: 'advanced',
    monteCarlo: {
      iterations: 1000,
      confidenceLevel: 0.95,
      variabilityFactor: 20
    },
    sensitivity: {
      parameters: [
        {
          name: 'completion_rate',
          baseline: 100,
          variations: [-20, -10, 10, 20],
          impact: 'linear'
        },
        {
          name: 'success_probability',
          baseline: 100,
          variations: [-15, -7.5, 7.5, 15],
          impact: 'exponential'
        }
      ]
    },
    timeHorizon: {
      start: new Date().toISOString(),
      end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      intervals: 'monthly'
    }
  })

  const runAdvancedAnalysis = () => {
    onRunAdvancedSimulation({
      name: `Gelişmiş Analiz ${new Date().toLocaleDateString('tr-TR')}`,
      description: 'Monte Carlo ve duyarlılık analizi ile kapsamlı simülasyon',
      scenarios,
      ...config
    })
  }

  return (
    <div className="space-y-6">
      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Gelişmiş Analiz Konfigürasyonu
          </CardTitle>
          <CardDescription>
            Monte Carlo simülasyonu ve duyarlılık analizi parametrelerini ayarlayın
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Monte Carlo Settings */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Monte Carlo Ayarları
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">İterasyon Sayısı</label>
                  <select 
                    value={config.monteCarlo.iterations}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      monteCarlo: { ...prev.monteCarlo, iterations: Number(e.target.value) }
                    }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value={100}>100 (Hızlı)</option>
                    <option value={500}>500 (Orta)</option>
                    <option value={1000}>1,000 (Detaylı)</option>
                    <option value={5000}>5,000 (Çok Detaylı)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Güven Seviyesi</label>
                  <select 
                    value={config.monteCarlo.confidenceLevel}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      monteCarlo: { ...prev.monteCarlo, confidenceLevel: Number(e.target.value) }
                    }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value={0.90}>%90</option>
                    <option value={0.95}>%95</option>
                    <option value={0.99}>%99</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Değişkenlik Faktörü (%)</label>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={config.monteCarlo.variabilityFactor}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      monteCarlo: { ...prev.monteCarlo, variabilityFactor: Number(e.target.value) }
                    }))}
                    className="w-full"
                  />
                  <div className="text-sm text-gray-600 text-center">
                    {config.monteCarlo.variabilityFactor}%
                  </div>
                </div>
              </div>
            </div>

            {/* Sensitivity Settings */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Duyarlılık Analizi
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2">Test Edilecek Parametreler</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={true} readOnly />
                      <span className="text-sm">Tamamlanma Oranı</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={true} readOnly />
                      <span className="text-sm">Başarı Olasılığı</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={false} readOnly />
                      <span className="text-sm">Kaynak Gereksinimi</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Varyasyon Aralığı</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="-20"
                      className="w-full p-2 border rounded-md text-sm"
                      defaultValue="-20"
                    />
                    <span className="flex items-center">ile</span>
                    <input
                      type="number"
                      placeholder="+20"
                      className="w-full p-2 border rounded-md text-sm"
                      defaultValue="+20"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Time Horizon */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Zaman Ufku
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Analiz Süresi</label>
                  <select 
                    value={new Date(config.timeHorizon.end).getTime() - new Date(config.timeHorizon.start).getTime() > 180 * 24 * 60 * 60 * 1000 ? '12' : '6'}
                    onChange={(e) => {
                      const months = Number(e.target.value)
                      setConfig(prev => ({
                        ...prev,
                        timeHorizon: {
                          ...prev.timeHorizon,
                          end: new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000).toISOString()
                        }
                      }))
                    }}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value={3}>3 Ay</option>
                    <option value={6}>6 Ay</option>
                    <option value={12}>12 Ay</option>
                    <option value={24}>24 Ay</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Raporlama Aralığı</label>
                  <select 
                    value={config.timeHorizon.intervals}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      timeHorizon: { ...prev.timeHorizon, intervals: e.target.value as any }
                    }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="weekly">Haftalık</option>
                    <option value="monthly">Aylık</option>
                    <option value="quarterly">Çeyreklik</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <Button 
              onClick={runAdvancedAnalysis}
              disabled={loading || scenarios.length === 0}
              size="lg"
              className="px-8"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Analiz Yapılıyor...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Gelişmiş Analizi Başlat
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Dashboard */}
      {results && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scenario Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Senaryo Analizi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.scenarioResults?.map((scenario: any, index: number) => (
                  <div key={scenario.scenarioId} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">Senaryo {index + 1}</h4>
                      <span className="text-sm text-gray-600">{scenario.probability}% olasılık</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">ROI:</span>
                        <span className={`ml-2 font-medium ${(scenario.roi || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {(scenario.roi || 0).toFixed(1)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Risk:</span>
                        <span className={`ml-2 font-medium ${
                          (scenario.riskScore || 0) < 30 ? 'text-green-600' : 
                          (scenario.riskScore || 0) < 70 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {(scenario.riskScore || 0).toFixed(0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Süre:</span>
                        <span className="ml-2 font-medium">{scenario.duration || 0} gün</span>
                      </div>
                      <div>
                        <span className="text-gray-600">KPI Etkisi:</span>
                        <span className="ml-2 font-medium">{scenario.kpiImpacts?.length || 0} KPI</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Monte Carlo Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Monte Carlo Analizi
              </CardTitle>
            </CardHeader>
            <CardContent>
              {results.monteCarlo && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {results.monteCarlo.meanROI?.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-600">Ortalama ROI</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {results.monteCarlo.medianROI?.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-600">Medyan ROI</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-medium">Güven Aralıkları</h5>
                    {results.monteCarlo.confidenceIntervals?.map((ci: any) => (
                      <div key={ci.level} className="flex justify-between text-sm">
                        <span>%{(ci.level * 100).toFixed(0)} Güven:</span>
                        <span>{ci.lower.toFixed(1)}% - {ci.upper.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span>Standart Sapma:</span>
                      <span className="font-medium">{results.monteCarlo.standardDeviation?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span>İterasyon Sayısı:</span>
                      <span className="font-medium">{results.monteCarlo.iterations?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sensitivity Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Duyarlılık Analizi
              </CardTitle>
            </CardHeader>
            <CardContent>
              {results.sensitivity && (
                <div className="space-y-4">
                  <div>
                    <h5 className="font-medium mb-2">En Duyarlı Parametreler</h5>
                    <div className="space-y-2">
                      {results.sensitivity.mostSensitive?.map((param: string, index: number) => (
                        <div key={param} className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            index === 0 ? 'bg-red-500' : index === 1 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}></div>
                          <span className="text-sm">{param.replace('_', ' ').toUpperCase()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium mb-2">Parametre Detayları</h5>
                    <div className="space-y-2">
                      {results.sensitivity.parameters?.map((param: any) => (
                        <div key={param.parameter} className="p-2 border rounded text-sm">
                          <div className="flex justify-between">
                            <span className="font-medium">{param.parameter}</span>
                            <span className="text-gray-600">Elastiklik: {param.elasticity?.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between mt-1">
                            <span>Korelasyon:</span>
                            <span className={param.correlation > 0 ? 'text-green-600' : 'text-red-600'}>
                              {param.correlation?.toFixed(3)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Risk Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Risk Analizi
              </CardTitle>
            </CardHeader>
            <CardContent>
              {results.risk && (
                <div className="space-y-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className={`text-3xl font-bold ${
                      results.risk.overallRiskScore < 30 ? 'text-green-600' :
                      results.risk.overallRiskScore < 70 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {results.risk.overallRiskScore?.toFixed(0)}
                    </div>
                    <div className="text-sm text-gray-600">Genel Risk Skoru</div>
                  </div>

                  <div>
                    <h5 className="font-medium mb-2">Risk Faktörleri</h5>
                    <div className="space-y-2">
                      {results.risk.riskFactors?.slice(0, 3).map((risk: any) => (
                        <div key={risk.id} className="p-2 border rounded">
                          <div className="flex justify-between items-start">
                            <span className="text-sm font-medium">{risk.name}</span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              risk.severity === 'critical' ? 'bg-red-100 text-red-800' :
                              risk.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                              risk.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {risk.severity}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs text-gray-600 mt-1">
                            <span>Olasılık: {risk.probability}%</span>
                            <span>Etki: {risk.impact}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {results.risk.overallRiskScore > 70 && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-red-700">
                        <p className="font-medium">Yüksek Risk Uyarısı</p>
                        <p>Bu analiz yüksek risk faktörleri içermektedir. Risk azaltma stratejileri uygulanması önerilir.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Optimization Results */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Optimizasyon Önerileri
              </CardTitle>
            </CardHeader>
            <CardContent>
              {results.optimization && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Optimal Sequence */}
                  <div>
                    <h5 className="font-medium mb-3">Optimal Eylem Sırası</h5>
                    <div className="space-y-2">
                      {results.optimization.optimalSequence?.actions?.slice(0, 5).map((action: any, index: number) => (
                        <div key={action.actionId} className="flex items-center gap-3 p-2 border rounded">
                          <div className="w-6 h-6 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium">Eylem {action.actionId.slice(-4)}</div>
                            <div className="text-xs text-gray-600">
                              Öncelik: {action.priority.toFixed(2)} | Etki: {action.expectedImpact.toFixed(1)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Resource Optimization */}
                  <div>
                    <h5 className="font-medium mb-3">Kaynak Optimizasyonu</h5>
                    <div className="space-y-3">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between text-sm">
                          <span>Toplam Kaynak İhtiyacı:</span>
                          <span className="font-medium">
                            {results.optimization.resourceOptimization?.totalResourcesNeeded?.toFixed(0)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span>Pik Kullanım:</span>
                          <span className="font-medium">
                            {results.optimization.resourceOptimization?.peakResourceUsage?.toFixed(0)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span>Verimlilik:</span>
                          <span className={`font-medium ${
                            (results.optimization.resourceOptimization?.resourceEfficiency || 0) > 0.8 ? 'text-green-600' : 'text-yellow-600'
                          }`}>
                            {((results.optimization.resourceOptimization?.resourceEfficiency || 0) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="flex justify-between text-sm">
                          <span>Toplam Süre:</span>
                          <span className="font-medium">
                            {results.optimization.timeOptimization?.totalDuration?.toFixed(0)} gün
                          </span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span>Hızlandırma Potansiyeli:</span>
                          <span className="font-medium text-green-600">
                            -{results.optimization.timeOptimization?.possibleAcceleration?.toFixed(0)} gün
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
