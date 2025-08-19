import { prisma } from '../src/lib/prisma'

async function populateAllFactoriesData() {
  try {
    console.log('🏭 Tüm model fabrikalar için demo KPI verileri oluşturuluyor...')
    
    // Tüm fabrikaları al
    const factories = await prisma.modelFactory.findMany({
      orderBy: { code: 'asc' }
    })
    
    console.log(`📊 ${factories.length} fabrika bulundu`)
    
    // KPI'ları al
    const kpis = await prisma.kpi.findMany({
      orderBy: { number: 'asc' }
    })
    
    // Son 6 dönem tanımla
    const periods = ['2023-Q3', '2023-Q4', '2024-Q1', '2024-Q2', '2024-Q3', '2024-Q4']
    
    let totalCreated = 0
    
    for (const factory of factories) {
      console.log(`\n🏭 ${factory.name} (${factory.code}) için veri oluşturuluyor...`)
      
      // Bu fabrika için mevcut veri sayısını kontrol et
      const existingCount = await prisma.kpiValue.count({
        where: { factoryId: factory.id }
      })
      
      if (existingCount >= periods.length * kpis.length * 0.8) {
        console.log(`  ⏭️ ${factory.code} zaten yeterli veriye sahip (${existingCount} kayıt)`)
        continue
      }
      
      // Mevcut verileri temizle
      await prisma.kpiValue.deleteMany({
        where: { factoryId: factory.id }
      })
      
      // Fabrika karakteristiği (bazı fabrikalar daha başarılı olsun)
      const basePerformance = 0.6 + Math.random() * 0.3 // 60-90% arası
      const growthRate = 0.05 + Math.random() * 0.1 // %5-15 arası büyüme
      
      // Her dönem için veri oluştur
      for (let periodIndex = 0; periodIndex < periods.length; periodIndex++) {
        const period = periods[periodIndex]
        const [year, quarter] = period.split('-')
        const yearNum = parseInt(year)
        const quarterNum = parseInt(quarter.substring(1))
        
        console.log(`  📅 ${period} dönemi...`)
        
        // Her KPI için veri oluştur
        for (const kpi of kpis) {
          const desc = (kpi.description || '').toLowerCase()
          const target = kpi.targetValue || 100
          
          let value: number
          
          // KPI türüne göre değer üretimi (reasoning tabanlı)
          if (desc.includes('toplam') || desc.includes('sayısı') || desc.includes('eğitim verilen') ||
              desc.includes('desteklenen') || desc.includes('gerçekleştirilen') || desc.includes('yapılan')) {
            
            // KÜMÜLATİF KPI'lar - progressif artış
            const baseValue = target * basePerformance * 0.3 // Hedefin %30'u civarı başlangıç
            const periodGrowth = baseValue * growthRate * periodIndex // Her dönem artış
            const randomVariation = baseValue * (Math.random() - 0.5) * 0.2 // ±10% rastgele
            
            value = Math.max(1, baseValue + periodGrowth + randomVariation)
            
          } else if (desc.includes('oranı') || desc.includes('yüzdesi') || desc.includes('memnuniyet') ||
                    kpi.unit?.includes('%')) {
            
            // PERİYODİK KPI'lar - dalgalı performans
            const baseScore = target * basePerformance
            const seasonality = Math.sin((quarterNum - 1) * Math.PI / 2) * target * 0.1 // Mevsimsel
            const trend = periodIndex * target * 0.02 // Yıllık %2 iyileşme
            const randomness = (Math.random() - 0.5) * target * 0.15 // ±7.5% rastgele
            
            value = Math.max(10, Math.min(100, baseScore + seasonality + trend + randomness))
            
          } else {
            // DURUM KPI'ları - yavaş değişen
            const baseValue = target * basePerformance
            const slowTrend = periodIndex * target * 0.01 // Yavaş artış
            const smallVariation = (Math.random() - 0.5) * target * 0.05 // ±2.5% değişim
            
            value = Math.max(target * 0.3, Math.min(target * 1.2, baseValue + slowTrend + smallVariation))
          }
          
          // Veriyi kaydet
          await prisma.kpiValue.create({
            data: {
              value: Math.round(value * 100) / 100,
              period,
              year: yearNum,
              quarter: quarterNum,
              kpiId: kpi.id,
              factoryId: factory.id,
              enteredAt: new Date(`${year}-${(quarterNum * 3).toString().padStart(2, '0')}-15`)
            }
          })
          
          totalCreated++
        }
      }
      
      console.log(`  ✅ ${factory.code} tamamlandı`)
    }
    
    console.log(`\n🎉 Toplam ${totalCreated} KPI değeri oluşturuldu!`)
    
    // Benchmark test verilerini göster
    console.log('\n📈 Benchmark Test Sonuçları:')
    
    const testPeriod = '2024-Q4'
    const benchmarkData = await prisma.modelFactory.findMany({
      include: {
        kpiValues: {
          where: { period: testPeriod },
          include: { kpi: true }
        }
      },
      take: 5
    })
    
    benchmarkData.forEach(factory => {
      const avgScore = factory.kpiValues.reduce((sum, kv) => {
        const target = kv.kpi.targetValue || 100
        return sum + Math.min((kv.value / target) * 100, 100)
      }, 0) / factory.kpiValues.length
      
      console.log(`  ${factory.code}: ${avgScore.toFixed(1)}% ortalama skor`)
    })
    
  } catch (error) {
    console.error('❌ Hata:', error)
  } finally {
    await prisma.$disconnect()
  }
}

populateAllFactoriesData()
