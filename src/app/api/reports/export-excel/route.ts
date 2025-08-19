import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  try {
    const { factoryId, period, reportType } = await request.json()
    
    console.log('📊 Excel export starting:', { factoryId, period, reportType })

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

    let workbook: XLSX.WorkBook
    
    switch (reportType) {
      case 'kpi_performance':
        workbook = await generateKPIPerformanceReport(factoryId, period, factory)
        break
      case 'benchmark':
        workbook = await generateBenchmarkReport(factoryId, period, factory)
        break
      case 'trend_analysis':
        workbook = await generateTrendAnalysisReport(factoryId, period, factory)
        break
      case 'ai_insights':
        workbook = await generateAIInsightsReport(factoryId, period, factory)
        break
      default:
        workbook = await generateComprehensiveReport(factoryId, period, factory)
    }

    // Excel dosyasını buffer'a çevir
    const buffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx',
      compression: true 
    })

    // Dosya adı oluştur
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `${factory.code}_${reportType || 'comprehensive'}_${period}_${timestamp}.xlsx`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString()
      }
    })

  } catch (error) {
    console.error('❌ Excel export error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Excel raporu oluşturulamadı',
        detail: String(error)
      }, 
      { status: 500 }
    )
  }
}

// KPI Performans Raporu
async function generateKPIPerformanceReport(factoryId: string, period: string, factory: any): Promise<XLSX.WorkBook> {
  const workbook = XLSX.utils.book_new()

  // KPI verilerini al
  const kpiData = await prisma.kpiValue.findMany({
    where: { factoryId, period },
    include: { 
      kpi: {
        include: {
          strategicTarget: {
            include: {
              strategicGoal: true
            }
          }
        }
      }
    },
    orderBy: { kpi: { number: 'asc' } }
  })

  // Özet sayfası
  const summaryData = [
    ['KPI PERFORMANS RAPORU'],
    [''],
    ['Fabrika:', factory.name],
    ['Kod:', factory.code],
    ['Dönem:', period],
    ['Rapor Tarihi:', new Date().toLocaleDateString('tr-TR')],
    [''],
    ['GENEL İSTATİSTİKLER'],
    ['Toplam KPI Sayısı:', kpiData.length],
    ['Hedef Aşan KPI:', kpiData.filter(k => (k.value / (k.kpi.targetValue || 100)) >= 1).length],
    ['Kritik KPI (<%50):', kpiData.filter(k => (k.value / (k.kpi.targetValue || 100)) < 0.5).length],
    ['Ortalama Başarı Oranı:', `${(kpiData.reduce((sum, k) => sum + (k.value / (k.kpi.targetValue || 100)), 0) / kpiData.length * 100).toFixed(1)}%`]
  ]

  const summaryWS = XLSX.utils.aoa_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(workbook, summaryWS, 'Özet')

  // Detay sayfası
  const detailData = [
    ['KPI No', 'KPI Açıklaması', 'Stratejik Amaç', 'Stratejik Hedef', 'Mevcut Değer', 'Hedef Değer', 'Başarı Oranı (%)', 'Durum', 'Birim']
  ]

  kpiData.forEach(item => {
    const achievementRate = ((item.value / (item.kpi.targetValue || 100)) * 100).toFixed(1)
    const status = parseFloat(achievementRate) >= 100 ? 'Hedef Aşıldı' :
                  parseFloat(achievementRate) >= 80 ? 'İyi' :
                  parseFloat(achievementRate) >= 50 ? 'Orta' : 'Kritik'

    detailData.push([
      item.kpi.number,
      item.kpi.description,
      item.kpi.strategicTarget?.strategicGoal?.title || '',
      item.kpi.strategicTarget?.name || '',
      item.value,
      item.kpi.targetValue || 100,
      achievementRate,
      status,
      item.kpi.unit || ''
    ])
  })

  const detailWS = XLSX.utils.aoa_to_sheet(detailData)
  
  // Sütun genişlikleri
  detailWS['!cols'] = [
    { width: 8 }, { width: 50 }, { width: 25 }, { width: 25 },
    { width: 15 }, { width: 15 }, { width: 15 }, { width: 12 }, { width: 10 }
  ]

  XLSX.utils.book_append_sheet(workbook, detailWS, 'KPI Detayları')

  return workbook
}

// Benchmark Raporu
async function generateBenchmarkReport(factoryId: string, period: string, factory: any): Promise<XLSX.WorkBook> {
  const workbook = XLSX.utils.book_new()

  // Tüm fabrikaların performansını al
  const allFactoriesData = await prisma.modelFactory.findMany({
    include: {
      kpiValues: {
        where: { period },
        include: { kpi: true }
      }
    }
  })

  // Benchmark hesapla
  const benchmarkData = allFactoriesData.map(f => {
    const avgScore = f.kpiValues.length > 0 ? 
      f.kpiValues.reduce((sum, kv) => sum + Math.min((kv.value / (kv.kpi.targetValue || 100)) * 100, 100), 0) / f.kpiValues.length : 0
    
    return {
      factory: f,
      averageScore: avgScore,
      kpiCount: f.kpiValues.length
    }
  }).sort((a, b) => b.averageScore - a.averageScore)

  // Sıralama sayfası
  const rankingData = [
    ['FABRIKA SIRALAMASI - ' + period],
    [''],
    ['Sıra', 'Fabrika Kodu', 'Fabrika Adı', 'Ortalama Skor (%)', 'KPI Sayısı', 'Performans Seviyesi']
  ]

  benchmarkData.forEach((item, index) => {
    const level = item.averageScore >= 90 ? 'Mükemmel' :
                  item.averageScore >= 80 ? 'İyi' :
                  item.averageScore >= 70 ? 'Orta' : 'Düşük'

    rankingData.push([
      index + 1,
      item.factory.code,
      item.factory.name,
      item.averageScore.toFixed(1),
      item.kpiCount,
      level
    ])
  })

  const rankingWS = XLSX.utils.aoa_to_sheet(rankingData)
  rankingWS['!cols'] = [
    { width: 8 }, { width: 12 }, { width: 25 }, { width: 15 }, { width: 12 }, { width: 15 }
  ]
  
  XLSX.utils.book_append_sheet(workbook, rankingWS, 'Sıralama')

  // Mevcut fabrikanın detayı
  const currentFactory = benchmarkData.find(item => item.factory.id === factoryId)
  if (currentFactory) {
    const myRank = benchmarkData.findIndex(item => item.factory.id === factoryId) + 1
    const totalFactories = benchmarkData.length
    const percentile = ((totalFactories - myRank) / (totalFactories - 1) * 100).toFixed(1)

    const myDetailData = [
      [`${factory.name} DETAY RAPORU`],
      [''],
      ['Fabrika Sıralaması:', `${myRank} / ${totalFactories}`],
      ['Percentile:', `%${percentile}`],
      ['Ortalama Skor:', `%${currentFactory.averageScore.toFixed(1)}`],
      ['Sektör Ortalaması:', `%${(benchmarkData.reduce((sum, b) => sum + b.averageScore, 0) / totalFactories).toFixed(1)}`],
      ['Fark:', `%${(currentFactory.averageScore - (benchmarkData.reduce((sum, b) => sum + b.averageScore, 0) / totalFactories)).toFixed(1)}`]
    ]

    const myDetailWS = XLSX.utils.aoa_to_sheet(myDetailData)
    XLSX.utils.book_append_sheet(workbook, myDetailWS, 'Benim Durumum')
  }

  return workbook
}

// Trend Analizi Raporu
async function generateTrendAnalysisReport(factoryId: string, period: string, factory: any): Promise<XLSX.WorkBook> {
  const workbook = XLSX.utils.book_new()

  // Son 4 dönem verilerini al
  const periods = ['2024-Q1', '2024-Q2', '2024-Q3', '2024-Q4']
  const trendData = await prisma.kpiValue.findMany({
    where: { 
      factoryId,
      period: { in: periods }
    },
    include: { kpi: true },
    orderBy: [{ kpi: { number: 'asc' } }, { period: 'asc' }]
  })

  // KPI bazında grupla
  const kpiGroups = new Map()
  trendData.forEach(item => {
    if (!kpiGroups.has(item.kpi.number)) {
      kpiGroups.set(item.kpi.number, {
        kpi: item.kpi,
        values: []
      })
    }
    kpiGroups.get(item.kpi.number).values.push({
      period: item.period,
      value: item.value
    })
  })

  // Trend analizi sayfası
  const trendAnalysisData = [
    ['TREND ANALİZİ RAPORU'],
    [''],
    ['KPI No', 'KPI Açıklaması', '2024-Q1', '2024-Q2', '2024-Q3', '2024-Q4', 'Trend', 'Değişim (%)']
  ]

  kpiGroups.forEach((group, kpiNumber) => {
    const values = periods.map(p => {
      const item = group.values.find(v => v.period === p)
      return item ? item.value : 0
    })

    const firstValue = values[0] || 0
    const lastValue = values[values.length - 1] || 0
    const changePercent = firstValue > 0 ? ((lastValue - firstValue) / firstValue * 100).toFixed(1) : '0.0'
    const trend = parseFloat(changePercent) > 5 ? 'Artan' :
                  parseFloat(changePercent) < -5 ? 'Azalan' : 'Sabit'

    trendAnalysisData.push([
      kpiNumber,
      group.kpi.description,
      values[0] || '',
      values[1] || '',
      values[2] || '',
      values[3] || '',
      trend,
      changePercent
    ])
  })

  const trendWS = XLSX.utils.aoa_to_sheet(trendAnalysisData)
  trendWS['!cols'] = [
    { width: 8 }, { width: 40 }, { width: 12 }, { width: 12 }, 
    { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }
  ]

  XLSX.utils.book_append_sheet(workbook, trendWS, 'Trend Analizi')

  return workbook
}

// AI Insights Raporu
async function generateAIInsightsReport(factoryId: string, period: string, factory: any): Promise<XLSX.WorkBook> {
  const workbook = XLSX.utils.book_new()

  // AI önerilerini al (API çağrısı yerine basit hesaplama)
  const kpiData = await prisma.kpiValue.findMany({
    where: { factoryId, period },
    include: { kpi: true },
    orderBy: { kpi: { number: 'asc' } }
  })

  // Basit AI analizi
  const insights = []
  const criticalKpis = kpiData.filter(k => (k.value / (k.kpi.targetValue || 100)) < 0.5)
  const excellentKpis = kpiData.filter(k => (k.value / (k.kpi.targetValue || 100)) >= 1.2)

  // AI önerileri sayfası
  const aiData = [
    ['AI INSIGHTS RAPORU'],
    [''],
    ['Toplam KPI:', kpiData.length],
    ['Kritik KPI:', criticalKpis.length],
    ['Mükemmel KPI:', excellentKpis.length],
    [''],
    ['ÖNCELİKLİ ÖNERİLER'],
    ['']
  ]

  if (criticalKpis.length > 0) {
    aiData.push(['KRİTİK DURUM - ACİL MÜDAHALE GEREKLİ'])
    criticalKpis.slice(0, 5).forEach(kpi => {
      aiData.push([`KPI ${kpi.kpi.number}:`, kpi.kpi.description.substring(0, 50) + '...'])
      aiData.push(['Öneri:', 'Acil eylem planı oluşturun ve haftalık takip yapın'])
      aiData.push([''])
    })
  }

  if (excellentKpis.length > 0) {
    aiData.push(['MÜKEMMEL PERFORMANS - SÜRDÜRME STRATEJİSİ'])
    excellentKpis.slice(0, 3).forEach(kpi => {
      aiData.push([`KPI ${kpi.kpi.number}:`, kpi.kpi.description.substring(0, 50) + '...'])
      aiData.push(['Öneri:', 'Bu başarıyı sürdürün ve best practice olarak paylaşın'])
      aiData.push([''])
    })
  }

  const aiWS = XLSX.utils.aoa_to_sheet(aiData)
  aiWS['!cols'] = [{ width: 15 }, { width: 60 }]

  XLSX.utils.book_append_sheet(workbook, aiWS, 'AI Önerileri')

  return workbook
}

// Kapsamlı Rapor
async function generateComprehensiveReport(factoryId: string, period: string, factory: any): Promise<XLSX.WorkBook> {
  const kpiReport = await generateKPIPerformanceReport(factoryId, period, factory)
  const benchmarkReport = await generateBenchmarkReport(factoryId, period, factory)
  const trendReport = await generateTrendAnalysisReport(factoryId, period, factory)
  
  // Tüm sayfaları birleştir
  const workbook = XLSX.utils.book_new()
  
  // KPI raporundan sayfaları kopyala
  kpiReport.SheetNames.forEach(name => {
    XLSX.utils.book_append_sheet(workbook, kpiReport.Sheets[name], name)
  })
  
  // Benchmark raporundan sayfaları kopyala
  benchmarkReport.SheetNames.forEach(name => {
    XLSX.utils.book_append_sheet(workbook, benchmarkReport.Sheets[name], `Benchmark_${name}`)
  })
  
  // Trend raporundan sayfaları kopyala  
  trendReport.SheetNames.forEach(name => {
    XLSX.utils.book_append_sheet(workbook, trendReport.Sheets[name], `Trend_${name}`)
  })

  return workbook
}
