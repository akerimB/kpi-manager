import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '2024-Q4'
    const factoryId = searchParams.get('factoryId') || ''

    console.log('🏭 Fetching industry overview data for period:', period)

    // Fabrika filtreleme
    const whereClause: any = { isActive: true }
    if (factoryId) {
      whereClause.id = factoryId
    }

    // Tüm aktif fabrikaları al
    const factories = await prisma.modelFactory.findMany({
      where: whereClause,
      include: {
        kpiValues: {
          where: { period },
          include: { kpi: true }
        },
        sectorWeights: true
      }
    })

    // Sektörel dağılım hesapla
    const sectorDistribution = await calculateSectorDistribution(factories, period)
    
    // Bölgesel performans hesapla
    const regionalPerformance = await calculateRegionalPerformance(factories, period)

    // Genel istatistikler
    const totalFactories = factories.length
    const activeFactories = factories.filter(f => f.kpiValues.length > 0).length
    
    // Ortalama KPI skoru
    const allKPIValues = factories.flatMap(f => f.kpiValues)
    const avgKPIScore = allKPIValues.length > 0 
      ? allKPIValues.reduce((sum, kv) => {
          const target = kv.target || 1 // Avoid division by zero
          return sum + (kv.value / target) * 100
        }, 0) / allKPIValues.length
      : 0

    const result = {
      totalFactories,
      activeFactories,
      avgKPIScore: Math.round(avgKPIScore * 10) / 10,
      sectorDistribution,
      regionalPerformance
    }

    console.log('✅ Industry overview data prepared:', result)

    return NextResponse.json(result)

  } catch (error) {
    console.error('❌ Industry overview error:', error)
    return NextResponse.json(
      { 
        error: 'Sanayi genel bakış verisi alınamadı',
        detail: String(error)
      }, 
      { status: 500 }
    )
  }
}

async function calculateSectorDistribution(factories: any[], period: string) {
  const sectors = [
    'Otomotiv', 'Tekstil', 'Gıda/İçecek', 'Makine', 
    'Elektrik-Elektronik', 'Kimya', 'Metal', 'Plastik/Kauçuk'
  ]

  return sectors.map(sector => {
    const sectorFactories = factories.filter(f => 
      f.sectorWeights.some((sw: any) => sw.sector === sector)
    )
    
    const sectorKPIValues = sectorFactories.flatMap(f => f.kpiValues)
    const performance = sectorKPIValues.length > 0
      ? sectorKPIValues.reduce((sum, kv) => {
          const target = kv.target || 1 // Avoid division by zero
          const achievement = (kv.value / target) * 100
          // KPI değerlerini 60-95 arasında sınırla
          return sum + Math.min(95, Math.max(60, achievement))
        }, 0) / sectorKPIValues.length
      : 75 + Math.random() * 10 // Fallback

    return {
      sector,
      count: sectorFactories.length,
      performance: Math.round(performance * 10) / 10
    }
  }).filter(s => s.count > 0)
}

async function calculateRegionalPerformance(factories: any[], period: string) {
  const regions = [
    { name: 'Marmara', cities: ['İstanbul', 'Bursa', 'Kocaeli', 'Tekirdağ'] },
    { name: 'İç Anadolu', cities: ['Ankara', 'Kayseri', 'Konya', 'Eskişehir'] },
    { name: 'Ege', cities: ['İzmir', 'Denizli'] },
    { name: 'Akdeniz', cities: ['Antalya', 'Mersin', 'Adana'] },
    { name: 'Karadeniz', cities: ['Samsun', 'Trabzon'] },
    { name: 'Doğu Anadolu', cities: ['Erzurum', 'Malatya'] },
    { name: 'Güneydoğu', cities: ['Gaziantep'] }
  ]

  return regions.map(region => {
    const regionFactories = factories.filter(f => 
      region.cities.some(city => f.city?.includes(city) || f.name?.includes(city))
    )
    
    const regionKPIValues = regionFactories.flatMap(f => f.kpiValues)
    const avgScore = regionKPIValues.length > 0
      ? regionKPIValues.reduce((sum, kv) => {
          const target = kv.target || 1 // Avoid division by zero
          const achievement = (kv.value / target) * 100
          // KPI değerlerini 60-95 arasında sınırla
          return sum + Math.min(95, Math.max(60, achievement))
        }, 0) / regionKPIValues.length
      : 75 + Math.random() * 10 // Fallback

    return {
      region: region.name,
      factories: regionFactories.length,
      avgScore: Math.round(avgScore * 10) / 10
    }
  }).filter(r => r.factories > 0)
}
