import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

// Development için cache hack
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }
const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

import { analyzeSectorKPICompatibility, getSectorKPIRecommendations } from '../../../../../lib/sector-kpi-compatibility'

// NACE kodunu sektöre çevir (aynı mantık sector-impact API'sinden)
function mapNaceToSector(nace: string | null): string {
  if (!nace) return 'Diğer'
  
  const code = parseInt(nace.substring(0, 2))
  const sectorMap: { [key: number]: string } = {
    10: 'Gıda', 11: 'Gıda', 12: 'Gıda',
    13: 'Tekstil', 14: 'Giyim', 15: 'Giyim',
    16: 'Mobilya', 17: 'Mobilya', 18: 'Mobilya',
    20: 'Kimya', 21: 'Kimya', 22: 'Plastik',
    24: 'Metal', 25: 'Metal',
    26: 'Bilgisayar', 27: 'Elektrikli', 28: 'Makine',
    29: 'Otomotiv', 30: 'Otomotiv',
    31: 'Mobilya', 32: 'Diğer'
  }
  
  return sectorMap[code] || 'Diğer'
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const factoryId = searchParams.get('factoryId')
    const period = searchParams.get('period') || '2024-Q4'

    if (!factoryId) {
      return NextResponse.json({ error: 'Factory ID gerekli' }, { status: 400 })
    }

    // Factory bilgisi
    const factory = await prisma.factory.findUnique({
      where: { id: factoryId },
      select: { id: true, name: true, code: true }
    })

    if (!factory) {
      return NextResponse.json({ error: 'Factory bulunamadı' }, { status: 404 })
    }

    // KPI evidence'larını al
    const evidences = await prisma.kpiEvidence.findMany({
      where: {
        factoryId,
        period
      },
      include: {
        kpi: {
          select: {
            id: true,
            number: true,
            description: true,
            strategicTarget: {
              select: {
                code: true,
                title: true
              }
            }
          }
        }
      }
    })

    // KPI bazında sektör dağılımını hesapla
    const kpiSectorDistribution: { [kpiId: string]: { [sector: string]: number } } = {}
    const kpiInfo: { [kpiId: string]: { number: number, shCode: string, description: string } } = {}

    evidences.forEach(evidence => {
      const kpiId = evidence.kpi.id
      const sector = mapNaceToSector(evidence.nace4d || evidence.nace2d)
      
      if (!kpiSectorDistribution[kpiId]) {
        kpiSectorDistribution[kpiId] = {}
        kpiInfo[kpiId] = {
          number: evidence.kpi.number,
          shCode: evidence.kpi.strategicTarget.code,
          description: evidence.kpi.description
        }
      }
      
      kpiSectorDistribution[kpiId][sector] = (kpiSectorDistribution[kpiId][sector] || 0) + 1
    })

    // Her KPI için uyumluluk analizi
    const kpiCompatibilityResults = Object.entries(kpiSectorDistribution).map(([kpiId, sectorDist]) => {
      const kpi = kpiInfo[kpiId]
      const compatibilityResult = analyzeSectorKPICompatibility(
        kpi.number,
        kpi.shCode,
        sectorDist
      )

      return {
        kpiId,
        kpiNumber: kpi.number,
        kpiDescription: kpi.description,
        shCode: kpi.shCode,
        evidenceCount: Object.values(sectorDist).reduce((sum, count) => sum + count, 0),
        sectorDistribution: compatibilityResult.sectorDistribution,
        compatibilityScore: compatibilityResult.compatibilityScore,
        isCompatible: compatibilityResult.isCompatible,
        warnings: compatibilityResult.warnings,
        suggestions: compatibilityResult.suggestions
      }
    })

    // Fabrika için sektör önerilerini al
    const factorySectors = [...new Set(evidences.map(e => mapNaceToSector(e.nace4d || e.nace2d)))]
    const sectorRecommendations = factorySectors.map(sector => ({
      sector,
      recommendations: getSectorKPIRecommendations(sector)
    }))

    // Genel uyumluluk özeti
    const totalKPIs = kpiCompatibilityResults.length
    const compatibleKPIs = kpiCompatibilityResults.filter(k => k.isCompatible).length
    const avgCompatibilityScore = totalKPIs > 0 ? 
      Math.round(kpiCompatibilityResults.reduce((sum, k) => sum + k.compatibilityScore, 0) / totalKPIs) : 0

    const allWarnings = kpiCompatibilityResults.flatMap(k => k.warnings)
    const allSuggestions = kpiCompatibilityResults.flatMap(k => k.suggestions)

    const response = {
      factory,
      period,
      summary: {
        totalKPIs,
        compatibleKPIs,
        incompatibleKPIs: totalKPIs - compatibleKPIs,
        avgCompatibilityScore,
        overallStatus: avgCompatibilityScore >= 70 ? 'compatible' : 
                      avgCompatibilityScore >= 50 ? 'warning' : 'incompatible'
      },
      kpiCompatibility: kpiCompatibilityResults,
      sectorRecommendations,
      globalWarnings: [...new Set(allWarnings)], // Unique warnings
      globalSuggestions: [...new Set(allSuggestions)], // Unique suggestions
      metadata: {
        calculatedAt: new Date().toISOString(),
        evidenceCount: evidences.length,
        analyzedSectors: factorySectors
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('KPI-Sector compatibility analysis error:', error)
    return NextResponse.json({ 
      error: 'Uyumluluk analizi hatası',
      detail: error instanceof Error ? error.message : 'Bilinmeyen hata',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}