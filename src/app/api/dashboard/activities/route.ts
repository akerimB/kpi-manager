import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Son güncellenen eylemler
    const recentActions = await prisma.action.findMany({
      take: 5,
      orderBy: {
        updatedAt: 'desc'
      },
      include: {
        strategicTarget: {
          select: {
            code: true
          }
        }
      }
    })

    // Son KPI girişleri 
    const recentKpiValues = await prisma.kpiValue.findMany({
      take: 3,
      orderBy: {
        enteredAt: 'desc'
      },
      include: {
        kpi: {
          select: {
            number: true,
            description: true
          }
        },
        factory: {
          select: {
            name: true
          }
        }
      }
    })

    const activities = [
      ...recentActions.map(action => ({
        type: 'action',
        title: action.code,
        description: action.description.length > 100 
          ? action.description.substring(0, 100) + '...' 
          : action.description,
        target: action.strategicTarget.code,
        time: action.updatedAt,
        progress: action.completionPercent
      })),
      ...recentKpiValues.map(kpiValue => ({
        type: 'kpi',
        title: `KPI ${kpiValue.kpi.number} güncelendi`,
        description: `${kpiValue.factory.name} - ${kpiValue.kpi.description.substring(0, 80)}...`,
        target: '',
        time: kpiValue.enteredAt,
        value: kpiValue.value
      }))
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5)

    return NextResponse.json(activities)
  } catch (error) {
    console.error('Recent activities error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 