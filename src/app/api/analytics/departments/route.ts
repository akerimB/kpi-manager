import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Basit departman/organizasyon kırılımı: SH ve sorumlu birim alanlarını kullanarak istatistik
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const factoryId = searchParams.get('factoryId') || undefined
    const period = searchParams.get('period') || '2024-Q4'

    // Eylemleri sorumlu birime göre grupla
    const actions = await prisma.action.findMany({
      select: {
        responsibleUnit: true,
        completionPercent: true,
        strategicTarget: {
          select: { code: true }
        }
      }
    })

    // KPI başarılarına göre departman performansı (basit eşleştirme: SH kodu ile)
    const kpiValues = await prisma.kpiValue.findMany({
      where: factoryId ? { period, factoryId } : { period },
      include: {
        kpi: {
          select: {
            targetValue: true,
            strategicTarget: { select: { code: true } }
          }
        }
      }
    })

    const deptMap = new Map<string, { actionCount: number; avgCompletionSum: number; successSum: number; successCount: number; shSet: Set<string> }>()

    actions.forEach(a => {
      const unit = a.responsibleUnit || 'GENEL'
      if (!deptMap.has(unit)) deptMap.set(unit, { actionCount: 0, avgCompletionSum: 0, successSum: 0, successCount: 0, shSet: new Set() })
      const rec = deptMap.get(unit)!
      rec.actionCount += 1
      rec.avgCompletionSum += a.completionPercent
      if (a.strategicTarget?.code) rec.shSet.add(a.strategicTarget.code)
    })

    // SH bazlı KPI skorlarını departmanlara paylaştır (aynı SH’da eylemi olan departmanlar pay alır)
    kpiValues.forEach(kv => {
      const target = kv.kpi.targetValue ?? 100
      const ach = Math.min(100, (kv.value / target) * 100)
      const shCode = kv.kpi.strategicTarget.code
      deptMap.forEach(rec => {
        if (rec.shSet.has(shCode)) {
          rec.successSum += ach
          rec.successCount += 1
        }
      })
    })

    const departments = Array.from(deptMap.entries()).map(([unit, rec]) => {
      const avgCompletion = rec.actionCount > 0 ? Math.round(rec.avgCompletionSum / rec.actionCount) : 0
      const avgSuccess = rec.successCount > 0 ? Math.round(rec.successSum / rec.successCount) : 0
      return { unit, actionCount: rec.actionCount, avgCompletion, avgSuccess }
    }).sort((a, b) => b.avgSuccess - a.avgSuccess)

    return NextResponse.json({ period, departments })
  } catch (error) {
    console.error('Analytics departments error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}


