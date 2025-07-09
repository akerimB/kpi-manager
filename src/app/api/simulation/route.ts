import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
    const { name, description, scenarioItems } = body

    if (!name || !scenarioItems || !Array.isArray(scenarioItems)) {
      return NextResponse.json({ error: 'İsim ve senaryo öğeleri gerekli' }, { status: 400 })
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
        simulationItems: true
      }
    }) as unknown as SimulationWithRelations | null

    if (!simulation) {
      throw new Error('Simülasyon bulunamadı')
    }

    // Basit simülasyon sonucu hesaplama
    const totalItems = simulation.simulationItems.length
    const avgCompletion = totalItems > 0 
      ? simulation.simulationItems.reduce((sum: number, item: SimulationWithRelations['simulationItems'][0]) => sum + (item.assumedCompletion || 50), 0) / totalItems
      : 50

    const avgImpact = totalItems > 0
      ? simulation.simulationItems.reduce((sum: number, item: SimulationWithRelations['simulationItems'][0]) => sum + (item.estimatedImpact || 0), 0) / totalItems
      : 0

    return {
      totalItems,
      avgCompletion: Math.round(avgCompletion),
      avgImpact: Math.round(avgImpact * 100) / 100,
      overallScore: Math.round((avgCompletion + Math.abs(avgImpact * 10)) / 2),
      riskScore: Math.max(0, Math.min(100, 50 + avgImpact * 10)),
      items: simulation.simulationItems.map((item: SimulationWithRelations['simulationItems'][0]) => ({
        id: item.id,
        actionId: item.actionId,
        assumedCompletion: item.assumedCompletion,
        estimatedImpact: item.estimatedImpact,
        estimatedImpactCategory: item.estimatedImpactCategory === 'HIGH' ? 'YÜKSEK' :
                               item.estimatedImpactCategory === 'MEDIUM' ? 'ORTA' :
                               item.estimatedImpactCategory === 'LOW' ? 'DÜŞÜK' : 'KRİTİK'
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
      items: []
    }
  }
} 