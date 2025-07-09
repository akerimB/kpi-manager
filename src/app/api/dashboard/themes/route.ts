import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type ThemeCounts = {
  LEAN: number
  DIGITAL: number
  GREEN: number
  RESILIENCE: number
}

export async function GET() {
  try {
    // Get all KPIs and their themes
    const kpis = await prisma.kpi.findMany({
      select: {
        themes: true,
      },
    })

    // Count KPIs by theme
    const themeCounts: ThemeCounts = {
      LEAN: 0,
      DIGITAL: 0,
      GREEN: 0,
      RESILIENCE: 0,
    }

    kpis.forEach((kpi) => {
      const themes = kpi.themes.split(',')
      themes.forEach((theme) => {
        const cleanTheme = theme.trim() as keyof ThemeCounts
        if (cleanTheme in themeCounts) {
          themeCounts[cleanTheme]++
        }
      })
    })

    // Format data for frontend
    const themeData = [
      { name: 'YALIN', value: themeCounts.LEAN, color: '#3B82F6' },
      { name: 'DİJİTAL', value: themeCounts.DIGITAL, color: '#10B981' },
      { name: 'YEŞİL', value: themeCounts.GREEN, color: '#34D399' },
      { name: 'DİRENÇLİLİK', value: themeCounts.RESILIENCE, color: '#F59E0B' },
    ]

    return NextResponse.json(themeData)
  } catch (error) {
    console.error('Error fetching theme stats:', error)
    return NextResponse.json(
      { error: 'Tema istatistikleri alınırken bir hata oluştu.' },
      { status: 500 }
    )
  }
} 