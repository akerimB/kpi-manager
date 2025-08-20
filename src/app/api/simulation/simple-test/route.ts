import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Simple Test Endpoint Called')

    // Minimal successful response
    const simpleResponse = {
      success: true,
      type: 'kpi-focused',
      results: {
        scenarioResults: [
          {
            scenarioId: 'test-1',
            scenarioName: 'Test Scenario',
            probability: 100,
            kpiProjections: [],
            overallMetrics: {
              totalKPIImprovement: 5.0,
              successProbability: 80,
              timeToValue: 6,
              resourceRequirement: 50,
              riskScore: 20
            }
          }
        ],
        factoryComparisons: [
          {
            factoryId: 'test-factory',
            factoryName: 'Test Factory',
            currentPerformance: {
              avgKPIScore: 85.0,
              rank: 1,
              totalKPIs: 5,
              aboveTarget: 3,
              belowTarget: 2
            },
            projectedPerformance: {
              avgKPIScore: 90.0,
              projectedRank: 1,
              expectedImprovement: 5.0,
              riskAdjustedScore: 88.0
            },
            competitivePosition: {
              relativeToAverage: 5.0,
              relativeToLeader: 0.0,
              gapAnalysis: {
                strengths: ['Good performance'],
                weaknesses: ['Some improvement needed'],
                opportunities: ['Growth potential']
              }
            }
          }
        ],
        overallInsights: {
          totalKPIsAnalyzed: 5,
          avgImprovementExpected: 5.0,
          highestRiskKPIs: ['KPI 1'],
          mostImpactfulActions: ['Action A'],
          underperformingFactories: [],
          recommendedPriorities: ['Monitor performance']
        },
        probabilisticOutcomes: {
          optimistic: { probability: 25, expectedKPIImprovements: [], factoryRankings: [] },
          realistic: { probability: 50, expectedKPIImprovements: [], factoryRankings: [] },
          pessimistic: { probability: 25, expectedKPIImprovements: [], factoryRankings: [] }
        }
      },
      generatedAt: new Date().toISOString(),
      dataSource: 'Simple Test',
      summary: {
        factoriesAnalyzed: 1,
        kpisAnalyzed: 5,
        scenariosProcessed: 1
      }
    }

    console.log('✅ Simple test response ready')
    return NextResponse.json(simpleResponse)

  } catch (error) {
    console.error('Simple test error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Simple test failed',
        detail: String(error)
      }, 
      { status: 500 }
    )
  }
}
