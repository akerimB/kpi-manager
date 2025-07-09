import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const simulationId = searchParams.get('id')

    if (simulationId) {
      // Belirli bir simülasyonu getir
      const simulation = await prisma.simulation.findUnique({
        where: { id: simulationId },
        include: {
          simulationItems: true
        }
      })

      if (!simulation) {
        return NextResponse.json({ error: 'Simulation not found' }, { status: 404 })
      }

      return NextResponse.json(simulation)
    } else {
      // Tüm simülasyonları listele
      const simulations = await prisma.simulation.findMany({
        include: {
          simulationItems: {
            take: 5 // Önizleme için sadece ilk 5 item
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      return NextResponse.json(simulations)
    }
  } catch (error) {
    console.error('Simulation fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, scenarioItems } = body

    if (!name || !scenarioItems || !Array.isArray(scenarioItems)) {
      return NextResponse.json({ error: 'Name and scenario items are required' }, { status: 400 })
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
            estimatedImpactCategory: item.estimatedImpactCategory || 'MEDIUM'
          }))
        }
      },
      include: {
        simulationItems: true
      }
    })

    // Simülasyon sonuçlarını hesapla
    const results = await calculateSimulationResults(simulation.id)

    return NextResponse.json({
      simulation,
      results
    })
  } catch (error) {
    console.error('Simulation creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function calculateSimulationResults(simulationId: string) {
  try {
    const simulation = await prisma.simulation.findUnique({
      where: { id: simulationId },
      include: {
        simulationItems: true
      }
    })

    if (!simulation) {
      throw new Error('Simulation not found')
    }

    // Basit simülasyon sonucu hesaplama
    const totalItems = simulation.simulationItems.length
    const avgCompletion = totalItems > 0 
      ? simulation.simulationItems.reduce((sum, item) => sum + (item.assumedCompletion || 50), 0) / totalItems
      : 50

    const avgImpact = totalItems > 0
      ? simulation.simulationItems.reduce((sum, item) => sum + (item.estimatedImpact || 0), 0) / totalItems
      : 0

    return {
      totalItems,
      avgCompletion: Math.round(avgCompletion),
      avgImpact: Math.round(avgImpact * 100) / 100,
      overallScore: Math.round((avgCompletion + Math.abs(avgImpact * 10)) / 2),
      riskScore: Math.max(0, Math.min(100, 50 + avgImpact * 10)),
      items: simulation.simulationItems.map(item => ({
        id: item.id,
        actionId: item.actionId,
        assumedCompletion: item.assumedCompletion,
        estimatedImpact: item.estimatedImpact,
        category: item.estimatedImpactCategory
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