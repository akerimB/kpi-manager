import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || '2024-Q4'
    const factoryId = searchParams.get('factoryId') || undefined

    const [kpiCount, targetCount, valueCount, actionCount] = await Promise.all([
      prisma.kpi.count(),
      prisma.strategicTarget.count(),
      prisma.kpiValue.count(factoryId ? { where: { factoryId } } : {}),
      prisma.action.count(),
    ])

    const reports = [
      {
        key: 'weights',
        name: 'Ağırlıklandırma Şeması',
        description: 'KPI ve Stratejik Hedef ağırlıkları',
        link: '/api/strategy/weights',
        meta: { kpiCount, targetCount },
      },
      {
        key: 'evidenceOverview',
        name: 'Kanıt Özeti (k-anonimlik)',
        description: 'NACE/sector kırılımında kanıt sayısı ve hacim',
        link: `/api/analytics/evidence?period=${encodeURIComponent(period)}${factoryId ? `&factory=${encodeURIComponent(factoryId)}` : ''}`,
        meta: { minN: 5 },
      },
      {
        key: 'sectorsHeatmap',
        name: 'Dokunulan Sektörler',
        description: 'NACE ve fabrika sektör payı ile etki görünümü',
        link: `/api/analytics/overview?period=${encodeURIComponent(period)}${factoryId ? `&factory=${encodeURIComponent(factoryId)}` : ''}`,
        meta: { note: 'NACE senkronlu' },
      },
      {
        key: 'impactHeatmap',
        name: 'Etki Isı Haritası',
        description: 'SA/SH × Sektör etki matrisi',
        link: `/api/strategy/overview?period=${encodeURIComponent(period)}${factoryId ? `&factory=${encodeURIComponent(factoryId)}` : ''}`,
        meta: { note: 'Ağırlıklandırmalı skorlar' },
      },
      {
        key: 'budgetImpact',
        name: 'Bütçe Etkinliği',
        description: 'SA/SH düzeyi plan/gerçek/etki',
        link: `/api/strategy/budget-impact?period=${encodeURIComponent(period)}${factoryId ? `&factoryId=${encodeURIComponent(factoryId)}` : ''}`,
        meta: { actionCount, period },
      },
      {
        key: 'kpiValues',
        name: 'KPI Değerleri',
        description: 'Dönem bazlı KPI girişleri',
        link: `/api/kpi-values${factoryId ? `?factoryId=${encodeURIComponent(factoryId)}` : ''}`,
        meta: { valueCount },
      },
    ]

    return NextResponse.json({ period, reports })
  } catch (error) {
    console.error('Analytics reports error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}


