import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AdvancedAnalyticsEngine } from '@/lib/advanced-analytics'

export async function POST(request: NextRequest) {
  try {
    const { startPeriod, endPeriod, reportType, factoryIds } = await request.json()
    if (!startPeriod || !endPeriod) {
      return NextResponse.json({ error: 'Başlangıç ve bitiş dönemleri gerekli' }, { status: 400 })
    }

    // Basit HTML rapor oluşturma (üst yönetim odaklı)
    const periods = buildPeriodRange(startPeriod, endPeriod)
    const factories = await prisma.modelFactory.findMany({
      where: factoryIds && factoryIds.length ? { id: { in: factoryIds } } : {},
      include: { kpiValues: { where: { period: { in: periods } }, include: { kpi: true } } }
    })

    const html = generateHTMLReport(factories, startPeriod, endPeriod, reportType)
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `UM_${reportType || 'report'}_${startPeriod}_to_${endPeriod}_${timestamp}.html`

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error('❌ Upper PDF export error:', error)
    return NextResponse.json({ error: 'Upper management PDF raporu oluşturulamadı', detail: String(error) }, { status: 500 })
  }
}

function generateHTMLReport(factories: any[], startPeriod: string, endPeriod: string, reportType: string): string {
  const periods = buildPeriodRange(startPeriod, endPeriod)
  const data = factories.map(f => {
    const perPeriodAvg: Record<string, number> = {}
    periods.forEach(p => {
      const values = f.kpiValues.filter((kv: any) => kv.period === p)
      const avg = values.length > 0
        ? (values.reduce((s: number, kv: any) => s + Math.min((kv.value / (kv.kpi.targetValue || 100)) * 100, 100), 0) / values.length)
        : 0
      perPeriodAvg[p] = Number(avg.toFixed(1))
    })
    const flatCount = f.kpiValues.length
    const flatAvg = flatCount > 0
      ? (f.kpiValues.reduce((s: number, kv: any) => s + Math.min((kv.value / (kv.kpi.targetValue || 100)) * 100, 100), 0) / flatCount)
      : 0
    const critical = f.kpiValues.filter((kv: any) => (kv.value / (kv.kpi.targetValue || 100)) < 0.5).length
    const excellent = f.kpiValues.filter((kv: any) => (kv.value / (kv.kpi.targetValue || 100)) >= 1).length
    return { name: f.name, code: f.code, perPeriodAvg, count: flatCount, avg: Number(flatAvg.toFixed(1)), critical, excellent }
  })

  const ranking = [...data].sort((a, b) => b.avg - a.avg)
  const overallAvg = data.length ? (data.reduce((s, a) => s + a.avg, 0) / data.length).toFixed(1) : '0.0'
  const totalFactories = data.length

  const titleMap: Record<string, string> = {
    executive_summary: 'Yönetsel Özet Raporu',
    factory_benchmark: 'Fabrika Benchmark Raporu',
    trend_forecast: 'Trend ve Tahmin Raporu',
    ai_insights: 'AI İçgörüleri Raporu',
    comprehensive: 'Kapsamlı Yönetim Raporu'
  }
  const title = titleMap[reportType] || 'Üst Yönetim Raporu'

  function renderSection(): string {
    if (reportType === 'factory_benchmark') {
      return `
        <div class="summary">
          <div class="card"><div><strong>Toplam Fabrika:</strong></div><div style="font-size:20px;">${totalFactories}</div></div>
          <div class="card"><div><strong>Ortalama Başarı:</strong></div><div style="font-size:20px;">%${overallAvg}</div></div>
          <div class="card"><div><strong>En İyi Fabrika:</strong></div><div style="font-size:16px;">${ranking[0]?.name || '-'}</div></div>
        </div>
        <div class="section">
          <h3>Benchmark Sıralaması</h3>
          <table>
            <thead><tr><th>Sıra</th><th>Kod</th><th>Fabrika</th><th>Ortalama Başarı (%)</th><th>KPI</th></tr></thead>
            <tbody>
              ${ranking.map((r, i) => `<tr><td>${i+1}</td><td>${r.code||''}</td><td>${r.name}</td><td><strong>%${r.avg}</strong></td><td>${r.count}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      `
    }

    if (reportType === 'trend_forecast') {
      return `
        <div class="summary">
          <div class="card"><div><strong>Kapsanan Dönem:</strong></div><div style="font-size:16px;">${startPeriod} → ${endPeriod}</div></div>
          <div class="card"><div><strong>Fabrika Sayısı:</strong></div><div style="font-size:20px;">${totalFactories}</div></div>
        </div>
        <div class="section">
          <h3>Fabrika Bazlı Dönemsel Ortalama</h3>
          <table>
            <thead>
              <tr><th>Fabrika</th>${periods.map(p => `<th>${p}</th>`).join('')}<th>Değişim (%)</th><th>Trend</th></tr>
            </thead>
            <tbody>
              ${data.map(row => {
                const vals = periods.map(p => row.perPeriodAvg[p] || 0)
                const change = vals.length ? (vals[vals.length-1] - vals[0]) : 0
                const changePct = vals[0] > 0 ? ((change / vals[0]) * 100) : 0
                const trend = changePct > 5 ? 'Artan' : changePct < -5 ? 'Azalan' : 'Sabit'
                return `<tr><td>${row.name}</td>${vals.map(v => `<td>%${v.toFixed(1)}</td>`).join('')}<td>%${changePct.toFixed(1)}</td><td>${trend}</td></tr>`
              }).join('')}
            </tbody>
          </table>
        </div>
      `
    }

    if (reportType === 'ai_insights') {
      // Build semantic cards using cohort KPI series
      const kpiSeries: Record<string, { kpi: any; series: Array<{ period: string; value: number }> }> = {}
      const perKpiPerPeriod: Record<string, Record<string, { sum: number; count: number }>> = {}
      factories.forEach(f => {
        f.kpiValues.forEach((kv: any) => {
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
          const e = (per as any)[p]
          const avg = e && e.count > 0 ? e.sum / e.count : 0
          return { period: p, value: avg }
        })
        if (kpiSeries[kpiId]) kpiSeries[kpiId].series = series
      })

      const kpiData: Record<string, Array<{ period: string; value: number }>> = {}
      Object.entries(kpiSeries).forEach(([id, obj]) => { (kpiData as any)[id] = (obj as any).series })
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

      const semanticCards = Object.entries(kpiSeries).slice(0, 12).map(([kpiId, obj]) => {
        const k: any = (obj as any).kpi
        const profile = AdvancedAnalyticsEngine.generatePerformanceProfile(
          kpiId,
          k.name || k.description || `KPI ${k.number}`,
          (obj as any).series,
          k.targetValue || 100,
          undefined,
          { description: k.description, themes: k.themes || null, strategicGoal: k.strategicTarget?.strategicGoal?.title || null, strategicTarget: k.strategicTarget?.title || null } as any,
          topCorrByKpi[kpiId]
        )
        const related = (profile.semantic?.relatedKPIs || []).slice(0,3).map(r => `${r.kpiId} ${r.relation}`).join(', ')
        return `
          <div class="card" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:12px;margin-bottom:8px;">
            <div style="font-weight:600;color:#9a3412;">#${k.number} ${k.name || ''}</div>
            <div style="font-size:12px;color:#7c2d12;">${profile.semantic?.strategicGoal || ''} • ${profile.semantic?.strategicTarget || ''} • ${(profile.semantic?.themes||[]).join(',')}</div>
            <div style="margin-top:6px;font-size:13px;">Rol: <strong>${profile.semantic?.role || ''}</strong> • Etiketler: ${(profile.semantic?.tags||[]).slice(0,5).join(', ')}</div>
            <div style="margin-top:6px;font-size:13px;">Başarı: <strong>${profile.achievementRate}%</strong> • Trend: ${profile.trend.direction} (${profile.trend.slope.toFixed(2)})</div>
            <div style="margin-top:6px;font-size:13px;">Öneri: ${profile.recommendations[0] || ''}</div>
            <div style="margin-top:6px;font-size:12px;color:#6b7280;">Hipotez: ${(profile.semantic?.hypotheses||[])[0] || ''}</div>
            <div style="margin-top:6px;font-size:12px;color:#6b7280;">İlişkili: ${related}</div>
          </div>
        `
      }).join('')

      return `
        <div class="summary">
          <div class="card"><div><strong>Fabrika:</strong></div><div style="font-size:20px;">${totalFactories}</div></div>
          <div class="card"><div><strong>Ortalama Başarı:</strong></div><div style="font-size:20px;">%${overallAvg}</div></div>
        </div>
        <div class="section">
          <h3>AI Öngörüleri ve Öneriler</h3>
          <table>
            <thead><tr><th>Fabrika</th><th>Toplam KPI</th><th>Kritik</th><th>Mükemmel</th><th>Öneri</th></tr></thead>
            <tbody>
              ${data.map(r => {
                const suggestion = r.critical > 10 ? 'Acil eylem planı' : r.excellent > 5 ? 'Best practice paylaşımı' : 'Düzenli takip'
                return `<tr><td>${r.name}</td><td>${r.count}</td><td>${r.critical}</td><td>${r.excellent}</td><td>${suggestion}</td></tr>`
              }).join('')}
            </tbody>
          </table>
          <div class="section">
            <h3>Semantik İçgörüler (Örnekler)</h3>
            ${semanticCards}
          </div>
        </div>
      `
    }

    // executive_summary or default
    const best = ranking[0]?.name || '-'
    const worst = ranking[ranking.length - 1]?.name || '-'
    return `
      <div class="summary">
        <div class="card"><div><strong>Toplam Fabrika:</strong></div><div style="font-size:20px;">${totalFactories}</div></div>
        <div class="card"><div><strong>Ortalama Başarı:</strong></div><div style="font-size:20px;">%${overallAvg}</div></div>
        <div class="card"><div><strong>En İyi Fabrika:</strong></div><div style="font-size:16px;">${best}</div></div>
        <div class="card"><div><strong>En Düşük Fabrika:</strong></div><div style="font-size:16px;">${worst}</div></div>
      </div>
      <div class="section">
        <h3>Özet Benchmark</h3>
        <table>
          <thead><tr><th>Sıra</th><th>Fabrika</th><th>Ortalama (%)</th><th>KPI</th></tr></thead>
          <tbody>
            ${ranking.slice(0, 10).map((r, i) => `<tr><td>${i+1}</td><td>${r.name}</td><td>%${r.avg}</td><td>${r.count}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    `
  }

  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} - ${startPeriod} - ${endPeriod}</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f6f7fb; color: #333; padding: 24px; }
    .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); overflow: hidden; }
    .header { background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; padding: 24px; }
    .header h1 { margin: 0 0 6px; }
    .content { padding: 24px; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-bottom: 16px; }
    .card { background: #f8fafc; padding: 14px; border-radius: 8px; border-left: 4px solid #2563eb; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: left; font-size: 14px; }
    th { background: #f1f5f9; }
    tr:nth-child(even) { background: #fafafa; }
    .badge { padding: 3px 8px; border-radius: 999px; font-size: 12px; font-weight: 600; }
    .good { background: #dcfce7; color: #166534; }
    .warn { background: #fef9c3; color: #854d0e; }
    .crit { background: #fee2e2; color: #991b1b; }
    .section { margin-top: 22px; }
    .section h3 { margin: 10px 0; color: #1f2937; }
  </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>${title}</h1>
        <p>${startPeriod} - ${endPeriod} dönemi</p>
      </div>
      <div class="content">
        ${renderSection()}
      </div>
    </div>
  </body>
  </html>
  `
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


