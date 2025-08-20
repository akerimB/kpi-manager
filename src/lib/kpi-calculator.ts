/**
 * Unified KPI Score Calculator
 * Tüm analytics API'lerde tutarlı KPI hesaplama sağlar
 */

export interface KPIValue {
  id: string
  value: number
  targetValue: number | null
  period: string
  factoryId?: string
  weight?: number
  kpi?: {
    id: string
    number: number
    description: string
    unit?: string
    themes?: string
    targetValue?: number | null
    shWeight?: number | null
  }
}

export interface CalculationOptions {
  useWeights?: boolean
  maxScore?: number
  minScore?: number
  handleMissingTarget?: 'skip' | 'default' | 'error'
  defaultTarget?: number
  periodWeighting?: 'equal' | 'recent' | 'custom'
  customPeriodWeights?: Record<string, number>
}

export interface ScoreResult {
  score: number
  achievementRate: number
  isValid: boolean
  weight: number
  contribution: number
  metadata: {
    value: number
    target: number
    period?: string
    factoryId?: string
  }
}

export interface AggregateResult {
  totalScore: number
  weightedScore: number
  achievementRate: number
  validCount: number
  totalCount: number
  contributions: ScoreResult[]
  metadata: {
    calculatedAt: string
    options: CalculationOptions
    periods: string[]
    factories: string[]
  }
}

export class KPICalculator {
  private options: Required<CalculationOptions>

  constructor(options: CalculationOptions = {}) {
    this.options = {
      useWeights: options.useWeights ?? false,
      maxScore: options.maxScore ?? 100,
      minScore: options.minScore ?? 0,
      handleMissingTarget: options.handleMissingTarget ?? 'default',
      defaultTarget: options.defaultTarget ?? 100,
      periodWeighting: options.periodWeighting ?? 'equal',
      customPeriodWeights: options.customPeriodWeights ?? {}
    }
  }

  /**
   * Tek bir KPI değeri için skor hesaplama
   */
  calculateSingleScore(kpiValue: KPIValue): ScoreResult {
    const { value, targetValue, weight: inputWeight, period, factoryId } = kpiValue
    
    // Target değeri kontrolü
    let target = targetValue
    if (target === null || target === undefined) {
      switch (this.options.handleMissingTarget) {
        case 'skip':
          return {
            score: 0,
            achievementRate: 0,
            isValid: false,
            weight: 0,
            contribution: 0,
            metadata: { value, target: 0, period, factoryId }
          }
        case 'default':
          target = this.options.defaultTarget
          break
        case 'error':
          throw new Error(`Missing target value for KPI: ${kpiValue.kpi?.description}`)
      }
    }

    // Sıfır target kontrolü
    if (target <= 0) {
      console.warn(`Invalid target value (${target}) for KPI ${kpiValue.kpi?.number}`)
      target = this.options.defaultTarget
    }

    // Achievement rate hesaplama
    const achievementRate = Math.max(
      this.options.minScore,
      Math.min(this.options.maxScore, (value / target) * 100)
    )

    // Weight hesaplama
    let weight = 1
    if (this.options.useWeights) {
      weight = inputWeight ?? kpiValue.kpi?.shWeight ?? 1
      
      // Period weighting
      if (period && this.options.periodWeighting !== 'equal') {
        const periodWeight = this.getPeriodWeight(period)
        weight *= periodWeight
      }
    }

    const score = achievementRate
    const contribution = score * weight

    return {
      score: Math.round(score * 100) / 100,
      achievementRate: Math.round(achievementRate * 100) / 100,
      isValid: true,
      weight: Math.round(weight * 1000) / 1000,
      contribution: Math.round(contribution * 100) / 100,
      metadata: { value, target, period, factoryId }
    }
  }

  /**
   * Gerçek matematiksel analiz - Ağırlıklı KPI hesaplama
   */
  calculateAggregateScore(kpiValues: KPIValue[]): AggregateResult {
    const contributions: ScoreResult[] = []
    
    // KPI kategorileri ve ağırlıkları
    const kpiCategories = {
      'Teknoloji Transferi': { weight: 0.25, values: [] },
      'Eğitim Katılımı': { weight: 0.20, values: [] },
      'Sürdürülebilirlik': { weight: 0.20, values: [] },
      'İnovasyon': { weight: 0.15, values: [] },
      'Verimlilik': { weight: 0.10, values: [] },
      'Kalite': { weight: 0.10, values: [] }
    }
    
    // Her KPI için hesaplama ve kategorilere dağıtım
    kpiValues.forEach(kpiValue => {
      const result = this.calculateSingleScore(kpiValue)
      contributions.push(result)
      
      if (result.isValid) {
        // KPI'yı kategorilere dağıt
        const description = kpiValue.kpi?.description?.toLowerCase() || ''
        
        if (description.includes('teknoloji') || description.includes('transfer')) {
          kpiCategories['Teknoloji Transferi'].values.push(result)
        } else if (description.includes('eğitim') || description.includes('katılım')) {
          kpiCategories['Eğitim Katılımı'].values.push(result)
        } else if (description.includes('sürdürülebilir') || description.includes('çevre')) {
          kpiCategories['Sürdürülebilirlik'].values.push(result)
        } else if (description.includes('inovasyon') || description.includes('araştırma')) {
          kpiCategories['İnovasyon'].values.push(result)
        } else if (description.includes('verimlilik') || description.includes('üretim')) {
          kpiCategories['Verimlilik'].values.push(result)
        } else {
          kpiCategories['Kalite'].values.push(result)
        }
      }
    })
    
    // Ağırlıklı genel skor hesapla
    let totalWeightedScore = 0
    let totalWeight = 0
    let validCount = 0
    
    Object.entries(kpiCategories).forEach(([category, data]) => {
      if (data.values.length > 0) {
        const categoryAvg = data.values.reduce((sum, result) => sum + result.achievementRate, 0) / data.values.length
        totalWeightedScore += categoryAvg * data.weight
        totalWeight += data.weight
        validCount += data.values.length
      }
    })
    
    const weightedScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0
    const totalScore = validCount > 0 
      ? contributions.filter(c => c.isValid).reduce((sum, c) => sum + c.score, 0) / validCount 
      : 0
    
    const achievementRate = weightedScore
    
    // Unique periods ve factories
    const periods = [...new Set(kpiValues.map(kv => kv.period).filter(Boolean))]
    const factories = [...new Set(kpiValues.map(kv => kv.factoryId).filter(Boolean))]

    return {
      totalScore: Math.round(totalScore * 100) / 100,
      weightedScore: Math.round(weightedScore * 100) / 100,
      achievementRate: Math.round(achievementRate * 100) / 100,
      validCount,
      totalCount: kpiValues.length,
      contributions,
      metadata: {
        calculatedAt: new Date().toISOString(),
        options: this.options,
        periods,
        factories
      }
    }
  }

  /**
   * Dönem ağırlığı hesaplama
   */
  private getPeriodWeight(period: string): number {
    if (this.options.periodWeighting === 'custom' && this.options.customPeriodWeights[period]) {
      return this.options.customPeriodWeights[period]
    }

    if (this.options.periodWeighting === 'recent') {
      // Daha yeni dönemler daha yüksek ağırlık
      const year = parseInt(period.split('-')[0])
      const quarter = parseInt(period.split('-')[1].replace('Q', ''))
      const periodValue = year * 4 + quarter
      const currentYear = new Date().getFullYear()
      const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3)
      const currentPeriodValue = currentYear * 4 + currentQuarter
      
      // Son 2 yıl için ağırlık hesaplama (0.5 - 1.0 arası)
      const ageDiff = Math.max(0, currentPeriodValue - periodValue)
      return Math.max(0.5, 1 - (ageDiff / 8)) // 8 çeyrek = 2 yıl
    }

    return 1 // Equal weighting
  }

  /**
   * Fabrika bazında KPI gruplandırma
   */
  groupByFactory(kpiValues: KPIValue[]): Record<string, AggregateResult> {
    const factoryGroups: Record<string, KPIValue[]> = {}
    
    kpiValues.forEach(kv => {
      const factoryId = kv.factoryId || 'unknown'
      if (!factoryGroups[factoryId]) {
        factoryGroups[factoryId] = []
      }
      factoryGroups[factoryId].push(kv)
    })

    const results: Record<string, AggregateResult> = {}
    Object.entries(factoryGroups).forEach(([factoryId, values]) => {
      results[factoryId] = this.calculateAggregateScore(values)
    })

    return results
  }

  /**
   * Dönem bazında KPI gruplandırma
   */
  groupByPeriod(kpiValues: KPIValue[]): Record<string, AggregateResult> {
    const periodGroups: Record<string, KPIValue[]> = {}
    
    kpiValues.forEach(kv => {
      const period = kv.period || 'unknown'
      if (!periodGroups[period]) {
        periodGroups[period] = []
      }
      periodGroups[period].push(kv)
    })

    const results: Record<string, AggregateResult> = {}
    Object.entries(periodGroups).forEach(([period, values]) => {
      results[period] = this.calculateAggregateScore(values)
    })

    return results
  }

  /**
   * Tema bazında KPI gruplandırma
   */
  groupByTheme(kpiValues: KPIValue[]): Record<string, AggregateResult> {
    const themeGroups: Record<string, KPIValue[]> = {}
    
    kpiValues.forEach(kv => {
      const themes = kv.kpi?.themes?.split(',').map(t => t.trim()).filter(Boolean) || ['OTHER']
      themes.forEach(theme => {
        if (!themeGroups[theme]) {
          themeGroups[theme] = []
        }
        themeGroups[theme].push(kv)
      })
    })

    const results: Record<string, AggregateResult> = {}
    Object.entries(themeGroups).forEach(([theme, values]) => {
      results[theme] = this.calculateAggregateScore(values)
    })

    return results
  }
}

/**
 * Utility functions
 */
export const KPIUtils = {
  /**
   * Basit skor hesaplama (geriye uyumluluk için)
   */
  simpleScore(value: number, target: number): number {
    if (target <= 0) return 0
    return Math.min(100, (value / target) * 100)
  },

  /**
   * Risk seviyesi belirleme
   */
  getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'low'
    if (score >= 60) return 'medium'
    if (score >= 40) return 'high'
    return 'critical'
  },

  /**
   * Performans seviyesi belirleme
   */
  getPerformanceLevel(score: number): 'excellent' | 'good' | 'adequate' | 'needs_improvement' | 'critical' {
    if (score >= 95) return 'excellent'
    if (score >= 85) return 'good'
    if (score >= 70) return 'adequate'
    if (score >= 50) return 'needs_improvement'
    return 'critical'
  },

  /**
   * Trend hesaplama
   */
  calculateTrend(current: number, previous: number): {
    change: number
    direction: 'up' | 'down' | 'stable'
    percentage: number
  } {
    const change = current - previous
    const percentage = previous > 0 ? (change / previous) * 100 : 0
    
    let direction: 'up' | 'down' | 'stable' = 'stable'
    if (Math.abs(change) > 0.5) { // 0.5 punktan fazla değişim
      direction = change > 0 ? 'up' : 'down'
    }

    return {
      change: Math.round(change * 100) / 100,
      direction,
      percentage: Math.round(percentage * 100) / 100
    }
  }
}
