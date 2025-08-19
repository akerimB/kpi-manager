import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const factoryId = searchParams.get('factoryId')
    const period = searchParams.get('period') || '2024-Q4'
    
    if (!factoryId) {
      return NextResponse.json({ error: 'Factory ID gerekli' }, { status: 400 })
    }

    // Fabrikayı bul
    const factory = await prisma.modelFactory.findUnique({
      where: { id: factoryId }
    })

    if (!factory) {
      return NextResponse.json({ error: 'Fabrika bulunamadı' }, { status: 404 })
    }

    // Bu fabrika için KPI evidence sayısını al
    const evidenceCount = await prisma.kpiEvidence.count({
      where: {
        factoryId,
        period
      }
    })

    // Basit sektörel veri (demo için)
    const demoSectors = [
      {
        sectorName: 'İmalat Sanayi',
        metrics: {
          evidenceCount: Math.floor(evidenceCount * 0.6),
          firmCount: 250,
          totalEmployees: 15000,
          totalRevenue: 500000000,
          exportCount: 75,
          avgKpiScore: 85,
          factoryWeight: 0.35
        },
        geographic: {
          provinces: ['Kayseri', 'Ankara', 'İstanbul'],
          zoneTypes: ['Organize Sanayi Bölgesi', 'Teknoloji Geliştirme Bölgesi']
        }
      },
      {
        sectorName: 'Otomotiv',
        metrics: {
          evidenceCount: Math.floor(evidenceCount * 0.25),
          firmCount: 120,
          totalEmployees: 8000,
          totalRevenue: 300000000,
          exportCount: 45,
          avgKpiScore: 78,
          factoryWeight: 0.25
        },
        geographic: {
          provinces: ['Kayseri', 'Bursa'],
          zoneTypes: ['Organize Sanayi Bölgesi']
        }
      },
      {
        sectorName: 'Tekstil',
        metrics: {
          evidenceCount: Math.floor(evidenceCount * 0.15),
          firmCount: 85,
          totalEmployees: 5500,
          totalRevenue: 150000000,
          exportCount: 30,
          avgKpiScore: 72,
          factoryWeight: 0.15
        },
        geographic: {
          provinces: ['Kayseri', 'Denizli'],
          zoneTypes: ['Serbest Bölge']
        }
      }
    ]

    // Özet istatistikler
    const summary = {
      totalSectors: demoSectors.length,
      totalEvidences: evidenceCount,
      totalFirms: demoSectors.reduce((sum, s) => sum + s.metrics.firmCount, 0),
      totalEmployees: demoSectors.reduce((sum, s) => sum + s.metrics.totalEmployees, 0),
      totalRevenue: demoSectors.reduce((sum, s) => sum + s.metrics.totalRevenue, 0),
      exportingFirms: demoSectors.reduce((sum, s) => sum + s.metrics.exportCount, 0),
      avgFactoryWeight: demoSectors.reduce((sum, s) => sum + s.metrics.factoryWeight, 0) / demoSectors.length
    }

    return NextResponse.json({
      factory: {
        id: factory.id,
        name: factory.name,
        code: factory.code
      },
      summary,
      sectorImpact: demoSectors,
      metadata: {
        period,
        calculatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Sector impact API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Sektörel etki verisi alınamadı',
        detail: String(error)
      }, 
      { status: 500 }
    )
  }
}
