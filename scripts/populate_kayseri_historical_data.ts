import { prisma } from '../src/lib/prisma'

async function populateKayseriHistoricalData() {
  try {
    // Kayseri fabrikasını bul
    const kayseriFabrika = await prisma.modelFactory.findFirst({
      where: { code: 'KAYSERI' }
    })
    
    if (!kayseriFabrika) {
      console.log('❌ Kayseri fabrikası bulunamadı')
      return
    }
    
    console.log('🏭 Kayseri Model Fabrika:', kayseriFabrika.name, '(ID:', kayseriFabrika.id + ')')
    
    // 10 dönem tanımla (2022-Q3'ten 2024-Q4'e)
    const periods = [
      '2022-Q3', '2022-Q4', '2023-Q1', '2023-Q2', '2023-Q3', 
      '2023-Q4', '2024-Q1', '2024-Q2', '2024-Q3', '2024-Q4'
    ]
    
    // KPI'ları al ve kategorize et
    const kpis = await prisma.kpi.findMany({
      orderBy: { number: 'asc' }
    })
    
    console.log('📊', kpis.length, 'KPI için', periods.length, 'dönem veri girişi başlıyor...')
    
    // Mevcut verileri temizle
    const deletedCount = await prisma.kpiValue.deleteMany({
      where: { factoryId: kayseriFabrika.id }
    })
    console.log('🗑️ Mevcut', deletedCount.count, 'veri temizlendi')
    
    let totalInserted = 0
    const cumulativeValues: Record<string, number> = {} // KPI bazında kümülatif değerler
    
    for (const period of periods) {
      const [year, quarter] = period.split('-')
      const yearNum = parseInt(year)
      const quarterNum = parseInt(quarter.substring(1))
      
      console.log(`⏳ ${period} dönemi için veri girişi...`)
      
      for (const kpi of kpis) {
        let value: number
        const desc = (kpi.description || '').toLowerCase()
        const target = kpi.targetValue || 100
        const kpiKey = `kpi_${kpi.number}`
        
        // Reasoning bazlı veri üretimi
        if (desc.includes('toplam') || desc.includes('sayısı') || desc.includes('eğitim verilen') ||
            desc.includes('desteklenen') || desc.includes('gerçekleştirilen') || desc.includes('yapılan') ||
            desc.includes('anlaşma') || desc.includes('sertifika')) {
          
          // KÜMÜLATİF KPI'lar - her dönem artarak devam eder
          if (!cumulativeValues[kpiKey]) {
            cumulativeValues[kpiKey] = Math.floor(Math.random() * 20) + 5 // 5-25 başlangıç
          }
          const growth = Math.floor(Math.random() * 10) + 3 // 3-13 arası artış
          cumulativeValues[kpiKey] += growth
          value = cumulativeValues[kpiKey]
          
        } else if (desc.includes('oranı') || desc.includes('yüzdesi') || desc.includes('memnuniyet') ||
                  desc.includes('başarı') || (kpi.unit && kpi.unit.includes('%'))) {
          
          // PERİYODİK KPI'lar - her dönem farklı performans (reasoning: mevsimsel + trend + rastgele)
          const seasonality = Math.sin((quarterNum - 1) * Math.PI / 2) * 8 // Q1 düşük, Q3 yüksek
          const yearTrend = (yearNum - 2022) * 5 // Yıllık %5 iyileşme
          const quarterTrend = periods.indexOf(period) * 1.5 // Dönemsel iyileşme
          const randomness = (Math.random() - 0.5) * 15 // ±7.5% rastgele
          
          const basePerformance = target * 0.75 // Hedefin %75'i temel performans
          value = Math.max(10, Math.min(100, basePerformance + seasonality + yearTrend + quarterTrend + randomness))
          
        } else {
          // DURUM KPI'ları - yavaş değişen (reasoning: altyapı, sistem sayıları)
          const baseValue = target * 0.8 // Hedefin %80'i
          const slowTrend = periods.indexOf(period) * 0.5 // Yavaş artış
          const smallVariation = (Math.random() - 0.5) * target * 0.05 // ±2.5% değişim
          value = Math.max(target * 0.4, Math.min(target * 1.1, baseValue + slowTrend + smallVariation))
        }
        
        // Veriyi kaydet
        await prisma.kpiValue.create({
          data: {
            value: Math.round(value * 100) / 100, // 2 ondalık basamak
            period,
            year: yearNum,
            quarter: quarterNum,
            kpiId: kpi.id,
            factoryId: kayseriFabrika.id,
            enteredAt: new Date(`${year}-${(quarterNum * 3).toString().padStart(2, '0')}-15`)
          }
        })
        
        totalInserted++
      }
      
      console.log(`  ✅ ${kpis.length} KPI değeri eklendi`)
    }
    
    console.log(`\n🎉 Toplam ${totalInserted} KPI değeri başarıyla eklendi!`)
    
    // Analitik örnek göster
    console.log('\n📈 Örnek Trend Analizi (Son 3 dönem):')
    const trendsAnalysis = await prisma.kpiValue.findMany({
      where: { 
        factoryId: kayseriFabrika.id,
        period: { in: ['2024-Q2', '2024-Q3', '2024-Q4'] }
      },
      include: { kpi: true },
      orderBy: [{ kpi: { number: 'asc' } }, { period: 'asc' }]
    })
    
    // KPI bazında grupla
    const kpiTrends: Record<number, number[]> = {}
    trendsAnalysis.forEach(v => {
      if (!kpiTrends[v.kpi.number]) kpiTrends[v.kpi.number] = []
      kpiTrends[v.kpi.number].push(v.value)
    })
    
    // İlk 5 KPI'nin trendini göster
    Object.entries(kpiTrends).slice(0, 5).forEach(([kpiNum, values]) => {
      const trend = values.length > 1 ? ((values[values.length - 1] - values[0]) / values[0] * 100).toFixed(1) : '0'
      console.log(`  KPI ${kpiNum}: ${values.join(' → ')} (${trend}% değişim)`)
    })
    
  } catch (error) {
    console.error('❌ Hata:', error)
  } finally {
    await prisma.$disconnect()
  }
}

populateKayseriHistoricalData()
