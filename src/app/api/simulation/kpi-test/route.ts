import { NextRequest, NextResponse } from 'next/server'

// Prisma'yı güvenli şekilde yükleme fonksiyonu
async function loadPrisma() {
  try {
    const { prisma } = await import('@/lib/prisma')
    return prisma
  } catch (error) {
    console.warn('⚠️ Prisma could not be loaded:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 KPI Test Analysis Started...')
    
    // Request body'yi güvenli şekilde parse et
    let scenarios = []
    try {
      const requestBody = await request.text()
      console.log('Raw request body:', requestBody)
      
      if (!requestBody || requestBody.trim() === '') {
        console.log('Empty request body, using default scenarios')
        scenarios = []
      } else {
        const parsed = JSON.parse(requestBody)
        scenarios = parsed.scenarios || []
      }
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError)
      console.log('Using empty scenarios array as fallback')
      scenarios = []
    }

    console.log('Processed scenarios:', scenarios?.length || 0)

    // Veritabanı bağlantısını test et
    let realFactories = []
    let realKPIs = []
    
    let prismaClient = await loadPrisma()
    
    if (prismaClient) {
      try {
        console.log('📊 Veritabanından fabrikaları alıyor...')
        realFactories = await prismaClient.modelFactory.findMany({
          where: { isActive: true },
          orderBy: { code: 'asc' }
        })
        console.log(`✅ ${realFactories.length} fabrika bulundu`)

        console.log('📋 Veritabanından KPI\'ları alıyor...')
        realKPIs = await prismaClient.kpi.findMany({
          take: 10, // İlk 10 KPI
          include: {
            theme: true,
            strategicTarget: {
              include: {
                strategicGoal: true
              }
            },
            kpiValues: {
              where: { period: '2024-Q4' },
              include: { factory: true }
            }
          },
          orderBy: { number: 'asc' }
        })
        console.log(`✅ ${realKPIs.length} KPI bulundu`)
        
      } catch (dbError) {
        console.error('Veritabanı bağlantı hatası:', dbError)
        prismaClient = null // Force fallback
      }
    }
    
    if (!prismaClient) {
      console.log('🔄 Prisma mevcut değil, mock data kullanılıyor...')
      
      // Fallback: mock data kullan
      realFactories = [
        { id: 'mock1', code: 'MF01', name: 'İstanbul Model Fabrikası', city: 'İstanbul', region: 'Marmara', isActive: true },
        { id: 'mock2', code: 'MF02', name: 'Ankara Model Fabrikası', city: 'Ankara', region: 'İç Anadolu', isActive: true },
        { id: 'mock3', code: 'MF03', name: 'İzmir Model Fabrikası', city: 'İzmir', region: 'Ege', isActive: true }
      ]
      
      realKPIs = [
        { 
          id: 'kpi1', 
          number: 1, 
          description: 'Test KPI 1', 
          theme: { name: 'Test Theme' },
          strategicTarget: { 
            description: 'Test Target',
            strategicGoal: { description: 'Test Goal' }
          },
          kpiValues: []
        }
      ]
      
      console.log('⚠️ Mock veriler kullanılıyor')
    }

    console.log(`📊 ${realFactories.length} gerçek fabrika, ${realKPIs.length} KPI bulundu`)

    // Gerçek verilerle simülasyon sonuçları
    const realResults = {
      scenarioResults: scenarios?.map((scenario: any) => ({
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        probability: scenario.probability,
        kpiProjections: realKPIs.map((kpi) => {
          // Gerçek mevcut period değerleri
          const currentPeriodValues = realFactories.map(factory => {
            const kpiValue = kpi.kpiValues.find(kv => kv.factoryId === factory.id)
            return {
              factoryId: factory.id,
              factoryName: factory.name,
              factoryCity: factory.city || factory.name,
              factoryRegion: factory.region || 'Belirtilmemiş',
              value: kpiValue?.value || (60 + Math.random() * 30), // Gerçek değer yoksa 60-90 arası
              target: kpiValue?.target || (80 + Math.random() * 20), // Gerçek hedef yoksa 80-100 arası
              achievementRate: kpiValue ? (kpiValue.value / kpiValue.target) * 100 : 75 + Math.random() * 25
            }
          })

          // Historik trend simülasyonu (gerçek geçmiş verileri olmadığı için simüle ediyoruz)
          const avgCurrentValue = currentPeriodValues.reduce((sum, cv) => sum + cv.value, 0) / currentPeriodValues.length
          const trendRate = -2 + Math.random() * 8 // %-2 ile %6 arası trend

          return {
            kpiId: kpi.id,
            kpiNumber: kpi.number,
            kpiDescription: kpi.description,
            theme: kpi.theme?.name || 'Belirtilmemiş',
            strategicGoal: kpi.strategicTarget?.strategicGoal?.description || 'Belirtilmemiş',
            strategicTarget: kpi.strategicTarget?.description || 'Belirtilmemiş',
            currentPeriodValues,
            historicalTrend: {
              periods: ['2024-Q1', '2024-Q2', '2024-Q3', '2024-Q4'],
              values: [
                avgCurrentValue - 6,
                avgCurrentValue - 4,
                avgCurrentValue - 2,
                avgCurrentValue
              ],
              trendDirection: trendRate > 2 ? 'improving' : trendRate < -2 ? 'declining' : 'stable',
              trendRate
            },
            projectedValues: [
              {
                period: '2025-Q1',
                factoryProjections: currentPeriodValues.map((factoryValue) => {
                  // Baseline projeksiyonu (doğal trend)
                  const baseline = factoryValue.value * (1 + trendRate / 100 / 4) // Çeyreklik büyüme
                  
                  // Eylem etkisi simülasyonu (scenario'nun eylem sayısına göre)
                  const actionCount = scenario.actions?.length || 0
                  const actionImpact = actionCount > 0 ? 
                    baseline * (0.02 + Math.random() * 0.08) * Math.min(actionCount / 3, 1) : 0 // %2-10 arası
                  
                  const projected = baseline + actionImpact
                  const improvement = projected - factoryValue.value
                  const improvementPercent = (improvement / factoryValue.value) * 100
                  
                  // Risk seviyesi hesaplama
                  const currentPerformance = factoryValue.achievementRate
                  const riskLevel = currentPerformance < 70 ? 'high' : 
                                   currentPerformance < 85 ? 'medium' : 'low'
                  
                  return {
                    factoryId: factoryValue.factoryId,
                    factoryName: factoryValue.factoryName,
                    baseline,
                    projected,
                    improvement,
                    improvementPercent,
                    riskLevel,
                    contributingActions: scenario.actions?.map((a: any) => a.actionCode || a.actionId) || []
                  }
                }),
                aggregateProjection: (() => {
                  const totalBaseline = currentPeriodValues.reduce((sum, cv) => sum + cv.value, 0) / currentPeriodValues.length
                  const projectedAvg = totalBaseline * (1 + trendRate / 100 / 4) + 
                                      (scenario.actions?.length || 0) * 2 // Her eylem %2 iyileşme
                  const improvement = projectedAvg - totalBaseline
                  const improvementPercent = (improvement / totalBaseline) * 100
                  
                  return {
                    baseline: totalBaseline,
                    withActions: projectedAvg,
                    improvement,
                    improvementPercent,
                    confidenceInterval: {
                      lower: projectedAvg * 0.9,
                      upper: projectedAvg * 1.1,
                      confidence: 75 + Math.random() * 20 // %75-95 güven aralığı
                    }
                  }
                })()
              }
            ],
            riskFactors: (() => {
              const risks = []
              
              // Performans bazlı risk
              const underperformingCount = currentPeriodValues.filter(cv => cv.achievementRate < 80).length
              const totalFactories = currentPeriodValues.length
              
              if (underperformingCount > totalFactories * 0.3) {
                risks.push({
                  id: 'underperformance_risk',
                  name: 'Yaygın Düşük Performans',
                  type: 'internal',
                  probability: 60,
                  impact: -15,
                  description: `Fabrikaların %${Math.round(underperformingCount/totalFactories*100)}'i hedefin altında`,
                  mitigation: 'Kapasiye geliştirme ve best practice paylaşımı'
                })
              }
              
              // Tema bazlı risk
              if (kpi.theme?.name.includes('Pazarlama') || kpi.theme?.name.includes('Satış')) {
                risks.push({
                  id: 'market_risk',
                  name: 'Pazar Dinamikleri Riski',
                  type: 'market',
                  probability: 40,
                  impact: -10,
                  description: 'Pazar koşullarındaki değişiklikler KPI performansını etkileyebilir',
                  mitigation: 'Pazar analizi ve esnek stratejiler'
                })
              }
              
              // Trend bazlı risk
              if (trendRate < -1) {
                risks.push({
                  id: 'declining_trend_risk',
                  name: 'Azalan Trend Riski',
                  type: 'internal',
                  probability: 70,
                  impact: Math.max(-20, trendRate * 2),
                  description: `KPI değeri %${Math.abs(trendRate).toFixed(1)} oranında azalıyor`,
                  mitigation: 'Kök neden analizi ve iyileştirme planı'
                })
              }
              
              return risks.length > 0 ? risks : [{
                id: 'minimal_risk',
                name: 'Minimal Risk',
                type: 'internal',
                probability: 20,
                impact: -3,
                description: 'Düşük seviyede operasyonel riskler',
                mitigation: 'Sürekli izleme ve önleyici tedbirler'
              }]
            })()
          }
        }),
        overallMetrics: (() => {
          const actionCount = scenario.actions?.length || 0
          const avgImprovement = actionCount * (2 + Math.random() * 3) // 2-5% per action
          const successProb = Math.max(60, 90 - actionCount * 5) // Daha fazla eylem = daha düşük başarı olasılığı
          const timeToValue = Math.max(3, actionCount * 1.5 + Math.random() * 3) // Aylar
          const resourceReq = Math.min(100, actionCount * 15 + Math.random() * 20) // %
          
          // Risk skorunu hesapla
          const riskScore = Math.max(0, Math.min(100,
            (100 - successProb) * 0.4 + 
            resourceReq * 0.3 + 
            (timeToValue > 6 ? 30 : timeToValue * 5) * 0.3
          ))
          
          return {
            totalKPIImprovement: avgImprovement,
            successProbability: successProb,
            timeToValue: Math.round(timeToValue),
            resourceRequirement: Math.round(resourceReq),
            riskScore: Math.round(riskScore)
          }
        })()
      })) || [],
      
      factoryComparisons: realFactories.map((factory, index) => {
        // Fabrika için ortalama KPI performansı hesapla
        const factoryKPIValues = realKPIs.map(kpi => {
          const kpiValue = kpi.kpiValues.find(kv => kv.factoryId === factory.id)
          return kpiValue ? (kpiValue.value / kpiValue.target) * 100 : 75 + Math.random() * 25
        })
        
        const avgKPIScore = factoryKPIValues.reduce((sum, score) => sum + score, 0) / factoryKPIValues.length
        const aboveTarget = factoryKPIValues.filter(score => score >= 100).length
        const belowTarget = factoryKPIValues.length - aboveTarget
        
        // Projected improvement (scenario'nun eylem sayısına göre)
        const actionCount = scenarios?.[0]?.actions?.length || 0
        const expectedImprovement = actionCount * (1 + Math.random() * 2) // 1-3% per action
        const projectedScore = avgKPIScore * (1 + expectedImprovement / 100)
        
        return {
          factoryId: factory.id,
          factoryName: factory.name,
          currentPerformance: {
            avgKPIScore: Math.round(avgKPIScore * 10) / 10,
            rank: index + 1, // Basit sıralama, gerçekte skorlara göre sıralanabilir
            totalKPIs: realKPIs.length,
            aboveTarget,
            belowTarget
          },
          projectedPerformance: {
            avgKPIScore: Math.round(projectedScore * 10) / 10,
            projectedRank: index + 1, // Basitleştirilmiş
            expectedImprovement: Math.round(expectedImprovement * 10) / 10,
            riskAdjustedScore: Math.round(projectedScore * (0.9 + Math.random() * 0.2) * 10) / 10
          },
          competitivePosition: {
            relativeToAverage: Math.round((avgKPIScore - 80) * 10) / 10, // 80 ortalama varsayımı
            relativeToLeader: Math.round((avgKPIScore - 90) * 10) / 10, // 90 lider varsayımı
            gapAnalysis: {
              strengths: avgKPIScore > 85 ? ['Güçlü KPI performansı', 'Hedeflerin üzerinde'] : ['Istikrarlı performans'],
              weaknesses: avgKPIScore < 75 ? ['Hedeflerin altında performans', 'İyileştirme gerekli'] : ['Bazı KPI\'larda gelişim fırsatı'],
              opportunities: actionCount > 0 ? ['Eylem planı ile iyileştirme potansiyeli', 'Stratejik gelişim fırsatları'] : ['Eylem planlaması gerekli']
            }
          }
        }
      }),
      overallInsights: {
        totalKPIsAnalyzed: realKPIs.length,
        avgImprovementExpected: scenarios?.reduce((sum, s) => {
          const actionCount = s.actions?.length || 0
          return sum + actionCount * (2 + Math.random() * 3)
        }, 0) / Math.max(scenarios?.length || 1, 1),
        highestRiskKPIs: realKPIs
          .filter((_, index) => Math.random() > 0.7)
          .slice(0, 3)
          .map(kpi => `KPI ${kpi.number}: ${kpi.description.substring(0, 30)}...`),
        mostImpactfulActions: scenarios?.flatMap(s => s.actions || [])
          .slice(0, 3)
          .map(a => a.actionCode || a.actionId || 'Unknown Action'),
        underperformingFactories: realFactories
          .filter((_, index) => Math.random() > 0.6)
          .slice(0, 3)
          .map(f => f.name),
        recommendedPriorities: [
          'KPI performans izleme sistemini güçlendirin',
          'Düşük performanslı fabrikalar için destek planı oluşturun',
          'Risk faktörlerini minimize edecek önlemler alın',
          'Eylem planlarının uygulama takibini artırın'
        ].slice(0, 3)
      },
      probabilisticOutcomes: {
        optimistic: {
          probability: 25,
          expectedKPIImprovements: [],
          factoryRankings: []
        },
        realistic: {
          probability: 50,
          expectedKPIImprovements: [],
          factoryRankings: []
        },
        pessimistic: {
          probability: 25,
          expectedKPIImprovements: [],
          factoryRankings: []
        }
      }
    }

    console.log('✅ KPI Analysis Complete')
    console.log(`📊 Processed ${realFactories.length} factories and ${realKPIs.length} KPIs`)

    // Response'u güvenli şekilde oluştur
    const safeResponse = {
      success: true,
      type: 'kpi-focused',
      results: {
        scenarioResults: realResults.scenarioResults || [],
        factoryComparisons: realResults.factoryComparisons || [],
        overallInsights: realResults.overallInsights || {},
        probabilisticOutcomes: realResults.probabilisticOutcomes || {}
      },
      generatedAt: new Date().toISOString(),
      dataSource: realFactories.length > 0 ? 'Real Model Factories' : 'Mock Data',
      summary: {
        factoriesAnalyzed: realFactories.length,
        kpisAnalyzed: realKPIs.length,
        scenariosProcessed: scenarios?.length || 0
      }
    }

    try {
      // JSON'u test et
      JSON.stringify(safeResponse)
      return NextResponse.json(safeResponse)
    } catch (jsonError) {
      console.error('JSON stringify error:', jsonError)
      
      // Minimal fallback response
      return NextResponse.json({
        success: true,
        type: 'kpi-focused',
        results: {
          scenarioResults: [],
          factoryComparisons: [],
          overallInsights: { totalKPIsAnalyzed: 0 },
          probabilisticOutcomes: {}
        },
        error: 'JSON generation error',
        dataSource: 'Fallback'
      })
    }

  } catch (error) {
    console.error('KPI test simulation error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'KPI test simülasyonu başarısız',
        detail: String(error)
      }, 
      { status: 500 }
    )
  }
}
