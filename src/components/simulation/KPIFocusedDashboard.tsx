'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Target, 
  BarChart3,
  Activity,
  Factory,
  Award,
  Zap,
  Eye,
  CheckCircle,
  XCircle
} from "lucide-react"

interface KPIFocusedDashboardProps {
  scenarios: any[]
  onRunKPISimulation: (scenarios: any[]) => void
  results?: any
  loading?: boolean
  useSimpleTest?: boolean
  onToggleSimpleTest?: (value: boolean) => void
  useMockKPI?: boolean
  onToggleMockKPI?: (value: boolean) => void
}

export default function KPIFocusedDashboard({ 
  scenarios, 
  onRunKPISimulation, 
  results, 
  loading = false,
  useSimpleTest = false,
  onToggleSimpleTest,
  useMockKPI = true, // Default olarak mock kullan
  onToggleMockKPI
}: KPIFocusedDashboardProps) {

  const [selectedScenario, setSelectedScenario] = useState<string>('')

  const runKPIAnalysis = () => {
    console.log('🎯 Starting KPI Analysis with scenarios:', scenarios)
    if (scenarios.length === 0) {
      console.warn('No scenarios available for KPI analysis')
      return
    }
    onRunKPISimulation(scenarios)
  }

  const getFactoryRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-500" />
      default: return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            KPI Odaklı Simülasyon Analizi
          </CardTitle>
          <CardDescription>
            Eylemlerinizin KPI'lara etkisini, fabrika performanslarını ve olasılıksal sonuçları analiz edin
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-2">
                  {scenarios.length} senaryo hazır • {scenarios.reduce((sum, s) => sum + s.actions.length, 0)} eylem
                  {useMockKPI && (
                    <span className="ml-2 text-blue-600 font-medium">
                      🏭 Mock Model Fabrikaları kullanılıyor
                    </span>
                  )}
                  {useSimpleTest && (
                    <span className="ml-2 text-gray-600 font-medium">
                      🔧 Basit test kullanılıyor
                    </span>
                  )}
                </p>
                <div className="flex gap-2">
                {scenarios.map((scenario) => (
                  <span key={scenario.id} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                    {scenario.name} ({scenario.probability}%)
                  </span>
                ))}
                </div>
              </div>
            <Button 
              onClick={runKPIAnalysis}
              disabled={loading || scenarios.length === 0}
              size="lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  KPI Analizi Yapılıyor...
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  KPI Etkilerini Analiz Et
                  {scenarios.length === 0 && " (Önce senaryo oluşturun)"}
                </>
              )}
            </Button>
            {scenarios.length === 0 && (
              <p className="text-sm text-yellow-600 mt-2">
                ⚠️ KPI analizi için önce "Senaryo Yönetimi" sekmesinden senaryo oluşturun
              </p>
            )}
            {results && (
              <p className="text-sm text-green-600 mt-2">
                📊 {results.summary?.factoriesAnalyzed || 0} gerçek model fabrikası ve {results.summary?.kpisAnalyzed || 0} KPI analiz edildi
                {results.dataSource && ` (${results.dataSource})`}
              </p>
            )}
            
            {/* Debug Toggles */}
            <div className="space-y-2 mt-2">
              {onToggleSimpleTest && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="simple-test"
                    checked={useSimpleTest}
                    onChange={(e) => onToggleSimpleTest(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="simple-test" className="text-sm text-gray-600">
                    🔧 Basit test endpoint'ini kullan
                  </label>
                </div>
              )}
              
              {onToggleMockKPI && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="mock-kpi"
                    checked={useMockKPI}
                    onChange={(e) => onToggleMockKPI(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="mock-kpi" className="text-sm text-blue-600">
                    🏭 Mock Model Fabrikaları kullan (veritabanı yok)
                  </label>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Dashboard */}
      {results && (
        <>
          {/* Overall Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Genel Sonuç Özeti
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">
                    {results.overallInsights?.totalKPIsAnalyzed || 0}
                  </div>
                  <div className="text-sm text-gray-600">Analiz Edilen KPI</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">
                    {results.overallInsights?.avgImprovementExpected?.toFixed(1) || '0.0'}%
                  </div>
                  <div className="text-sm text-gray-600">Beklenen İyileşme</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-3xl font-bold text-yellow-600">
                    {results.overallInsights?.underperformingFactories?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Performansı Düşük Fabrika</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600">
                    {results.scenarioResults?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Analiz Edilen Senaryo</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scenario Results */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Senaryo Sonuçları
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.scenarioResults?.map((scenario: any, index: number) => (
                    <div key={scenario.scenarioId} className="p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium">{scenario.scenarioName}</h4>
                          <span className="text-sm text-gray-600">%{scenario.probability} olasılık</span>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedScenario(scenario.scenarioId)}
                        >
                          Detay
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">KPI İyileşmesi:</span>
                          <span className="font-medium text-green-600">
                            +{scenario.overallMetrics?.totalKPIImprovement?.toFixed(1) || '0'}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Başarı Olasılığı:</span>
                          <span className="font-medium">
                            {scenario.overallMetrics?.successProbability?.toFixed(0) || '0'}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Süre:</span>
                          <span className="font-medium">
                            {scenario.overallMetrics?.timeToValue || 0} ay
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Risk Skoru:</span>
                          <span className={`font-medium ${
                            (scenario.overallMetrics?.riskScore || 0) < 30 ? 'text-green-600' : 
                            (scenario.overallMetrics?.riskScore || 0) < 70 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {scenario.overallMetrics?.riskScore?.toFixed(0) || '0'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Factory Performance Comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Factory className="h-5 w-5" />
                  Fabrika Performans Karşılaştırması
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {results.factoryComparisons?.slice(0, 6).map((factory: any) => (
                    <div key={factory.factoryId} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h5 className="font-medium">{factory.factoryName}</h5>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            #{factory.currentPerformance?.rank}
                          </span>
                          {factory.projectedPerformance?.projectedRank < factory.currentPerformance?.rank ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : factory.projectedPerformance?.projectedRank > factory.currentPerformance?.rank ? (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          ) : (
                            <Activity className="h-4 w-4 text-gray-500" />
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-gray-600">Mevcut Skor:</span>
                          <span className="ml-2 font-medium">
                            {factory.currentPerformance?.avgKPIScore?.toFixed(1) || '0'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Tahmini Skor:</span>
                          <span className="ml-2 font-medium text-blue-600">
                            {factory.projectedPerformance?.avgKPIScore?.toFixed(1) || '0'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Beklenen İyileşme:</span>
                          <span className="ml-2 font-medium text-green-600">
                            +{factory.projectedPerformance?.expectedImprovement?.toFixed(1) || '0'}%
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Risk Ayarlı:</span>
                          <span className="ml-2 font-medium">
                            {factory.projectedPerformance?.riskAdjustedScore?.toFixed(1) || '0'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* KPI Projections - Selected Scenario */}
          {selectedScenario && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  KPI Projeksiyon Detayları
                </CardTitle>
                <CardDescription>
                  Seçili senaryo için KPI'ların detaylı analizi
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const scenario = results.scenarioResults?.find((s: any) => s.scenarioId === selectedScenario)
                  if (!scenario) return <p>Senaryo bulunamadı</p>

                  return (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">{scenario.scenarioName}</h4>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedScenario('')}
                        >
                          Kapat
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        {scenario.kpiProjections?.slice(0, 8).map((kpi: any) => (
                          <div key={kpi.kpiId} className="p-4 border rounded-lg">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h5 className="font-medium">KPI {kpi.kpiNumber}: {kpi.kpiDescription}</h5>
                                <p className="text-sm text-gray-600">{kpi.theme} • {kpi.strategicGoal}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {getTrendIcon(kpi.historicalTrend?.trendDirection)}
                                <span className="text-xs text-gray-600">
                                  {kpi.historicalTrend?.trendRate > 0 ? '+' : ''}{kpi.historicalTrend?.trendRate?.toFixed(1)}%
                                </span>
                              </div>
                            </div>

                            {/* Current vs Projected */}
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div className="text-center p-2 bg-gray-50 rounded">
                                <div className="font-medium">
                                  {kpi.currentPeriodValues?.reduce((sum: number, f: any) => sum + f.value, 0) / 
                                   Math.max(kpi.currentPeriodValues?.length || 1, 1) || 0}
                                </div>
                                <div className="text-xs text-gray-600">Mevcut Ortalama</div>
                              </div>
                              <div className="text-center p-2 bg-blue-50 rounded">
                                <div className="font-medium text-blue-600">
                                  {kpi.projectedValues?.[kpi.projectedValues.length - 1]?.aggregateProjection?.withActions?.toFixed(1) || '0'}
                                </div>
                                <div className="text-xs text-gray-600">Tahmini Sonuç</div>
                              </div>
                              <div className="text-center p-2 bg-green-50 rounded">
                                <div className="font-medium text-green-600">
                                  +{kpi.projectedValues?.[kpi.projectedValues.length - 1]?.aggregateProjection?.improvementPercent?.toFixed(1) || '0'}%
                                </div>
                                <div className="text-xs text-gray-600">İyileşme</div>
                              </div>
                            </div>

                            {/* Risk Factors */}
                            {kpi.riskFactors?.length > 0 && (
                              <div className="mt-3 pt-3 border-t">
                                <h6 className="text-sm font-medium mb-2 flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3 text-yellow-500" />
                                  Risk Faktörleri
                                </h6>
                                <div className="space-y-1">
                                  {kpi.riskFactors.slice(0, 2).map((risk: any, index: number) => (
                                    <div key={index} className="flex items-center justify-between text-xs">
                                      <span className="text-gray-700">{risk.name}</span>
                                      <span className={`px-1 py-0.5 rounded ${
                                        Math.abs(risk.impact) > 15 ? 'bg-red-100 text-red-700' :
                                        Math.abs(risk.impact) > 5 ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-green-100 text-green-700'
                                      }`}>
                                        {risk.impact > 0 ? '+' : ''}{risk.impact}%
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          )}

          {/* Probabilistic Outcomes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Olasılıksal Sonuçlar
              </CardTitle>
              <CardDescription>
                Farklı senaryolar altında beklenen sonuçlar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Optimistic */}
                <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <h5 className="font-medium text-green-800">İyimser Senaryo</h5>
                  </div>
                  <p className="text-sm text-green-700 mb-2">
                    %{results.probabilisticOutcomes?.optimistic?.probability || 25} olasılık
                  </p>
                  <div className="text-xs text-green-600">
                    • Tüm eylemler başarılı<br/>
                    • Minimum risk faktörü<br/>
                    • Maksimum KPI iyileşmesi
                  </div>
                </div>

                {/* Realistic */}
                <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-blue-600" />
                    <h5 className="font-medium text-blue-800">Gerçekçi Senaryo</h5>
                  </div>
                  <p className="text-sm text-blue-700 mb-2">
                    %{results.probabilisticOutcomes?.realistic?.probability || 50} olasılık
                  </p>
                  <div className="text-xs text-blue-600">
                    • Ortalama performans<br/>
                    • Beklenen risk seviyesi<br/>
                    • Tahmini KPI iyileşmesi
                  </div>
                </div>

                {/* Pessimistic */}
                <div className="p-4 border rounded-lg bg-red-50 border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <h5 className="font-medium text-red-800">Kötümser Senaryo</h5>
                  </div>
                  <p className="text-sm text-red-700 mb-2">
                    %{results.probabilisticOutcomes?.pessimistic?.probability || 25} olasılık
                  </p>
                  <div className="text-xs text-red-600">
                    • Eylem başarısızlıkları<br/>
                    • Yüksek risk etkisi<br/>
                    • Sınırlı iyileşme
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* No Results State */}
      {!results && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <Target className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">KPI Odaklı Analiz</h3>
            <p className="text-gray-600 mb-4">
              Eylemlerinizin KPI'lara olan etkisini detaylı analiz etmek için simülasyonu başlatın
            </p>
            <Button onClick={runKPIAnalysis} disabled={scenarios.length === 0}>
              <Eye className="h-4 w-4 mr-2" />
              Analizi Başlat
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
