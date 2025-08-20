// Advanced Simulation Engine
import { prisma } from '@/lib/prisma'

export interface Scenario {
  id: string
  name: string
  description: string
  probability: number // 0-100
  actions: ScenarioAction[]
  assumptions: ScenarioAssumption[]
}

export interface ScenarioAction {
  actionId: string
  completionRate: number // 0-100
  startDelay: number // days
  duration: number // days
  resourceRequirement: number // 0-100
  successProbability: number // 0-100
  dependencies: string[] // actionIds
}

export interface ScenarioAssumption {
  type: 'market' | 'resource' | 'external' | 'regulatory'
  name: string
  impact: number // -100 to +100
  probability: number // 0-100
  description: string
}

export interface MonteCarloSettings {
  iterations: number
  confidenceLevel: number // 0.95, 0.99 etc
  variabilityFactor: number // 0-100
  randomSeed?: number
}

export interface SensitivityAnalysis {
  parameters: SensitivityParameter[]
  ranges: ParameterRange[]
}

export interface SensitivityParameter {
  name: string
  baseline: number
  variations: number[] // % variations to test
  impact: 'linear' | 'exponential' | 'logarithmic'
}

export interface ParameterRange {
  min: number
  max: number
  step: number
}

export interface TimeRange {
  start: Date
  end: Date
  intervals: 'daily' | 'weekly' | 'monthly' | 'quarterly'
}

export interface ActionDependency {
  sourceActionId: string
  targetActionId: string
  type: 'prerequisite' | 'concurrent' | 'followup'
  delay: number // days
  strength: number // 0-100
}

export interface SimulationResult {
  scenarioResults: ScenarioResult[]
  monteCarlo: MonteCarloResult
  sensitivity: SensitivityResult
  optimization: OptimizationResult
  risk: RiskAnalysis
  timeline: TimelineAnalysis
}

export interface ScenarioResult {
  scenarioId: string
  probability: number
  kpiImpacts: KPIImpact[]
  totalCost: number
  totalBenefit: number
  roi: number
  duration: number
  riskScore: number
}

export interface KPIImpact {
  kpiId: string
  kpiNumber: number
  kpiDescription: string
  currentValue: number
  projectedValue: number
  improvement: number
  improvementPercent: number
  confidence: number
  timeToImpact: number // days
}

export interface MonteCarloResult {
  iterations: number
  meanROI: number
  medianROI: number
  standardDeviation: number
  confidenceIntervals: {
    lower: number
    upper: number
    level: number
  }[]
  probabilityDistribution: {
    value: number
    probability: number
  }[]
}

export interface SensitivityResult {
  parameters: ParameterSensitivity[]
  mostSensitive: string[]
  leastSensitive: string[]
}

export interface ParameterSensitivity {
  parameter: string
  elasticity: number
  correlation: number
  impact: number[]
}

export interface OptimizationResult {
  optimalSequence: ActionSequence[]
  alternativeSequences: ActionSequence[]
  resourceOptimization: ResourceOptimization
  timeOptimization: TimeOptimization
}

export interface ActionSequence {
  actions: OptimalAction[]
  totalDuration: number
  totalCost: number
  expectedBenefit: number
  riskLevel: 'low' | 'medium' | 'high'
}

export interface OptimalAction {
  actionId: string
  priority: number
  startDate: Date
  endDate: Date
  resourceAllocation: number
  expectedImpact: number
}

export interface ResourceOptimization {
  totalResourcesNeeded: number
  peakResourceUsage: number
  resourceEfficiency: number
  bottlenecks: ResourceBottleneck[]
}

export interface ResourceBottleneck {
  period: string
  resourceShortfall: number
  affectedActions: string[]
  mitigationOptions: string[]
}

export interface TimeOptimization {
  criticalPath: string[]
  totalDuration: number
  possibleAcceleration: number
  accelerationCost: number
}

export interface RiskAnalysis {
  overallRiskScore: number
  riskFactors: RiskFactor[]
  mitigationStrategies: MitigationStrategy[]
  contingencyPlans: ContingencyPlan[]
}

export interface RiskFactor {
  id: string
  name: string
  category: 'execution' | 'market' | 'resource' | 'technical' | 'regulatory'
  probability: number
  impact: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  mitigation: string
}

export interface MitigationStrategy {
  riskFactorId: string
  strategy: string
  cost: number
  effectiveness: number // 0-100
  timeToImplement: number // days
}

export interface ContingencyPlan {
  trigger: string
  actions: string[]
  cost: number
  timeframe: number
}

export interface TimelineAnalysis {
  milestones: Milestone[]
  phases: Phase[]
  dependencies: DependencyPath[]
  criticalPath: string[]
}

export interface Milestone {
  id: string
  name: string
  date: Date
  kpiTargets: number[]
  dependencies: string[]
}

export interface Phase {
  id: string
  name: string
  startDate: Date
  endDate: Date
  actions: string[]
  budget: number
  expectedOutcome: string
}

export interface DependencyPath {
  path: string[]
  totalDuration: number
  slack: number // days
  isCritical: boolean
}

export class AdvancedSimulationEngine {
  
  async runAdvancedSimulation(
    scenarios: Scenario[],
    monteCarlo: MonteCarloSettings,
    sensitivity: SensitivityAnalysis,
    timeHorizon: TimeRange
  ): Promise<SimulationResult> {
    
    console.log('🚀 Starting Advanced Simulation Analysis...')
    
    // Run scenario analysis
    const scenarioResults = await this.analyzeScenarios(scenarios)
    
    // Run Monte Carlo simulation
    const monteCarloResults = await this.runMonteCarlo(scenarios, monteCarlo)
    
    // Run sensitivity analysis
    const sensitivityResults = await this.runSensitivityAnalysis(scenarios, sensitivity)
    
    // Run optimization
    const optimizationResults = await this.optimizeActionSequence(scenarios)
    
    // Run risk analysis
    const riskAnalysis = await this.analyzeRisks(scenarios)
    
    // Run timeline analysis
    const timelineAnalysis = await this.analyzeTimeline(scenarios, timeHorizon)
    
    return {
      scenarioResults,
      monteCarlo: monteCarloResults,
      sensitivity: sensitivityResults,
      optimization: optimizationResults,
      risk: riskAnalysis,
      timeline: timelineAnalysis
    }
  }
  
  private async analyzeScenarios(scenarios: Scenario[]): Promise<ScenarioResult[]> {
    const results: ScenarioResult[] = []
    
    for (const scenario of scenarios) {
      console.log(`📊 Analyzing scenario: ${scenario.name}`)
      
      // Get all actions and their KPI impacts
      const actionIds = scenario.actions.map(a => a.actionId)
      const actions = await prisma.action.findMany({
        where: { id: { in: actionIds } },
        include: {
          actionKpis: {
            include: {
              kpi: {
                include: {
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
      
      let totalCost = 0
      let totalBenefit = 0
      const kpiImpacts: KPIImpact[] = []
      
      for (const scenarioAction of scenario.actions) {
        const action = actions.find(a => a.id === scenarioAction.actionId)
        if (!action) continue
        
        // Calculate cost (simplified)
        const actionCost = this.calculateActionCost(scenarioAction)
        totalCost += actionCost
        
        // Calculate KPI impacts
        for (const actionKpi of action.actionKpis) {
          const kpi = actionKpi.kpi
          const currentValues = kpi.kpiValues
          
          if (currentValues.length > 0) {
            const avgCurrentValue = currentValues.reduce((sum, kv) => sum + kv.value, 0) / currentValues.length
            const impactMultiplier = (scenarioAction.completionRate / 100) * (scenarioAction.successProbability / 100)
            const baseImpact = (actionKpi.impactScore || 0.1) * impactMultiplier
            
            const projectedValue = avgCurrentValue * (1 + baseImpact)
            const improvement = projectedValue - avgCurrentValue
            const improvementPercent = (improvement / avgCurrentValue) * 100
            
            // Calculate time to impact based on action duration
            const timeToImpact = scenarioAction.startDelay + (scenarioAction.duration * 0.7) // 70% through action
            
            kpiImpacts.push({
              kpiId: kpi.id,
              kpiNumber: kpi.number,
              kpiDescription: kpi.description,
              currentValue: avgCurrentValue,
              projectedValue,
              improvement,
              improvementPercent,
              confidence: scenarioAction.successProbability,
              timeToImpact
            })
            
            // Add to total benefit (simplified monetary conversion)
            totalBenefit += improvement * 1000 // Simple conversion factor
          }
        }
      }
      
      const roi = totalCost > 0 ? ((totalBenefit - totalCost) / totalCost) * 100 : 0
      const duration = Math.max(...scenario.actions.map(a => a.startDelay + a.duration))
      const riskScore = this.calculateScenarioRisk(scenario)
      
      results.push({
        scenarioId: scenario.id,
        probability: scenario.probability,
        kpiImpacts,
        totalCost,
        totalBenefit,
        roi,
        duration,
        riskScore
      })
    }
    
    return results
  }
  
  private async runMonteCarlo(scenarios: Scenario[], settings: MonteCarloSettings): Promise<MonteCarloResult> {
    const roiResults: number[] = []
    
    for (let i = 0; i < settings.iterations; i++) {
      // Apply random variation to scenario parameters
      const variationFactor = (Math.random() - 0.5) * 2 * (settings.variabilityFactor / 100)
      
      let iterationROI = 0
      for (const scenario of scenarios) {
        // Apply variation to completion rates and success probabilities
        const scenarioROI = this.calculateVariedROI(scenario, variationFactor)
        iterationROI += scenarioROI * (scenario.probability / 100)
      }
      
      roiResults.push(iterationROI)
    }
    
    // Calculate statistics
    roiResults.sort((a, b) => a - b)
    const mean = roiResults.reduce((sum, roi) => sum + roi, 0) / roiResults.length
    const median = roiResults[Math.floor(roiResults.length / 2)]
    
    const variance = roiResults.reduce((sum, roi) => sum + Math.pow(roi - mean, 2), 0) / roiResults.length
    const standardDeviation = Math.sqrt(variance)
    
    // Calculate confidence intervals
    const confidenceIntervals = [0.90, 0.95, 0.99].map(level => {
      const alpha = 1 - level
      const lowerIndex = Math.floor(roiResults.length * (alpha / 2))
      const upperIndex = Math.floor(roiResults.length * (1 - alpha / 2))
      
      return {
        lower: roiResults[lowerIndex],
        upper: roiResults[upperIndex],
        level
      }
    })
    
    // Create probability distribution (histogram)
    const bins = 20
    const minROI = Math.min(...roiResults)
    const maxROI = Math.max(...roiResults)
    const binWidth = (maxROI - minROI) / bins
    
    const probabilityDistribution = []
    for (let i = 0; i < bins; i++) {
      const binStart = minROI + i * binWidth
      const binEnd = binStart + binWidth
      const count = roiResults.filter(roi => roi >= binStart && roi < binEnd).length
      
      probabilityDistribution.push({
        value: binStart + binWidth / 2,
        probability: count / roiResults.length
      })
    }
    
    return {
      iterations: settings.iterations,
      meanROI: mean,
      medianROI: median,
      standardDeviation,
      confidenceIntervals,
      probabilityDistribution
    }
  }
  
  private async runSensitivityAnalysis(scenarios: Scenario[], settings: SensitivityAnalysis): Promise<SensitivityResult> {
    const parameters: ParameterSensitivity[] = []
    
    for (const param of settings.parameters) {
      const impacts: number[] = []
      const baselineROI = await this.calculateBaselineROI(scenarios)
      
      for (const variation of param.variations) {
        const modifiedScenarios = this.applyParameterVariation(scenarios, param.name, variation)
        const modifiedROI = await this.calculateBaselineROI(modifiedScenarios)
        const impact = ((modifiedROI - baselineROI) / baselineROI) * 100
        impacts.push(impact)
      }
      
      // Calculate elasticity (% change in output / % change in input)
      const avgVariation = param.variations.reduce((sum, v) => sum + Math.abs(v), 0) / param.variations.length
      const avgImpact = impacts.reduce((sum, i) => sum + Math.abs(i), 0) / impacts.length
      const elasticity = avgImpact / avgVariation
      
      // Calculate correlation
      const correlation = this.calculateCorrelation(param.variations, impacts)
      
      parameters.push({
        parameter: param.name,
        elasticity,
        correlation,
        impact: impacts
      })
    }
    
    // Sort by elasticity to find most/least sensitive
    const sortedByElasticity = [...parameters].sort((a, b) => b.elasticity - a.elasticity)
    
    return {
      parameters,
      mostSensitive: sortedByElasticity.slice(0, 3).map(p => p.parameter),
      leastSensitive: sortedByElasticity.slice(-3).map(p => p.parameter)
    }
  }
  
  private async optimizeActionSequence(scenarios: Scenario[]): Promise<OptimizationResult> {
    // Get all unique actions from scenarios
    const allActions = new Map<string, ScenarioAction>()
    scenarios.forEach(scenario => {
      scenario.actions.forEach(action => {
        if (!allActions.has(action.actionId) || 
            allActions.get(action.actionId)!.completionRate < action.completionRate) {
          allActions.set(action.actionId, action)
        }
      })
    })
    
    // Calculate action priorities based on impact vs effort
    const actionData = await prisma.action.findMany({
      where: { id: { in: Array.from(allActions.keys()) } },
      include: {
        actionKpis: {
          include: {
            kpi: {
              include: {
                kpiValues: { where: { period: '2024-Q4' } }
              }
            }
          }
        }
      }
    })
    
    const prioritizedActions = actionData.map(action => {
      const scenarioAction = allActions.get(action.id)!
      const impact = this.calculateActionImpact(action, scenarioAction)
      const effort = scenarioAction.resourceRequirement * scenarioAction.duration
      const priority = effort > 0 ? impact / effort : impact
      
      return {
        actionId: action.id,
        priority,
        startDate: new Date(Date.now() + scenarioAction.startDelay * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + (scenarioAction.startDelay + scenarioAction.duration) * 24 * 60 * 60 * 1000),
        resourceAllocation: scenarioAction.resourceRequirement,
        expectedImpact: impact
      }
    }).sort((a, b) => b.priority - a.priority)
    
    // Create optimal sequence
    const optimalSequence: ActionSequence = {
      actions: prioritizedActions,
      totalDuration: Math.max(...prioritizedActions.map(a => 
        (a.endDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
      )),
      totalCost: prioritizedActions.reduce((sum, a) => sum + a.resourceAllocation * 1000, 0),
      expectedBenefit: prioritizedActions.reduce((sum, a) => sum + a.expectedImpact * 1000, 0),
      riskLevel: 'medium'
    }
    
    // Generate alternative sequences (different orderings)
    const alternativeSequences = this.generateAlternativeSequences(prioritizedActions)
    
    // Resource optimization
    const resourceOptimization = this.optimizeResources(prioritizedActions)
    
    // Time optimization
    const timeOptimization = this.optimizeTime(prioritizedActions)
    
    return {
      optimalSequence,
      alternativeSequences,
      resourceOptimization,
      timeOptimization
    }
  }
  
  private async analyzeRisks(scenarios: Scenario[]): Promise<RiskAnalysis> {
    const riskFactors: RiskFactor[] = [
      {
        id: 'execution_delay',
        name: 'Uygulama Gecikmeleri',
        category: 'execution',
        probability: 30,
        impact: 60,
        severity: 'medium',
        mitigation: 'Proje yönetimi araçları ve düzenli takip'
      },
      {
        id: 'resource_shortage',
        name: 'Kaynak Yetersizliği',
        category: 'resource',
        probability: 25,
        impact: 70,
        severity: 'high',
        mitigation: 'Kaynak planlaması ve yedek kaynaklar'
      },
      {
        id: 'market_changes',
        name: 'Pazar Değişiklikleri',
        category: 'market',
        probability: 40,
        impact: 50,
        severity: 'medium',
        mitigation: 'Esnek stratejiler ve hızlı adaptasyon'
      },
      {
        id: 'technical_issues',
        name: 'Teknik Sorunlar',
        category: 'technical',
        probability: 20,
        impact: 80,
        severity: 'high',
        mitigation: 'Teknoloji altyapısı güçlendirme'
      }
    ]
    
    const mitigationStrategies: MitigationStrategy[] = riskFactors.map(risk => ({
      riskFactorId: risk.id,
      strategy: risk.mitigation,
      cost: risk.impact * 100,
      effectiveness: 70,
      timeToImplement: 30
    }))
    
    const contingencyPlans: ContingencyPlan[] = [
      {
        trigger: 'Kritik eylem %50+ gecikme',
        actions: ['Kaynak artırımı', 'Alternatif yaklaşım', 'Scope azaltma'],
        cost: 50000,
        timeframe: 15
      },
      {
        trigger: 'Bütçe %20+ aşım',
        actions: ['Öncelik yeniden değerlendirme', 'Fazlar arası kaynak transferi'],
        cost: 0,
        timeframe: 7
      }
    ]
    
    const overallRiskScore = riskFactors.reduce((sum, risk) => 
      sum + (risk.probability * risk.impact / 100), 0
    ) / riskFactors.length
    
    return {
      overallRiskScore,
      riskFactors,
      mitigationStrategies,
      contingencyPlans
    }
  }
  
  private async analyzeTimeline(scenarios: Scenario[], timeHorizon: TimeRange): Promise<TimelineAnalysis> {
    // Create milestones based on scenario phases
    const milestones: Milestone[] = [
      {
        id: 'phase1_complete',
        name: 'Faz 1 Tamamlanması',
        date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        kpiTargets: [5, 10, 15],
        dependencies: []
      },
      {
        id: 'phase2_complete',
        name: 'Faz 2 Tamamlanması',
        date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        kpiTargets: [20, 25, 30],
        dependencies: ['phase1_complete']
      }
    ]
    
    const phases: Phase[] = [
      {
        id: 'planning',
        name: 'Planlama',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        actions: [],
        budget: 50000,
        expectedOutcome: 'Detaylı proje planı'
      },
      {
        id: 'implementation',
        name: 'Uygulama',
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000),
        actions: [],
        budget: 200000,
        expectedOutcome: 'Temel eylemlerin tamamlanması'
      }
    ]
    
    const dependencies: DependencyPath[] = []
    const criticalPath = ['planning', 'implementation', 'monitoring']
    
    return {
      milestones,
      phases,
      dependencies,
      criticalPath
    }
  }
  
  // Helper methods
  private calculateActionCost(action: ScenarioAction): number {
    return action.resourceRequirement * action.duration * 1000 // Simplified cost calculation
  }
  
  private calculateScenarioRisk(scenario: Scenario): number {
    const executionRisk = scenario.actions.reduce((sum, action) => 
      sum + (100 - action.successProbability), 0
    ) / scenario.actions.length
    
    const assumptionRisk = scenario.assumptions.reduce((sum, assumption) => 
      sum + (100 - assumption.probability) * Math.abs(assumption.impact) / 100, 0
    ) / scenario.assumptions.length
    
    return (executionRisk + assumptionRisk) / 2
  }
  
  private calculateVariedROI(scenario: Scenario, variationFactor: number): number {
    // Apply variation and calculate ROI for this iteration
    let totalBenefit = 0
    let totalCost = 0
    
    for (const action of scenario.actions) {
      const variedCompletion = Math.max(0, Math.min(100, 
        action.completionRate * (1 + variationFactor)
      ))
      const variedSuccess = Math.max(0, Math.min(100, 
        action.successProbability * (1 + variationFactor * 0.5)
      ))
      
      const benefit = variedCompletion * variedSuccess * 100 // Simplified
      const cost = action.resourceRequirement * action.duration * 10
      
      totalBenefit += benefit
      totalCost += cost
    }
    
    return totalCost > 0 ? ((totalBenefit - totalCost) / totalCost) * 100 : 0
  }
  
  private async calculateBaselineROI(scenarios: Scenario[]): Promise<number> {
    let totalROI = 0
    for (const scenario of scenarios) {
      totalROI += this.calculateVariedROI(scenario, 0) * (scenario.probability / 100)
    }
    return totalROI
  }
  
  private applyParameterVariation(scenarios: Scenario[], paramName: string, variation: number): Scenario[] {
    return scenarios.map(scenario => ({
      ...scenario,
      actions: scenario.actions.map(action => {
        if (paramName === 'completion_rate') {
          return { ...action, completionRate: action.completionRate * (1 + variation / 100) }
        }
        if (paramName === 'success_probability') {
          return { ...action, successProbability: action.successProbability * (1 + variation / 100) }
        }
        return action
      })
    }))
  }
  
  private calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length
    const sumX = x.reduce((a, b) => a + b, 0)
    const sumY = y.reduce((a, b) => a + b, 0)
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0)
    const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0)
    
    const numerator = n * sumXY - sumX * sumY
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY))
    
    return denominator === 0 ? 0 : numerator / denominator
  }
  
  private calculateActionImpact(action: any, scenarioAction: ScenarioAction): number {
    const kpiImpact = action.actionKpis.reduce((sum: number, actionKpi: any) => {
      return sum + (actionKpi.impactScore || 0.1)
    }, 0)
    
    return kpiImpact * (scenarioAction.completionRate / 100) * (scenarioAction.successProbability / 100)
  }
  
  private generateAlternativeSequences(actions: OptimalAction[]): ActionSequence[] {
    // Generate 2-3 alternative sequences with different prioritization strategies
    const alternatives: ActionSequence[] = []
    
    // Time-optimized sequence (shortest first)
    const timeOptimized = [...actions].sort((a, b) => 
      (a.endDate.getTime() - a.startDate.getTime()) - (b.endDate.getTime() - b.startDate.getTime())
    )
    
    alternatives.push({
      actions: timeOptimized,
      totalDuration: Math.max(...timeOptimized.map(a => (a.endDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))),
      totalCost: timeOptimized.reduce((sum, a) => sum + a.resourceAllocation * 1000, 0),
      expectedBenefit: timeOptimized.reduce((sum, a) => sum + a.expectedImpact * 1000, 0),
      riskLevel: 'low'
    })
    
    // Impact-optimized sequence (highest impact first)
    const impactOptimized = [...actions].sort((a, b) => b.expectedImpact - a.expectedImpact)
    
    alternatives.push({
      actions: impactOptimized,
      totalDuration: Math.max(...impactOptimized.map(a => (a.endDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))),
      totalCost: impactOptimized.reduce((sum, a) => sum + a.resourceAllocation * 1000, 0),
      expectedBenefit: impactOptimized.reduce((sum, a) => sum + a.expectedImpact * 1000, 0),
      riskLevel: 'high'
    })
    
    return alternatives
  }
  
  private optimizeResources(actions: OptimalAction[]): ResourceOptimization {
    const totalResourcesNeeded = actions.reduce((sum, action) => sum + action.resourceAllocation, 0)
    const peakResourceUsage = Math.max(...actions.map(action => action.resourceAllocation))
    const resourceEfficiency = totalResourcesNeeded > 0 ? peakResourceUsage / totalResourcesNeeded : 0
    
    const bottlenecks: ResourceBottleneck[] = []
    
    return {
      totalResourcesNeeded,
      peakResourceUsage,
      resourceEfficiency,
      bottlenecks
    }
  }
  
  private optimizeTime(actions: OptimalAction[]): TimeOptimization {
    const criticalPath = actions
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
      .map(action => action.actionId)
    
    const totalDuration = Math.max(...actions.map(a => 
      (a.endDate.getTime() - a.startDate.getTime()) / (24 * 60 * 60 * 1000)
    ))
    
    return {
      criticalPath,
      totalDuration,
      possibleAcceleration: totalDuration * 0.2, // 20% possible acceleration
      accelerationCost: totalDuration * 500 // Cost per day saved
    }
  }
}

export const simulationEngine = new AdvancedSimulationEngine()
