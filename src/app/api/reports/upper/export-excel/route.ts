import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AdvancedAnalyticsEngine } from '@/lib/advanced-analytics'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  try {
    const { startPeriod, endPeriod, reportType, factoryIds } = await request.json()
    if (!startPeriod || !endPeriod) {
      return NextResponse.json({ error: 'Başlangıç ve bitiş dönemleri gerekli' }, { status: 400 })
    }

    let workbook: XLSX.WorkBook
    switch (reportType) {
      case 'executive_summary':
        workbook = await generateExecutiveSummary(startPeriod, endPeriod, factoryIds)
        break
      case 'factory_benchmark':
        workbook = await generateUpperBenchmark(startPeriod, endPeriod, factoryIds)
        break
      case 'trend_forecast':
        workbook = await generateUpperTrendForecast(startPeriod, endPeriod, factoryIds)
        break
      case 'ai_insights':
        workbook = await generateUpperAIInsights(startPeriod, endPeriod, factoryIds)
        break
      default:
        workbook = await generateComprehensiveUpper(startPeriod, endPeriod, factoryIds)
    }

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx', compression: true })
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `UM_${reportType || 'comprehensive'}_${startPeriod}_to_${endPeriod}_${timestamp}.xlsx`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString()
      }
    })
  } catch (error) {
    console.error('❌ Upper Excel export error:', error)
    return NextResponse.json({ error: 'Upper management Excel raporu oluşturulamadı', detail: String(error) }, { status: 500 })
  }
}

async function generateExecutiveSummary(startPeriod: string, endPeriod: string, factoryIds?: string[]): Promise<XLSX.WorkBook> {
  const workbook = XLSX.utils.book_new()

  // Dönem aralığı
  const periods = buildPeriodRange(startPeriod, endPeriod)

  // Fabrika bazlı ortalamalar
  const factories = await prisma.modelFactory.findMany({
    where: factoryIds && factoryIds.length ? { id: { in: factoryIds } } : {},
    include: {
      kpiValues: { where: { period: { in: periods } }, include: { kpi: true } }
    }
  })

  const summaryRows: any[] = [[
    'Fabrika Kodu', 'Fabrika Adı', 'KPI Sayısı', 'Ortalama Başarı (%)', 'Kritik KPI (<50%)', 'Mükemmel KPI (>=100%)'
  ]]

  factories.forEach(f => {
    const count = f.kpiValues.length
    const avg = count > 0 ? (f.kpiValues.reduce((s, kv) => s + Math.min((kv.value / (kv.kpi.targetValue || 100)) * 100, 100), 0) / count) : 0
    const critical = f.kpiValues.filter(kv => (kv.value / (kv.kpi.targetValue || 100)) < 0.5).length
    const excellent = f.kpiValues.filter(kv => (kv.value / (kv.kpi.targetValue || 100)) >= 1).length
    summaryRows.push([f.code, f.name, count, Number(avg.toFixed(1)), critical, excellent])
  })

  const ws = XLSX.utils.aoa_to_sheet(summaryRows)
  ws['!cols'] = [{ width: 12 }, { width: 24 }, { width: 12 }, { width: 18 }, { width: 18 }, { width: 20 }]
  XLSX.utils.book_append_sheet(workbook, ws, 'Yönetsel Özet')
  return workbook
}

async function generateUpperBenchmark(startPeriod: string, endPeriod: string, factoryIds?: string[]): Promise<XLSX.WorkBook> {
  const workbook = XLSX.utils.book_new()
  const periods = buildPeriodRange(startPeriod, endPeriod)
  const factories = await prisma.modelFactory.findMany({
    where: factoryIds && factoryIds.length ? { id: { in: factoryIds } } : {},
    include: { kpiValues: { where: { period: { in: periods } }, include: { kpi: true } } }
  })

  const ranking = factories.map(f => {
    const count = f.kpiValues.length
    const avg = count > 0 ? (f.kpiValues.reduce((s, kv) => s + Math.min((kv.value / (kv.kpi.targetValue || 100)) * 100, 100), 0) / count) : 0
    return { code: f.code, name: f.name, avg, count }
  }).sort((a, b) => b.avg - a.avg)

  const rows: any[] = [[`Benchmark (${startPeriod} - ${endPeriod})`], [''], ['Sıra', 'Fabrika Kodu', 'Fabrika', 'Ortalama Başarı (%)', 'KPI Sayısı']]
  ranking.forEach((r, i) => rows.push([i + 1, r.code, r.name, Number(r.avg.toFixed(1)), r.count]))

  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [{ width: 8 }, { width: 12 }, { width: 24 }, { width: 20 }, { width: 12 }]
  XLSX.utils.book_append_sheet(workbook, ws, 'Benchmark')
  return workbook
}

async function generateUpperTrendForecast(startPeriod: string, endPeriod: string, factoryIds?: string[]): Promise<XLSX.WorkBook> {
  const workbook = XLSX.utils.book_new()
  const periods = buildPeriodRange(startPeriod, endPeriod)
  const factories = await prisma.modelFactory.findMany({
    where: factoryIds && factoryIds.length ? { id: { in: factoryIds } } : {},
    include: { kpiValues: { where: { period: { in: periods } }, include: { kpi: true } } }
  })

  // Fabrika bazında son değer ve değişim
  const rows: any[] = [[`Trend & Forecast (${startPeriod} - ${endPeriod})`], [''], ['Fabrika', ...periods, 'Değişim (%)', 'Trend']]

  factories.forEach(f => {
    const kpiGroups = new Map<string, number[]>()
    periods.forEach(p => {
      const values = f.kpiValues.filter(kv => kv.period === p)
      const avg = values.length > 0 ? (values.reduce((s, kv) => s + Math.min((kv.value / (kv.kpi.targetValue || 100)) * 100, 100), 0) / values.length) : 0
      if (!kpiGroups.has('avg')) kpiGroups.set('avg', [])
      kpiGroups.get('avg')!.push(avg)
    })
    const vals = kpiGroups.get('avg') || [0, 0, 0, 0]
    const change = vals[0] > 0 ? ((vals[3] - vals[0]) / vals[0] * 100) : 0
    const trend = change > 5 ? 'Artan' : change < -5 ? 'Azalan' : 'Sabit'
    rows.push([f.name, ...vals.map(v => Number(v.toFixed(1))), Number(change.toFixed(1)), trend])
  })

  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [{ width: 24 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 14 }, { width: 12 }]
  XLSX.utils.book_append_sheet(workbook, ws, 'Trend & Forecast')
  return workbook
}

async function generateUpperAIInsights(startPeriod: string, endPeriod: string, factoryIds?: string[]): Promise<XLSX.WorkBook> {
  const workbook = XLSX.utils.book_new()
  const periods = buildPeriodRange(startPeriod, endPeriod)
  const factories = await prisma.modelFactory.findMany({
    where: factoryIds && factoryIds.length ? { id: { in: factoryIds } } : {},
    include: { kpiValues: { where: { period: { in: periods } }, include: { kpi: { include: { strategicTarget: { include: { strategicGoal: true } } } } } } }
  })

  const rows: any[] = [[`AI İçgörüleri (${startPeriod} - ${endPeriod})`], [''], ['Fabrika', 'Toplam KPI', 'Kritik KPI', 'Mükemmel KPI', 'Öneri']]
  factories.forEach(f => {
    const total = f.kpiValues.length
    const critical = f.kpiValues.filter(kv => (kv.value / (kv.kpi.targetValue || 100)) < 0.5).length
    const excellent = f.kpiValues.filter(kv => (kv.value / (kv.kpi.targetValue || 100)) >= 1.2).length
    const suggestion = critical > 10 ? 'Acil eylem planı' : excellent > 5 ? 'Best practice paylaşımı' : 'Düzenli takip'
    rows.push([f.name, total, critical, excellent, suggestion])
  })

  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [{ width: 24 }, { width: 12 }, { width: 12 }, { width: 16 }, { width: 28 }]
  XLSX.utils.book_append_sheet(workbook, ws, 'AI İçgörüleri')

  // Semantic sheet
  const kpiSeries: Record<string, { kpi: any; series: Array<{ period: string; value: number }> }> = {}
  const perKpiPerPeriod: Record<string, Record<string, { sum: number; count: number }>> = {}
  factories.forEach(f => {
    f.kpiValues.forEach(kv => {
      const k = kv.kpi
      if (!perKpiPerPeriod[k.id]) perKpiPerPeriod[k.id] = {}
      if (!perKpiPerPeriod[k.id][kv.period]) perKpiPerPeriod[k.id][kv.period] = { sum: 0, count: 0 }
      perKpiPerPeriod[k.id][kv.period].sum += kv.value
      perKpiPerPeriod[k.id][kv.period].count += 1
      if (!kpiSeries[k.id]) kpiSeries[k.id] = { kpi: k, series: [] }
    })
  })
  Object.entries(perKpiPerPeriod).forEach(([kpiId, per]) => {
    const series = periods.map(p => {
      const e = per[p]
      const avg = e && e.count > 0 ? e.sum / e.count : 0
      return { period: p, value: avg }
    })
    if (kpiSeries[kpiId]) kpiSeries[kpiId].series = series
  })

  const kpiData: Record<string, Array<{ period: string; value: number }>> = {}
  Object.entries(kpiSeries).forEach(([id, obj]) => { kpiData[id] = obj.series })
  const corr = AdvancedAnalyticsEngine.analyzeCorrelations(kpiData)
  const topCorrByKpi: Record<string, Array<{ otherId: string; coefficient: number }>> = {}
  corr.correlations.forEach(c => {
    if (Math.abs(c.coefficient) >= 0.7) {
      if (!topCorrByKpi[c.kpi1]) topCorrByKpi[c.kpi1] = []
      if (!topCorrByKpi[c.kpi2]) topCorrByKpi[c.kpi2] = []
      topCorrByKpi[c.kpi1].push({ otherId: c.kpi2, coefficient: c.coefficient })
      topCorrByKpi[c.kpi2].push({ otherId: c.kpi1, coefficient: c.coefficient })
    }
  })

  const semanticRows: any[] = [[
    'KPI No', 'KPI Adı', 'Stratejik Amaç', 'Stratejik Hedef', 'Temalar', 'Rol', 'Etiketler', 'Başarı (%)', 'Trend', 'Öneri', 'Hipotez', 'İlişkili KPI’lar'
  ]]
  Object.entries(kpiSeries).forEach(([kpiId, obj]) => {
    const k = obj.kpi
    const profile = AdvancedAnalyticsEngine.generatePerformanceProfile(
      kpiId,
      k.name || k.description || `KPI ${k.number}`,
      obj.series,
      k.targetValue || 100,
      undefined,
      { description: k.description, themes: (k as any).themes || null, strategicGoal: (k as any).strategicTarget?.strategicGoal?.title || null, strategicTarget: (k as any).strategicTarget?.title || null } as any,
      topCorrByKpi[kpiId]
    )
    const related = (profile.semantic?.relatedKPIs || []).slice(0,3).map(r => {
      const other = (kpiSeries as any)[r.kpiId]?.kpi
      const label = other ? `#${other.number}` : r.kpiId
      return `${label} ${r.relation}`
    }).join('; ')
    semanticRows.push([
      k.number,
      k.name || k.description || '',
      profile.semantic?.strategicGoal || '',
      profile.semantic?.strategicTarget || '',
      (profile.semantic?.themes || []).join(','),
      profile.semantic?.role || '',
      (profile.semantic?.tags || []).slice(0,5).join(','),
      profile.achievementRate,
      `${profile.trend.direction} (${profile.trend.slope.toFixed(2)})`,
      profile.recommendations[0] || '',
      (profile.semantic?.hypotheses || [])[0] || '',
      related
    ])
  })
  const ws2 = XLSX.utils.aoa_to_sheet(semanticRows)
  ws2['!cols'] = [
    { width: 8 }, { width: 28 }, { width: 22 }, { width: 22 }, { width: 18 }, { width: 10 }, { width: 24 }, { width: 12 }, { width: 16 }, { width: 40 }, { width: 40 }, { width: 22 }
  ]
  XLSX.utils.book_append_sheet(workbook, ws2, 'AI_Semantic')
  return workbook
}

async function generateComprehensiveUpper(startPeriod: string, endPeriod: string, factoryIds?: string[]): Promise<XLSX.WorkBook> {
  const exec = await generateExecutiveSummary(startPeriod, endPeriod, factoryIds)
  const bench = await generateUpperBenchmark(startPeriod, endPeriod, factoryIds)
  const trend = await generateUpperTrendForecast(startPeriod, endPeriod, factoryIds)

  const workbook = XLSX.utils.book_new()
  exec.SheetNames.forEach(n => XLSX.utils.book_append_sheet(workbook, exec.Sheets[n], n))
  bench.SheetNames.forEach(n => XLSX.utils.book_append_sheet(workbook, bench.Sheets[n], `BM_${n}`))
  trend.SheetNames.forEach(n => XLSX.utils.book_append_sheet(workbook, trend.Sheets[n], `Trend_${n}`))
  return workbook
}

function buildPeriodRange(start: string, end: string): string[] {
  const [sy, sq] = start.split('-')
  const [ey, eq] = end.split('-')
  const startVal = parseInt(sy) * 4 + parseInt(sq.replace('Q', ''))
  const endVal = parseInt(ey) * 4 + parseInt(eq.replace('Q', ''))
  const result: string[] = []
  for (let v = startVal; v <= endVal; v++) {
    const y = Math.floor(v / 4)
    const q = v % 4 === 0 ? 4 : v % 4
    const year = q === 4 ? y : y
    result.push(`${year}-Q${q}`)
  }
  return result
}


