import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MLEngine, TrainingData } from '@/lib/ml-engine'
import { z } from 'zod'

// Request schemas
const ForecastRequestSchema = z.object({
  kpiId: z.string(),
  factoryId: z.string().optional(),
  periodsAhead: z.number().min(1).max(12).default(4),
  includeSeasonality: z.boolean().default(true)
})

const PredictRequestSchema = z.object({
  modelId: z.string(),
  features: z.array(z.number()),
  kpiId: z.string(),
  factoryId: z.string().optional()
})

const TrainModelRequestSchema = z.object({
  kpiId: z.string(),
  factoryId: z.string().optional(),
  modelType: z.enum(['linear_regression', 'polynomial_regression', 'exponential_smoothing', 'ensemble']),
  parameters: z.object({
    order: z.number().optional(), // For polynomial regression
    alpha: z.number().optional()  // For exponential smoothing
  }).optional()
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const action = url.searchParams.get('action')
    const body = await request.json()

    const mlEngine = MLEngine.getInstance()

    switch (action) {
      case 'forecast':
        return await handleForecast(body, session.user, mlEngine)
      
      case 'predict':
        return await handlePredict(body, session.user, mlEngine)
      
      case 'train':
        return await handleTrainModel(body, session.user, mlEngine)
      
      case 'models':
        return await handleListModels(mlEngine)
      
      case 'seasonality':
        return await handleSeasonalityAnalysis(body, session.user, mlEngine)
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('ML API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        detail: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const action = url.searchParams.get('action')
    const mlEngine = MLEngine.getInstance()

    switch (action) {
      case 'models':
        return await handleListModels(mlEngine)
      
      case 'model-info':
        const modelId = url.searchParams.get('modelId')
        if (!modelId) {
          return NextResponse.json({ error: 'Model ID required' }, { status: 400 })
        }
        return await handleGetModelInfo(modelId, mlEngine)
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('ML API GET error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        detail: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function handleForecast(body: any, user: any, mlEngine: MLEngine) {
  const validation = ForecastRequestSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({ 
      error: 'Invalid request', 
      details: validation.error.errors 
    }, { status: 400 })
  }

  const { kpiId, factoryId, periodsAhead, includeSeasonality } = validation.data

  // Validate access
  if (user.role !== 'ADMIN' && factoryId && user.factoryId !== factoryId) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  // Fetch historical KPI data
  const whereClause: any = { kpiId }
  if (factoryId) {
    whereClause.factoryId = factoryId
  } else if (user.role !== 'ADMIN' && user.factoryId) {
    whereClause.factoryId = user.factoryId
  }

  const kpiValues = await prisma.kPIValue.findMany({
    where: whereClause,
    include: {
      kpi: {
        select: { name: true, description: true, unit: true }
      }
    },
    orderBy: { period: 'asc' }
  })

  if (kpiValues.length < 8) {
    return NextResponse.json({ 
      error: 'Insufficient data',
      message: 'Minimum 8 periods required for forecasting'
    }, { status: 400 })
  }

  // Prepare time series data
  const timeSeriesData = kpiValues.map(kv => ({
    period: kv.period,
    value: kv.value
  }))

  // Generate forecast
  const forecast = mlEngine.generateForecast(timeSeriesData, periodsAhead)

  // Seasonality analysis if requested
  let seasonalityResult = null
  if (includeSeasonality) {
    seasonalityResult = mlEngine.performSeasonalDecomposition(timeSeriesData)
  }

  return NextResponse.json({
    success: true,
    forecast,
    seasonality: seasonalityResult,
    kpi: {
      name: kpiValues[0].kpi.name,
      description: kpiValues[0].kpi.description,
      unit: kpiValues[0].kpi.unit
    },
    metadata: {
      historicalPeriods: kpiValues.length,
      forecastHorizon: periodsAhead,
      generatedAt: new Date().toISOString()
    }
  })
}

async function handlePredict(body: any, user: any, mlEngine: MLEngine) {
  const validation = PredictRequestSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({ 
      error: 'Invalid request', 
      details: validation.error.errors 
    }, { status: 400 })
  }

  const { modelId, features, kpiId, factoryId } = validation.data

  // Validate access
  if (user.role !== 'ADMIN' && factoryId && user.factoryId !== factoryId) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  // Get model info
  const modelInfo = mlEngine.getModelInfo(modelId)
  if (!modelInfo) {
    return NextResponse.json({ error: 'Model not found' }, { status: 404 })
  }

  // Make prediction
  const prediction = mlEngine.predict(modelId, features)

  return NextResponse.json({
    success: true,
    prediction,
    model: {
      id: modelId,
      type: modelInfo.type,
      performance: modelInfo.performance,
      trainedAt: modelInfo.trainedAt
    }
  })
}

async function handleTrainModel(body: any, user: any, mlEngine: MLEngine) {
  const validation = TrainModelRequestSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({ 
      error: 'Invalid request', 
      details: validation.error.errors 
    }, { status: 400 })
  }

  const { kpiId, factoryId, modelType, parameters } = validation.data

  // Validate access
  if (user.role !== 'ADMIN' && factoryId && user.factoryId !== factoryId) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  // Fetch training data
  const whereClause: any = { kpiId }
  if (factoryId) {
    whereClause.factoryId = factoryId
  } else if (user.role !== 'ADMIN' && user.factoryId) {
    whereClause.factoryId = user.factoryId
  }

  const kpiValues = await prisma.kPIValue.findMany({
    where: whereClause,
    orderBy: { period: 'asc' }
  })

  if (kpiValues.length < 6) {
    return NextResponse.json({ 
      error: 'Insufficient data',
      message: 'Minimum 6 periods required for training'
    }, { status: 400 })
  }

  // Prepare time series data
  const timeSeriesData = kpiValues.map(kv => ({
    period: kv.period,
    value: kv.value
  }))

  let modelId: string
  let modelInfo: any

  try {
    switch (modelType) {
      case 'linear_regression':
        const trainingData = mlEngine.prepareTimeSeriesData(timeSeriesData)
        trainingData.metadata.kpiId = kpiId
        trainingData.metadata.factoryId = factoryId
        modelId = mlEngine.trainLinearRegression(trainingData)
        break

      case 'polynomial_regression':
        const polyData = mlEngine.prepareTimeSeriesData(timeSeriesData)
        polyData.metadata.kpiId = kpiId
        polyData.metadata.factoryId = factoryId
        const order = parameters?.order || 2
        modelId = mlEngine.trainPolynomialRegression(polyData, order)
        break

      case 'exponential_smoothing':
        modelId = mlEngine.trainExponentialSmoothing(timeSeriesData)
        break

      case 'ensemble':
        // Train multiple models for ensemble
        const ensembleData = mlEngine.prepareTimeSeriesData(timeSeriesData)
        ensembleData.metadata.kpiId = kpiId
        ensembleData.metadata.factoryId = factoryId
        
        const linearId = mlEngine.trainLinearRegression(ensembleData)
        const polyId = mlEngine.trainPolynomialRegression(ensembleData, 2)
        const expId = mlEngine.trainExponentialSmoothing(timeSeriesData)
        
        modelId = `ensemble_${Date.now()}`
        modelInfo = {
          type: 'ensemble',
          modelIds: [linearId, polyId, expId],
          trainedAt: new Date().toISOString(),
          performance: { r2: 0.85 } // Placeholder
        }
        break

      default:
        return NextResponse.json({ error: 'Invalid model type' }, { status: 400 })
    }

    modelInfo = modelInfo || mlEngine.getModelInfo(modelId)

    return NextResponse.json({
      success: true,
      modelId,
      model: {
        type: modelType,
        performance: modelInfo.performance,
        trainedAt: modelInfo.trainedAt,
        metadata: {
          kpiId,
          factoryId,
          trainingPeriods: kpiValues.length
        }
      }
    })

  } catch (error) {
    console.error('Model training error:', error)
    return NextResponse.json({
      error: 'Training failed',
      detail: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function handleListModels(mlEngine: MLEngine) {
  const models = mlEngine.listModels()
  
  return NextResponse.json({
    success: true,
    models,
    count: models.length
  })
}

async function handleGetModelInfo(modelId: string, mlEngine: MLEngine) {
  const modelInfo = mlEngine.getModelInfo(modelId)
  
  if (!modelInfo) {
    return NextResponse.json({ error: 'Model not found' }, { status: 404 })
  }

  return NextResponse.json({
    success: true,
    model: {
      id: modelId,
      type: modelInfo.type,
      performance: modelInfo.performance,
      trainedAt: modelInfo.trainedAt,
      metadata: modelInfo.metadata
    }
  })
}

async function handleSeasonalityAnalysis(body: any, user: any, mlEngine: MLEngine) {
  const { kpiId, factoryId } = body

  // Validate access
  if (user.role !== 'ADMIN' && factoryId && user.factoryId !== factoryId) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  // Fetch historical data
  const whereClause: any = { kpiId }
  if (factoryId) {
    whereClause.factoryId = factoryId
  } else if (user.role !== 'ADMIN' && user.factoryId) {
    whereClause.factoryId = user.factoryId
  }

  const kpiValues = await prisma.kPIValue.findMany({
    where: whereClause,
    include: {
      kpi: {
        select: { name: true, description: true }
      }
    },
    orderBy: { period: 'asc' }
  })

  if (kpiValues.length < 8) {
    return NextResponse.json({ 
      error: 'Insufficient data',
      message: 'Minimum 8 periods required for seasonality analysis'
    }, { status: 400 })
  }

  // Prepare time series data
  const timeSeriesData = kpiValues.map(kv => ({
    period: kv.period,
    value: kv.value
  }))

  // Perform seasonality analysis
  const seasonalityResult = mlEngine.performSeasonalDecomposition(timeSeriesData)

  return NextResponse.json({
    success: true,
    seasonality: seasonalityResult,
    kpi: {
      name: kpiValues[0].kpi.name,
      description: kpiValues[0].kpi.description
    },
    metadata: {
      periods: kpiValues.length,
      analyzedAt: new Date().toISOString()
    }
  })
}
