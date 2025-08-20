import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { KPICalculator, KPIUtils } from '@/lib/kpi-calculator'
import { 
  validateRequest, 
  validateAccess, 
  validateDataRange,
  AnalyticsOverviewRequestSchema,
  createValidationErrorResponse,
  PeriodUtils,
  safeParseNumber
} from '@/lib/validation'
import { OptimizedKPILoader, PerformanceMonitor } from '@/lib/query-optimizer'
import { analyticsCache } from '@/lib/redis-cache'

// Dönem aralığı hesaplama fonksiyonları
function calculatePeriodRange(basePeriod: string, range: string): string[] {
  const [year, quarter] = basePeriod.split('-')
  const baseYear = parseInt(year)
  const baseQuarter = quarter ? parseInt(quarter.replace('Q', '')) : 4

  switch (range) {
    case 'yearly':
      // 2 yıllık: 8 çeyrek
      const yearlyPeriods: string[] = []
      for (let y = baseYear - 1; y <= baseYear; y++) {
        for (let q = 1; q <= 4; q++) {
          yearlyPeriods.push(`${y}-Q${q}`)
        }
      }
      return yearlyPeriods

    case 'quarterly':
      // 2 çeyreklik
      const quarterlyPeriods: string[] = []
      if (baseQuarter === 1) {
        quarterlyPeriods.push(`${baseYear - 1}-Q4`, `${baseYear}-Q1`)
      } else {
        quarterlyPeriods.push(`${baseYear}-Q${baseQuarter - 1}`, `${baseYear}-Q${baseQuarter}`)
      }
      return quarterlyPeriods

    case 'single':
    default:
      // Tek dönem
      return [basePeriod]
  }
}

function getPreviousPeriod(period: string): string {
  const [year, quarter] = period.split('-')
  const currentYear = parseInt(year)
  const currentQuarter = parseInt(quarter.replace('Q', ''))

  if (currentQuarter === 1) {
    return `${currentYear - 1}-Q4`
  } else {
    return `${currentYear}-Q${currentQuarter - 1}`
  }
}

// Basit analytics overview: genel başarı, tema dağılımı, riskli KPI'lar, zaman çizgisi
export async function GET(request: NextRequest) {
  try {
    // Request validation
    const validationResult = validateRequest(AnalyticsOverviewRequestSchema, request)
    if (!validationResult.success) {
      return createValidationErrorResponse(validationResult.errors!)
    }
    
    const { userRole, factoryId, periods } = validationResult.data!
    const currentPeriod = periods[periods.length - 1] // En son dönem
    
    // Access control validation
    const accessResult = validateAccess(userRole, factoryId, factoryId)
    if (!accessResult.success) {
      return createValidationErrorResponse(accessResult.errors!, 403)
    }
    
    // Data range validation
    const rangeResult = validateDataRange(periods, 12)
    if (!rangeResult.success) {
      return createValidationErrorResponse(rangeResult.errors!)
    }

    // Rol bazlı erişim kontrolü
    let accessibleFactoryIds: string[] = []
    if (userRole === 'MODEL_FACTORY') {
      if (!factoryId) {
        return NextResponse.json({ error: 'Model fabrika kullanıcısı için factoryId gerekli' }, { status: 400 })
      }
      accessibleFactoryIds = [factoryId]
            } else if (userRole === 'UPPER_MANAGEMENT') {
      // Tüm fabrikalara erişim
      const allFactories = await prisma.modelFactory.findMany({ select: { id: true } })
      accessibleFactoryIds = allFactories.map(f => f.id)
      if (factoryId) {
        // Belirli bir fabrika seçilmişse sadece onu filtrele
        accessibleFactoryIds = [factoryId]
      }
    }

    // Check cache first
    const cachedOverview = await analyticsCache.getOverview(userRole, accessibleFactoryIds, periods)
    if (cachedOverview) {
      console.log('📦 Serving from cache')
      return NextResponse.json(cachedOverview)
    }

    // Önceki dönem hesapla (trend için)
    const previousPeriod = PeriodUtils.getPreviousPeriod(currentPeriod)
    const allPeriods = [...periods, previousPeriod]

    // Optimized data loading
    const loader = OptimizedKPILoader.getInstance()
    
    const aggregateData = await PerformanceMonitor.measure('load_aggregate_data', () =>
      loader.loadAggregateData({
        periods: allPeriods,
        factoryIds: accessibleFactoryIds.length > 0 ? accessibleFactoryIds : undefined,
        userRole
      })
    )

    // Extract optimized data
    const { kpiData, factoryInfo: factoryInfoData, actionCount } = aggregateData
    const kpis = kpiData.kpis
    const kpiValues = kpiData.kpiValues

    // Genel metrikler (rol bazlı) - optimized
    const factoriesCount = userRole === 'MODEL_FACTORY' ? 1 : (factoryInfoData?.count || accessibleFactoryIds.length)
    const actionsCount = actionCount
    const kpiCount = kpis.length

    // Fabrika bilgilerini extract et
    const factoryInfo = factoryInfoData?.factoryMap ? 
      Object.fromEntries(Object.entries(factoryInfoData.factoryMap).map(([id, f]: [string, any]) => [id, f.name])) :
      {}

    // KPI Calculator initialize
    const calculator = new KPICalculator({
      useWeights: false, // Basit ortalama için
      handleMissingTarget: 'default',
      defaultTarget: 100,
      periodWeighting: 'equal'
    })

    // KPI lookup map for performance
    const kpiMap = new Map(kpis.map(k => [k.id, k]))

    // KPI değerlerini calculator formatına çevir - optimized processing
    const currentKpiValues = await PerformanceMonitor.measure('process_current_kpi_values', () => {
      return kpiValues
        .filter(v => periods.includes(v.period))
        .filter(v => v.value != null && !isNaN(v.value)) // Null/NaN değerleri filtrele
        .map(v => {
          const kpi = kpiMap.get(v.kpiId)
          return {
            id: v.id,
            value: safeParseNumber(v.value, 0, 0), // Negatif değerleri 0 yap
            targetValue: v.targetValue,
            period: v.period,
            factoryId: v.factoryId,
            kpi: {
              id: v.kpiId,
              number: v.kpiNumber,
              description: kpi?.description || '',
              themes: typeof kpi?.themes === 'string' ? kpi.themes : (kpi?.themes || []).join(','),
              targetValue: v.targetValue
            }
          }
        })
    })

    const previousKpiValues = await PerformanceMonitor.measure('process_previous_kpi_values', () => {
      return kpiValues
        .filter(v => v.period === previousPeriod)
        .filter(v => v.value != null && !isNaN(v.value)) // Null/NaN değerleri filtrele
        .map(v => {
          const kpi = kpiMap.get(v.kpiId)
          return {
            id: v.id,
            value: safeParseNumber(v.value, 0, 0), // Negatif değerleri 0 yap
            targetValue: v.targetValue,
            period: v.period,
            factoryId: v.factoryId,
            kpi: {
              id: v.kpiId,
              number: v.kpiNumber,
              description: kpi?.description || '',
              themes: typeof kpi?.themes === 'string' ? kpi.themes : (kpi?.themes || []).join(','),
              targetValue: v.targetValue
            }
          }
        })
    })

    // Ana hesaplamalar
    const currentResult = calculator.calculateAggregateScore(currentKpiValues)
    const previousResult = calculator.calculateAggregateScore(previousKpiValues)
    
    const avgSuccess = Math.round(currentResult.achievementRate)
    const avgPrevSuccess = Math.round(previousResult.achievementRate)
    const trend = KPIUtils.calculateTrend(avgSuccess, avgPrevSuccess)

    // Tema bazında gruplandırma
    const themeResults = calculator.groupByTheme(currentKpiValues)
    
    // Fabrika bazında gruplandırma (üst yönetim için)
    const factoryResults = (userRole === 'UPPER_MANAGEMENT' || userRole === 'ADMIN') 
      ? calculator.groupByFactory(currentKpiValues) 
      : {}

    const themes = Object.entries(themeResults).map(([name, result]) => ({
      name,
      avg: Math.round(result.achievementRate),
      count: result.validCount
    }))

    // Riskli KPI'lar (en son dönem bazında) - optimized
    const currentPeriodKpis = kpiValues
      .filter(v => v.period === currentPeriod)
      .filter(v => v.value != null && !isNaN(v.value))
      .map(v => {
        const kpi = kpiMap.get(v.kpiId)
        if (!kpi) return null
        
        const kpiValue = {
          id: v.id,
          value: v.value,
          targetValue: v.targetValue,
          period: v.period,
          factoryId: v.factoryId,
          kpi: {
            id: v.kpiId,
            number: v.kpiNumber,
            description: kpi.description,
            targetValue: v.targetValue
          }
        }
        
        const result = calculator.calculateSingleScore(kpiValue)
        return {
          id: kpi.id,
          number: kpi.number,
          description: kpi.description,
          success: Math.round(result.achievementRate),
          targetValue: v.targetValue ?? 100,
          riskLevel: KPIUtils.getRiskLevel(result.achievementRate)
        }
      })
      .filter(Boolean)
      .sort((a, b) => a.success - b.success)
      .slice(0, 10)

    const risks = currentPeriodKpis

    // Zaman çizgisi: seçili dönemler + önceki dönem (trend için) - optimized
    const timelinePeriods = periods.length > 1 ? periods : [currentPeriod, previousPeriod]
    
    const timelineKpiValues = await PerformanceMonitor.measure('process_timeline', () => {
      return kpiValues
        .filter(v => timelinePeriods.includes(v.period))
        .filter(v => v.value != null && !isNaN(v.value))
        .map(v => ({
          id: v.id,
          value: safeParseNumber(v.value, 0, 0),
          targetValue: v.targetValue,
          period: v.period,
          factoryId: v.factoryId,
          kpi: {
            id: v.kpiId,
            number: v.kpiNumber,
            description: '',
            targetValue: v.targetValue
          }
        }))
    })
    
    const periodResults = calculator.groupByPeriod(timelineKpiValues)
    
    const timelineData = timelinePeriods.map(period => ({
      period,
      avgSuccess: Math.round(periodResults[period]?.achievementRate || 0)
    }))
    
    // Dönemleri kronolojik sırayla düzenle
    const timeline = timelineData.sort((a, b) => a.period.localeCompare(b.period))

    // Fabrika bazında performans özeti (üst yönetim için)
    const factoryPerformance = Object.entries(factoryResults).map(([factoryId, result]) => ({
      factoryId,
      factoryName: factoryInfo[factoryId] || 'Bilinmeyen',
      avgScore: Math.round(result.achievementRate),
      kpiCount: result.validCount
    })).sort((a, b) => b.avgScore - a.avgScore)

    const responseData = {
      overall: { 
        avgSuccess, 
        trend: trend.change, 
        kpiCount, 
        actionCount: actionsCount, 
        factoryCount: factoriesCount 
      },
      themes,
      topRisks: risks,
      timeline,
      factoryPerformance: userRole === 'UPPER_MANAGEMENT' || userRole === 'ADMIN' ? factoryPerformance : [],
      selectedPeriods: periods,
      currentPeriod,
      accessibleFactories: accessibleFactoryIds.length,
      userRole,
      analysisScope: userRole === 'MODEL_FACTORY' ? 'single_factory' : 'multi_factory'
    }

    // Debug logging
    console.log('📊 Analytics Overview Response:', {
      userRole,
      factoryId,
      periods,
      overallData: responseData.overall,
      themesCount: responseData.themes.length,
      risksCount: responseData.topRisks.length,
      timelineCount: responseData.timeline.length
    })

    // Cache the response
    await analyticsCache.cacheOverview(userRole, accessibleFactoryIds, periods, responseData)

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Analytics overview error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    // Specific error handling
    if (error instanceof Error) {
      if (error.message.includes('P2002')) {
        return NextResponse.json({ 
          error: 'Veritabanı kısıtlama hatası',
          type: 'DATABASE_CONSTRAINT_ERROR',
          timestamp: new Date().toISOString()
        }, { status: 409 })
      }
      
      if (error.message.includes('P2025')) {
        return NextResponse.json({ 
          error: 'Kayıt bulunamadı',
          type: 'RECORD_NOT_FOUND',
          timestamp: new Date().toISOString()
        }, { status: 404 })
      }
    }
    
    return NextResponse.json({ 
      error: 'Sunucu hatası', 
      detail: error instanceof Error ? error.message : String(error),
      type: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}



