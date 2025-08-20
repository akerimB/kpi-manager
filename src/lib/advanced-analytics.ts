/**
 * Advanced Analytics Module
 * Gelişmiş analitik özellikler: trend analizi, tahmin, anomaly detection, correlation analysis
 */

import { KPICalculator, KPIUtils } from './kpi-calculator'

// Advanced analytics interfaces
export interface TrendAnalysis {
  direction: 'increasing' | 'decreasing' | 'stable' | 'volatile'
  strength: 'strong' | 'moderate' | 'weak'
  confidence: number // 0-100
  slope: number
  r2: number // Coefficient of determination
  periods: number
  projectedNext: number
  seasonality?: SeasonalityPattern
}

export interface SeasonalityPattern {
  detected: boolean
  pattern: 'quarterly' | 'monthly' | 'none'
  strength: number
  peaks: string[] // periods
  troughs: string[] // periods
}

export interface AnomalyDetection {
  anomalies: Array<{
    period: string
    value: number
    expectedValue: number
    deviation: number
    severity: 'low' | 'medium' | 'high' | 'critical'
    type: 'spike' | 'drop' | 'outlier'
  }>
  overallHealth: 'healthy' | 'concerning' | 'critical'
  patternsDetected: string[]
}

export interface CorrelationAnalysis {
  correlations: Array<{
    kpi1: string
    kpi2: string
    coefficient: number
    strength: 'strong' | 'moderate' | 'weak' | 'none'
    direction: 'positive' | 'negative'
    significance: number
  }>
  clusters: Array<{
    name: string
    kpis: string[]
    averageCorrelation: number
  }>
}

export interface Forecast {
  predictions: Array<{
    period: string
    predicted: number
    confidence: {
      low: number
      high: number
    }
    probability: number
  }>
  accuracy: number
  method: 'linear' | 'exponential' | 'seasonal' | 'arima'
  confidence: number
}

export interface PerformanceProfile {
  kpiId: string
  kpiName: string
  currentValue: number
  targetValue: number
  achievementRate: number
  trend: TrendAnalysis
  forecast: Forecast
  anomalies: AnomalyDetection
  benchmarkPosition: 'top_performer' | 'above_average' | 'average' | 'below_average' | 'underperformer'
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  recommendations: string[]
  semantic?: SemanticInsights
}

// Semantic and conceptual insight model
export interface SemanticInsights {
  strategicGoal?: string
  strategicTarget?: string
  themes: string[]
  tags: string[]
  role: 'leading' | 'lagging' | 'balancing'
  relatedKPIs: Array<{ kpiId: string; relation: 'supports' | 'conflicts' | 'correlates'; reason: string }>
  hypotheses: string[]
  actions: string[]
}

/**
 * Advanced Analytics Engine
 */
export class AdvancedAnalyticsEngine {
  /**
   * Trend analizi - linear regression ile
   */
  static analyzeTrend(data: Array<{ period: string; value: number }>): TrendAnalysis {
    if (data.length < 3) {
      return {
        direction: 'stable',
        strength: 'weak',
        confidence: 0,
        slope: 0,
        r2: 0,
        periods: data.length,
        projectedNext: data[data.length - 1]?.value || 0
      }
    }

    // Sort by period
    const sortedData = data.sort((a, b) => a.period.localeCompare(b.period))
    
    // Linear regression
    const n = sortedData.length
    const x = sortedData.map((_, i) => i)
    const y = sortedData.map(d => d.value)
    
    const sumX = x.reduce((a, b) => a + b, 0)
    const sumY = y.reduce((a, b) => a + b, 0)
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    // R-squared calculation
    const yMean = sumY / n
    const totalSumSquares = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0)
    const residualSumSquares = y.reduce((sum, yi, i) => {
      const predicted = slope * x[i] + intercept
      return sum + Math.pow(yi - predicted, 2)
    }, 0)
    
    const r2 = totalSumSquares > 0 ? 1 - (residualSumSquares / totalSumSquares) : 0

    // Direction and strength
    const direction = Math.abs(slope) < 0.1 ? 'stable' : slope > 0 ? 'increasing' : 'decreasing'
    const strength = r2 > 0.7 ? 'strong' : r2 > 0.3 ? 'moderate' : 'weak'
    const confidence = Math.max(0, Math.min(100, r2 * 100))

    // Projection
    const projectedNext = slope * n + intercept

    // Volatility check
    const changes = sortedData.slice(1).map((d, i) => Math.abs(d.value - sortedData[i].value))
    const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length
    const volatility = avgChange / (sumY / n)
    
    const finalDirection = volatility > 0.3 ? 'volatile' : direction

    return {
      direction: finalDirection,
      strength,
      confidence: Math.round(confidence),
      slope,
      r2: Math.round(r2 * 1000) / 1000,
      periods: n,
      projectedNext: Math.round(projectedNext * 100) / 100,
      seasonality: this.detectSeasonality(sortedData)
    }
  }

  /**
   * Seasonality detection
   */
  private static detectSeasonality(data: Array<{ period: string; value: number }>): SeasonalityPattern {
    if (data.length < 8) {
      return { detected: false, pattern: 'none', strength: 0, peaks: [], troughs: [] }
    }

    // Quarterly pattern detection
    const quarterlyGroups: Record<string, number[]> = {}
    const peaks: string[] = []
    const troughs: string[] = []

    data.forEach((d, i) => {
      const quarter = d.period.split('-')[1] // Q1, Q2, Q3, Q4
      if (!quarterlyGroups[quarter]) quarterlyGroups[quarter] = []
      quarterlyGroups[quarter].push(d.value)

      // Peak/trough detection (local maxima/minima)
      if (i > 0 && i < data.length - 1) {
        const prev = data[i - 1].value
        const curr = d.value
        const next = data[i + 1].value

        if (curr > prev && curr > next) {
          peaks.push(d.period)
        } else if (curr < prev && curr < next) {
          troughs.push(d.period)
        }
      }
    })

    // Calculate quarterly averages
    const quarterlyAvgs = Object.entries(quarterlyGroups).map(([quarter, values]) => ({
      quarter,
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      count: values.length
    }))

    // Check if there's a seasonal pattern
    if (quarterlyAvgs.length === 4 && quarterlyAvgs.every(q => q.count >= 2)) {
      const overallAvg = quarterlyAvgs.reduce((sum, q) => sum + q.avg, 0) / 4
      const variations = quarterlyAvgs.map(q => Math.abs(q.avg - overallAvg) / overallAvg)
      const seasonalStrength = variations.reduce((a, b) => a + b, 0) / variations.length

      return {
        detected: seasonalStrength > 0.1,
        pattern: 'quarterly',
        strength: Math.round(seasonalStrength * 100),
        peaks,
        troughs
      }
    }

    return { detected: false, pattern: 'none', strength: 0, peaks, troughs }
  }

  /**
   * Anomaly detection using statistical methods
   */
  static detectAnomalies(data: Array<{ period: string; value: number }>): AnomalyDetection {
    if (data.length < 5) {
      return {
        anomalies: [],
        overallHealth: 'healthy',
        patternsDetected: []
      }
    }

    const values = data.map(d => d.value)
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    const stdDev = Math.sqrt(variance)

    // Z-score threshold for anomalies
    const zThreshold = 2.5 // 2.5 standard deviations

    const anomalies = data
      .map(d => {
        const zScore = Math.abs(d.value - mean) / stdDev
        if (zScore > zThreshold) {
          const deviation = ((d.value - mean) / mean) * 100
          const severity = zScore > 4 ? 'critical' : zScore > 3.5 ? 'high' : zScore > 3 ? 'medium' : 'low'
          const type = d.value > mean + (stdDev * 2) ? 'spike' : d.value < mean - (stdDev * 2) ? 'drop' : 'outlier'

          return {
            period: d.period,
            value: d.value,
            expectedValue: Math.round(mean * 100) / 100,
            deviation: Math.round(deviation * 100) / 100,
            severity: severity as 'low' | 'medium' | 'high' | 'critical',
            type: type as 'spike' | 'drop' | 'outlier'
          }
        }
        return null
      })
      .filter(Boolean) as any[]

    // Determine overall health
    const criticalCount = anomalies.filter(a => a.severity === 'critical').length
    const highCount = anomalies.filter(a => a.severity === 'high').length
    const overallHealth = criticalCount > 0 ? 'critical' : highCount > 1 ? 'concerning' : 'healthy'

    // Pattern detection
    const patternsDetected: string[] = []
    if (anomalies.filter(a => a.type === 'spike').length > 2) {
      patternsDetected.push('recurring_spikes')
    }
    if (anomalies.filter(a => a.type === 'drop').length > 2) {
      patternsDetected.push('recurring_drops')
    }
    if (anomalies.length > data.length * 0.3) {
      patternsDetected.push('high_volatility')
    }

    return { anomalies, overallHealth, patternsDetected }
  }

  /**
   * Correlation analysis between KPIs
   */
  static analyzeCorrelations(kpiData: Record<string, Array<{ period: string; value: number }>>): CorrelationAnalysis {
    const kpiIds = Object.keys(kpiData)
    const correlations: CorrelationAnalysis['correlations'] = []

    // Calculate pairwise correlations
    for (let i = 0; i < kpiIds.length; i++) {
      for (let j = i + 1; j < kpiIds.length; j++) {
        const kpi1 = kpiIds[i]
        const kpi2 = kpiIds[j]
        
        const data1 = kpiData[kpi1]
        const data2 = kpiData[kpi2]
        
        // Find common periods
        const commonPeriods = data1
          .filter(d1 => data2.some(d2 => d2.period === d1.period))
          .map(d1 => ({
            period: d1.period,
            value1: d1.value,
            value2: data2.find(d2 => d2.period === d1.period)!.value
          }))

        if (commonPeriods.length >= 3) {
          const correlation = this.calculateCorrelation(
            commonPeriods.map(cp => cp.value1),
            commonPeriods.map(cp => cp.value2)
          )

          const strength = Math.abs(correlation) > 0.7 ? 'strong' : 
                          Math.abs(correlation) > 0.3 ? 'moderate' : 
                          Math.abs(correlation) > 0.1 ? 'weak' : 'none'

          correlations.push({
            kpi1,
            kpi2,
            coefficient: Math.round(correlation * 1000) / 1000,
            strength,
            direction: correlation > 0 ? 'positive' : 'negative',
            significance: Math.abs(correlation)
          })
        }
      }
    }

    // Cluster KPIs by correlation
    const clusters = this.clusterKPIsByCorrelation(correlations, kpiIds)

    return { correlations, clusters }
  }

  /**
   * Pearson correlation coefficient
   */
  private static calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length
    if (n === 0) return 0

    const sumX = x.reduce((a, b) => a + b, 0)
    const sumY = y.reduce((a, b) => a + b, 0)
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0)

    const numerator = n * sumXY - sumX * sumY
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))

    return denominator === 0 ? 0 : numerator / denominator
  }

  /**
   * Cluster KPIs by correlation
   */
  private static clusterKPIsByCorrelation(correlations: any[], kpiIds: string[]): any[] {
    // Simple clustering based on strong correlations
    const clusters: Array<{ name: string; kpis: string[]; averageCorrelation: number }> = []
    const processedKPIs = new Set<string>()

    correlations
      .filter(c => c.strength === 'strong')
      .forEach(correlation => {
        if (!processedKPIs.has(correlation.kpi1) && !processedKPIs.has(correlation.kpi2)) {
          // Find all KPIs strongly correlated with this pair
          const clusterKPIs = new Set([correlation.kpi1, correlation.kpi2])
          const relatedCorrelations = correlations.filter(c => 
            c.strength === 'strong' && 
            (clusterKPIs.has(c.kpi1) || clusterKPIs.has(c.kpi2))
          )

          relatedCorrelations.forEach(rc => {
            clusterKPIs.add(rc.kpi1)
            clusterKPIs.add(rc.kpi2)
          })

          const avgCorrelation = relatedCorrelations.reduce((sum, rc) => sum + Math.abs(rc.coefficient), 0) / relatedCorrelations.length

          clusters.push({
            name: `Cluster ${clusters.length + 1}`,
            kpis: Array.from(clusterKPIs),
            averageCorrelation: Math.round(avgCorrelation * 1000) / 1000
          })

          clusterKPIs.forEach(kpi => processedKPIs.add(kpi))
        }
      })

    return clusters
  }

  /**
   * Simple forecasting using linear trend
   */
  static generateForecast(data: Array<{ period: string; value: number }>, periodsAhead: number = 4): Forecast {
    if (data.length < 3) {
      return {
        predictions: [],
        accuracy: 0,
        method: 'linear',
        confidence: 0
      }
    }

    const trend = this.analyzeTrend(data)
    const lastValue = data[data.length - 1].value
    const predictions = []

    for (let i = 1; i <= periodsAhead; i++) {
      const predicted = lastValue + (trend.slope * i)
      
      // Simple confidence interval based on historical variance
      const values = data.map(d => d.value)
      const variance = values.reduce((sum, val) => sum + Math.pow(val - (values.reduce((a, b) => a + b, 0) / values.length), 2), 0) / values.length
      const stdDev = Math.sqrt(variance)
      
      const confidenceInterval = stdDev * 1.96 // 95% confidence interval
      
      // Generate future period (simple increment)
      const lastPeriod = data[data.length - 1].period
      const [year, quarter] = lastPeriod.split('-')
      const currentYear = parseInt(year)
      const currentQuarter = parseInt(quarter.replace('Q', ''))
      
      let futureYear = currentYear
      let futureQuarter = currentQuarter + i
      
      while (futureQuarter > 4) {
        futureYear++
        futureQuarter -= 4
      }
      
      const futurePeriod = `${futureYear}-Q${futureQuarter}`

      predictions.push({
        period: futurePeriod,
        predicted: Math.round(predicted * 100) / 100,
        confidence: {
          low: Math.round((predicted - confidenceInterval) * 100) / 100,
          high: Math.round((predicted + confidenceInterval) * 100) / 100
        },
        probability: Math.max(0.1, Math.min(0.9, trend.confidence / 100))
      })
    }

    return {
      predictions,
      accuracy: trend.confidence,
      method: 'linear',
      confidence: trend.confidence
    }
  }

  /**
   * Comprehensive KPI Performance Profile
   */
  static generatePerformanceProfile(
    kpiId: string,
    kpiName: string,
    data: Array<{ period: string; value: number }>,
    targetValue: number,
    benchmarkData?: Array<{ value: number; factoryId: string }>,
    meta?: { description?: string; themes?: string | string[] | null; strategicGoal?: string | null; strategicTarget?: string | null },
    correlationContext?: Array<{ otherId: string; coefficient: number }>
  ): PerformanceProfile {
    const currentValue = data[data.length - 1]?.value || 0
    const achievementRate = targetValue > 0 ? (currentValue / targetValue) * 100 : 0

    const trend = this.analyzeTrend(data)
    const forecast = this.generateForecast(data)
    const anomalies = this.detectAnomalies(data)

    // Benchmark position
    let benchmarkPosition: PerformanceProfile['benchmarkPosition'] = 'average'
    if (benchmarkData && benchmarkData.length > 0) {
      const benchmarkValues = benchmarkData.map(b => b.value).sort((a, b) => b - a)
      const percentile = benchmarkValues.findIndex(v => v <= currentValue) / benchmarkValues.length
      
      benchmarkPosition = percentile <= 0.2 ? 'top_performer' :
                         percentile <= 0.4 ? 'above_average' :
                         percentile <= 0.6 ? 'average' :
                         percentile <= 0.8 ? 'below_average' : 'underperformer'
    }

    // Risk level
    const riskLevel = anomalies.overallHealth === 'critical' ? 'critical' :
                     anomalies.overallHealth === 'concerning' ? 'high' :
                     achievementRate < 50 ? 'high' :
                     achievementRate < 70 ? 'medium' : 'low'

    // Generate recommendations
    const recommendations = this.generateRecommendations({
      achievementRate,
      trend,
      anomalies,
      benchmarkPosition,
      riskLevel
    })

    // Semantic insights
    const semantic = this.buildSemanticInsights(
      { name: kpiName, description: meta?.description, themes: meta?.themes, strategicGoal: meta?.strategicGoal, strategicTarget: meta?.strategicTarget },
      correlationContext
    )

    return {
      kpiId,
      kpiName,
      currentValue,
      targetValue,
      achievementRate: Math.round(achievementRate),
      trend,
      forecast,
      anomalies,
      benchmarkPosition,
      riskLevel,
      recommendations,
      semantic
    }
  }

  /**
   * Generate AI-powered recommendations
   */
  private static generateRecommendations(profile: {
    achievementRate: number
    trend: TrendAnalysis
    anomalies: AnomalyDetection
    benchmarkPosition: PerformanceProfile['benchmarkPosition']
    riskLevel: PerformanceProfile['riskLevel']
  }): string[] {
    const recommendations: string[] = []

    // Achievement rate based recommendations
    if (profile.achievementRate < 50) {
      recommendations.push('Critical: KPI performance is significantly below target. Immediate action required.')
    } else if (profile.achievementRate < 70) {
      recommendations.push('Warning: KPI performance is below expectations. Review and improve processes.')
    } else if (profile.achievementRate > 120) {
      recommendations.push('Excellent: Performance exceeds target. Consider raising targets or sharing best practices.')
    }

    // Trend based recommendations
    if (profile.trend.direction === 'decreasing' && profile.trend.strength === 'strong') {
      recommendations.push('Alert: Strong negative trend detected. Investigate root causes immediately.')
    } else if (profile.trend.direction === 'increasing' && profile.trend.strength === 'strong') {
      recommendations.push('Positive: Strong improvement trend. Maintain current strategies.')
    } else if (profile.trend.direction === 'volatile') {
      recommendations.push('Stability needed: High volatility detected. Focus on process standardization.')
    }

    // Anomaly based recommendations
    if (profile.anomalies.overallHealth === 'critical') {
      recommendations.push('Critical anomalies detected. Conduct thorough investigation and implement controls.')
    } else if (profile.anomalies.patternsDetected.includes('recurring_spikes')) {
      recommendations.push('Recurring spikes identified. Analyze peak periods and optimize resource allocation.')
    }

    // Benchmark based recommendations
    if (profile.benchmarkPosition === 'underperformer') {
      recommendations.push('Below peer performance. Study top performers and implement best practices.')
    } else if (profile.benchmarkPosition === 'top_performer') {
      recommendations.push('Top performer! Document and share successful strategies with other units.')
    }

    // Risk based recommendations
    if (profile.riskLevel === 'critical') {
      recommendations.push('High risk status. Implement immediate monitoring and control measures.')
    }

    return recommendations.length > 0 ? recommendations : ['Performance is within acceptable range. Continue monitoring.']
  }

  /**
   * Build semantic insights using KPI text, themes and correlations
   */
  private static buildSemanticInsights(
    meta: { name?: string; description?: string; themes?: string | string[] | null; strategicGoal?: string | null; strategicTarget?: string | null },
    correlationContext?: Array<{ otherId: string; coefficient: number }>
  ): SemanticInsights {
    const text = `${meta.name ?? ''} ${meta.description ?? ''}`.toLowerCase()
    const themeList = Array.isArray(meta.themes) ? meta.themes : typeof meta.themes === 'string' ? meta.themes.split(',') : []

    const tags = this.extractSemanticTags(text, themeList)
    const role = this.determineRole(tags)

    const relatedKPIs: SemanticInsights['relatedKPIs'] = (correlationContext || [])
      .filter(c => Math.abs(c.coefficient) >= 0.7)
      .map(c => ({
        kpiId: c.otherId,
        relation: c.coefficient > 0 ? 'correlates' : 'conflicts',
        reason: c.coefficient > 0 ? 'Strong positive co-movement (r≥0.7)' : 'Strong inverse relation (r≤-0.7)'
      }))

    const hypotheses: string[] = []
    if (tags.includes('leading') && (tags.includes('delivery') || tags.includes('cycle_time'))) {
      hypotheses.push('Reducing cycle/lead time can cascade improvements into quality and cost KPIs within 1–2 quarters.')
    }
    if (tags.includes('quality') && tags.includes('rework')) {
      hypotheses.push('High rework/defect rates likely drive cost overruns and delivery delays; focus on root-cause elimination (5-Why/DOE).')
    }
    if (tags.includes('sustainability') && tags.includes('energy')) {
      hypotheses.push('Energy intensity improvements may positively affect cost KPIs; consider energy monitoring and load optimization.')
    }
    if (tags.includes('financial') && tags.includes('profit')) {
      hypotheses.push('Profit margin is a lagging KPI; prioritize leading KPIs (throughput, yield, OEE) for earlier impact.')
    }

    const actions: string[] = []
    if (tags.includes('oee') || tags.includes('availability')) actions.push('Implement SMED/TPM to increase availability and performance components of OEE.')
    if (tags.includes('delivery') || tags.includes('on_time')) actions.push('Apply CONWIP/pull systems and WIP caps to stabilize flow and on-time delivery.')
    if (tags.includes('quality')) actions.push('Deploy SPC and Poka‑Yoke at defect hotspots; link CTQ to process parameters.')
    if (tags.includes('digital')) actions.push('Leverage digital tracing/IoT for early anomaly detection and predictive maintenance.')
    if (tags.includes('sustainability')) actions.push('Introduce energy baselining and set per‑unit intensity targets aligned to Scope‑2 reductions.')

    return {
      strategicGoal: meta.strategicGoal ?? undefined,
      strategicTarget: meta.strategicTarget ?? undefined,
      themes: themeList.map(t => t.trim()).filter(Boolean),
      tags,
      role,
      relatedKPIs,
      hypotheses,
      actions
    }
  }

  private static extractSemanticTags(text: string, themes: (string | undefined)[]): string[] {
    const tags: string[] = []
    const add = (t: string) => { if (!tags.includes(t)) tags.push(t) }

    const dict: Record<string, string> = {
      quality: 'defect|rework|ppm|first pass|yield|quality|scrap|ftq|capability',
      delivery: 'on-time|ontime|delivery|lead time|cycle time|flow|throughput|sla',
      cost: 'cost|expense|unit cost|cogs|efficiency|waste|inventory',
      productivity: 'oee|availability|performance|utilization|throughput|takt',
      safety: 'safety|incident|lost time|ltir|near miss',
      sustainability: 'energy|emission|carbon|co2|waste|recycle|water|green',
      financial: 'revenue|profit|margin|ebit|cash|working capital',
      customer: 'complaint|nps|satisfaction|otif|service level',
      digital: 'digital|iot|automation|ai|predictive|industry 4.0',
      resilience: 'resilience|continuity|backup|recovery|stockout|supply risk',
      on_time: 'on-time|otif|service level',
      cycle_time: 'cycle time|lead time',
      oee: 'oee|availability|performance|quality rate',
      availability: 'availability|downtime|mtbf|mttr',
      rework: 'rework|scrap|ppm|defect'
    }
    Object.entries(dict).forEach(([tag, pattern]) => { if (new RegExp(pattern, 'i').test(text)) add(tag) })

    themes.filter(Boolean).forEach(t => add(String(t).toLowerCase()))
    // Leading/lagging heuristics
    if (/(lead time|cycle time|oee|availability|throughput|defect|ppm|yield|on-time|otif)/i.test(text)) add('leading')
    if (/(profit|margin|revenue|cost|cogs|working capital)/i.test(text)) add('lagging')
    return tags
  }

  private static determineRole(tags: string[]): SemanticInsights['role'] {
    if (tags.includes('leading') && !tags.includes('lagging')) return 'leading'
    if (tags.includes('lagging') && !tags.includes('leading')) return 'lagging'
    return 'balancing'
  }
}

/**
 * Advanced Analytics API Helper
 */
export class AdvancedAnalyticsAPI {
  /**
   * Batch analyze multiple KPIs
   */
  static async analyzeKPIBatch(
    kpiData: Array<{
      kpiId: string
      kpiName: string
      data: Array<{ period: string; value: number }>
      targetValue: number
    }>
  ): Promise<PerformanceProfile[]> {
    return kpiData.map(kpi => 
      AdvancedAnalyticsEngine.generatePerformanceProfile(
        kpi.kpiId,
        kpi.kpiName,
        kpi.data,
        kpi.targetValue
      )
    )
  }

  /**
   * Cross-KPI correlation matrix
   */
  static async generateCorrelationMatrix(
    kpiData: Record<string, Array<{ period: string; value: number }>>
  ): Promise<CorrelationAnalysis> {
    return AdvancedAnalyticsEngine.analyzeCorrelations(kpiData)
  }

  /**
   * Factory performance comparison
   */
  static compareFactoryPerformance(
    factoryData: Record<string, Array<{ period: string; value: number }>>
  ): any {
    const analysis: Record<string, any> = {}

    Object.entries(factoryData).forEach(([factoryId, data]) => {
      analysis[factoryId] = {
        trend: AdvancedAnalyticsEngine.analyzeTrend(data),
        forecast: AdvancedAnalyticsEngine.generateForecast(data),
        anomalies: AdvancedAnalyticsEngine.detectAnomalies(data)
      }
    })

    return analysis
  }
}
