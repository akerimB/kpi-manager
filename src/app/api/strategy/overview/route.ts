import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const factoryParam = searchParams.get('factory')
    const period = searchParams.get('period') || '2024-Q4'
    const userRole = searchParams.get('userRole') || 'UPPER_MANAGEMENT'

    // Fabrika ID çözümlemesi (id | code | name)
    async function resolveFactoryId(param: string | null): Promise<string | null> {
      if (!param) return null
      // crudely detect cuid-like id
      if (param.length > 20) return param
      const byCode = await prisma.modelFactory.findFirst({ where: { code: param } })
      if (byCode) return byCode.id
      const byName = await prisma.modelFactory.findFirst({ where: { name: param } })
      if (byName) return byName.id
      return null
    }

    const resolvedFactoryId = await resolveFactoryId(factoryParam)

    // Fabrika sektörel ağırlıkları (NACE/sector bazlı)
    const factorySectorWeights = resolvedFactoryId
      ? await prisma.factorySectorWeight.findMany({ where: { factoryId: resolvedFactoryId } })
      : []

    function mapNaceToSector(nace?: string | null): string | null {
      if (!nace) return null
      const m = nace.match(/\d{2}/)
      if (!m) return null
      const code = parseInt(m[0], 10)
      // Heuristic mapping aligned with Data_SectorShares sectors
      if ([10,11,12].includes(code)) return 'Gıda/İçecek'
      if ([13,14,15].includes(code)) return 'Tekstil'
      if (code === 16) return 'Mobilya'
      if ([17,18,19].includes(code)) return 'Diğer'
      if (code === 20) return 'Kimya'
      if (code === 21) return 'Diğer'
      if (code === 22) return 'Plastik/Kauçuk'
      if (code === 23) return 'Mermer/Doğal Taş'
      if (code === 24) return 'Çelik'
      if (code === 25) return 'Metal (Fabrikasyon)'
      if (code === 26) return 'Elektrik-Elektronik'
      if (code === 27) return 'Demir Dışı Metaller'
      if ([28].includes(code)) return 'Makine'
      if ([29,30].includes(code)) return 'Otomotiv'
      if (code === 31) return 'Mobilya'
      if (code === 32) return 'Medikal Cihaz'
      if (code === 3) return 'Su Ürünleri'
      return 'Diğer'
    }

    function getSectorShare(sector?: string | null): number | null {
      if (!sector) return null
      const rec = factorySectorWeights.find(s => s.sector === sector)
      return rec ? Number(rec.share) : null
    }

    // Tüm stratejik amaçları getir
    const strategicGoals = await prisma.strategicGoal.findMany({
      include: {
        strategicTargets: {
          include: {
            kpis: {
              include: {
                 kpiValues: {
                   where: resolvedFactoryId ? { period, factoryId: resolvedFactoryId } : { period },
                  include: {
                    factory: {
                      select: {
                        id: true,
                        code: true,
                        name: true
                      }
                    }
                  },
                  orderBy: {
                    period: 'desc'
                  }
                }
              }
            },
            factoryWeights: true
          }
        }
      },
      orderBy: {
        code: 'asc'
      }
    })

    // Önceki dönem verilerini de al (trend için)
    const previousPeriod = period === '2024-Q4' ? '2024-Q3' : 
                          period === '2024-Q3' ? '2024-Q2' : 
                          period === '2024-Q2' ? '2024-Q1' : '2023-Q4'

    const previousKpiValues = await prisma.kpiValue.findMany({
      where: resolvedFactoryId ? { period: previousPeriod, factoryId: resolvedFactoryId } : { period: previousPeriod },
      include: {
        factory: {
          select: {
            id: true,
            code: true,
            name: true
          }
        }
      }
    })

    // Her SA için başarım hesapla (ağırlıklı)
    const strategicOverview = strategicGoals.map(sa => {
      // SH bazında KPI ağırlıklarıyla (kpi.shWeight) skor
      let saWeightedScore = 0
      let saWeightSum = 0
      let saPrevWeightedScore = 0
      
      sa.strategicTargets.forEach(sh => {
        // KPI başına fabrikanın ortalaması -> KPI skoru
        let shScoreWeightedSum = 0
        let shWeightSum = 0
        let shPrevScoreWeightedSum = 0

        sh.kpis.forEach(kpi => {
          const tv = kpi.targetValue || 100
          // Mevcut dönem KPI skoru: kpiValues ortalaması
          let kpiScore = 0
          if (kpi.kpiValues.length > 0) {
            // NACE/sector ağırlıklı ortalama (fabrika seçiliyse)
            if (resolvedFactoryId && factorySectorWeights.length > 0) {
              let wSum = 0
              let vSum = 0
              for (const kv of kpi.kpiValues as any[]) {
                const sector = mapNaceToSector(kv.nace4d)
                const share = getSectorShare(sector) ?? 0
                const w = share > 0 ? share : 0
                if (w > 0) { vSum += kv.value * w; wSum += w }
              }
              const baseAvg = kpi.kpiValues.reduce((s, kv) => s + kv.value, 0) / kpi.kpiValues.length
              const weightedAvg = wSum > 0 ? (vSum / wSum) : baseAvg
              kpiScore = Math.min(100, (weightedAvg / tv) * 100)
            } else {
              const avgVal = kpi.kpiValues.reduce((s, kv) => s + kv.value, 0) / kpi.kpiValues.length
              kpiScore = Math.min(100, (avgVal / tv) * 100)
            }
          }
          // Önceki dönem KPI skoru
          const prevVals = previousKpiValues.filter(pv => pv.kpiId === kpi.id)
          let kpiPrevScore = 0
          if (prevVals.length > 0) {
            const avgPrev = prevVals.reduce((s, kv) => s + kv.value, 0) / prevVals.length
            kpiPrevScore = Math.min(100, (avgPrev / tv) * 100)
          }
          const w = (kpi as any).shWeight ?? 0 // Prisma type doesn't include field unless selected; cast any
          const weight = w > 0 ? w : 0
          shScoreWeightedSum += kpiScore * weight
          shPrevScoreWeightedSum += kpiPrevScore * weight
          shWeightSum += weight
        })

        const shScore = shWeightSum > 0 ? shScoreWeightedSum / shWeightSum : 0
        const shPrev = shWeightSum > 0 ? shPrevScoreWeightedSum / shWeightSum : 0
        const shW = (sh as any).goalWeight ?? 0
        const fwArr = Array.isArray((sh as any).factoryWeights) ? (sh as any).factoryWeights : []
        const fRec = resolvedFactoryId ? fwArr.find((fw: any) => fw.factoryId === resolvedFactoryId) : null
        const shFW = fRec ? (Number(fRec.weight) || 1) : 1
        const shWeight = shW > 0 ? shW * shFW : 0
        saWeightedScore += shScore * shWeight
        saPrevWeightedScore += shPrev * shWeight
        saWeightSum += shWeight
      })

      const averageScore = saWeightSum > 0 ? Math.round(saWeightedScore / saWeightSum) : 0
      const previousAverageScore = saWeightSum > 0 ? Math.round(saPrevWeightedScore / saWeightSum) : 0
      const trend = averageScore - previousAverageScore

      // Eğer belirli bir fabrika seçiliyse, o fabrika için ayrı hesaplama (zaten factoryId ile filtreli)
      let factorySpecificScore = null
      if (resolvedFactoryId) factorySpecificScore = averageScore

      return {
        id: sa.id,
        code: sa.code,
        title: sa.title,
        description: sa.description || '',
        successRate: averageScore,
        factorySpecificScore, // Seçili fabrika skoru (varsa)
        trend,
        totalFactories: new Set(
          sa.strategicTargets.flatMap(sh => 
            sh.kpis.flatMap(kpi => 
              kpi.kpiValues.map(kv => kv.factory.id)
            )
          )
        ).size,
        status: averageScore >= 80 ? 'excellent' : 
                averageScore >= 60 ? 'good' : 
                averageScore >= 40 ? 'at-risk' : 'critical'
      }
    })

    return NextResponse.json(Array.isArray(strategicOverview) ? strategicOverview : [])
  } catch (error) {
    console.error('Strategy overview error:', error)
    return NextResponse.json({ error: 'Sunucu hatası', detail: String(error) }, { status: 500 })
  }
} 