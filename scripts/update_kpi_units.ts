import { prisma } from '../src/lib/prisma'

async function updateKpiUnits() {
  try {
    console.log('🔧 KPI birimlerini güncelleniyor...')
    
    const updates = [
      // Kümülatif KPI'lar - Sayısal
      { number: 1, unit: 'puan', targetValue: 100 },
      { number: 2, unit: 'adet', targetValue: 50 },
      { number: 4, unit: 'kişi*saat', targetValue: 10000 },
      { number: 5, unit: 'adet', targetValue: 200 },
      { number: 8, unit: 'adet', targetValue: 15 },
      { number: 10, unit: 'adet', targetValue: 150 },
      { number: 14, unit: 'adet', targetValue: 100 },
      { number: 17, unit: 'adet', targetValue: 8 },
      
      // Periyodik KPI'lar - Oransal
      { number: 3, unit: '%', targetValue: 85 },
      { number: 6, unit: '%', targetValue: 70 },
      { number: 7, unit: '%', targetValue: 80 },
      { number: 9, unit: '%', targetValue: 60 },
      { number: 11, unit: '%', targetValue: 15 },
      { number: 12, unit: '%', targetValue: 20 },
      { number: 13, unit: '%', targetValue: 90 },
      { number: 16, unit: '%', targetValue: 75 },
      
      // Durum KPI'ları - Karma
      { number: 15, unit: 'TL', targetValue: 50000 },
      { number: 20, unit: 'saat', targetValue: 40 },
      { number: 22, unit: '%', targetValue: 85 },
      
      // Diğer önemli KPI'lar
      { number: 18, unit: 'adet', targetValue: 5 },
      { number: 19, unit: '%', targetValue: 80 },
      { number: 21, unit: 'puan', targetValue: 4.0 },
      { number: 23, unit: '%', targetValue: 90 },
      { number: 24, unit: '%', targetValue: 75 },
      { number: 25, unit: 'adet', targetValue: 500 },
      { number: 26, unit: '%', targetValue: 70 },
      { number: 27, unit: 'gün', targetValue: 30 },
      { number: 28, unit: '%', targetValue: 95 },
      { number: 29, unit: 'adet', targetValue: 25 },
      { number: 30, unit: '%', targetValue: 85 },
      { number: 31, unit: 'ton CO2e', targetValue: 1000 },
      { number: 32, unit: '%', targetValue: 60 },
      { number: 33, unit: 'MWh', targetValue: 2000 },
      { number: 34, unit: '%', targetValue: 80 },
      { number: 35, unit: 'adet', targetValue: 100 },
      { number: 36, unit: '%', targetValue: 85 },
      { number: 37, unit: 'puan', targetValue: 4.5 },
      { number: 38, unit: '%', targetValue: 90 },
      { number: 39, unit: 'adet', targetValue: 20 },
      { number: 40, unit: '%', targetValue: 75 },
      { number: 41, unit: 'puan', targetValue: 4.2 }
    ]
    
    let updatedCount = 0
    
    for (const update of updates) {
      const result = await prisma.kpi.updateMany({
        where: { number: update.number },
        data: {
          unit: update.unit,
          targetValue: update.targetValue
        }
      })
      
      if (result.count > 0) {
        console.log(`✅ KPI ${update.number}: ${update.unit} birimi, hedef: ${update.targetValue}`)
        updatedCount++
      }
    }
    
    console.log(`\n🎉 ${updatedCount} KPI birimi güncellendi!`)
    
    // Güncellenmiş KPI'ları kontrol et
    const sampleKpis = await prisma.kpi.findMany({
      where: { number: { in: [1, 3, 5, 11, 15, 20] } },
      select: { number: true, description: true, unit: true, targetValue: true },
      orderBy: { number: 'asc' }
    })
    
    console.log('\n📋 Güncellenmiş KPI örnekleri:')
    sampleKpis.forEach(kpi => {
      const desc = kpi.description?.substring(0, 50) + '...'
      console.log(`  KPI ${kpi.number}: ${desc}`)
      console.log(`    Birim: ${kpi.unit} | Hedef: ${kpi.targetValue}`)
    })
    
  } catch (error) {
    console.error('❌ Hata:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateKpiUnits()
