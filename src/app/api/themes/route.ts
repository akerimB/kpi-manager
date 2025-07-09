import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Tema verilerini hesapla
    const kpis = await prisma.kpi.findMany({
      include: {
        kpiValues: {
          orderBy: {
            period: 'desc'
          },
          take: 1
        },
        strategicTarget: {
          include: {
            strategicGoal: true
          }
        }
      }
    })

    // Tema başlıklarını tanımla
    const themeDefinitions = {
      'YALIN': {
        name: 'Yalın Üretim',
        description: 'Verimlilik ve israf azaltma odaklı KPI\'lar',
        color: '#10B981' // green
      },
      'DİJİTAL': {
        name: 'Dijital Dönüşüm', 
        description: 'Teknoloji ve dijitalleşme KPI\'ları',
        color: '#3B82F6' // blue
      },
      'YEŞİL': {
        name: 'Yeşil Üretim',
        description: 'Çevre ve sürdürülebilirlik KPI\'ları',
        color: '#059669' // emerald
      },
      'DİRENÇLİLİK': {
        name: 'Dirençlilik',
        description: 'Risk yönetimi ve esneklik KPI\'ları',
        color: '#DC2626' // red
      }
    }

    // KPI'ları temalara göre grupla
    const themeGroups: { [key: string]: any[] } = {
      'YALIN': [],
      'DİJİTAL': [],
      'YEŞİL': [],
      'DİRENÇLİLİK': []
    }

    kpis.forEach(kpi => {
      // KPI tema ataması (basitleştirilmiş mantık)
      let theme = 'YALIN' // default
      
      const description = kpi.description.toLowerCase()
      
      if (description.includes('dijital') || description.includes('teknoloji') || description.includes('otomasyon')) {
        theme = 'DİJİTAL'
      } else if (description.includes('çevre') || description.includes('enerji') || description.includes('yeşil') ||
                 description.includes('sürdürülebil')) {
        theme = 'YEŞİL'
      } else if (description.includes('risk') || description.includes('güvenlik') || description.includes('direnc')) {
        theme = 'DİRENÇLİLİK'
      }

      const currentValue = kpi.kpiValues.length > 0 ? kpi.kpiValues[0].value : 0
      const targetValue = kpi.targetValue || 100
      const achievement = Math.min(100, (currentValue / targetValue) * 100)

      themeGroups[theme].push({
        id: kpi.id,
        number: kpi.number,
        title: kpi.description,
        currentValue,
        targetValue,
        achievement: Math.round(achievement),
        shCode: kpi.strategicTarget.code,
        saCode: kpi.strategicTarget.strategicGoal.code
      })
    })

    // Tema radar verilerini hesapla
    const themeRadarData = Object.entries(themeGroups).map(([themeKey, kpis]) => {
      const totalKpis = kpis.length
      const avgAchievement = totalKpis > 0 
        ? kpis.reduce((sum, kpi) => sum + kpi.achievement, 0) / totalKpis
        : 0

      const excellentKpis = kpis.filter(kpi => kpi.achievement >= 90).length
      const goodKpis = kpis.filter(kpi => kpi.achievement >= 70 && kpi.achievement < 90).length
      const atRiskKpis = kpis.filter(kpi => kpi.achievement >= 50 && kpi.achievement < 70).length
      const criticalKpis = kpis.filter(kpi => kpi.achievement < 50).length

      const themeInfo = themeDefinitions[themeKey as keyof typeof themeDefinitions]
      return {
        theme: themeKey,
        name: themeInfo.name,
        description: themeInfo.description,
        color: themeInfo.color,
        totalKpis,
        avgAchievement: Math.round(avgAchievement),
        distribution: {
          excellent: excellentKpis,
          good: goodKpis,
          atRisk: atRiskKpis,
          critical: criticalKpis
        },
        kpis: kpis,
        status: avgAchievement >= 80 ? 'mükemmel' :
                avgAchievement >= 60 ? 'iyi' :
                avgAchievement >= 40 ? 'riskli' : 'kritik'
      }
    })

    // Radar chart için 5 boyutlu veri (4 tema + genel)
    const radarMetrics = [
      {
        metric: 'Verimlilik',
        value: themeRadarData.find(t => t.theme === 'YALIN')?.avgAchievement || 0
      },
      {
        metric: 'Dijitalleşme',
        value: themeRadarData.find(t => t.theme === 'DİJİTAL')?.avgAchievement || 0
      },
      {
        metric: 'Sürdürülebilirlik',
        value: themeRadarData.find(t => t.theme === 'YEŞİL')?.avgAchievement || 0
      },
      {
        metric: 'Dirençlilik',
        value: themeRadarData.find(t => t.theme === 'DİRENÇLİLİK')?.avgAchievement || 0
      },
      {
        metric: 'Genel Başarım',
        value: Math.round(themeRadarData.reduce((sum, t) => sum + t.avgAchievement, 0) / themeRadarData.length)
      }
    ]

    return NextResponse.json({
      themes: themeRadarData,
      radarMetrics,
      summary: {
        totalKpis: kpis.length,
        avgOverallAchievement: Math.round(themeRadarData.reduce((sum, t) => sum + t.avgAchievement, 0) / themeRadarData.length),
        bestPerformingTheme: themeRadarData.reduce((best, current) => 
          current.avgAchievement > best.avgAchievement ? current : best
        ),
        worstPerformingTheme: themeRadarData.reduce((worst, current) => 
          current.avgAchievement < worst.avgAchievement ? current : worst
        )
      }
    })
  } catch (error) {
    console.error('Themes API error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
} 