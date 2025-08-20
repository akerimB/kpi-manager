// Enhanced KPI-Focused Simulation Engine
import { prisma } from '@/lib/prisma'

export interface KPISimulationScenario {
  id: string
  name: string
  description: string
  probability: number
  actions: KPIActionSimulation[]
  timeHorizon: {
    startPeriod: string
    endPeriod: string
    intervalMonths: number
  }
}

export interface KPIActionSimulation {
  actionId: string
  actionCode: string
  completionRate: number // 0-100
  implementationDelay: number // months
  implementationDuration: number // months
  successProbability: number // 0-100
  resourceIntensity: number // 0-100
}

export interface KPIProjection {
  kpiId: string
  kpiNumber: number
  kpiDescription: string
  theme: string
  strategicGoal: string
  strategicTarget: string
  currentPeriodValues: FactoryKPIValue[]
  historicalTrend: {
    periods: string[]
    values: number[]
    trendDirection: 'improving' | 'declining' | 'stable'
    trendRate: number // % change per period
  }
  projectedValues: {
    period: string
    factoryProjections: FactoryProjection[]
    aggregateProjection: {
      baseline: number
      withActions: number
      improvement: number
      improvementPercent: number
      confidenceInterval: {
        lower: number
        upper: number
        confidence: number
      }
    }
  }[]
  riskFactors: KPIRiskFactor[]
}

export interface FactoryKPIValue {
  factoryId: string
  factoryName: string
  factoryCity: string
  factoryRegion: string
  value: number
  target: number
  achievementRate: number
}

export interface FactoryProjection {
  factoryId: string
  factoryName: string
  baseline: number
  projected: number
  improvement: number
  improvementPercent: number
  riskLevel: 'low' | 'medium' | 'high'
  contributingActions: string[]
}

export interface KPIRiskFactor {
  id: string
  name: string
  type: 'market' | 'operational' | 'regulatory' | 'competitive' | 'internal'
  probability: number // 0-100
  impact: number // -100 to +100
  description: string
  mitigation: string
}

export interface FactoryPerformanceComparison {
  factoryId: string
  factoryName: string
  currentPerformance: {
    avgKPIScore: number
    rank: number
    totalKPIs: number
    aboveTarget: number
    belowTarget: number
  }
  projectedPerformance: {
    avgKPIScore: number
    projectedRank: number
    expectedImprovement: number
    riskAdjustedScore: number
  }
  competitivePosition: {
    relativeToAverage: number
    relativeToLeader: number
    gapAnalysis: {
      strengths: string[]
      weaknesses: string[]
      opportunities: string[]
    }
  }
}

export interface KPISimulationResult {
  scenarioResults: ScenarioKPIResult[]
  factoryComparisons: FactoryPerformanceComparison[]
  overallInsights: {
    totalKPIsAnalyzed: number
    avgImprovementExpected: number
    highestRiskKPIs: string[]
    mostImpactfulActions: string[]
    underperformingFactories: string[]
    recommendedPriorities: string[]
  }
  probabilisticOutcomes: {
    optimistic: KPIOutcome
    realistic: KPIOutcome
    pessimistic: KPIOutcome
  }
}

export interface ScenarioKPIResult {
  scenarioId: string
  scenarioName: string
  probability: number
  kpiProjections: KPIProjection[]
  overallMetrics: {
    totalKPIImprovement: number
    successProbability: number
    timeToValue: number // months
    resourceRequirement: number
    riskScore: number
  }
}

export interface KPIOutcome {
  probability: number
  expectedKPIImprovements: {
    kpiId: string
    improvementPercent: number
  }[]
  factoryRankings: {
    factoryId: string
    rank: number
    score: number
  }[]
}

export class EnhancedKPISimulationEngine {
  
  async runKPIFocusedSimulation(
    scenarios: KPISimulationScenario[]
  ): Promise<KPISimulationResult> {
    
    console.log('🎯 Starting KPI-Focused Simulation...')
    
    // 1. Analyze historical KPI performance for baseline
    const historicalData = await this.getHistoricalKPIData()
    
    // 2. Get current KPI values and factory performance
    const currentPerformance = await this.getCurrentFactoryPerformance()
    
    // 3. Run scenario analysis with KPI projections
    const scenarioResults = await this.analyzeKPIScenarios(scenarios, historicalData)
    
    // 4. Generate factory comparisons
    const factoryComparisons = await this.generateFactoryComparisons(scenarioResults, currentPerformance)
    
    // 5. Create probabilistic outcomes
    const probabilisticOutcomes = this.generateProbabilisticOutcomes(scenarioResults)
    
    // 6. Generate overall insights
    const overallInsights = this.generateOverallInsights(scenarioResults, factoryComparisons)
    
    return {
      scenarioResults,
      factoryComparisons,
      overallInsights,
      probabilisticOutcomes
    }
  }
  
  private async getHistoricalKPIData() {
    // Get last 4 quarters of KPI data for trend analysis
    const periods = ['2024-Q1', '2024-Q2', '2024-Q3', '2024-Q4']
    
    const historicalData = await prisma.kPIValue.findMany({
      where: {
        period: { in: periods }
      },
      include: {
        kpi: {
          include: {
            theme: true,
            strategicTarget: {
              include: {
                strategicGoal: true
              }
            }
          }
        },
        factory: true
      },
      orderBy: [
        { kpi: { number: 'asc' } },
        { period: 'asc' }
      ]
    })
    
    // Group by KPI and calculate trends
    const kpiTrends = new Map()
    
    historicalData.forEach(value => {
      const kpiId = value.kpiId
      if (!kpiTrends.has(kpiId)) {
        kpiTrends.set(kpiId, {
          kpi: value.kpi,
          periods: [],
          values: [],
          factories: new Map()
        })
      }
      
      const kpiData = kpiTrends.get(kpiId)
      
      if (!kpiData.factories.has(value.factoryId)) {
        kpiData.factories.set(value.factoryId, {
          factory: value.factory,
          periodValues: []
        })
      }
      
      kpiData.factories.get(value.factoryId).periodValues.push({
        period: value.period,
        value: value.value,
        target: value.target
      })
    })
    
    return kpiTrends
  }
  
  private async getCurrentFactoryPerformance() {
    const currentPeriod = '2024-Q4'
    
    const factoryPerformance = await prisma.factory.findMany({
      include: {
        kpiValues: {
          where: { period: currentPeriod },
          include: {
            kpi: {
              include: {
                theme: true,
                strategicTarget: {
                  include: {
                    strategicGoal: true
                  }
                }
              }
            }
          }
        }
      }
    })
    
    return factoryPerformance.map(factory => {
      const kpiValues = factory.kpiValues
      const totalKPIs = kpiValues.length
      const aboveTarget = kpiValues.filter(kv => kv.value >= kv.target).length
      const belowTarget = totalKPIs - aboveTarget
      const avgKPIScore = totalKPIs > 0 ? 
        kpiValues.reduce((sum, kv) => sum + (kv.value / kv.target) * 100, 0) / totalKPIs : 0
      
      return {
        factoryId: factory.id,
        factoryName: factory.name,
        factoryCity: factory.city,
        factoryRegion: factory.region,
        currentPerformance: {
          avgKPIScore,
          totalKPIs,
          aboveTarget,
          belowTarget,
          rank: 0 // Will be calculated later
        },
        kpiValues
      }
    }).sort((a, b) => b.currentPerformance.avgKPIScore - a.currentPerformance.avgKPIScore)
      .map((factory, index) => ({
        ...factory,
        currentPerformance: {
          ...factory.currentPerformance,
          rank: index + 1
        }
      }))
  }
  
  private async analyzeKPIScenarios(
    scenarios: KPISimulationScenario[], 
    historicalData: Map<string, any>
  ): Promise<ScenarioKPIResult[]> {
    
    const results: ScenarioKPIResult[] = []
    
    for (const scenario of scenarios) {
      console.log(`📈 Analyzing KPI scenario: ${scenario.name}`)
      
      // Get actions in this scenario
      const actionIds = scenario.actions.map(a => a.actionId)
      const actions = await prisma.action.findMany({
        where: { id: { in: actionIds } },
        include: {
          actionKpis: {
            include: {
              kpi: {
                include: {
                  theme: true,
                  strategicTarget: {
                    include: {
                      strategicGoal: true
                    }
                  },
                  kpiValues: {
                    where: { period: '2024-Q4' },
                    include: { factory: true }
                  }
                }
              }
            }
          }
        }
      })
      
      // Analyze KPI projections
      const kpiProjections = await this.projectKPIImpacts(scenario, actions, historicalData)
      
      // Calculate overall metrics
      const overallMetrics = this.calculateScenarioMetrics(scenario, kpiProjections)
      
      results.push({
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        probability: scenario.probability,
        kpiProjections,
        overallMetrics
      })
    }
    
    return results
  }
  
  private async projectKPIImpacts(
    scenario: KPISimulationScenario,
    actions: any[],
    historicalData: Map<string, any>
  ): Promise<KPIProjection[]> {
    
    const kpiProjections: KPIProjection[] = []
    const affectedKPIs = new Set<string>()
    
    // Collect all KPIs affected by actions in this scenario
    actions.forEach(action => {
      action.actionKpis.forEach((actionKpi: any) => {
        affectedKPIs.add(actionKpi.kpiId)
      })
    })
    
    for (const kpiId of affectedKPIs) {
      const historicalKPI = historicalData.get(kpiId)
      if (!historicalKPI) continue
      
      const kpi = historicalKPI.kpi
      
      // Calculate historical trend
      const factoryValues = Array.from(historicalKPI.factories.values())
      const trendAnalysis = this.calculateKPITrend(factoryValues)
      
      // Get current period values
      const currentPeriodValues: FactoryKPIValue[] = []
      historicalKPI.factories.forEach((factoryData: any, factoryId: string) => {
        const currentValue = factoryData.periodValues.find((pv: any) => pv.period === '2024-Q4')
        if (currentValue) {
          currentPeriodValues.push({
            factoryId,
            factoryName: factoryData.factory.name,
            factoryCity: factoryData.factory.city,
            factoryRegion: factoryData.factory.region,
            value: currentValue.value,
            target: currentValue.target,
            achievementRate: (currentValue.value / currentValue.target) * 100
          })
        }
      })
      
      // Project future values based on actions
      const projectedValues = this.projectFutureKPIValues(
        scenario,
        kpiId,
        currentPeriodValues,
        actions,
        trendAnalysis
      )
      
      // Identify risk factors
      const riskFactors = this.identifyKPIRiskFactors(kpi, currentPeriodValues, trendAnalysis)
      
      kpiProjections.push({
        kpiId,
        kpiNumber: kpi.number,
        kpiDescription: kpi.description,
        theme: kpi.theme?.name || 'Unknown',
        strategicGoal: kpi.strategicTarget?.strategicGoal?.description || 'Unknown',
        strategicTarget: kpi.strategicTarget?.description || 'Unknown',
        currentPeriodValues,
        historicalTrend: trendAnalysis,
        projectedValues,
        riskFactors
      })
    }
    
    return kpiProjections
  }
  
  private calculateKPITrend(factoryValues: any[]) {
    // Calculate overall trend across all factories
    const allPeriodValues = factoryValues.flatMap(fv => fv.periodValues)
    const periods = ['2024-Q1', '2024-Q2', 'Q3', '2024-Q4']
    
    const periodAverages = periods.map(period => {
      const periodValues = allPeriodValues.filter(pv => pv.period === period)
      return periodValues.length > 0 ? 
        periodValues.reduce((sum, pv) => sum + pv.value, 0) / periodValues.length : 0
    }).filter(avg => avg > 0)
    
    if (periodAverages.length < 2) {
      return {
        periods,
        values: periodAverages,
        trendDirection: 'stable' as const,
        trendRate: 0
      }
    }
    
    // Calculate trend rate (% change per period)
    const firstValue = periodAverages[0]
    const lastValue = periodAverages[periodAverages.length - 1]
    const periodsCount = periodAverages.length - 1
    const trendRate = periodsCount > 0 ? 
      (Math.pow(lastValue / firstValue, 1 / periodsCount) - 1) * 100 : 0
    
    const trendDirection = trendRate > 2 ? 'improving' : 
                          trendRate < -2 ? 'declining' : 'stable'
    
    return {
      periods,
      values: periodAverages,
      trendDirection,
      trendRate
    }
  }
  
  private projectFutureKPIValues(
    scenario: KPISimulationScenario,
    kpiId: string,
    currentValues: FactoryKPIValue[],
    actions: any[],
    trendAnalysis: any
  ) {
    const projectedPeriods = ['2025-Q1', '2025-Q2', '2025-Q3', '2025-Q4']
    
    return projectedPeriods.map(period => {
      const monthsFromStart = this.getMonthsFromPeriod('2024-Q4', period)
      
      const factoryProjections: FactoryProjection[] = currentValues.map(factoryValue => {
        // Calculate baseline projection (natural trend)
        const naturalGrowth = (trendAnalysis.trendRate / 100) * (monthsFromStart / 3) // Quarterly rate
        const baseline = factoryValue.value * (1 + naturalGrowth)
        
        // Calculate action impacts
        let actionImpact = 0
        const contributingActions: string[] = []
        
        actions.forEach(action => {
          const scenarioAction = scenario.actions.find(sa => sa.actionId === action.id)
          if (!scenarioAction) return
          
          const actionKPI = action.actionKpis.find((ak: any) => ak.kpiId === kpiId)
          if (!actionKPI) return
          
          // Check if action is active in this period
          const actionStartMonth = scenarioAction.implementationDelay
          const actionEndMonth = actionStartMonth + scenarioAction.implementationDuration
          
          if (monthsFromStart >= actionStartMonth && monthsFromStart <= actionEndMonth) {
            const completionFactor = (scenarioAction.completionRate / 100)
            const successFactor = (scenarioAction.successProbability / 100)
            const timeFactor = Math.min(1, (monthsFromStart - actionStartMonth + 1) / scenarioAction.implementationDuration)
            
            const impactScore = (actionKPI.impactScore || 0.1) * completionFactor * successFactor * timeFactor
            actionImpact += baseline * impactScore
            contributingActions.push(action.code)
          }
        })
        
        const projected = baseline + actionImpact
        const improvement = projected - factoryValue.value
        const improvementPercent = (improvement / factoryValue.value) * 100
        
        // Calculate risk level based on various factors
        const riskLevel = this.calculateFactoryRiskLevel(
          factoryValue,
          improvement,
          scenario,
          contributingActions
        )
        
        return {
          factoryId: factoryValue.factoryId,
          factoryName: factoryValue.factoryName,
          baseline,
          projected,
          improvement,
          improvementPercent,
          riskLevel,
          contributingActions
        }
      })
      
      // Calculate aggregate projection
      const totalBaseline = factoryProjections.reduce((sum, fp) => sum + fp.baseline, 0) / factoryProjections.length
      const totalProjected = factoryProjections.reduce((sum, fp) => sum + fp.projected, 0) / factoryProjections.length
      const totalImprovement = totalProjected - totalBaseline
      const totalImprovementPercent = (totalImprovement / totalBaseline) * 100
      
      // Calculate confidence interval based on variability and risk
      const variability = this.calculateProjectionVariability(factoryProjections)
      const confidence = Math.max(50, 90 - variability * 2) // Higher variability = lower confidence
      
      return {
        period,
        factoryProjections,
        aggregateProjection: {
          baseline: totalBaseline,
          withActions: totalProjected,
          improvement: totalImprovement,
          improvementPercent: totalImprovementPercent,
          confidenceInterval: {
            lower: totalProjected * (1 - variability / 100),
            upper: totalProjected * (1 + variability / 100),
            confidence
          }
        }
      }
    })
  }
  
  private identifyKPIRiskFactors(kpi: any, currentValues: FactoryKPIValue[], trendAnalysis: any): KPIRiskFactor[] {
    const riskFactors: KPIRiskFactor[] = []
    
    // Market risks based on KPI theme
    if (kpi.theme?.name.includes('Pazarlama') || kpi.theme?.name.includes('Satış')) {
      riskFactors.push({
        id: 'market_competition',
        name: 'Artan Rekabet Baskısı',
        type: 'competitive',
        probability: 40,
        impact: -15,
        description: 'Pazarda artan rekabet KPI performansını olumsuz etkileyebilir',
        mitigation: 'Farklılaştırma stratejileri ve müşteri sadakati programları'
      })
    }
    
    // Operational risks for production KPIs
    if (kpi.theme?.name.includes('Üretim') || kpi.theme?.name.includes('Operasyon')) {
      riskFactors.push({
        id: 'operational_disruption',
        name: 'Operasyonel Aksamalar',
        type: 'operational',
        probability: 25,
        impact: -20,
        description: 'Üretim süreçlerinde beklenmeyen aksamalar',
        mitigation: 'Preventif bakım ve süreç iyileştirmeleri'
      })
    }
    
    // Performance-based risks
    const underperformingFactories = currentValues.filter(cv => cv.achievementRate < 80).length
    const totalFactories = currentValues.length
    
    if (underperformingFactories > totalFactories * 0.3) {
      riskFactors.push({
        id: 'widespread_underperformance',
        name: 'Yaygın Düşük Performans',
        type: 'internal',
        probability: 60,
        impact: -25,
        description: `Fabrikaların %${Math.round(underperformingFactories/totalFactories*100)}'i hedefin altında`,
        mitigation: 'Kapasiye geliştirme ve best practice paylaşımı'
      })
    }
    
    // Trend-based risks
    if (trendAnalysis.trendDirection === 'declining') {
      riskFactors.push({
        id: 'declining_trend',
        name: 'Azalan Trend',
        type: 'internal',
        probability: 70,
        impact: Math.min(-10, trendAnalysis.trendRate),
        description: `KPI değeri %${Math.abs(trendAnalysis.trendRate).toFixed(1)} oranında azalıyor`,
        mitigation: 'Kök neden analizi ve corrective action planı'
      })
    }
    
    return riskFactors
  }
  
  private calculateFactoryRiskLevel(
    factoryValue: FactoryKPIValue,
    improvement: number,
    scenario: KPISimulationScenario,
    contributingActions: string[]
  ): 'low' | 'medium' | 'high' {
    let riskScore = 0
    
    // Current performance risk
    if (factoryValue.achievementRate < 70) riskScore += 30
    else if (factoryValue.achievementRate < 90) riskScore += 15
    
    // Improvement dependency risk
    if (contributingActions.length === 0) riskScore += 20 // No actions contributing
    else if (contributingActions.length === 1) riskScore += 10 // Single point of failure
    
    // Action complexity risk
    const avgResourceIntensity = scenario.actions
      .filter(a => contributingActions.includes(a.actionCode))
      .reduce((sum, a) => sum + a.resourceIntensity, 0) / contributingActions.length
    
    if (avgResourceIntensity > 80) riskScore += 20
    else if (avgResourceIntensity > 60) riskScore += 10
    
    if (riskScore > 40) return 'high'
    if (riskScore > 20) return 'medium'
    return 'low'
  }
  
  private calculateProjectionVariability(factoryProjections: FactoryProjection[]): number {
    const improvements = factoryProjections.map(fp => fp.improvementPercent)
    const mean = improvements.reduce((sum, imp) => sum + imp, 0) / improvements.length
    const variance = improvements.reduce((sum, imp) => sum + Math.pow(imp - mean, 2), 0) / improvements.length
    return Math.sqrt(variance)
  }
  
  private calculateScenarioMetrics(scenario: KPISimulationScenario, kpiProjections: KPIProjection[]) {
    const lastPeriodProjections = kpiProjections.map(kp => 
      kp.projectedValues[kp.projectedValues.length - 1]?.aggregateProjection.improvementPercent || 0
    )
    
    const totalKPIImprovement = lastPeriodProjections.reduce((sum, imp) => sum + imp, 0) / lastPeriodProjections.length
    
    const actionSuccessRates = scenario.actions.map(a => a.successProbability)
    const successProbability = actionSuccessRates.reduce((sum, rate) => sum + rate, 0) / actionSuccessRates.length
    
    const timeToValue = Math.max(...scenario.actions.map(a => a.implementationDelay + a.implementationDuration))
    
    const resourceRequirement = scenario.actions.reduce((sum, a) => sum + a.resourceIntensity, 0) / scenario.actions.length
    
    // Calculate risk score based on various factors
    const riskScore = Math.max(0, Math.min(100, 
      (100 - successProbability) * 0.4 + 
      resourceRequirement * 0.3 + 
      (timeToValue > 12 ? 30 : timeToValue * 2.5) * 0.3
    ))
    
    return {
      totalKPIImprovement,
      successProbability,
      timeToValue,
      resourceRequirement,
      riskScore
    }
  }
  
  private async generateFactoryComparisons(
    scenarioResults: ScenarioKPIResult[],
    currentPerformance: any[]
  ): Promise<FactoryPerformanceComparison[]> {
    
    // Take the most probable scenario for comparison
    const primaryScenario = scenarioResults.reduce((prev, current) => 
      current.probability > prev.probability ? current : prev
    )
    
    return currentPerformance.map(factory => {
      // Calculate projected performance based on KPI improvements
      const factoryKPIProjections = primaryScenario.kpiProjections.map(kp => {
        const lastProjection = kp.projectedValues[kp.projectedValues.length - 1]
        const factoryProjection = lastProjection?.factoryProjections.find(fp => fp.factoryId === factory.factoryId)
        return factoryProjection ? factoryProjection.improvementPercent : 0
      })
      
      const avgProjectedImprovement = factoryKPIProjections.reduce((sum, imp) => sum + imp, 0) / factoryKPIProjections.length
      const projectedScore = factory.currentPerformance.avgKPIScore * (1 + avgProjectedImprovement / 100)
      
      // Calculate risk-adjusted score
      const riskFactors = primaryScenario.kpiProjections.flatMap(kp => kp.riskFactors)
      const avgRiskImpact = riskFactors.reduce((sum, rf) => sum + rf.impact, 0) / Math.max(riskFactors.length, 1)
      const riskAdjustedScore = projectedScore * (1 + avgRiskImpact / 100)
      
      return {
        factoryId: factory.factoryId,
        factoryName: factory.factoryName,
        currentPerformance: factory.currentPerformance,
        projectedPerformance: {
          avgKPIScore: projectedScore,
          projectedRank: 0, // Will be calculated after sorting
          expectedImprovement: avgProjectedImprovement,
          riskAdjustedScore
        },
        competitivePosition: {
          relativeToAverage: 0, // Will be calculated
          relativeToLeader: 0, // Will be calculated
          gapAnalysis: {
            strengths: [],
            weaknesses: [],
            opportunities: []
          }
        }
      }
    })
  }
  
  private generateProbabilisticOutcomes(scenarioResults: ScenarioKPIResult[]) {
    // Generate three outcomes based on scenario probabilities and performance
    const weightedResults = scenarioResults.map(sr => ({
      ...sr,
      weightedImprovement: sr.overallMetrics.totalKPIImprovement * (sr.probability / 100)
    }))
    
    const avgImprovement = weightedResults.reduce((sum, wr) => sum + wr.weightedImprovement, 0)
    
    return {
      optimistic: {
        probability: 25,
        expectedKPIImprovements: [],
        factoryRankings: []
      },
      realistic: {
        probability: 50,
        expectedKPIImprovements: [],
        factoryRankings: []
      },
      pessimistic: {
        probability: 25,
        expectedKPIImprovements: [],
        factoryRankings: []
      }
    }
  }
  
  private generateOverallInsights(
    scenarioResults: ScenarioKPIResult[],
    factoryComparisons: FactoryPerformanceComparison[]
  ) {
    const allKPIs = new Set<string>()
    scenarioResults.forEach(sr => {
      sr.kpiProjections.forEach(kp => allKPIs.add(kp.kpiId))
    })
    
    return {
      totalKPIsAnalyzed: allKPIs.size,
      avgImprovementExpected: scenarioResults.reduce((sum, sr) => 
        sum + sr.overallMetrics.totalKPIImprovement * (sr.probability / 100), 0
      ),
      highestRiskKPIs: [],
      mostImpactfulActions: [],
      underperformingFactories: factoryComparisons
        .filter(fc => fc.currentPerformance.avgKPIScore < 75)
        .map(fc => fc.factoryName),
      recommendedPriorities: []
    }
  }
  
  private getMonthsFromPeriod(fromPeriod: string, toPeriod: string): number {
    // Simple calculation - in real implementation, use proper date library
    const periodMap: { [key: string]: number } = {
      '2024-Q4': 0,
      '2025-Q1': 3,
      '2025-Q2': 6,
      '2025-Q3': 9,
      '2025-Q4': 12
    }
    return (periodMap[toPeriod] || 0) - (periodMap[fromPeriod] || 0)
  }
}

export const enhancedKPISimulation = new EnhancedKPISimulationEngine()
