// AI-Powered Simulation Advisor
import { prisma } from '@/lib/prisma'

export interface AIRecommendation {
  id: string
  type: 'optimization' | 'risk_mitigation' | 'alternative_scenario' | 'resource_allocation' | 'timing'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  expectedImpact: number // 0-100
  implementationEffort: number // 0-100
  confidence: number // 0-100
  actions: RecommendedAction[]
  rationale: string
  risks: string[]
  benefits: string[]
}

export interface RecommendedAction {
  actionId: string
  suggestedChanges: {
    completionRate?: number
    startDelay?: number
    duration?: number
    resourceRequirement?: number
    successProbability?: number
  }
  reasoning: string
}

export interface OptimalSequence {
  sequence: ActionPriority[]
  totalDuration: number
  totalCost: number
  expectedROI: number
  riskLevel: 'low' | 'medium' | 'high'
  reasoning: string
}

export interface ActionPriority {
  actionId: string
  actionCode: string
  priority: number
  reasoning: string
  dependencies: string[]
  criticalPath: boolean
}

export interface ResourceAllocation {
  timeframe: string
  allocations: ResourceSlot[]
  conflicts: ResourceConflict[]
  optimization: ResourceOptimization
}

export interface ResourceSlot {
  actionId: string
  actionCode: string
  startDate: Date
  endDate: Date
  resourceNeed: number
  priority: number
}

export interface ResourceConflict {
  timeframe: string
  conflictingActions: string[]
  totalDemand: number
  availableCapacity: number
  resolution: string
}

export interface ResourceOptimization {
  currentEfficiency: number
  optimizedEfficiency: number
  recommendations: string[]
  potentialSavings: number
}

export interface AlternativeScenario {
  id: string
  name: string
  description: string
  rationale: string
  keyDifferences: string[]
  expectedOutcome: ScenarioOutcome
  riskProfile: RiskProfile
}

export interface ScenarioOutcome {
  expectedROI: number
  duration: number
  successProbability: number
  kpiImpacts: {
    kpiId: string
    expectedImprovement: number
  }[]
}

export interface RiskProfile {
  overallRisk: number
  keyRisks: {
    risk: string
    probability: number
    impact: number
    mitigation: string
  }[]
}

export class AISimulationAdvisor {
  
  async generateRecommendations(
    scenarios: any[],
    simulationResults: any,
    currentActions: any[]
  ): Promise<AIRecommendation[]> {
    
    console.log('🤖 Generating AI recommendations...')
    
    const recommendations: AIRecommendation[] = []
    
    // 1. Optimization recommendations
    const optimizationRecs = await this.generateOptimizationRecommendations(scenarios, simulationResults)
    recommendations.push(...optimizationRecs)
    
    // 2. Risk mitigation recommendations
    const riskRecs = await this.generateRiskMitigationRecommendations(simulationResults)
    recommendations.push(...riskRecs)
    
    // 3. Resource allocation recommendations
    const resourceRecs = await this.generateResourceRecommendations(scenarios)
    recommendations.push(...resourceRecs)
    
    // 4. Timing recommendations
    const timingRecs = await this.generateTimingRecommendations(scenarios)
    recommendations.push(...timingRecs)
    
    // Sort by impact and priority
    return recommendations.sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 }
      const aScore = (priorityWeight[a.priority] * 0.3) + (a.expectedImpact * 0.7)
      const bScore = (priorityWeight[b.priority] * 0.3) + (b.expectedImpact * 0.7)
      return bScore - aScore
    })
  }
  
  async generateOptimalSequence(scenarios: any[]): Promise<OptimalSequence> {
    console.log('🎯 Generating optimal action sequence...')
    
    // Collect all actions from scenarios
    const actionMap = new Map<string, any>()
    scenarios.forEach(scenario => {
      scenario.actions.forEach((action: any) => {
        if (!actionMap.has(action.actionId) || 
            actionMap.get(action.actionId).completionRate < action.completionRate) {
          actionMap.set(action.actionId, action)
        }
      })
    })
    
    // Get action details from database
    const actionIds = Array.from(actionMap.keys())
    const dbActions = await prisma.action.findMany({
      where: { id: { in: actionIds } },
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
    
    // Calculate priorities using AI-driven scoring
    const actionPriorities: ActionPriority[] = dbActions.map(dbAction => {
      const scenarioAction = actionMap.get(dbAction.id)
      const priority = this.calculateActionPriority(dbAction, scenarioAction)
      
      return {
        actionId: dbAction.id,
        actionCode: dbAction.code,
        priority,
        reasoning: this.generatePriorityReasoning(dbAction, scenarioAction, priority),
        dependencies: this.identifyDependencies(dbAction, dbActions),
        criticalPath: priority > 0.8
      }
    }).sort((a, b) => b.priority - a.priority)
    
    // Calculate sequence metrics
    const totalDuration = this.calculateSequenceDuration(actionPriorities, actionMap)
    const totalCost = this.calculateSequenceCost(actionPriorities, actionMap)
    const expectedROI = this.calculateSequenceROI(actionPriorities, dbActions)
    const riskLevel = this.assessSequenceRisk(actionPriorities, actionMap)
    
    return {
      sequence: actionPriorities,
      totalDuration,
      totalCost,
      expectedROI,
      riskLevel,
      reasoning: this.generateSequenceReasoning(actionPriorities, expectedROI, riskLevel)
    }
  }
  
  async optimizeResourceAllocation(scenarios: any[]): Promise<ResourceAllocation> {
    console.log('📊 Optimizing resource allocation...')
    
    const slots: ResourceSlot[] = []
    const conflicts: ResourceConflict[] = []
    
    // Create time slots for all actions
    scenarios.forEach(scenario => {
      scenario.actions.forEach((action: any) => {
        const startDate = new Date(Date.now() + action.startDelay * 24 * 60 * 60 * 1000)
        const endDate = new Date(startDate.getTime() + action.duration * 24 * 60 * 60 * 1000)
        
        slots.push({
          actionId: action.actionId,
          actionCode: action.actionCode,
          startDate,
          endDate,
          resourceNeed: action.resourceRequirement,
          priority: this.calculateActionPriority(action, action)
        })
      })
    })
    
    // Detect resource conflicts
    const timeframes = this.generateTimeframes(slots)
    timeframes.forEach(timeframe => {
      const overlappingActions = this.findOverlappingActions(slots, timeframe)
      const totalDemand = overlappingActions.reduce((sum, action) => sum + action.resourceNeed, 0)
      const availableCapacity = 100 // Simplified: 100% capacity
      
      if (totalDemand > availableCapacity) {
        conflicts.push({
          timeframe: timeframe.toISOString(),
          conflictingActions: overlappingActions.map(a => a.actionCode),
          totalDemand,
          availableCapacity,
          resolution: this.generateConflictResolution(overlappingActions, totalDemand, availableCapacity)
        })
      }
    })
    
    // Generate optimization recommendations
    const optimization: ResourceOptimization = {
      currentEfficiency: this.calculateCurrentEfficiency(slots, conflicts),
      optimizedEfficiency: this.calculateOptimizedEfficiency(slots, conflicts),
      recommendations: this.generateResourceRecommendationsList(conflicts),
      potentialSavings: this.calculatePotentialSavings(slots, conflicts)
    }
    
    return {
      timeframe: `${new Date().toISOString()} - ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()}`,
      allocations: slots,
      conflicts,
      optimization
    }
  }
  
  async generateAlternativeScenarios(
    baseScenarios: any[],
    simulationResults: any
  ): Promise<AlternativeScenario[]> {
    console.log('🔄 Generating alternative scenarios...')
    
    const alternatives: AlternativeScenario[] = []
    
    // Conservative scenario (lower risk, moderate returns)
    alternatives.push(await this.createConservativeScenario(baseScenarios))
    
    // Aggressive scenario (higher risk, higher potential returns)
    alternatives.push(await this.createAggressiveScenario(baseScenarios))
    
    // Balanced scenario (optimized for best risk-return ratio)
    alternatives.push(await this.createBalancedScenario(baseScenarios))
    
    // Resource-constrained scenario
    alternatives.push(await this.createResourceConstrainedScenario(baseScenarios))
    
    return alternatives
  }
  
  // Private helper methods
  private async generateOptimizationRecommendations(
    scenarios: any[], 
    results: any
  ): Promise<AIRecommendation[]> {
    const recommendations: AIRecommendation[] = []
    
    // Analyze Monte Carlo results for optimization opportunities
    if (results.monteCarlo && results.monteCarlo.standardDeviation > 20) {
      recommendations.push({
        id: `opt_variance_${Date.now()}`,
        type: 'optimization',
        priority: 'high',
        title: 'Varyans Azaltma Önerisi',
        description: 'Monte Carlo analizi yüksek varyans gösteriyor. Sonuç belirsizliğini azaltmak için eylem parametrelerini optimize edebiliriz.',
        expectedImpact: 75,
        implementationEffort: 40,
        confidence: 85,
        actions: this.generateVarianceReductionActions(scenarios),
        rationale: 'Yüksek standart sapma (σ=' + results.monteCarlo.standardDeviation.toFixed(2) + ') risk seviyesini artırıyor.',
        risks: ['Potansiyel getiri azalması', 'Uygulama karmaşıklığı'],
        benefits: ['Daha öngörülebilir sonuçlar', 'Risk azaltımı', 'İyileştirilmiş güvenilirlik']
      })
    }
    
    // Analyze for action sequence optimization
    if (scenarios.length > 0) {
      const totalDuration = Math.max(...scenarios.flatMap((s: any) => 
        s.actions.map((a: any) => a.startDelay + a.duration)
      ))
      
      if (totalDuration > 180) { // More than 6 months
        recommendations.push({
          id: `opt_timeline_${Date.now()}`,
          type: 'optimization',
          priority: 'medium',
          title: 'Zaman Optimizasyonu',
          description: 'Eylem sıralama ve paralel yürütme ile toplam proje süresini %20-30 azaltabilirsiniz.',
          expectedImpact: 60,
          implementationEffort: 30,
          confidence: 80,
          actions: this.generateTimelineOptimizationActions(scenarios),
          rationale: `Mevcut proje süresi ${totalDuration} gün. Paralel yürütme fırsatları mevcut.`,
          risks: ['Kaynak çakışması', 'Koordinasyon zorluğu'],
          benefits: ['Daha hızlı sonuçlar', 'Kaynak verimliliği', 'Rekabet avantajı']
        })
      }
    }
    
    return recommendations
  }
  
  private async generateRiskMitigationRecommendations(results: any): Promise<AIRecommendation[]> {
    const recommendations: AIRecommendation[] = []
    
    if (results.risk && results.risk.overallRiskScore > 70) {
      recommendations.push({
        id: `risk_high_${Date.now()}`,
        type: 'risk_mitigation',
        priority: 'high',
        title: 'Yüksek Risk Azaltımı',
        description: 'Genel risk skoru çok yüksek. Acil risk azaltım eylemleri önerilir.',
        expectedImpact: 85,
        implementationEffort: 60,
        confidence: 90,
        actions: this.generateRiskMitigationActions(results.risk.riskFactors),
        rationale: `Risk skoru ${results.risk.overallRiskScore.toFixed(0)}. Kabul edilebilir seviye <50.`,
        risks: ['Maliyet artışı', 'Süre uzaması'],
        benefits: ['Güvenli uygulama', 'Tahmin edilebilir sonuçlar', 'Stakeholder güveni']
      })
    }
    
    return recommendations
  }
  
  private async generateResourceRecommendations(scenarios: any[]): Promise<AIRecommendation[]> {
    const recommendations: AIRecommendation[] = []
    
    // Analyze resource distribution
    const totalResourceNeed = scenarios.flatMap((s: any) => s.actions)
      .reduce((sum: number, a: any) => sum + a.resourceRequirement, 0)
    
    const averageResourceNeed = totalResourceNeed / scenarios.flatMap((s: any) => s.actions).length
    
    if (averageResourceNeed > 70) {
      recommendations.push({
        id: `resource_load_${Date.now()}`,
        type: 'resource_allocation',
        priority: 'medium',
        title: 'Kaynak Yükü Dengeleme',
        description: 'Ortalama kaynak kullanımı yüksek. Kaynak dağılımını optimize ederek verimliliği artırabilirsiniz.',
        expectedImpact: 55,
        implementationEffort: 45,
        confidence: 75,
        actions: this.generateResourceBalancingActions(scenarios),
        rationale: `Ortalama kaynak ihtiyacı %${averageResourceNeed.toFixed(0)}. Optimal seviye <%60.`,
        risks: ['Gecikme riski', 'Kalite etkisi'],
        benefits: ['Sürdürülebilir kaynak kullanımı', 'Maliyet optimizasyonu', 'Esneklik']
      })
    }
    
    return recommendations
  }
  
  private async generateTimingRecommendations(scenarios: any[]): Promise<AIRecommendation[]> {
    const recommendations: AIRecommendation[] = []
    
    // Analyze start delays
    const actionsWithDelay = scenarios.flatMap((s: any) => s.actions)
      .filter((a: any) => a.startDelay > 30)
    
    if (actionsWithDelay.length > 0) {
      recommendations.push({
        id: `timing_delay_${Date.now()}`,
        type: 'timing',
        priority: 'low',
        title: 'Başlama Zamanı Optimizasyonu',
        description: 'Bazı eylemlerin başlama gecikmesi fazla. Erken başlama ile genel süreyi kısaltabilirsiniz.',
        expectedImpact: 40,
        implementationEffort: 20,
        confidence: 70,
        actions: this.generateTimingOptimizationActions(actionsWithDelay),
        rationale: `${actionsWithDelay.length} eylem 30+ gün gecikme ile başlıyor.`,
        risks: ['Hazırlık eksikliği', 'Koordinasyon sorunları'],
        benefits: ['Hızlı başlama', 'Momentum kazanma', 'Erken değer elde etme']
      })
    }
    
    return recommendations
  }
  
  private calculateActionPriority(dbAction: any, scenarioAction: any): number {
    let priority = 0
    
    // Impact score (40% weight)
    const kpiImpactScore = dbAction.actionKpis?.reduce((sum: number, ak: any) => 
      sum + (ak.impactScore || 0.1), 0
    ) || 0.1
    priority += (kpiImpactScore / 2) * 0.4
    
    // Success probability (30% weight)
    priority += (scenarioAction.successProbability / 100) * 0.3
    
    // Resource efficiency (20% weight)
    const resourceEfficiency = scenarioAction.resourceRequirement > 0 ? 
      (scenarioAction.completionRate / scenarioAction.resourceRequirement) : 1
    priority += Math.min(1, resourceEfficiency / 2) * 0.2
    
    // Duration efficiency (10% weight)
    const durationEfficiency = scenarioAction.duration > 0 ? 
      Math.min(1, 60 / scenarioAction.duration) : 1
    priority += durationEfficiency * 0.1
    
    return Math.min(1, priority)
  }
  
  private generatePriorityReasoning(dbAction: any, scenarioAction: any, priority: number): string {
    const reasons = []
    
    if (priority > 0.8) {
      reasons.push('Yüksek KPI etkisi')
    }
    if (scenarioAction.successProbability > 85) {
      reasons.push('Yüksek başarı olasılığı')
    }
    if (scenarioAction.resourceRequirement < 40) {
      reasons.push('Düşük kaynak ihtiyacı')
    }
    if (scenarioAction.duration < 30) {
      reasons.push('Kısa uygulama süresi')
    }
    
    return reasons.length > 0 ? reasons.join(', ') : 'Orta seviye öncelik'
  }
  
  private identifyDependencies(action: any, allActions: any[]): string[] {
    // Simplified dependency identification based on strategic targets
    return allActions
      .filter(a => a.id !== action.id && a.strategicTargetId === action.strategicTargetId)
      .slice(0, 2) // Max 2 dependencies
      .map(a => a.id)
  }
  
  private calculateSequenceDuration(priorities: ActionPriority[], actionMap: Map<string, any>): number {
    let maxDuration = 0
    let currentTime = 0
    
    priorities.forEach(action => {
      const scenarioAction = actionMap.get(action.actionId)
      if (scenarioAction) {
        const startTime = Math.max(currentTime, scenarioAction.startDelay)
        const endTime = startTime + scenarioAction.duration
        maxDuration = Math.max(maxDuration, endTime)
        currentTime = action.criticalPath ? endTime : currentTime
      }
    })
    
    return maxDuration
  }
  
  private calculateSequenceCost(priorities: ActionPriority[], actionMap: Map<string, any>): number {
    return priorities.reduce((total, action) => {
      const scenarioAction = actionMap.get(action.actionId)
      return total + (scenarioAction ? scenarioAction.resourceRequirement * 1000 : 0)
    }, 0)
  }
  
  private calculateSequenceROI(priorities: ActionPriority[], dbActions: any[]): number {
    let totalExpectedBenefit = 0
    
    priorities.forEach(action => {
      const dbAction = dbActions.find(a => a.id === action.actionId)
      if (dbAction) {
        const kpiImpact = dbAction.actionKpis?.reduce((sum: number, ak: any) => 
          sum + (ak.impactScore || 0.1), 0
        ) || 0.1
        totalExpectedBenefit += kpiImpact * action.priority * 1000
      }
    })
    
    const totalCost = priorities.length * 500 // Simplified cost
    return totalCost > 0 ? ((totalExpectedBenefit - totalCost) / totalCost) * 100 : 0
  }
  
  private assessSequenceRisk(priorities: ActionPriority[], actionMap: Map<string, any>): 'low' | 'medium' | 'high' {
    const avgSuccessProbability = priorities.reduce((sum, action) => {
      const scenarioAction = actionMap.get(action.actionId)
      return sum + (scenarioAction?.successProbability || 50)
    }, 0) / priorities.length
    
    if (avgSuccessProbability > 80) return 'low'
    if (avgSuccessProbability > 60) return 'medium'
    return 'high'
  }
  
  private generateSequenceReasoning(priorities: ActionPriority[], roi: number, risk: string): string {
    return `Bu sıralama ${priorities.length} eylemi öncelik skorlarına göre düzenler. ` +
           `Beklenen ROI %${roi.toFixed(1)}, risk seviyesi ${risk}. ` +
           `${priorities.filter(p => p.criticalPath).length} eylem kritik yolda yer alıyor.`
  }
  
  // Additional helper methods for creating scenarios and actions
  private generateVarianceReductionActions(scenarios: any[]): RecommendedAction[] {
    return scenarios.flatMap((s: any) => s.actions).slice(0, 3).map((action: any) => ({
      actionId: action.actionId,
      suggestedChanges: {
        successProbability: Math.min(100, action.successProbability + 10),
        resourceRequirement: Math.min(100, action.resourceRequirement + 15)
      },
      reasoning: 'Başarı olasılığını artırarak varyansı azalt'
    }))
  }
  
  private generateTimelineOptimizationActions(scenarios: any[]): RecommendedAction[] {
    return scenarios.flatMap((s: any) => s.actions).slice(0, 3).map((action: any) => ({
      actionId: action.actionId,
      suggestedChanges: {
        startDelay: Math.max(0, action.startDelay - 15),
        duration: Math.max(7, action.duration * 0.8)
      },
      reasoning: 'Paralel yürütme ve hızlandırma ile süre optimizasyonu'
    }))
  }
  
  private generateRiskMitigationActions(riskFactors: any[]): RecommendedAction[] {
    // Simplified: Return empty array or generate based on risk factors
    return []
  }
  
  private generateResourceBalancingActions(scenarios: any[]): RecommendedAction[] {
    return scenarios.flatMap((s: any) => s.actions)
      .filter((a: any) => a.resourceRequirement > 70)
      .slice(0, 3)
      .map((action: any) => ({
        actionId: action.actionId,
        suggestedChanges: {
          resourceRequirement: action.resourceRequirement * 0.8,
          duration: action.duration * 1.2
        },
        reasoning: 'Kaynak yükünü azaltmak için süreyi uzat'
      }))
  }
  
  private generateTimingOptimizationActions(delayedActions: any[]): RecommendedAction[] {
    return delayedActions.slice(0, 3).map((action: any) => ({
      actionId: action.actionId,
      suggestedChanges: {
        startDelay: Math.max(0, action.startDelay - 20)
      },
      reasoning: 'Erken başlama ile genel süreyi kısalt'
    }))
  }
  
  private async createConservativeScenario(baseScenarios: any[]): Promise<AlternativeScenario> {
    return {
      id: `conservative_${Date.now()}`,
      name: 'Muhafazakar Senaryo',
      description: 'Düşük risk, orta getiri odaklı muhafazakar yaklaşım',
      rationale: 'Risk minimizasyonu ile güvenli ve öngörülebilir sonuçlar hedeflenir',
      keyDifferences: [
        'Başarı olasılıkları %85+ seçildi',
        'Kaynak kullanımı %60 ile sınırlandırıldı',
        'Süre tamponları eklendi'
      ],
      expectedOutcome: {
        expectedROI: 35,
        duration: 240,
        successProbability: 88,
        kpiImpacts: []
      },
      riskProfile: {
        overallRisk: 25,
        keyRisks: [
          {
            risk: 'Düşük getiri',
            probability: 30,
            impact: 40,
            mitigation: 'Performans izleme ve ince ayar'
          }
        ]
      }
    }
  }
  
  private async createAggressiveScenario(baseScenarios: any[]): Promise<AlternativeScenario> {
    return {
      id: `aggressive_${Date.now()}`,
      name: 'Agresif Senaryo',
      description: 'Yüksek risk, yüksek getiri potansiyeli olan agresif yaklaşım',
      rationale: 'Maksimum etki ve hızlı sonuçlar için yüksek risk alınır',
      keyDifferences: [
        'Tamamlanma oranları %95+ hedeflendi',
        'Paralel yürütme maksimize edildi',
        'Kaynak kullanımı %90+ çıkarıldı'
      ],
      expectedOutcome: {
        expectedROI: 85,
        duration: 150,
        successProbability: 65,
        kpiImpacts: []
      },
      riskProfile: {
        overallRisk: 75,
        keyRisks: [
          {
            risk: 'Kaynak tükenmesi',
            probability: 60,
            impact: 80,
            mitigation: 'Acil durum kaynak planı'
          }
        ]
      }
    }
  }
  
  private async createBalancedScenario(baseScenarios: any[]): Promise<AlternativeScenario> {
    return {
      id: `balanced_${Date.now()}`,
      name: 'Dengeli Senaryo',
      description: 'Risk-getiri dengesini optimize eden dengeli yaklaşım',
      rationale: 'En iyi risk-getiri oranı için parametreler optimize edilir',
      keyDifferences: [
        'Risk-getiri oranı optimize edildi',
        'Kritik yol analizi uygulandı',
        'Aşamalı ilerlem planlandı'
      ],
      expectedOutcome: {
        expectedROI: 60,
        duration: 190,
        successProbability: 78,
        kpiImpacts: []
      },
      riskProfile: {
        overallRisk: 45,
        keyRisks: [
          {
            risk: 'Koordinasyon zorluğu',
            probability: 40,
            impact: 50,
            mitigation: 'Güçlü proje yönetimi'
          }
        ]
      }
    }
  }
  
  private async createResourceConstrainedScenario(baseScenarios: any[]): Promise<AlternativeScenario> {
    return {
      id: `resource_constrained_${Date.now()}`,
      name: 'Kaynak Kısıtlı Senaryo',
      description: 'Sınırlı kaynaklarla maksimum etki hedefleyen yaklaşım',
      rationale: 'Mevcut kaynak kısıtları dahilinde en iyi sonucu elde etmek',
      keyDifferences: [
        'Kaynak kullanımı %40 ile sınırlandırıldı',
        'Aşamalı uygulama planlandı',
        'Öncelikli eylemler seçildi'
      ],
      expectedOutcome: {
        expectedROI: 45,
        duration: 280,
        successProbability: 82,
        kpiImpacts: []
      },
      riskProfile: {
        overallRisk: 35,
        keyRisks: [
          {
            risk: 'Süre uzaması',
            probability: 50,
            impact: 40,
            mitigation: 'Esnek zaman planlaması'
          }
        ]
      }
    }
  }
  
  // Resource allocation helper methods
  private generateTimeframes(slots: ResourceSlot[]): Date[] {
    const dates = new Set<number>()
    slots.forEach(slot => {
      dates.add(slot.startDate.getTime())
      dates.add(slot.endDate.getTime())
    })
    return Array.from(dates).map(d => new Date(d)).sort((a, b) => a.getTime() - b.getTime())
  }
  
  private findOverlappingActions(slots: ResourceSlot[], timeframe: Date): ResourceSlot[] {
    return slots.filter(slot => 
      slot.startDate <= timeframe && slot.endDate > timeframe
    )
  }
  
  private generateConflictResolution(
    actions: ResourceSlot[], 
    demand: number, 
    capacity: number
  ): string {
    const excess = demand - capacity
    const excessPercent = (excess / capacity) * 100
    
    if (excessPercent > 50) {
      return 'Kritik: Eylemleri farklı zamanlara kaydır'
    } else if (excessPercent > 25) {
      return 'Orta: Kaynak artırımı veya öncelik değişikliği'
    } else {
      return 'Düşük: İnce ayarlarla çözülebilir'
    }
  }
  
  private calculateCurrentEfficiency(slots: ResourceSlot[], conflicts: ResourceConflict[]): number {
    const totalCapacity = slots.length * 100
    const wastedCapacity = conflicts.reduce((sum, c) => sum + (c.totalDemand - c.availableCapacity), 0)
    return Math.max(0, ((totalCapacity - wastedCapacity) / totalCapacity) * 100)
  }
  
  private calculateOptimizedEfficiency(slots: ResourceSlot[], conflicts: ResourceConflict[]): number {
    // Optimistic estimation assuming conflicts are resolved
    return Math.min(100, this.calculateCurrentEfficiency(slots, conflicts) + (conflicts.length * 10))
  }
  
  private generateResourceRecommendationsList(conflicts: ResourceConflict[]): string[] {
    const recs = []
    if (conflicts.length > 0) {
      recs.push('Çakışan eylemleri yeniden zamanla')
    }
    if (conflicts.some(c => c.totalDemand > c.availableCapacity * 1.5)) {
      recs.push('Kritik periyotlarda ek kaynak sağla')
    }
    recs.push('Öncelik bazlı kaynak tahsisi uygula')
    return recs
  }
  
  private calculatePotentialSavings(slots: ResourceSlot[], conflicts: ResourceConflict[]): number {
    return conflicts.reduce((sum, c) => sum + (c.totalDemand - c.availableCapacity) * 100, 0)
  }
}

export const aiSimulationAdvisor = new AISimulationAdvisor()
