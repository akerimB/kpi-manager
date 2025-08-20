'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Activity,
  Target,
  Clock
} from "lucide-react"

interface SimulationChartsProps {
  results?: any
}

export default function SimulationCharts({ results }: SimulationChartsProps) {
  if (!results) return null

  // Monte Carlo Distribution Chart (simplified visualization)
  const renderMonteCarloChart = () => {
    if (!results.monteCarlo?.probabilityDistribution) return null

    const data = results.monteCarlo.probabilityDistribution
    const maxProbability = Math.max(...data.map((d: any) => d.probability))

    return (
      <div className="space-y-2">
        <h5 className="font-medium">ROI Dağılımı</h5>
        <div className="relative h-32 flex items-end gap-1">
          {data.slice(0, 20).map((point: any, index: number) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div 
                className="w-full bg-blue-500 rounded-t"
                style={{ 
                  height: `${(point.probability / maxProbability) * 100}%`,
                  minHeight: '2px'
                }}
                title={`ROI: ${point.value.toFixed(1)}%, Olasılık: ${(point.probability * 100).toFixed(1)}%`}
              ></div>
              {index % 4 === 0 && (
                <div className="text-xs text-gray-600 mt-1 rotate-45 origin-left">
                  {point.value.toFixed(0)}%
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="text-xs text-gray-600 text-center">ROI (%)</div>
      </div>
    )
  }

  // Risk Heatmap
  const renderRiskHeatmap = () => {
    if (!results.risk?.riskFactors) return null

    const risks = results.risk.riskFactors.slice(0, 6)

    return (
      <div className="space-y-2">
        <h5 className="font-medium">Risk Matrisi</h5>
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: 9 }, (_, i) => {
            const row = Math.floor(i / 3)
            const col = i % 3
            const probability = (row + 1) * 33.33
            const impact = (col + 1) * 33.33
            
            // Find if any risk falls in this cell
            const riskInCell = risks.find((risk: any) => 
              Math.abs(risk.probability - probability) < 16.67 && 
              Math.abs(risk.impact - impact) < 16.67
            )
            
            const cellRisk = riskInCell ? 
              (riskInCell.probability * riskInCell.impact) / 100 : 0

            return (
              <div 
                key={i}
                className={`h-8 w-full rounded text-xs flex items-center justify-center text-white font-medium ${
                  cellRisk > 50 ? 'bg-red-500' :
                  cellRisk > 25 ? 'bg-yellow-500' :
                  cellRisk > 0 ? 'bg-green-500' : 'bg-gray-200'
                }`}
                title={riskInCell ? riskInCell.name : `P:${probability.toFixed(0)}% I:${impact.toFixed(0)}%`}
              >
                {riskInCell && cellRisk.toFixed(0)}
              </div>
            )
          })}
        </div>
        <div className="flex justify-between text-xs text-gray-600">
          <span>Düşük Etki</span>
          <span>Yüksek Etki</span>
        </div>
        <div className="text-xs text-gray-600 text-center">← Düşük Olasılık | Yüksek Olasılık →</div>
      </div>
    )
  }

  // Sensitivity Tornado Chart
  const renderSensitivityChart = () => {
    if (!results.sensitivity?.parameters) return null

    const params = results.sensitivity.parameters.slice(0, 5)
    const maxElasticity = Math.max(...params.map((p: any) => Math.abs(p.elasticity)))

    return (
      <div className="space-y-2">
        <h5 className="font-medium">Duyarlılık Analizi</h5>
        <div className="space-y-2">
          {params.map((param: any, index: number) => (
            <div key={param.parameter} className="flex items-center gap-2">
              <div className="w-20 text-xs truncate" title={param.parameter}>
                {param.parameter.replace('_', ' ')}
              </div>
              <div className="flex-1 relative h-4 bg-gray-200 rounded">
                <div 
                  className={`absolute h-full rounded ${
                    param.elasticity > 0 ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{ 
                    width: `${(Math.abs(param.elasticity) / maxElasticity) * 100}%`,
                    left: param.elasticity < 0 ? `${100 - (Math.abs(param.elasticity) / maxElasticity) * 100}%` : '0'
                  }}
                ></div>
              </div>
              <div className="w-12 text-xs text-right">
                {param.elasticity.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Timeline Gantt Chart (simplified)
  const renderTimelineChart = () => {
    if (!results.optimization?.optimalSequence?.actions) return null

    const actions = results.optimization.optimalSequence.actions.slice(0, 8)
    const startTime = Math.min(...actions.map((a: any) => new Date(a.startDate).getTime()))
    const endTime = Math.max(...actions.map((a: any) => new Date(a.endDate).getTime()))
    const totalDuration = endTime - startTime

    return (
      <div className="space-y-2">
        <h5 className="font-medium">Eylem Zaman Çizelgesi</h5>
        <div className="space-y-1">
          {actions.map((action: any, index: number) => {
            const actionStart = new Date(action.startDate).getTime()
            const actionEnd = new Date(action.endDate).getTime()
            const actionDuration = actionEnd - actionStart
            
            const startPercent = ((actionStart - startTime) / totalDuration) * 100
            const widthPercent = (actionDuration / totalDuration) * 100

            return (
              <div key={action.actionId} className="flex items-center gap-2">
                <div className="w-16 text-xs truncate">
                  Eylem {index + 1}
                </div>
                <div className="flex-1 relative h-4 bg-gray-100 rounded">
                  <div 
                    className={`absolute h-full rounded ${
                      action.priority > 0.8 ? 'bg-red-500' :
                      action.priority > 0.5 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ 
                      left: `${startPercent}%`,
                      width: `${widthPercent}%`
                    }}
                    title={`${new Date(action.startDate).toLocaleDateString()} - ${new Date(action.endDate).toLocaleDateString()}`}
                  ></div>
                </div>
                <div className="w-12 text-xs text-right">
                  {action.priority.toFixed(1)}
                </div>
              </div>
            )
          })}
        </div>
        <div className="text-xs text-gray-600 text-center">
          {new Date(startTime).toLocaleDateString()} - {new Date(endTime).toLocaleDateString()}
        </div>
      </div>
    )
  }

  // KPI Impact Radar Chart (simplified as bars)
  const renderKPIImpactChart = () => {
    const kpiImpacts = results.scenarioResults?.[0]?.kpiImpacts?.slice(0, 6)
    if (!kpiImpacts) return null

    const maxImprovement = Math.max(...kpiImpacts.map((kpi: any) => Math.abs(kpi.improvementPercent)))

    return (
      <div className="space-y-2">
        <h5 className="font-medium">KPI Etki Analizi</h5>
        <div className="space-y-2">
          {kpiImpacts.map((kpi: any) => (
            <div key={kpi.kpiId} className="flex items-center gap-2">
              <div className="w-16 text-xs truncate" title={kpi.kpiDescription}>
                KPI {kpi.kpiNumber}
              </div>
              <div className="flex-1 relative h-4 bg-gray-200 rounded">
                <div 
                  className={`absolute h-full rounded ${
                    kpi.improvementPercent > 0 ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{ 
                    width: `${(Math.abs(kpi.improvementPercent) / maxImprovement) * 100}%`,
                    left: kpi.improvementPercent < 0 ? `${100 - (Math.abs(kpi.improvementPercent) / maxImprovement) * 100}%` : '0'
                  }}
                ></div>
              </div>
              <div className="w-16 text-xs text-right">
                {kpi.improvementPercent > 0 ? '+' : ''}{kpi.improvementPercent.toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Monte Carlo Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Monte Carlo Dağılımı
          </CardTitle>
          <CardDescription>
            ROI olasılık dağılımı ({results.monteCarlo?.iterations?.toLocaleString()} iterasyon)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderMonteCarloChart()}
        </CardContent>
      </Card>

      {/* Risk Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Risk Haritası
          </CardTitle>
          <CardDescription>
            Olasılık vs Etki matrisi
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderRiskHeatmap()}
        </CardContent>
      </Card>

      {/* Sensitivity Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Duyarlılık Tornado
          </CardTitle>
          <CardDescription>
            Parametrelerin sonuçlara etkisi
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderSensitivityChart()}
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Zaman Çizelgesi
          </CardTitle>
          <CardDescription>
            Optimal eylem sıralama ve zamanlaması
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderTimelineChart()}
        </CardContent>
      </Card>

      {/* KPI Impact Analysis */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            KPI Etki Analizi
          </CardTitle>
          <CardDescription>
            Her KPI'ya beklenen etkiler
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderKPIImpactChart()}
        </CardContent>
      </Card>
    </div>
  )
}
