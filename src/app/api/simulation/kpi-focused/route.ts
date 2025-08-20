import { NextRequest, NextResponse } from 'next/server'
import { enhancedKPISimulation } from '@/lib/enhanced-kpi-simulation'

export async function POST(request: NextRequest) {
  try {
    const { scenarios } = await request.json()

    if (!scenarios || !Array.isArray(scenarios)) {
      return NextResponse.json({ error: 'Scenarios are required' }, { status: 400 })
    }

    console.log('🎯 Running KPI-Focused Simulation...')

    // Transform scenarios to KPI simulation format
    const kpiScenarios = scenarios.map((scenario: any) => ({
      id: scenario.id,
      name: scenario.name,
      description: scenario.description,
      probability: scenario.probability,
      actions: scenario.actions.map((action: any) => ({
        actionId: action.actionId,
        actionCode: action.actionCode,
        completionRate: action.completionRate,
        implementationDelay: Math.floor(action.startDelay / 30), // Convert days to months
        implementationDuration: Math.floor(action.duration / 30), // Convert days to months
        successProbability: action.successProbability,
        resourceIntensity: action.resourceRequirement
      })),
      timeHorizon: {
        startPeriod: '2024-Q4',
        endPeriod: '2025-Q4',
        intervalMonths: 3
      }
    }))

    const results = await enhancedKPISimulation.runKPIFocusedSimulation(kpiScenarios)

    return NextResponse.json({
      success: true,
      type: 'kpi-focused',
      results,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('KPI-focused simulation error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'KPI odaklı simülasyon başarısız',
        detail: String(error)
      }, 
      { status: 500 }
    )
  }
}
