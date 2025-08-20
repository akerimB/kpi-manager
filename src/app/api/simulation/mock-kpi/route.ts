import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🏭 Mock KPI Analysis Started (No Database)')

    // Request'i parse et
    let scenarios = []
    try {
      const requestBody = await request.text()
      if (requestBody && requestBody.trim() !== '') {
        const parsed = JSON.parse(requestBody)
        scenarios = parsed.scenarios || []
      }
    } catch (parseError) {
      console.log('Using empty scenarios array as fallback')
      scenarios = []
    }

    console.log('Processed scenarios:', scenarios?.length || 0)

    // Mock gerçek model fabrikaları
    const mockFactories = [
      { id: 'mf01', code: 'MF01', name: 'İstanbul Model Fabrikası', city: 'İstanbul', region: 'Marmara', isActive: true },
      { id: 'mf02', code: 'MF02', name: 'Ankara Model Fabrikası', city: 'Ankara', region: 'İç Anadolu', isActive: true },
      { id: 'mf03', code: 'MF03', name: 'İzmir Model Fabrikası', city: 'İzmir', region: 'Ege', isActive: true },
      { id: 'mf04', code: 'MF04', name: 'Bursa Model Fabrikası', city: 'Bursa', region: 'Marmara', isActive: true },
      { id: 'mf05', code: 'MF05', name: 'Kayseri Model Fabrikası', city: 'Kayseri', region: 'İç Anadolu', isActive: true },
      { id: 'mf06', code: 'MF06', name: 'Gaziantep Model Fabrikası', city: 'Gaziantep', region: 'Güneydoğu', isActive: true },
      { id: 'mf07', code: 'MF07', name: 'Konya Model Fabrikası', city: 'Konya', region: 'İç Anadolu', isActive: true },
      { id: 'mf08', code: 'MF08', name: 'Samsun Model Fabrikası', city: 'Samsun', region: 'Karadeniz', isActive: true },
      { id: 'mf09', code: 'MF09', name: 'Antalya Model Fabrikası', city: 'Antalya', region: 'Akdeniz', isActive: true },
      { id: 'mf10', code: 'MF10', name: 'Erzurum Model Fabrikası', city: 'Erzurum', region: 'Doğu Anadolu', isActive: true }
    ]

    // Mock KPI'lar
    const mockKPIs = [
      { 
        id: 'kpi1', number: 1, description: 'Toplam Katılımcı İşletme Sayısı',
        theme: { name: 'Katılım ve Erişim' },
        strategicTarget: { 
          description: 'Model fabrika ekosisteminde aktif katılım',
          strategicGoal: { description: 'Ekosistem Geliştirme' }
        },
        kpiValues: []
      },
      { 
        id: 'kpi2', number: 2, description: 'Eğitim Programlarına Katılım Oranı',
        theme: { name: 'Eğitim ve Geliştirme' },
        strategicTarget: { 
          description: 'Sürekli öğrenme ve gelişim',
          strategicGoal: { description: 'İnsan Kaynağı Geliştirme' }
        },
        kpiValues: []
      },
      { 
        id: 'kpi3', number: 3, description: 'Teknoloji Transfer Başarı Oranı',
        theme: { name: 'Teknoloji ve İnovasyon' },
        strategicTarget: { 
          description: 'Teknoloji transferi ve adaptasyonu',
          strategicGoal: { description: 'Teknolojik Dönüşüm' }
        },
        kpiValues: []
      },
      { 
        id: 'kpi4', number: 4, description: 'Sürdürülebilirlik Uygulamaları Yayılımı',
        theme: { name: 'Sürdürülebilirlik' },
        strategicTarget: { 
          description: 'Çevresel ve sosyal sürdürülebilirlik',
          strategicGoal: { description: 'Sürdürülebilir Kalkınma' }
        },
        kpiValues: []
      },
      { 
        id: 'kpi5', number: 5, description: 'İş Birliği Ağı Genişliği',
        theme: { name: 'İş Birliği ve Ortaklık' },
        strategicTarget: { 
          description: 'Güçlü iş birliği ağları',
          strategicGoal: { description: 'Ekosistem Geliştirme' }
        },
        kpiValues: []
      }
    ]

    console.log(`📊 ${mockFactories.length} mock fabrika, ${mockKPIs.length} mock KPI hazırlandı`)

    // Simülasyon sonuçları oluştur
    const simulationResults = {
      scenarioResults: scenarios?.map((scenario: any) => {
        const actionCount = scenario.actions?.length || 0
        const avgImprovement = actionCount * (3 + Math.random() * 4) // 3-7% per action

        return {
          scenarioId: scenario.id,
          scenarioName: scenario.name,
          probability: scenario.probability,
          kpiProjections: mockKPIs.map((kpi) => {
            // Her fabrika için mevcut performans değerleri
            const currentPeriodValues = mockFactories.map(factory => ({
              factoryId: factory.id,
              factoryName: factory.name,
              factoryCity: factory.city,
              factoryRegion: factory.region,
              value: 70 + Math.random() * 25, // 70-95 arası
              target: 85 + Math.random() * 15, // 85-100 arası
              achievementRate: 75 + Math.random() * 25 // 75-100% arası
            }))

            // Trend hesaplama
            const avgValue = currentPeriodValues.reduce((sum, cv) => sum + cv.value, 0) / currentPeriodValues.length
            const trendRate = -1 + Math.random() * 6 // %-1 ile %5 arası

            // Projeksiyon hesaplama
            const factoryProjections = currentPeriodValues.map((factoryValue) => {
              const baseline = factoryValue.value * (1 + trendRate / 100 / 4) // Çeyreklik
              const actionImpact = actionCount > 0 ? baseline * (0.03 + Math.random() * 0.05) * Math.min(actionCount / 3, 1) : 0
              const projected = baseline + actionImpact
              const improvement = projected - factoryValue.value
              const improvementPercent = (improvement / factoryValue.value) * 100

              return {
                factoryId: factoryValue.factoryId,
                factoryName: factoryValue.factoryName,
                baseline: Math.round(baseline * 10) / 10,
                projected: Math.round(projected * 10) / 10,
                improvement: Math.round(improvement * 10) / 10,
                improvementPercent: Math.round(improvementPercent * 10) / 10,
                riskLevel: factoryValue.achievementRate < 70 ? 'high' : 
                          factoryValue.achievementRate < 85 ? 'medium' : 'low',
                contributingActions: scenario.actions?.map((a: any) => a.actionCode || a.actionId) || []
              }
            })

            const aggregateBaseline = factoryProjections.reduce((sum, fp) => sum + fp.baseline, 0) / factoryProjections.length
            const aggregateProjected = factoryProjections.reduce((sum, fp) => sum + fp.projected, 0) / factoryProjections.length
            const aggregateImprovement = aggregateProjected - aggregateBaseline
            const aggregateImprovementPercent = (aggregateImprovement / aggregateBaseline) * 100

            return {
              kpiId: kpi.id,
              kpiNumber: kpi.number,
              kpiDescription: kpi.description,
              theme: kpi.theme.name,
              strategicGoal: kpi.strategicTarget.strategicGoal.description,
              strategicTarget: kpi.strategicTarget.description,
              currentPeriodValues,
              historicalTrend: {
                periods: ['2024-Q1', '2024-Q2', '2024-Q3', '2024-Q4'],
                values: [avgValue - 4, avgValue - 2, avgValue - 1, avgValue],
                trendDirection: trendRate > 1 ? 'improving' : trendRate < -1 ? 'declining' : 'stable',
                trendRate: Math.round(trendRate * 10) / 10
              },
              projectedValues: [{
                period: '2025-Q1',
                factoryProjections,
                aggregateProjection: {
                  baseline: Math.round(aggregateBaseline * 10) / 10,
                  withActions: Math.round(aggregateProjected * 10) / 10,
                  improvement: Math.round(aggregateImprovement * 10) / 10,
                  improvementPercent: Math.round(aggregateImprovementPercent * 10) / 10,
                  confidenceInterval: {
                    lower: Math.round(aggregateProjected * 0.9 * 10) / 10,
                    upper: Math.round(aggregateProjected * 1.1 * 10) / 10,
                    confidence: 75 + Math.random() * 20
                  }
                }
              }],
              riskFactors: [
                {
                  id: 'implementation_risk',
                  name: 'Uygulama Riski',
                  type: 'operational',
                  probability: 30 + Math.random() * 30,
                  impact: -5 - Math.random() * 10,
                  description: 'Eylem planlarının uygulanmasında karşılaşılabilecek zorluklar',
                  mitigation: 'Detaylı planlama ve sürekli izleme'
                }
              ]
            }
          }),
          overallMetrics: {
            totalKPIImprovement: Math.round(avgImprovement * 10) / 10,
            successProbability: Math.max(60, 90 - actionCount * 3),
            timeToValue: Math.max(3, actionCount * 1.2 + Math.random() * 2),
            resourceRequirement: Math.min(100, actionCount * 12 + Math.random() * 15),
            riskScore: Math.max(0, Math.min(100, 20 + actionCount * 8 + Math.random() * 20))
          }
        }
      }) || [],

      factoryComparisons: mockFactories.map((factory, index) => {
        const avgKPIScore = 75 + Math.random() * 20
        const expectedImprovement = (scenarios?.[0]?.actions?.length || 0) * (2 + Math.random() * 2)
        const projectedScore = avgKPIScore * (1 + expectedImprovement / 100)

        return {
          factoryId: factory.id,
          factoryName: factory.name,
          currentPerformance: {
            avgKPIScore: Math.round(avgKPIScore * 10) / 10,
            rank: index + 1,
            totalKPIs: mockKPIs.length,
            aboveTarget: Math.floor(mockKPIs.length * (0.4 + Math.random() * 0.4)),
            belowTarget: Math.floor(mockKPIs.length * (0.2 + Math.random() * 0.4))
          },
          projectedPerformance: {
            avgKPIScore: Math.round(projectedScore * 10) / 10,
            projectedRank: index + 1,
            expectedImprovement: Math.round(expectedImprovement * 10) / 10,
            riskAdjustedScore: Math.round(projectedScore * (0.9 + Math.random() * 0.2) * 10) / 10
          },
          competitivePosition: {
            relativeToAverage: Math.round((avgKPIScore - 80) * 10) / 10,
            relativeToLeader: Math.round((avgKPIScore - 90) * 10) / 10,
            gapAnalysis: {
              strengths: avgKPIScore > 85 ? ['Güçlü performans', 'Hedef üstü başarı'] : ['Stabil performans'],
              weaknesses: avgKPIScore < 75 ? ['Hedef altı performans', 'İyileştirme gerekli'] : ['Bazı alanlarda gelişim fırsatı'],
              opportunities: scenarios?.length > 0 ? ['Eylem planı potansiyeli', 'Gelişim fırsatları'] : ['Planlama gerekli']
            }
          }
        }
      }),

      overallInsights: {
        totalKPIsAnalyzed: mockKPIs.length,
        avgImprovementExpected: scenarios?.reduce((sum: number, s: any) => {
          const actionCount = s.actions?.length || 0
          return sum + actionCount * (3 + Math.random() * 4)
        }, 0) / Math.max(scenarios?.length || 1, 1),
        highestRiskKPIs: mockKPIs.slice(0, 2).map(kpi => `${kpi.description}`),
        mostImpactfulActions: scenarios?.flatMap((s: any) => s.actions || [])
          .slice(0, 3)
          .map((a: any) => a.actionCode || a.actionId || 'Unknown Action'),
        underperformingFactories: mockFactories.slice(0, 2).map(f => f.name),
        recommendedPriorities: [
          'Model fabrika etkileşimlerini artırın',
          'Teknoloji transferi süreçlerini güçlendirin',
          'Sürdürülebilirlik uygulamalarını yaygınlaştırın'
        ]
      },

      probabilisticOutcomes: {
        optimistic: { probability: 25, expectedKPIImprovements: [], factoryRankings: [] },
        realistic: { probability: 50, expectedKPIImprovements: [], factoryRankings: [] },
        pessimistic: { probability: 25, expectedKPIImprovements: [], factoryRankings: [] }
      }
    }

    console.log('✅ Mock KPI Analysis Complete')

    return NextResponse.json({
      success: true,
      type: 'kpi-focused',
      results: simulationResults,
      generatedAt: new Date().toISOString(),
      dataSource: 'Mock Model Factories (No Database)',
      summary: {
        factoriesAnalyzed: mockFactories.length,
        kpisAnalyzed: mockKPIs.length,
        scenariosProcessed: scenarios?.length || 0
      }
    })

  } catch (error) {
    console.error('Mock KPI simulation error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Mock KPI simülasyonu başarısız',
        detail: String(error)
      }, 
      { status: 500 }
    )
  }
}
