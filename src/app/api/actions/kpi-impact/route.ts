import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Eylem-KPI etki ilişkilerini getir
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const actionId = searchParams.get('actionId')
    const kpiId = searchParams.get('kpiId')
    const userRole = searchParams.get('userRole') || 'MODEL_FACTORY'

    // Rol kontrolü - sadece üst yönetim ve admin erişebilir
    if (userRole === 'MODEL_FACTORY') {
      return NextResponse.json({ error: 'Bu API\'ye erişim yetkiniz bulunmamaktadır' }, { status: 403 })
    }

    let whereCondition: any = {}
    if (actionId) whereCondition.actionId = actionId
    if (kpiId) whereCondition.kpiId = kpiId

    const actionKpis = await prisma.actionKpi.findMany({
      where: whereCondition,
      include: {
        action: {
          select: {
            id: true,
            code: true,
            description: true,
            strategicTarget: {
              select: {
                code: true,
                title: true
              }
            }
          }
        },
        kpi: {
          select: {
            id: true,
            number: true,
            description: true,
            unit: true,
            strategicTarget: {
              select: {
                code: true,
                title: true
              }
            }
          }
        }
      },
      orderBy: [
        { action: { code: 'asc' } },
        { kpi: { number: 'asc' } }
      ]
    })

    const formattedResults = actionKpis.map(ak => ({
      id: ak.id,
      actionId: ak.actionId,
      kpiId: ak.kpiId,
      impactScore: ak.impactScore,
      impactCategory: ak.impactCategory === 'HIGH' ? 'YÜKSEK' :
                     ak.impactCategory === 'MEDIUM' ? 'ORTA' :
                     ak.impactCategory === 'LOW' ? 'DÜŞÜK' : 'BELİRSİZ',
      action: {
        id: ak.action.id,
        code: ak.action.code,
        description: ak.action.description,
        strategicTarget: ak.action.strategicTarget
      },
      kpi: {
        id: ak.kpi.id,
        number: ak.kpi.number,
        description: ak.kpi.description,
        unit: ak.kpi.unit,
        strategicTarget: ak.kpi.strategicTarget
      }
    }))

    return NextResponse.json(formattedResults)
  } catch (error) {
    console.error('Action-KPI relationships fetch error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

// Eylem-KPI etki ilişkisi oluştur veya güncelle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { actionId, kpiId, impactScore, impactCategory, userRole } = body

    // Rol kontrolü
    if (userRole === 'MODEL_FACTORY') {
      return NextResponse.json({ error: 'Bu API\'ye erişim yetkiniz bulunmamaktadır' }, { status: 403 })
    }

    if (!actionId || !kpiId) {
      return NextResponse.json({ error: 'Action ID ve KPI ID gerekli' }, { status: 400 })
    }

    // İmpact score validasyonu
    if (impactScore && (impactScore < 0 || impactScore > 1)) {
      return NextResponse.json({ error: 'Impact score 0-1 arasında olmalıdır' }, { status: 400 })
    }

    // İmpact category validasyonu
    const validCategories = ['LOW', 'MEDIUM', 'HIGH']
    if (impactCategory && !validCategories.includes(impactCategory)) {
      return NextResponse.json({ error: 'Geçersiz impact category' }, { status: 400 })
    }

    const actionKpi = await prisma.actionKpi.upsert({
      where: {
        actionId_kpiId: {
          actionId,
          kpiId
        }
      },
      update: {
        impactScore: impactScore || null,
        impactCategory: impactCategory || null
      },
      create: {
        actionId,
        kpiId,
        impactScore: impactScore || null,
        impactCategory: impactCategory || null
      },
      include: {
        action: {
          select: {
            id: true,
            code: true,
            description: true,
            strategicTarget: {
              select: {
                code: true,
                title: true
              }
            }
          }
        },
        kpi: {
          select: {
            id: true,
            number: true,
            description: true,
            unit: true,
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

    const formattedResult = {
      id: actionKpi.id,
      actionId: actionKpi.actionId,
      kpiId: actionKpi.kpiId,
      impactScore: actionKpi.impactScore,
      impactCategory: actionKpi.impactCategory === 'HIGH' ? 'YÜKSEK' :
                     actionKpi.impactCategory === 'MEDIUM' ? 'ORTA' :
                     actionKpi.impactCategory === 'LOW' ? 'DÜŞÜK' : 'BELİRSİZ',
      action: {
        id: actionKpi.action.id,
        code: actionKpi.action.code,
        description: actionKpi.action.description,
        strategicTarget: actionKpi.action.strategicTarget
      },
      kpi: {
        id: actionKpi.kpi.id,
        number: actionKpi.kpi.number,
        description: actionKpi.kpi.description,
        unit: actionKpi.kpi.unit,
        strategicTarget: actionKpi.kpi.strategicTarget
      }
    }

    return NextResponse.json(formattedResult)
  } catch (error) {
    console.error('Action-KPI relationship creation error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

// Eylem-KPI etki ilişkisini sil
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const actionId = searchParams.get('actionId')
    const kpiId = searchParams.get('kpiId')
    const userRole = searchParams.get('userRole') || 'MODEL_FACTORY'

    // Rol kontrolü
    if (userRole === 'MODEL_FACTORY') {
      return NextResponse.json({ error: 'Bu API\'ye erişim yetkiniz bulunmamaktadır' }, { status: 403 })
    }

    if (!actionId || !kpiId) {
      return NextResponse.json({ error: 'Action ID ve KPI ID gerekli' }, { status: 400 })
    }

    await prisma.actionKpi.delete({
      where: {
        actionId_kpiId: {
          actionId,
          kpiId
        }
      }
    })

    return NextResponse.json({ success: true, message: 'Eylem-KPI ilişkisi silindi' })
  } catch (error) {
    console.error('Action-KPI relationship deletion error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
} 