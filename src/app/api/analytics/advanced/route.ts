/**
 * Advanced Analytics API
 * Trend analysis, forecasting, anomaly detection, correlation analysis
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  AdvancedAnalyticsEngine, 
  AdvancedAnalyticsAPI,
  PerformanceProfile 
} from '@/lib/advanced-analytics'
import { 
  validateRequest, 
  AnalyticsOverviewRequestSchema,
  createValidationErrorResponse 
} from '@/lib/validation'
import { redisCache } from '@/lib/redis-cache'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { analysisType, kpiIds, factoryIds, periods, options } = body

    // Validation
    if (!analysisType) {
      return NextResponse.json({ error: 'Analysis type is required' }, { status: 400 })
    }

    // Cache key
    const cacheKey = `advanced_analytics:${analysisType}:${JSON.stringify({ kpiIds, factoryIds, periods })}`
    const cached = await redisCache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    let result: any

    switch (analysisType) {
      case 'trend_analysis':
        result = await performTrendAnalysis(kpiIds, factoryIds, periods)
        break
      
      case 'anomaly_detection':
        result = await performAnomalyDetection(kpiIds, factoryIds, periods)
        break
      
      case 'correlation_analysis':
        result = await performCorrelationAnalysis(kpiIds, factoryIds, periods)
        break
      
      case 'forecasting':
        result = await performForecasting(kpiIds, factoryIds, periods, options?.forecastPeriods || 4)
        break
      
      case 'performance_profiling':
        result = await performPerformanceProfiling(kpiIds, factoryIds, periods)
        break
      
      case 'factory_comparison':
        result = await performFactoryComparison(kpiIds, factoryIds, periods)
        break
      
      case 'knowledge_actions':
        result = await performKnowledgeActionPlan(kpiIds, factoryIds, periods)
        break
      
      default:
        return NextResponse.json({ error: 'Unknown analysis type' }, { status: 400 })
    }

    // Cache result for 15 minutes
    await redisCache.set(cacheKey, result, 900)

    return NextResponse.json(result)

  } catch (error) {
    console.error('Advanced analytics error:', error)
    return NextResponse.json({ 
      error: 'Advanced analytics failed',
      detail: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

/**
 * Trend Analysis
 */
async function performTrendAnalysis(kpiIds: string[], factoryIds: string[], periods: string[]) {
  const kpiValues = await prisma.kpiValue.findMany({
    where: {
      kpiId: kpiIds ? { in: kpiIds } : undefined,
      factoryId: factoryIds ? { in: factoryIds } : undefined,
      period: { in: periods }
    },
    include: {
      kpi: {
        select: { id: true, number: true, name: true, description: true }
      }
    },
    orderBy: { period: 'asc' }
  })

  // Group by KPI
  const kpiGroups: Record<string, any[]> = {}
  kpiValues.forEach(kv => {
    if (!kpiGroups[kv.kpiId]) {
      kpiGroups[kv.kpiId] = []
    }
    kpiGroups[kv.kpiId].push({
      period: kv.period,
      value: kv.value,
      kpi: kv.kpi
    })
  })

  const trends = Object.entries(kpiGroups).map(([kpiId, values]) => {
    const trend = AdvancedAnalyticsEngine.analyzeTrend(values)
    return {
      kpiId,
      kpiName: values[0].kpi.name,
      kpiNumber: values[0].kpi.number,
      trend,
      dataPoints: values.length
    }
  })

  return {
    analysisType: 'trend_analysis',
    results: trends,
    summary: {
      totalKPIs: trends.length,
      improving: trends.filter(t => t.trend.direction === 'increasing').length,
      declining: trends.filter(t => t.trend.direction === 'decreasing').length,
      stable: trends.filter(t => t.trend.direction === 'stable').length,
      volatile: trends.filter(t => t.trend.direction === 'volatile').length,
      strongTrends: trends.filter(t => t.trend.strength === 'strong').length
    },
    metadata: {
      periods,
      factoryIds,
      generatedAt: new Date().toISOString()
    }
  }
}

/**
 * Anomaly Detection
 */
async function performAnomalyDetection(kpiIds: string[], factoryIds: string[], periods: string[]) {
  const kpiValues = await prisma.kpiValue.findMany({
    where: {
      kpiId: kpiIds ? { in: kpiIds } : undefined,
      factoryId: factoryIds ? { in: factoryIds } : undefined,
      period: { in: periods }
    },
    include: {
      kpi: {
        select: { id: true, number: true, name: true, description: true }
      },
      factory: {
        select: { id: true, name: true }
      }
    },
    orderBy: { period: 'asc' }
  })

  // Group by KPI
  const kpiGroups: Record<string, any[]> = {}
  kpiValues.forEach(kv => {
    if (!kpiGroups[kv.kpiId]) {
      kpiGroups[kv.kpiId] = []
    }
    kpiGroups[kv.kpiId].push({
      period: kv.period,
      value: kv.value,
      kpi: kv.kpi,
      factory: kv.factory
    })
  })

  const anomalyResults = Object.entries(kpiGroups).map(([kpiId, values]) => {
    const anomalies = AdvancedAnalyticsEngine.detectAnomalies(values)
    return {
      kpiId,
      kpiName: values[0].kpi.name,
      kpiNumber: values[0].kpi.number,
      ...anomalies,
      dataPoints: values.length
    }
  })

  const criticalAnomalies = anomalyResults.filter(r => r.overallHealth === 'critical')
  const concerningAnomalies = anomalyResults.filter(r => r.overallHealth === 'concerning')

  return {
    analysisType: 'anomaly_detection',
    results: anomalyResults,
    summary: {
      totalKPIs: anomalyResults.length,
      healthy: anomalyResults.filter(r => r.overallHealth === 'healthy').length,
      concerning: concerningAnomalies.length,
      critical: criticalAnomalies.length,
      totalAnomalies: anomalyResults.reduce((sum, r) => sum + r.anomalies.length, 0),
      criticalAnomalies: criticalAnomalies.reduce((sum, r) => sum + r.anomalies.filter(a => a.severity === 'critical').length, 0)
    },
    alerts: [
      ...criticalAnomalies.map(r => ({
        type: 'critical_anomaly',
        kpiId: r.kpiId,
        kpiName: r.kpiName,
        message: `Critical anomalies detected in ${r.kpiName}`,
        urgency: 'high'
      })),
      ...concerningAnomalies.map(r => ({
        type: 'concerning_pattern',
        kpiId: r.kpiId,
        kpiName: r.kpiName,
        message: `Concerning patterns detected in ${r.kpiName}`,
        urgency: 'medium'
      }))
    ],
    metadata: {
      periods,
      factoryIds,
      generatedAt: new Date().toISOString()
    }
  }
}

/**
 * Correlation Analysis
 */
async function performCorrelationAnalysis(kpiIds: string[], factoryIds: string[], periods: string[]) {
  const kpiValues = await prisma.kpiValue.findMany({
    where: {
      kpiId: kpiIds ? { in: kpiIds } : undefined,
      factoryId: factoryIds ? { in: factoryIds } : undefined,
      period: { in: periods }
    },
    include: {
      kpi: {
        select: { id: true, number: true, name: true, description: true }
      }
    },
    orderBy: { period: 'asc' }
  })

  // Group by KPI for correlation analysis
  const kpiData: Record<string, Array<{ period: string; value: number }>> = {}
  const kpiNames: Record<string, string> = {}

  kpiValues.forEach(kv => {
    if (!kpiData[kv.kpiId]) {
      kpiData[kv.kpiId] = []
      kpiNames[kv.kpiId] = kv.kpi.name
    }
    kpiData[kv.kpiId].push({
      period: kv.period,
      value: kv.value
    })
  })

  const correlationAnalysis = AdvancedAnalyticsEngine.analyzeCorrelations(kpiData)

  // Enhance with KPI names
  const enhancedCorrelations = correlationAnalysis.correlations.map(corr => ({
    ...corr,
    kpi1Name: kpiNames[corr.kpi1],
    kpi2Name: kpiNames[corr.kpi2]
  }))

  const enhancedClusters = correlationAnalysis.clusters.map(cluster => ({
    ...cluster,
    kpiDetails: cluster.kpis.map(kpiId => ({
      id: kpiId,
      name: kpiNames[kpiId]
    }))
  }))

  return {
    analysisType: 'correlation_analysis',
    results: {
      correlations: enhancedCorrelations,
      clusters: enhancedClusters
    },
    summary: {
      totalPairs: enhancedCorrelations.length,
      strongCorrelations: enhancedCorrelations.filter(c => c.strength === 'strong').length,
      moderateCorrelations: enhancedCorrelations.filter(c => c.strength === 'moderate').length,
      weakCorrelations: enhancedCorrelations.filter(c => c.strength === 'weak').length,
      clustersFound: enhancedClusters.length,
      averageClusterSize: enhancedClusters.length > 0 ? 
        enhancedClusters.reduce((sum, c) => sum + c.kpis.length, 0) / enhancedClusters.length : 0
    },
    insights: [
      ...enhancedCorrelations
        .filter(c => c.strength === 'strong')
        .map(c => ({
          type: 'strong_correlation',
          message: `Strong ${c.direction} correlation between ${c.kpi1Name} and ${c.kpi2Name} (r=${c.coefficient})`,
          coefficient: c.coefficient
        })),
      ...enhancedClusters.map(cluster => ({
        type: 'kpi_cluster',
        message: `Identified cluster of ${cluster.kpis.length} related KPIs with average correlation of ${cluster.averageCorrelation}`,
        cluster: cluster.name
      }))
    ],
    metadata: {
      periods,
      factoryIds,
      generatedAt: new Date().toISOString()
    }
  }
}

/**
 * Forecasting
 */
async function performForecasting(kpiIds: string[], factoryIds: string[], periods: string[], forecastPeriods: number) {
  const kpiValues = await prisma.kpiValue.findMany({
    where: {
      kpiId: kpiIds ? { in: kpiIds } : undefined,
      factoryId: factoryIds ? { in: factoryIds } : undefined,
      period: { in: periods }
    },
    include: {
      kpi: {
        select: { id: true, number: true, name: true, description: true, targetValue: true }
      }
    },
    orderBy: { period: 'asc' }
  })

  // Group by KPI
  const kpiGroups: Record<string, any[]> = {}
  kpiValues.forEach(kv => {
    if (!kpiGroups[kv.kpiId]) {
      kpiGroups[kv.kpiId] = []
    }
    kpiGroups[kv.kpiId].push({
      period: kv.period,
      value: kv.value,
      kpi: kv.kpi
    })
  })

  const forecasts = Object.entries(kpiGroups).map(([kpiId, values]) => {
    const forecast = AdvancedAnalyticsEngine.generateForecast(values, forecastPeriods)
    const trend = AdvancedAnalyticsEngine.analyzeTrend(values)
    
    return {
      kpiId,
      kpiName: values[0].kpi.name,
      kpiNumber: values[0].kpi.number,
      targetValue: values[0].kpi.targetValue,
      currentValue: values[values.length - 1]?.value,
      trend,
      forecast,
      dataPoints: values.length
    }
  })

  return {
    analysisType: 'forecasting',
    results: forecasts,
    summary: {
      totalKPIs: forecasts.length,
      forecastPeriods,
      averageAccuracy: forecasts.reduce((sum, f) => sum + f.forecast.accuracy, 0) / forecasts.length,
      kpisWithHighConfidence: forecasts.filter(f => f.forecast.confidence > 70).length,
      predictedImprovements: forecasts.filter(f => 
        f.forecast.predictions.length > 0 && 
        f.forecast.predictions[0].predicted > f.currentValue
      ).length
    },
    recommendations: forecasts
      .filter(f => f.forecast.confidence > 50)
      .map(f => {
        const nextPrediction = f.forecast.predictions[0]
        const willImprove = nextPrediction && nextPrediction.predicted > f.currentValue
        
        return {
          kpiId: f.kpiId,
          kpiName: f.kpiName,
          recommendation: willImprove 
            ? `${f.kpiName} is projected to improve. Current trajectory looks positive.`
            : `${f.kpiName} may decline. Consider intervention measures.`,
          confidence: f.forecast.confidence,
          urgency: f.forecast.confidence > 70 && !willImprove ? 'high' : 'medium'
        }
      }),
    metadata: {
      periods,
      factoryIds,
      forecastHorizon: forecastPeriods,
      generatedAt: new Date().toISOString()
    }
  }
}

/**
 * Performance Profiling
 */
async function performPerformanceProfiling(kpiIds: string[], factoryIds: string[], periods: string[]) {
  const kpiValues = await prisma.kpiValue.findMany({
    where: {
      kpiId: kpiIds ? { in: kpiIds } : undefined,
      factoryId: factoryIds ? { in: factoryIds } : undefined,
      period: { in: periods }
    },
    include: {
      kpi: {
        select: { id: true, number: true, name: true, description: true, targetValue: true }
      }
    },
    orderBy: { period: 'asc' }
  })

  // Group by KPI
  const kpiGroups: Record<string, any[]> = {}
  kpiValues.forEach(kv => {
    if (!kpiGroups[kv.kpiId]) {
      kpiGroups[kv.kpiId] = []
    }
    kpiGroups[kv.kpiId].push({
      period: kv.period,
      value: kv.value,
      kpi: kv.kpi
    })
  })

  const profiles: PerformanceProfile[] = Object.entries(kpiGroups).map(([kpiId, values]) => {
    const kpi = values[0].kpi
    return AdvancedAnalyticsEngine.generatePerformanceProfile(
      kpiId,
      kpi.name,
      values,
      kpi.targetValue || 100,
      undefined,
      {
        description: kpi.description,
        themes: (kpi as any).themes || null,
        strategicGoal: (kpi as any).strategicTarget?.strategicGoal?.title || null,
        strategicTarget: (kpi as any).strategicTarget?.title || null
      } as any
    )
  })

  return {
    analysisType: 'performance_profiling',
    results: profiles,
    summary: {
      totalKPIs: profiles.length,
      topPerformers: profiles.filter(p => p.benchmarkPosition === 'top_performer').length,
      underperformers: profiles.filter(p => p.benchmarkPosition === 'underperformer').length,
      highRisk: profiles.filter(p => p.riskLevel === 'high' || p.riskLevel === 'critical').length,
      averageAchievement: profiles.reduce((sum, p) => sum + p.achievementRate, 0) / profiles.length,
      kpisAboveTarget: profiles.filter(p => p.achievementRate >= 100).length
    },
    actionItems: profiles
      .filter(p => p.riskLevel === 'high' || p.riskLevel === 'critical')
      .map(p => ({
        kpiId: p.kpiId,
        kpiName: p.kpiName,
        riskLevel: p.riskLevel,
        primaryRecommendation: p.recommendations[0],
        urgency: p.riskLevel === 'critical' ? 'immediate' : 'high'
      })),
    metadata: {
      periods,
      factoryIds,
      generatedAt: new Date().toISOString()
    }
  }
}

/**
 * Factory Comparison
 */
async function performFactoryComparison(kpiIds: string[], factoryIds: string[], periods: string[]) {
  const kpiValues = await prisma.kpiValue.findMany({
    where: {
      kpiId: kpiIds ? { in: kpiIds } : undefined,
      factoryId: factoryIds ? { in: factoryIds } : undefined,
      period: { in: periods }
    },
    include: {
      kpi: {
        select: { id: true, number: true, name: true, description: true }
      },
      factory: {
        select: { id: true, name: true }
      }
    },
    orderBy: { period: 'asc' }
  })

  // Group by factory
  const factoryGroups: Record<string, any[]> = {}
  const factoryNames: Record<string, string> = {}

  kpiValues.forEach(kv => {
    if (!factoryGroups[kv.factoryId]) {
      factoryGroups[kv.factoryId] = []
      factoryNames[kv.factoryId] = kv.factory.name
    }
    factoryGroups[kv.factoryId].push({
      period: kv.period,
      value: kv.value,
      kpiId: kv.kpiId
    })
  })

  const factoryAnalysis = AdvancedAnalyticsAPI.compareFactoryPerformance(factoryGroups)

  const comparison = Object.entries(factoryAnalysis).map(([factoryId, analysis]) => ({
    factoryId,
    factoryName: factoryNames[factoryId],
    trend: analysis.trend,
    forecast: analysis.forecast,
    anomalies: analysis.anomalies,
    overallScore: analysis.trend.confidence + 
                  (analysis.anomalies.overallHealth === 'healthy' ? 50 : 
                   analysis.anomalies.overallHealth === 'concerning' ? 25 : 0),
    dataPoints: factoryGroups[factoryId].length
  }))

  // Rank factories
  const rankedFactories = comparison
    .sort((a, b) => b.overallScore - a.overallScore)
    .map((factory, index) => ({
      ...factory,
      rank: index + 1,
      performance: index === 0 ? 'top' : 
                  index < comparison.length * 0.3 ? 'above_average' :
                  index < comparison.length * 0.7 ? 'average' : 'below_average'
    }))

  return {
    analysisType: 'factory_comparison',
    results: rankedFactories,
    summary: {
      totalFactories: rankedFactories.length,
      topPerformer: rankedFactories[0],
      bottomPerformer: rankedFactories[rankedFactories.length - 1],
      averageScore: rankedFactories.reduce((sum, f) => sum + f.overallScore, 0) / rankedFactories.length,
      factoriesWithPositiveTrend: rankedFactories.filter(f => f.trend.direction === 'increasing').length,
      factoriesWithAnomalies: rankedFactories.filter(f => f.anomalies.overallHealth !== 'healthy').length
    },
    recommendations: [
      {
        type: 'best_practice_sharing',
        message: `Share best practices from ${rankedFactories[0].factoryName} with underperforming factories`,
        priority: 'high'
      },
      ...rankedFactories
        .filter(f => f.performance === 'below_average')
        .map(f => ({
          type: 'improvement_needed',
          message: `${f.factoryName} needs performance improvement. Focus on trend reversal and anomaly resolution.`,
          factoryId: f.factoryId,
          priority: 'medium'
        }))
    ],
    metadata: {
      periods,
      kpiIds,
      generatedAt: new Date().toISOString()
    }
  }
}

async function performKnowledgeActionPlan(kpiIds: string[] = [], factoryIds: string[] = [], periods: string[] = []) {
  const kpiValues = await prisma.kpiValue.findMany({
    where: {
      kpiId: kpiIds && kpiIds.length ? { in: kpiIds } : undefined,
      factoryId: factoryIds && factoryIds.length ? { in: factoryIds } : undefined,
      period: periods && periods.length ? { in: periods } : undefined
    },
    include: {
      kpi: {
        include: {
          strategicTarget: { include: { strategicGoal: true } }
        }
      },
      factory: { select: { id: true, name: true } }
    },
    orderBy: { period: 'asc' }
  })

  const lite = kpiValues.map(v => ({
    factoryId: v.factoryId,
    factoryName: (v as any).factory?.name || '',
    kpiId: v.kpiId,
    kpiNumber: (v.kpi as any)?.number,
    kpiName: (v.kpi as any)?.name || (v.kpi as any)?.description,
    period: v.period,
    value: v.value,
    target: (v.kpi as any)?.targetValue || 100,
    sa: { code: (v.kpi as any)?.strategicTarget?.strategicGoal?.code, title: (v.kpi as any)?.strategicTarget?.strategicGoal?.title },
    sh: { code: (v.kpi as any)?.strategicTarget?.code, title: (v.kpi as any)?.strategicTarget?.title }
  }))

  const { generateKnowledgeInsights } = await import('@/lib/ai-knowledge')
  const knowledge = generateKnowledgeInsights(lite as any, periods)

  return {
    analysisType: 'knowledge_actions',
    results: knowledge.insights,
    summary: knowledge.summaries,
    metadata: { periods, factories: factoryIds, kpis: kpiIds, generatedAt: new Date().toISOString() }
  }
}
