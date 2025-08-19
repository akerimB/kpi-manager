import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const saCode = searchParams.get('sa')
    const factoryParam = searchParams.get('factory')
    const period = searchParams.get('period') || '2024-Q4'
    const userRole = searchParams.get('userRole') || 'UPPER_MANAGEMENT'

    // Fabrika ID çözümlemesi (id | code | name)
    async function resolveFactoryId(param: string | null): Promise<string | null> {
      if (!param) return null
      if (param.length > 20) return param
      const byCode = await prisma.modelFactory.findFirst({ where: { code: param } })
      if (byCode) return byCode.id
      const byName = await prisma.modelFactory.findFirst({ where: { name: param } })
      if (byName) return byName.id
      return null
    }

    const factoryId = await resolveFactoryId(factoryParam)

    // Fabrika sektörel payları
    const factorySectorWeights = factoryId
      ? await prisma.factorySectorWeight.findMany({ where: { factoryId } })
      : []

    function mapNaceToSector(nace?: string | null): string | null {
      if (!nace) return null
      const m = (nace as string).match(/\d{2}/)
      if (!m) return null
      const code = parseInt(m[0], 10)
      if ([10,11,12].includes(code)) return 'Gıda/İçecek'
      if ([13,14,15].includes(code)) return 'Tekstil'
      if (code === 16 || code === 31) return 'Mobilya'
      if ([17,18,19].includes(code)) return 'Diğer'
      if (code === 20) return 'Kimya'
      if (code === 22) return 'Plastik/Kauçuk'
      if (code === 23) return 'Mermer/Doğal Taş'
      if (code === 24) return 'Çelik'
      if (code === 25) return 'Metal (Fabrikasyon)'
      if (code === 26) return 'Elektrik-Elektronik'
      if (code === 27) return 'Demir Dışı Metaller'
      if (code === 28) return 'Makine'
      if ([29,30].includes(code)) return 'Otomotiv'
      if (code === 32) return 'Medikal Cihaz'
      if (code === 3) return 'Su Ürünleri'
      return 'Diğer'
    }

    function getSectorShare(sector?: string | null): number | null {
      if (!sector) return null
      const rec = factorySectorWeights.find(s => s.sector === sector)
      return rec ? Number(rec.share) : null
    }

    let whereCondition: any = {}
    if (saCode) {
      whereCondition = {
        strategicGoal: {
          code: saCode
        }
      }
    }

    const strategicTargets = await prisma.strategicTarget.findMany({
      where: whereCondition,
      include: {
        strategicGoal: true,
        kpis: {
          include: {
            kpiValues: {
              where: factoryId ? { period, factoryId } : { period },
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
            },
            
          }
        },
        factoryWeights: true,
        actions: {
          select: {
            id: true,
            code: true,
            completionPercent: true
          }
        },
        // goalWeight is a scalar; no include
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
      where: factoryId ? { period: previousPeriod, factoryId } : { period: previousPeriod },
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

    // Her SH için başarım hesapla (tüm fabrikalar bazında)
    const targetDetails = strategicTargets.map(sh => {
      // Ağırlıklı KPI ortalaması
      let shScoreWeightedSum = 0
      let shWeightSum = 0
      let shPrevWeightedSum = 0

      sh.kpis.forEach(kpi => {
        const tv = kpi.targetValue || 100
        let kpiScore = 0
        if (kpi.kpiValues.length > 0) {
          // NACE kırılımı varsa MF sektörel payları ile ağırlıklandır
      const hasNace = kpi.kpiValues.some(kv => (kv as any).nace4d)
      if (factoryId && factorySectorWeights.length > 0 && hasNace) {
        let wSum = 0; let vSum = 0
        for (const kv of kpi.kpiValues as any[]) {
          const sector = mapNaceToSector(kv.nace4d)
          const share = getSectorShare(sector) ?? 0
          if (share > 0) { vSum += kv.value * share; wSum += share }
        }
        const baseAvg = kpi.kpiValues.reduce((s, kv) => s + kv.value, 0) / kpi.kpiValues.length
        const weightedAvg = wSum > 0 ? (vSum / wSum) : baseAvg
        kpiScore = Math.min(100, (weightedAvg / tv) * 100)
      } else {
        const avgVal = kpi.kpiValues.reduce((s, kv) => s + kv.value, 0) / kpi.kpiValues.length
        kpiScore = Math.min(100, (avgVal / tv) * 100)
      }
        }
        const prevVals = previousKpiValues.filter(pv => pv.kpiId === kpi.id)
        let kpiPrevScore = 0
        if (prevVals.length > 0) {
          const avgPrev = prevVals.reduce((s, kv) => s + kv.value, 0) / prevVals.length
          kpiPrevScore = Math.min(100, (avgPrev / tv) * 100)
        }
        const w = (kpi as any).shWeight ?? 0
        const weight = w > 0 ? w : 0
        shScoreWeightedSum += kpiScore * weight
        shPrevWeightedSum += kpiPrevScore * weight
        shWeightSum += weight
      })

      // Fabrika-özel SH ağırlığı (varsa) uygula
      const fwArr = Array.isArray((sh as any).factoryWeights) ? (sh as any).factoryWeights : []
      const fRec = factoryId ? fwArr.find((fw: any) => fw.factoryId === factoryId) : null
      const factoryWeight = fRec ? (Number(fRec.weight) || 1) : 1
      const averageScore = shWeightSum > 0 ? Math.round((shScoreWeightedSum / shWeightSum) * factoryWeight) : 0
      const previousAverageScore = shWeightSum > 0 ? Math.round(shPrevWeightedSum / shWeightSum) : 0
      const trend = averageScore - previousAverageScore

      // Eğer belirli bir fabrika seçiliyse, o fabrika için ayrı hesaplama
      let factorySpecificScore = null
      if (factoryId) {
        let factoryScore = 0
        let factoryKpiCount = 0
        
        sh.kpis.forEach(kpi => {
          const factoryKpiValue = kpi.kpiValues.find(kv => kv.factory.id === factoryId)
          if (factoryKpiValue) {
            factoryKpiCount++
            const targetValue = kpi.targetValue || 100
            const score = Math.min(100, (factoryKpiValue.value / targetValue) * 100)
            factoryScore += score
          }
        })
        
        factorySpecificScore = factoryKpiCount > 0 ? Math.round(factoryScore / factoryKpiCount) : 0
      }

      return {
        id: sh.id,
        code: sh.code,
        name: sh.title || `Stratejik Hedef ${sh.code}`,
        description: sh.description || '',
        strategicGoalId: sh.strategicGoal.id,
        successRate: Math.round(averageScore), // Tüm fabrikalar ortalaması
        factorySpecificScore, // Seçili fabrika skoru (varsa)
        kpiCount: sh.kpis.length,
        trend: Math.round(trend),
        totalFactories: new Set(
          sh.kpis.flatMap(kpi => 
            kpi.kpiValues.map(kv => kv.factory.id)
          )
        ).size,
        status: averageScore >= 80 ? 'excellent' : 
                averageScore >= 60 ? 'good' : 
                averageScore >= 40 ? 'at-risk' : 'critical'
      }
    })

    return NextResponse.json(targetDetails)
  } catch (error) {
    console.error('Strategy targets error:', error)
    return NextResponse.json({ error: 'Stratejik hedefler alınırken bir hata oluştu.' }, { status: 500 })
  }
} 