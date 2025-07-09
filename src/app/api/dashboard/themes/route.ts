import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Tüm KPI'ları ve temalarını çek
    const kpis = await prisma.kpi.findMany({
      select: {
        id: true,
        themes: true
      }
    })

    // Tema sayılarını hesapla
    const themeCounts = {
      LEAN: 0,
      DIGITAL: 0,
      GREEN: 0,
      RESILIENCE: 0
    }

    kpis.forEach(kpi => {
      if (kpi.themes) {
        const themes = kpi.themes.split(',')
        themes.forEach(theme => {
          const cleanTheme = theme.trim()
          if (cleanTheme in themeCounts) {
            themeCounts[cleanTheme as keyof typeof themeCounts]++
          }
        })
      }
    })

    const totalKpis = kpis.length
    const themeDistribution = [
      {
        name: 'Yalın',
        value: totalKpis > 0 ? Math.round((themeCounts.LEAN / totalKpis) * 100) : 0,
        color: '#3b82f6'
      },
      {
        name: 'Dijital',
        value: totalKpis > 0 ? Math.round((themeCounts.DIGITAL / totalKpis) * 100) : 0,
        color: '#10b981'
      },
      {
        name: 'Yeşil',
        value: totalKpis > 0 ? Math.round((themeCounts.GREEN / totalKpis) * 100) : 0,
        color: '#f59e0b'
      },
      {
        name: 'Dirençlilik',
        value: totalKpis > 0 ? Math.round((themeCounts.RESILIENCE / totalKpis) * 100) : 0,
        color: '#ef4444'
      }
    ]

    return NextResponse.json(themeDistribution)
  } catch (error) {
    console.error('Theme distribution error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 