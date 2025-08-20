import { NextRequest, NextResponse } from 'next/server'
import { aiSimulationAdvisor } from '@/lib/ai-simulation-advisor'

export async function POST(request: NextRequest) {
  try {
    const { scenarios, simulationResults, actions } = await request.json()

    if (!scenarios || !Array.isArray(scenarios)) {
      return NextResponse.json({ error: 'Scenarios are required' }, { status: 400 })
    }

    console.log('🤖 Generating AI recommendations for simulation...')

    // Generate AI recommendations
    const recommendations = await aiSimulationAdvisor.generateRecommendations(
      scenarios,
      simulationResults,
      actions || []
    )

    // Generate optimal sequence
    const optimalSequence = await aiSimulationAdvisor.generateOptimalSequence(scenarios)

    // Generate resource allocation optimization
    const resourceAllocation = await aiSimulationAdvisor.optimizeResourceAllocation(scenarios)

    // Generate alternative scenarios
    const alternativeScenarios = await aiSimulationAdvisor.generateAlternativeScenarios(
      scenarios,
      simulationResults
    )

    return NextResponse.json({
      success: true,
      recommendations,
      optimalSequence,
      resourceAllocation,
      alternativeScenarios,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('AI recommendations error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'AI önerileri oluşturulamadı',
        detail: String(error)
      }, 
      { status: 500 }
    )
  }
}
