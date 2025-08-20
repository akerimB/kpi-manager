import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { simulationEngine, Scenario, MonteCarloSettings, SensitivityAnalysis, TimeRange } from '@/lib/simulation-engine'

type SimulationWithRelations = {
  id: string
  name: string
  description: string | null
  createdAt: Date
  createdBy: string
  updatedAt: Date
  simulationItems: {
    id: string
    actionId: string
    assumedCompletion: number
    estimatedImpact: number
    estimatedImpactCategory: string
    action: {
      id: string
      code: string
      title: string | null
      description: string | null
      strategicTarget: {
        code: string
        strategicGoal: {
          code: string
        }
      }
    }
  }[]
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const simulationId = searchParams.get('id')

    if (simulationId) {
      // Belirli bir simülasyonu getir
      const simulation = await prisma.simulation.findUnique({
        where: { id: simulationId },
        include: {
          simulationItems: {
            include: {
              action: {
                include: {
                  strategicTarget: {
                    include: {
                      strategicGoal: true
                    }
                  }
                }
              }
            }
          }
        }
      }) as unknown as SimulationWithRelations | null

      if (!simulation) {
        return NextResponse.json({ error: 'Simülasyon bulunamadı' }, { status: 404 })
      }

      // Frontend formatına dönüştür
      const formattedSimulation = {
        id: simulation.id,
        name: simulation.name,
        description: simulation.description,
        createdAt: simulation.createdAt,
        simulationItems: simulation.simulationItems.map((item: SimulationWithRelations['simulationItems'][0]) => ({
          id: item.id,
          actionId: item.actionId,
          assumedCompletion: item.assumedCompletion,
          estimatedImpact: item.estimatedImpact,
          estimatedImpactCategory: item.estimatedImpactCategory === 'HIGH' ? 'YÜKSEK' :
                                 item.estimatedImpactCategory === 'MEDIUM' ? 'ORTA' :
                                 item.estimatedImpactCategory === 'LOW' ? 'DÜŞÜK' : 'KRİTİK',
          action: {
            id: item.action.id,
            code: item.action.code,
            description: item.action.title, // Frontend description bekliyor
            strategicTarget: {
              code: item.action.strategicTarget.code,
              strategicGoal: {
                code: item.action.strategicTarget.strategicGoal.code
              }
            }
          }
        }))
      }

      return NextResponse.json(formattedSimulation)
    } else {
      // Tüm simülasyonları listele
      const simulations = await prisma.simulation.findMany({
        include: {
          simulationItems: {
            take: 5, // Önizleme için sadece ilk 5 item
            include: {
              action: {
                include: {
                  strategicTarget: {
                    include: {
                      strategicGoal: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }) as unknown as SimulationWithRelations[]

      // Frontend formatına dönüştür
      const formattedSimulations = simulations.map(simulation => ({
        id: simulation.id,
        name: simulation.name,
        description: simulation.description,
        createdAt: simulation.createdAt,
        simulationItems: simulation.simulationItems.map((item: SimulationWithRelations['simulationItems'][0]) => ({
          id: item.id,
          actionId: item.actionId,
          assumedCompletion: item.assumedCompletion,
          estimatedImpact: item.estimatedImpact,
          estimatedImpactCategory: item.estimatedImpactCategory === 'HIGH' ? 'YÜKSEK' :
                                 item.estimatedImpactCategory === 'MEDIUM' ? 'ORTA' :
                                 item.estimatedImpactCategory === 'LOW' ? 'DÜŞÜK' : 'KRİTİK',
          action: {
            id: item.action.id,
            code: item.action.code,
            description: item.action.title, // Frontend description bekliyor
            strategicTarget: {
              code: item.action.strategicTarget.code,
              strategicGoal: {
                code: item.action.strategicTarget.strategicGoal.code
              }
            }
          }
        }))
      }))

      return NextResponse.json(formattedSimulations)
    }
  } catch (error) {
    console.error('Simulation fetch error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      name, 
      description, 
      scenarioItems, 
      analysisType = 'basic',
      scenarios,
      monteCarlo,
      sensitivity,
      timeHorizon
    } = body

    if (!name) {
      return NextResponse.json({ error: 'İsim gerekli' }, { status: 400 })
    }

    // Advanced simulation analysis
    if (analysisType === 'advanced' && scenarios) {
      console.log('🚀 Running Advanced Simulation Analysis...')
      
      const advancedResults = await simulationEngine.runAdvancedSimulation(
        scenarios as Scenario[],
        monteCarlo as MonteCarloSettings || {
          iterations: 1000,
          confidenceLevel: 0.95,
          variabilityFactor: 20
        },
        sensitivity as SensitivityAnalysis || {
          parameters: [
            {
              name: 'completion_rate',
              baseline: 100,
              variations: [-20, -10, 10, 20],
              impact: 'linear'
            },
            {
              name: 'success_probability',
              baseline: 100,
              variations: [-15, -7.5, 7.5, 15],
              impact: 'exponential'
            }
          ],
          ranges: [{ min: -50, max: 50, step: 10 }]
        },
        timeHorizon as TimeRange || {
          start: new Date(),
          end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          intervals: 'monthly'
        }
      )

      return NextResponse.json({
        success: true,
        type: 'advanced',
        results: advancedResults,
        generatedAt: new Date().toISOString()
      })
    }

    // Basic simulation (existing functionality)
    if (!scenarioItems || !Array.isArray(scenarioItems)) {
      return NextResponse.json({ error: 'Senaryo öğeleri gerekli' }, { status: 400 })
    }

    // Simülasyon oluştur
    const simulation = await prisma.simulation.create({
      data: {
        name,
        description: description || '',
        createdBy: 'user', // TODO: get from auth
        simulationItems: {
          create: scenarioItems.map((item: any) => ({
            actionId: item.actionId,
            assumedCompletion: item.assumedCompletion || 50,
            estimatedImpact: item.estimatedImpact || 0,
            estimatedImpactCategory: item.estimatedImpactCategory || 'ORTA'
          }))
        }
      },
      include: {
        simulationItems: {
          include: {
            action: {
              include: {
                strategicTarget: {
                  include: {
                    strategicGoal: true
                  }
                }
              }
            }
          }
        }
      }
    }) as unknown as SimulationWithRelations

    // Frontend formatına dönüştür
    const formattedSimulation = {
      id: simulation.id,
      name: simulation.name,
      description: simulation.description,
      createdAt: simulation.createdAt,
      simulationItems: simulation.simulationItems.map((item: SimulationWithRelations['simulationItems'][0]) => ({
        id: item.id,
        actionId: item.actionId,
        assumedCompletion: item.assumedCompletion,
        estimatedImpact: item.estimatedImpact,
        estimatedImpactCategory: item.estimatedImpactCategory === 'HIGH' ? 'YÜKSEK' :
                               item.estimatedImpactCategory === 'MEDIUM' ? 'ORTA' :
                               item.estimatedImpactCategory === 'LOW' ? 'DÜŞÜK' : 'KRİTİK',
        action: {
          id: item.action.id,
          code: item.action.code,
          description: item.action.title, // Frontend description bekliyor
          strategicTarget: {
            code: item.action.strategicTarget.code,
            strategicGoal: {
              code: item.action.strategicTarget.strategicGoal.code
            }
          }
        }
      }))
    }

    // Simülasyon sonuçlarını hesapla
    const results = await calculateSimulationResults(simulation.id)

    return NextResponse.json({
      success: true,
      type: 'basic',
      simulation: formattedSimulation,
      results
    })
  } catch (error) {
    console.error('Simulation creation error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

async function calculateSimulationResults(simulationId: string) {
  try {
    const simulation = await prisma.simulation.findUnique({
      where: { id: simulationId },
      include: {
        simulationItems: {
          include: {
            action: {
              include: {
                actionKpis: {
                  include: {
                    kpi: {
                      include: {
                        kpiValues: {
                          where: {
                            period: '2024-Q4' // Mevcut dönem
                          },
                          include: {
                            factory: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }) as unknown as SimulationWithRelations | null

    if (!simulation) {
      throw new Error('Simülasyon bulunamadı')
    }

    // Gelişmiş simülasyon sonucu hesaplama (ActionKpi ilişkilerini kullanarak)
    const totalItems = simulation.simulationItems.length
    let totalPotentialImpact = 0
    let totalWeightedCompletion = 0
    let totalKpiImpacts = 0

    simulation.simulationItems.forEach((item: any) => {
      const completionRate = item.assumedCompletion / 100
      
      // Bu eylemin etkilediği KPI'lar
      item.action.actionKpis.forEach((actionKpi: any) => {
        const impactScore = actionKpi.impactScore || 0.5 // Varsayılan etki
        const kpiCurrentValues = actionKpi.kpi.kpiValues
        
        if (kpiCurrentValues.length > 0) {
          // Tüm fabrikalar için ortalama mevcut değer
          const avgCurrentValue = kpiCurrentValues.reduce((sum: number, kv: any) => sum + kv.value, 0) / kpiCurrentValues.length
          const targetValue = actionKpi.kpi.targetValue || 100
          const currentAchievement = Math.min(100, (avgCurrentValue / targetValue) * 100)
          
          // Eylemin tamamlanma oranına göre KPI'ya olan etkisi
          const potentialImprovement = impactScore * completionRate * (100 - currentAchievement)
          totalPotentialImpact += potentialImprovement
          totalKpiImpacts++
        }
      })
      
      totalWeightedCompletion += completionRate * (item.action.actionKpis.length || 1)
    })

    const avgCompletion = totalItems > 0 
      ? simulation.simulationItems.reduce((sum: number, item: any) => sum + (item.assumedCompletion || 50), 0) / totalItems
      : 50

    const avgPotentialImpact = totalKpiImpacts > 0 ? totalPotentialImpact / totalKpiImpacts : 0
    const overallScore = Math.round((avgCompletion + avgPotentialImpact) / 2)
    const riskScore = Math.max(0, Math.min(100, 100 - avgPotentialImpact))

    return {
      totalItems,
      avgCompletion: Math.round(avgCompletion),
      avgImpact: Math.round(avgPotentialImpact * 100) / 100,
      overallScore,
      riskScore,
      totalKpiImpacts,
      items: simulation.simulationItems.map((item: any) => ({
        id: item.id,
        actionId: item.actionId,
        assumedCompletion: item.assumedCompletion,
        estimatedImpact: item.estimatedImpact,
        estimatedImpactCategory: item.estimatedImpactCategory === 'HIGH' ? 'YÜKSEK' :
                               item.estimatedImpactCategory === 'MEDIUM' ? 'ORTA' :
                               item.estimatedImpactCategory === 'LOW' ? 'DÜŞÜK' : 'KRİTİK',
        impactedKpiCount: item.action.actionKpis.length
      }))
    }
  } catch (error) {
    console.error('Simulation calculation error:', error)
    return {
      totalItems: 0,
      avgCompletion: 0,
      avgImpact: 0,
      overallScore: 0,
      riskScore: 50,
      totalKpiImpacts: 0,
      items: []
    }
  }
} 