import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { factoryId, period, reportType } = await request.json()
    
    console.log('📄 PDF export starting:', { factoryId, period, reportType })

    if (!factoryId) {
      return NextResponse.json({ error: 'Factory ID gerekli' }, { status: 400 })
    }

    // Fabrika bilgilerini al
    const factory = await prisma.modelFactory.findUnique({
      where: { id: factoryId }
    })

    if (!factory) {
      return NextResponse.json({ error: 'Fabrika bulunamadı' }, { status: 404 })
    }

    // KPI verilerini al (ilgili dönem)
    const kpiData = await prisma.kpiValue.findMany({
      where: { factoryId, period },
      include: { 
        kpi: {
          include: {
            strategicTarget: { include: { strategicGoal: true } }
          }
        }
      },
      orderBy: { kpi: { number: 'asc' } }
    })

    let htmlContent = ''
    switch (reportType) {
      case 'benchmark': {
        // Tüm fabrikaları çekip tek dönem için benchmark oluştur
        const all = await prisma.modelFactory.findMany({
          include: { kpiValues: { where: { period }, include: { kpi: true } } }
        })
        htmlContent = generateBenchmarkHTML(factory, period, all)
        break
      }
      case 'trend_analysis': {
        const periods = getLastNPeriods(period, 4)
        const trendData = await prisma.kpiValue.findMany({
          where: { factoryId, period: { in: periods } },
          include: { kpi: true },
          orderBy: [{ kpi: { number: 'asc' } }, { period: 'asc' }]
        })
        htmlContent = generateTrendHTML(factory, periods, trendData)
        break
      }
      case 'ai_insights': {
        htmlContent = generateAIInsightsHTML(factory, kpiData, period)
        break
      }
      case 'comprehensive': {
        const all = await prisma.modelFactory.findMany({
          include: { kpiValues: { where: { period }, include: { kpi: true } } }
        })
        const periods = getLastNPeriods(period, 4)
        const trendData = await prisma.kpiValue.findMany({
          where: { factoryId, period: { in: periods } },
          include: { kpi: true },
          orderBy: [{ kpi: { number: 'asc' } }, { period: 'asc' }]
        })
        htmlContent = [
          generateKPIHTML(factory, kpiData, period),
          '<hr/>',
          generateBenchmarkHTML(factory, period, all),
          '<hr/>',
          generateTrendHTML(factory, periods, trendData),
          '<hr/>',
          generateAIInsightsHTML(factory, kpiData, period)
        ].join('\n')
        break
      }
      default: {
        htmlContent = generateKPIHTML(factory, kpiData, period)
      }
    }

    // HTML response
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `${factory.code}_${reportType || 'report'}_${period}_${timestamp}.html`

    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      }
    })

  } catch (error) {
    console.error('❌ PDF export error:', error)
    return NextResponse.json(
      { success: false, error: 'PDF raporu oluşturulamadı', detail: String(error) },
      { status: 500 }
    )
  }
}

function generateKPIHTML(factory: any, kpiData: any[], period: string): string {
  const timestamp = new Date().toLocaleDateString('tr-TR')
  const totalKpis = kpiData.length
  const achievedKpis = kpiData.filter(k => (k.value / (k.kpi.targetValue || 100)) >= 1).length
  const criticalKpis = kpiData.filter(k => (k.value / (k.kpi.targetValue || 100)) < 0.5).length
  const avgSuccess = totalKpis > 0 ? (kpiData.reduce((sum, k) => sum + (k.value / (k.kpi.targetValue || 100)), 0) / totalKpis * 100).toFixed(1) : '0.0'

  return `
  <div class="container" style="margin-bottom:24px;">
    <div class="header"><h1>${factory.name} KPI Raporu</h1><p>${period} Dönemi Performans Analizi</p></div>
    <div class="content">
      <div class="summary">
        <div class="summary-card"><h3>${totalKpis}</h3><p>Toplam KPI</p></div>
        <div class="summary-card"><h3>${achievedKpis}</h3><p>Hedef Aşan</p></div>
        <div class="summary-card"><h3>${criticalKpis}</h3><p>Kritik Durum</p></div>
        <div class="summary-card"><h3>%${avgSuccess}</h3><p>Ortalama Başarı</p></div>
      </div>
      <div class="table-container"><h3>📋 KPI Detay Analizi</h3>
        <table><thead><tr><th>KPI No</th><th>Açıklama</th><th>Mevcut</th><th>Hedef</th><th>Başarı %</th><th>Durum</th><th>Stratejik Hedef</th></tr></thead>
        <tbody>
          ${kpiData.map(item => {
            const achievementRate = ((item.value / (item.kpi.targetValue || 100)) * 100)
            const status = achievementRate >= 100 ? 'Mükemmel' : achievementRate >= 80 ? 'İyi' : achievementRate >= 50 ? 'Orta' : 'Kritik'
            return `<tr><td><strong>${item.kpi.number}</strong></td><td>${item.kpi.description.substring(0, 80)}${item.kpi.description.length > 80 ? '...' : ''}</td><td>${item.value.toFixed(2)}</td><td>${item.kpi.targetValue || 100}</td><td><strong>${achievementRate.toFixed(1)}%</strong></td><td>${status}</td><td>${item.kpi.strategicTarget?.name || '-'}</td></tr>`
          }).join('')}
        </tbody></table>
      </div>
      <div style="margin-top:12px;color:#555;">Rapor Tarihi: ${timestamp}</div>
    </div>
  </div>`
}

function generateBenchmarkHTML(factory: any, period: string, allFactories: any[]): string {
  const ranking = allFactories.map(f => {
    const values = (f.kpiValues || [])
    const count = values.length
    const avg = count > 0 ? (values.reduce((s: number, kv: any) => s + Math.min((kv.value / (kv.kpi?.targetValue || 100)) * 100, 100), 0) / count) : 0
    return { name: f.name, code: f.code, id: f.id, avg: Number(avg.toFixed(1)), count }
  }).sort((a, b) => b.avg - a.avg)
  const myRank = ranking.findIndex(r => r.code === factory.code) + 1
  const total = ranking.length
  const overallAvg = total ? (ranking.reduce((s, r) => s + r.avg, 0) / total).toFixed(1) : '0.0'
  return `
  <div class="container" style="margin-bottom:24px;">
    <div class="header"><h1>Benchmark Raporu</h1><p>${period} dönemi</p></div>
    <div class="content">
      <div class="summary">
        <div class="summary-card"><h3>${myRank}/${total}</h3><p>${factory.name} Sıralama</p></div>
        <div class="summary-card"><h3>%${overallAvg}</h3><p>Sektör Ortalaması</p></div>
      </div>
      <div class="table-container"><h3>Fabrika Sıralaması</h3>
        <table><thead><tr><th>Sıra</th><th>Kod</th><th>Fabrika</th><th>Ortalama %</th><th>KPI</th></tr></thead>
        <tbody>
          ${ranking.slice(0, 25).map((r, i) => `<tr><td>${i+1}</td><td>${r.code||''}</td><td>${r.name}</td><td>%${r.avg}</td><td>${r.count}</td></tr>`).join('')}
        </tbody></table>
      </div>
    </div>
  </div>`
}

function generateTrendHTML(factory: any, periods: string[], trendData: any[]): string {
  // KPI bazında grupla ve dönemsel ortalamayı hesapla
  const periodToValues: Record<string, number[]> = {}
  periods.forEach(p => periodToValues[p] = [])
  trendData.forEach(item => {
    const rate = Math.min((item.value / (item.kpi.targetValue || 100)) * 100, 100)
    periodToValues[item.period]?.push(rate)
  })
  const periodAvg = periods.map(p => {
    const arr = periodToValues[p]
    const avg = arr.length ? (arr.reduce((s, v) => s + v, 0) / arr.length) : 0
    return Number(avg.toFixed(1))
  })
  const change = periodAvg.length ? (periodAvg[periodAvg.length - 1] - periodAvg[0]) : 0
  const changePct = periodAvg[0] > 0 ? ((change / periodAvg[0]) * 100) : 0
  const trend = changePct > 5 ? 'Artan' : changePct < -5 ? 'Azalan' : 'Sabit'

  return `
  <div class="container" style="margin-bottom:24px;">
    <div class="header"><h1>Trend Analizi</h1><p>${periods[0]} → ${periods[periods.length-1]}</p></div>
    <div class="content">
      <div class="summary">
        <div class="summary-card"><h3>%${periodAvg[0] || 0}</h3><p>İlk Dönem</p></div>
        <div class="summary-card"><h3>%${periodAvg[periodAvg.length-1] || 0}</h3><p>Son Dönem</p></div>
        <div class="summary-card"><h3>%${changePct.toFixed(1)}</h3><p>Değişim</p></div>
        <div class="summary-card"><h3>${trend}</h3><p>Trend</p></div>
      </div>
      <div class="table-container"><h3>Dönemsel Ortalama</h3>
        <table><thead><tr>${periods.map(p => `<th>${p}</th>`).join('')}</tr></thead>
        <tbody><tr>${periodAvg.map(v => `<td>%${v}</td>`).join('')}</tr></tbody></table>
      </div>
    </div>
  </div>`
}

function generateAIInsightsHTML(factory: any, kpiData: any[], period: string): string {
  const critical = kpiData.filter(k => (k.value / (k.kpi.targetValue || 100)) < 0.5)
  const excellent = kpiData.filter(k => (k.value / (k.kpi.targetValue || 100)) >= 1.2)
  return `
  <div class="container" style="margin-bottom:24px;">
    <div class="header"><h1>AI Öngörüleri</h1><p>${factory.name} • ${period}</p></div>
    <div class="content">
      <div class="summary">
        <div class="summary-card"><h3>${critical.length}</h3><p>Kritik KPI</p></div>
        <div class="summary-card"><h3>${excellent.length}</h3><p>Mükemmel KPI</p></div>
      </div>
      <div class="table-container"><h3>Öncelikli Öneriler</h3>
        <table><thead><tr><th>Tür</th><th>KPI</th><th>Açıklama</th><th>Öneri</th></tr></thead>
        <tbody>
          ${critical.slice(0, 5).map(k => `<tr><td>Kritik</td><td>${k.kpi.number}</td><td>${k.kpi.description.substring(0,60)}${k.kpi.description.length>60?'...':''}</td><td>Acil eylem planı ve haftalık takip</td></tr>`).join('')}
          ${excellent.slice(0, 3).map(k => `<tr><td>Mükemmel</td><td>${k.kpi.number}</td><td>${k.kpi.description.substring(0,60)}${k.kpi.description.length>60?'...':''}</td><td>Best practice olarak paylaşım ve yaygınlaştırma</td></tr>`).join('')}
        </tbody></table>
      </div>
    </div>
  </div>`
}

function getLastNPeriods(latest: string, n: number): string[] {
  // latest format: YYYY-QX
  const [y, q] = latest.split('-')
  let year = parseInt(y)
  let quarter = parseInt(q.replace('Q', ''))
  const out: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    let yy = year
    let qq = quarter - i
    while (qq <= 0) {
      yy -= 1
      qq += 4
    }
    out.push(`${yy}-Q${qq}`)
  }
  return out
}

function generateSimpleChart(kpiData: any[]): string {
  const categories = [
    { name: 'Kritik (<50%)', color: '#f44336', count: kpiData.filter(k => (k.value / (k.kpi.targetValue || 100)) < 0.5).length },
    { name: 'Orta (50-80%)', color: '#ff9800', count: kpiData.filter(k => { const r = (k.value / (k.kpi.targetValue || 100)); return r >= 0.5 && r < 0.8; }).length },
    { name: 'İyi (80-100%)', color: '#2196f3', count: kpiData.filter(k => { const r = (k.value / (k.kpi.targetValue || 100)); return r >= 0.8 && r < 1; }).length },
    { name: 'Mükemmel (≥100%)', color: '#4caf50', count: kpiData.filter(k => (k.value / (k.kpi.targetValue || 100)) >= 1).length }
  ]
  
  const maxCount = Math.max(...categories.map(c => c.count), 1)
  
  return categories.map(cat => `
    <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 10px;">
      <div style="
        width: 100%; 
        height: ${(cat.count / maxCount) * 150}px; 
        background: ${cat.color}; 
        border-radius: 4px 4px 0 0;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 1.2em;
      ">${cat.count}</div>
      <div style="font-size: 0.85em; text-align: center; color: #666; line-height: 1.3;">
        ${cat.name}
      </div>
    </div>
  `).join('')
}
