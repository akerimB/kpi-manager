import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
    const searchParams = request.nextUrl.searchParams
    const userRole = searchParams.get('userRole') || 'UPPER_MANAGEMENT'
    const factoryId = searchParams.get('factoryId') || searchParams.get('factory') || undefined
    
    // Çoklu dönem desteği
    const periodsParam = searchParams.getAll('periods')
    const periods = periodsParam.length > 0 ? periodsParam : [searchParams.get('period') || '2024-Q4']
    const currentPeriod = periods[periods.length - 1] // En son dönem

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

    // Önceki dönem hesapla (trend için)
    const previousPeriod = getPreviousPeriod(currentPeriod)

    // KPI'lar ve değerleri (rol bazlı filtreleme ile)
    const kpis = await prisma.kpi.findMany({
      include: {
        kpiValues: {
          where: {
            OR: [
              { period: { in: periods } },
              { period: previousPeriod }
            ],
            factoryId: { in: accessibleFactoryIds }
          },
          orderBy: { period: 'desc' }
        }
      }
    })

    // Genel metrikler (rol bazlı)
    const factoriesCount = userRole === 'MODEL_FACTORY' ? 1 : await prisma.modelFactory.count()
    const actionsCount = await prisma.action.count()
    const kpiCount = kpis.length

    let totalScore = 0
    let totalPrevScore = 0
    let valueCount = 0
    const themeAccumulator: Record<string, { sum: number; count: number }> = {}
    const factoryBreakdown: Record<string, { name: string; score: number; count: number }> = {}

    // Fabrika bilgilerini al (üst yönetim için)
    let factoryInfo: Record<string, string> = {}
    if (userRole === 'UPPER_MANAGEMENT' || userRole === 'ADMIN') {
      const factories = await prisma.modelFactory.findMany({
        where: { id: { in: accessibleFactoryIds } },
        select: { id: true, name: true }
      })
      factoryInfo = Object.fromEntries(factories.map(f => [f.id, f.name]))
    }

    kpis.forEach(kpi => {
      const target = kpi.targetValue ?? 100
      const themes = (kpi.themes || '').split(',').map(t => t.trim()).filter(Boolean)

      // Dönem aralığındaki tüm değerleri işle
      const currentValues = kpi.kpiValues.filter(v => periods.includes(v.period))
      const prevValues = kpi.kpiValues.filter(v => v.period === previousPeriod)

      currentValues.forEach(curr => {
        const score = Math.min(100, (curr.value / target) * 100)
        totalScore += score
        valueCount++

        // Tema bazında toplayıcı
        themes.forEach(t => {
          themeAccumulator[t] = themeAccumulator[t] || { sum: 0, count: 0 }
          themeAccumulator[t].sum += score
          themeAccumulator[t].count += 1
        })

        // Fabrika bazında breakdown (üst yönetim için)
        if ((userRole === 'UPPER_MANAGEMENT' || userRole === 'ADMIN') && curr.factoryId) {
          const factoryName = factoryInfo[curr.factoryId] || 'Bilinmeyen'
          if (!factoryBreakdown[curr.factoryId]) {
            factoryBreakdown[curr.factoryId] = { name: factoryName, score: 0, count: 0 }
          }
          factoryBreakdown[curr.factoryId].score += score
          factoryBreakdown[curr.factoryId].count += 1
        }
      })

      prevValues.forEach(prev => {
        const prevScore = Math.min(100, (prev.value / target) * 100)
        totalPrevScore += prevScore
      })
    })

    const avgSuccess = valueCount > 0 ? Math.round(totalScore / valueCount) : 0
    const avgPrevSuccess = valueCount > 0 ? Math.round(totalPrevScore / valueCount) : 0
    const trend = avgSuccess - avgPrevSuccess

    const themes = Object.entries(themeAccumulator).map(([name, { sum, count }]) => ({
      name,
      avg: count > 0 ? Math.round(sum / count) : 0,
      count
    }))

    // Riskli KPI'lar (en son dönem bazında)
    const risks = kpis.map(kpi => {
      const target = kpi.targetValue ?? 100
      const curr = kpi.kpiValues.find(v => v.period === currentPeriod)
      const score = curr ? Math.min(100, (curr.value / target) * 100) : 0
      return {
        id: kpi.id,
        number: kpi.number,
        description: kpi.description,
        success: Math.round(score),
        targetValue: target,
      }
    }).sort((a, b) => a.success - b.success).slice(0, 10)

    // Zaman çizgisi: seçili dönemler + önceki dönem (trend için)
    const timelinePeriods = periods.length > 1 ? periods : [currentPeriod, previousPeriod]
    const timelineData = await Promise.all(timelinePeriods.map(async (p) => {
      const values = await prisma.kpiValue.findMany({ 
        where: { 
          period: p, 
          factoryId: { in: accessibleFactoryIds }
        } 
      })
      const avg = values.length > 0 ? Math.round(values.reduce((s, v) => s + v.value, 0) / values.length) : 0
      return { period: p, avgSuccess: avg }
    }))
    
    // Dönemleri kronolojik sırayla düzenle
    const timeline = timelineData.sort((a, b) => a.period.localeCompare(b.period))

    // Fabrika bazında performans özeti (üst yönetim için)
    const factoryPerformance = Object.entries(factoryBreakdown).map(([factoryId, data]) => ({
      factoryId,
      factoryName: data.name,
      avgScore: data.count > 0 ? Math.round(data.score / data.count) : 0,
      kpiCount: data.count
    })).sort((a, b) => b.avgScore - a.avgScore)

    return NextResponse.json({
      overall: { 
        avgSuccess, 
        trend, 
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
    })
  } catch (error) {
    console.error('Analytics overview error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}



