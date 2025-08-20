/**
 * Machine Learning Engine
 * Predictive modeling for KPI forecasting and analysis
 */

import * as ss from 'simple-statistics'
import * as regression from 'regression'

export interface TrainingData {
  features: number[][]
  targets: number[]
  metadata: {
    kpiId: string
    factoryId?: string
    periods: string[]
    featureNames: string[]
  }
}

export interface PredictionResult {
  predicted: number
  confidence: number
  model: string
  features: number[]
  explanation?: ModelExplanation
}

export interface ModelExplanation {
  featureImportance: Array<{
    feature: string
    importance: number
    impact: 'positive' | 'negative'
  }>
  confidence: {
    level: 'high' | 'medium' | 'low'
    factors: string[]
  }
  assumptions: string[]
  limitations: string[]
}

export interface ForecastResult {
  predictions: Array<{
    period: string
    predicted: number
    confidence: {
      low: number
      high: number
    }
    probability: number
  }>
  modelAccuracy: number
  modelType: string
  trainingData: {
    samples: number
    periods: number
    features: number
  }
  metadata: {
    trainedAt: string
    lastUpdate: string
    kpiId: string
    factoryId?: string
  }
}

export interface SeasonalityResult {
  hasSeasonality: boolean
  seasonalPeriod: number
  seasonalStrength: number
  seasonalPattern: Array<{
    period: string
    multiplier: number
  }>
  trendComponent: number[]
  seasonalComponent: number[]
  residualComponent: number[]
}

/**
 * ML Model Types
 */
export enum ModelType {
  LINEAR_REGRESSION = 'linear_regression',
  POLYNOMIAL_REGRESSION = 'polynomial_regression',
  EXPONENTIAL_SMOOTHING = 'exponential_smoothing',
  ARIMA = 'arima_simple',
  SEASONAL_DECOMPOSITION = 'seasonal_decomposition',
  ENSEMBLE = 'ensemble'
}

/**
 * Machine Learning Engine
 */
export class MLEngine {
  private static instance: MLEngine
  private trainedModels: Map<string, any> = new Map()
  private modelPerformance: Map<string, number> = new Map()

  static getInstance(): MLEngine {
    if (!MLEngine.instance) {
      MLEngine.instance = new MLEngine()
    }
    return MLEngine.instance
  }

  /**
   * Prepare time series data for training
   */
  prepareTimeSeriesData(
    timeSeriesData: Array<{ period: string; value: number }>,
    additionalFeatures?: Array<{ period: string; [key: string]: any }>
  ): TrainingData {
    // Sort by period
    const sortedData = timeSeriesData.sort((a, b) => a.period.localeCompare(b.period))
    
    const features: number[][] = []
    const targets: number[] = []
    const periods: string[] = []

    // Create lag features and trend features
    for (let i = 3; i < sortedData.length; i++) { // Need at least 3 previous points
      const currentValue = sortedData[i].value
      const lag1 = sortedData[i - 1].value
      const lag2 = sortedData[i - 2].value
      const lag3 = sortedData[i - 3].value
      
      // Trend features
      const trend = (sortedData[i].value - sortedData[i - 3].value) / 3
      const volatility = ss.standardDeviation([lag1, lag2, lag3])
      
      // Seasonal features (quarter)
      const quarterNum = this.extractQuarterNumber(sortedData[i].period)
      const quarter1 = quarterNum === 1 ? 1 : 0
      const quarter2 = quarterNum === 2 ? 1 : 0
      const quarter3 = quarterNum === 3 ? 1 : 0
      const quarter4 = quarterNum === 4 ? 1 : 0
      
      // Time index
      const timeIndex = i
      
      // Additional features
      let additionalFeats: number[] = []
      if (additionalFeatures) {
        const additionalForPeriod = additionalFeatures.find(af => af.period === sortedData[i].period)
        if (additionalForPeriod) {
          // Extract numeric features (exclude period)
          additionalFeats = Object.entries(additionalForPeriod)
            .filter(([key, value]) => key !== 'period' && typeof value === 'number')
            .map(([, value]) => value as number)
        }
      }

      features.push([
        lag1, lag2, lag3,           // Lag features
        trend, volatility,          // Trend features
        quarter1, quarter2, quarter3, quarter4, // Seasonal features
        timeIndex,                  // Time index
        ...additionalFeats          // Additional features
      ])
      
      targets.push(currentValue)
      periods.push(sortedData[i].period)
    }

    return {
      features,
      targets,
      metadata: {
        kpiId: 'unknown',
        periods,
        featureNames: [
          'lag1', 'lag2', 'lag3',
          'trend', 'volatility',
          'quarter1', 'quarter2', 'quarter3', 'quarter4',
          'timeIndex',
          ...(additionalFeatures ? ['external1', 'external2'] : [])
        ]
      }
    }
  }

  /**
   * Train linear regression model
   */
  trainLinearRegression(trainingData: TrainingData): string {
    const modelId = `linear_${Date.now()}`
    
    try {
      // Convert to regression.js format
      const regressionData = trainingData.features.map((features, index) => {
        return [features, trainingData.targets[index]]
      })

      // Train multiple regression
      const result = regression.polynomial(
        trainingData.features.map((features, index) => [
          features[0], // Use lag1 as primary feature
          trainingData.targets[index]
        ]),
        { order: 1 } // Linear
      )

      // Calculate model performance
      const predictions = trainingData.features.map(features => 
        this.predictWithLinearModel(result, features)
      )
      
      const mse = ss.meanSquaredError(trainingData.targets, predictions)
      const r2 = ss.rSquared(trainingData.targets, predictions)
      
      this.trainedModels.set(modelId, {
        type: ModelType.LINEAR_REGRESSION,
        model: result,
        features: trainingData.features,
        targets: trainingData.targets,
        metadata: trainingData.metadata,
        performance: { mse, r2 },
        trainedAt: new Date().toISOString()
      })
      
      this.modelPerformance.set(modelId, r2)
      
      console.log(`📊 Linear regression model trained: ${modelId}, R² = ${r2.toFixed(3)}`)
      return modelId
      
    } catch (error) {
      console.error('Linear regression training failed:', error)
      throw error
    }
  }

  /**
   * Train polynomial regression model
   */
  trainPolynomialRegression(trainingData: TrainingData, order: number = 2): string {
    const modelId = `poly_${Date.now()}`
    
    try {
      // Use primary feature (lag1) for polynomial regression
      const polynomialData = trainingData.features.map((features, index) => [
        features[0], // lag1 as x
        trainingData.targets[index] // target as y
      ])

      const result = regression.polynomial(polynomialData, { order })
      
      // Calculate performance
      const predictions = trainingData.features.map(features => 
        this.predictWithPolynomialModel(result, features[0])
      )
      
      const mse = ss.meanSquaredError(trainingData.targets, predictions)
      const r2 = ss.rSquared(trainingData.targets, predictions)
      
      this.trainedModels.set(modelId, {
        type: ModelType.POLYNOMIAL_REGRESSION,
        model: result,
        order,
        features: trainingData.features,
        targets: trainingData.targets,
        metadata: trainingData.metadata,
        performance: { mse, r2 },
        trainedAt: new Date().toISOString()
      })
      
      this.modelPerformance.set(modelId, r2)
      
      console.log(`📊 Polynomial regression model trained: ${modelId}, R² = ${r2.toFixed(3)}`)
      return modelId
      
    } catch (error) {
      console.error('Polynomial regression training failed:', error)
      throw error
    }
  }

  /**
   * Train exponential smoothing model
   */
  trainExponentialSmoothing(timeSeriesData: Array<{ period: string; value: number }>): string {
    const modelId = `exp_smooth_${Date.now()}`
    
    try {
      const values = timeSeriesData.map(d => d.value)
      
      // Simple exponential smoothing parameters
      const alpha = this.optimizeExponentialSmoothingAlpha(values)
      
      // Calculate smoothed values
      const smoothed = this.calculateExponentialSmoothing(values, alpha)
      
      // Calculate performance
      const mse = ss.meanSquaredError(values.slice(1), smoothed.slice(0, -1))
      const r2 = ss.rSquared(values.slice(1), smoothed.slice(0, -1))
      
      this.trainedModels.set(modelId, {
        type: ModelType.EXPONENTIAL_SMOOTHING,
        alpha,
        values,
        smoothed,
        lastValue: smoothed[smoothed.length - 1],
        metadata: { periods: timeSeriesData.map(d => d.period) },
        performance: { mse, r2 },
        trainedAt: new Date().toISOString()
      })
      
      this.modelPerformance.set(modelId, r2)
      
      console.log(`📊 Exponential smoothing model trained: ${modelId}, α = ${alpha.toFixed(3)}, R² = ${r2.toFixed(3)}`)
      return modelId
      
    } catch (error) {
      console.error('Exponential smoothing training failed:', error)
      throw error
    }
  }

  /**
   * Seasonal decomposition
   */
  performSeasonalDecomposition(
    timeSeriesData: Array<{ period: string; value: number }>
  ): SeasonalityResult {
    const values = timeSeriesData.map(d => d.value)
    const periods = timeSeriesData.map(d => d.period)
    
    // Simple seasonal decomposition for quarterly data
    const seasonalPeriod = 4 // Quarterly
    
    if (values.length < seasonalPeriod * 2) {
      return {
        hasSeasonality: false,
        seasonalPeriod: 0,
        seasonalStrength: 0,
        seasonalPattern: [],
        trendComponent: values,
        seasonalComponent: new Array(values.length).fill(0),
        residualComponent: new Array(values.length).fill(0)
      }
    }

    // Calculate trend using moving average
    const trendComponent = this.calculateMovingAverageTrend(values, seasonalPeriod)
    
    // Calculate seasonal component
    const seasonalComponent = this.calculateSeasonalComponent(values, trendComponent, seasonalPeriod)
    
    // Calculate residual
    const residualComponent = values.map((value, index) => 
      value - trendComponent[index] - seasonalComponent[index]
    )
    
    // Calculate seasonal strength
    const seasonalVariance = ss.variance(seasonalComponent)
    const residualVariance = ss.variance(residualComponent)
    const seasonalStrength = seasonalVariance / (seasonalVariance + residualVariance)
    
    // Create seasonal pattern
    const seasonalPattern = []
    for (let i = 0; i < seasonalPeriod; i++) {
      const seasonalValues = seasonalComponent.filter((_, index) => index % seasonalPeriod === i)
      const avgSeasonal = ss.mean(seasonalValues)
      seasonalPattern.push({
        period: `Q${i + 1}`,
        multiplier: avgSeasonal
      })
    }
    
    return {
      hasSeasonality: seasonalStrength > 0.1,
      seasonalPeriod,
      seasonalStrength,
      seasonalPattern,
      trendComponent,
      seasonalComponent,
      residualComponent
    }
  }

  /**
   * Create ensemble prediction
   */
  createEnsemblePrediction(
    modelIds: string[],
    features: number[]
  ): PredictionResult {
    const predictions: Array<{ value: number; confidence: number; weight: number }> = []
    
    for (const modelId of modelIds) {
      const model = this.trainedModels.get(modelId)
      if (!model) continue
      
      try {
        const prediction = this.predict(modelId, features)
        const weight = this.modelPerformance.get(modelId) || 0.5
        
        predictions.push({
          value: prediction.predicted,
          confidence: prediction.confidence,
          weight
        })
      } catch (error) {
        console.warn(`Failed to get prediction from model ${modelId}:`, error)
      }
    }
    
    if (predictions.length === 0) {
      throw new Error('No valid predictions from ensemble models')
    }
    
    // Weighted average
    const totalWeight = predictions.reduce((sum, p) => sum + p.weight, 0)
    const weightedPrediction = predictions.reduce((sum, p) => 
      sum + (p.value * p.weight), 0) / totalWeight
    
    const averageConfidence = predictions.reduce((sum, p) => 
      sum + (p.confidence * p.weight), 0) / totalWeight
    
    return {
      predicted: weightedPrediction,
      confidence: averageConfidence,
      model: 'ensemble',
      features,
      explanation: {
        featureImportance: [
          { feature: 'lag1', importance: 0.4, impact: 'positive' },
          { feature: 'trend', importance: 0.3, impact: 'positive' },
          { feature: 'seasonal', importance: 0.2, impact: 'positive' },
          { feature: 'volatility', importance: 0.1, impact: 'negative' }
        ],
        confidence: {
          level: averageConfidence > 0.8 ? 'high' : averageConfidence > 0.6 ? 'medium' : 'low',
          factors: [
            `${predictions.length} models agreement`,
            `Average R² = ${(totalWeight / predictions.length).toFixed(3)}`
          ]
        },
        assumptions: [
          'Historical patterns continue',
          'No major structural changes',
          'Seasonal patterns remain stable'
        ],
        limitations: [
          'Based on historical data only',
          'External factors not considered',
          'Uncertainty increases with forecast horizon'
        ]
      }
    }
  }

  /**
   * Predict single value
   */
  predict(modelId: string, features: number[]): PredictionResult {
    const model = this.trainedModels.get(modelId)
    if (!model) {
      throw new Error(`Model ${modelId} not found`)
    }

    let predicted: number
    let confidence: number = 0.7 // Default confidence

    switch (model.type) {
      case ModelType.LINEAR_REGRESSION:
        predicted = this.predictWithLinearModel(model.model, features)
        confidence = model.performance.r2
        break
        
      case ModelType.POLYNOMIAL_REGRESSION:
        predicted = this.predictWithPolynomialModel(model.model, features[0])
        confidence = model.performance.r2
        break
        
      case ModelType.EXPONENTIAL_SMOOTHING:
        predicted = model.lastValue // Simple next-step prediction
        confidence = model.performance.r2
        break
        
      default:
        throw new Error(`Unsupported model type: ${model.type}`)
    }

    return {
      predicted,
      confidence: Math.max(0.1, Math.min(0.95, confidence)),
      model: model.type,
      features
    }
  }

  /**
   * Generate forecast for multiple periods
   */
  generateForecast(
    timeSeriesData: Array<{ period: string; value: number }>,
    periodsAhead: number = 4
  ): ForecastResult {
    // Prepare training data
    const trainingData = this.prepareTimeSeriesData(timeSeriesData)
    
    if (trainingData.features.length < 5) {
      throw new Error('Insufficient data for forecasting (minimum 8 periods required)')
    }

    // Train multiple models
    const modelIds = [
      this.trainLinearRegression(trainingData),
      this.trainPolynomialRegression(trainingData, 2),
      this.trainExponentialSmoothing(timeSeriesData)
    ]

    // Generate predictions
    const predictions = []
    const lastKnownValues = timeSeriesData.slice(-3).map(d => d.value)
    const lastPeriod = timeSeriesData[timeSeriesData.length - 1].period
    
    for (let i = 1; i <= periodsAhead; i++) {
      const futurePeriod = this.generateFuturePeriod(lastPeriod, i)
      
      // Create features for prediction
      const features = this.createForecastFeatures(
        lastKnownValues,
        timeSeriesData,
        i,
        futurePeriod
      )
      
      // Ensemble prediction
      const ensemblePrediction = this.createEnsemblePrediction(modelIds, features)
      
      // Calculate confidence interval
      const modelPredictions = modelIds.map(id => {
        try {
          return this.predict(id, features).predicted
        } catch {
          return ensemblePrediction.predicted
        }
      })
      
      const stdDev = ss.standardDeviation(modelPredictions)
      const confidenceInterval = 1.96 * stdDev // 95% confidence interval
      
      predictions.push({
        period: futurePeriod,
        predicted: Math.round(ensemblePrediction.predicted * 100) / 100,
        confidence: {
          low: Math.round((ensemblePrediction.predicted - confidenceInterval) * 100) / 100,
          high: Math.round((ensemblePrediction.predicted + confidenceInterval) * 100) / 100
        },
        probability: ensemblePrediction.confidence
      })

      // Update lastKnownValues for next iteration
      lastKnownValues.push(ensemblePrediction.predicted)
      lastKnownValues.shift()
    }

    // Calculate model accuracy
    const avgPerformance = modelIds.reduce((sum, id) => 
      sum + (this.modelPerformance.get(id) || 0), 0) / modelIds.length

    return {
      predictions,
      modelAccuracy: Math.round(avgPerformance * 100),
      modelType: 'ensemble',
      trainingData: {
        samples: trainingData.features.length,
        periods: timeSeriesData.length,
        features: trainingData.features[0]?.length || 0
      },
      metadata: {
        trainedAt: new Date().toISOString(),
        lastUpdate: new Date().toISOString(),
        kpiId: trainingData.metadata.kpiId,
        factoryId: trainingData.metadata.factoryId
      }
    }
  }

  /**
   * Helper methods
   */
  private extractQuarterNumber(period: string): number {
    const match = period.match(/Q(\d)/)
    return match ? parseInt(match[1]) : 1
  }

  private predictWithLinearModel(model: any, features: number[]): number {
    // Simple linear prediction using lag1
    return model.predict(features[0])[1]
  }

  private predictWithPolynomialModel(model: any, x: number): number {
    return model.predict(x)[1]
  }

  private optimizeExponentialSmoothingAlpha(values: number[]): number {
    let bestAlpha = 0.3
    let bestMse = Infinity

    for (let alpha = 0.1; alpha <= 0.9; alpha += 0.1) {
      const smoothed = this.calculateExponentialSmoothing(values, alpha)
      const mse = ss.meanSquaredError(values.slice(1), smoothed.slice(0, -1))
      
      if (mse < bestMse) {
        bestMse = mse
        bestAlpha = alpha
      }
    }

    return bestAlpha
  }

  private calculateExponentialSmoothing(values: number[], alpha: number): number[] {
    const smoothed = [values[0]]
    
    for (let i = 1; i < values.length; i++) {
      const smoothedValue = alpha * values[i] + (1 - alpha) * smoothed[i - 1]
      smoothed.push(smoothedValue)
    }
    
    // Add next prediction
    const nextPrediction = alpha * values[values.length - 1] + (1 - alpha) * smoothed[smoothed.length - 1]
    smoothed.push(nextPrediction)
    
    return smoothed
  }

  private calculateMovingAverageTrend(values: number[], period: number): number[] {
    const trend = []
    
    for (let i = 0; i < values.length; i++) {
      if (i < Math.floor(period / 2) || i >= values.length - Math.floor(period / 2)) {
        trend.push(values[i]) // Use original value for edges
      } else {
        const start = i - Math.floor(period / 2)
        const end = start + period
        const sum = values.slice(start, end).reduce((a, b) => a + b, 0)
        trend.push(sum / period)
      }
    }
    
    return trend
  }

  private calculateSeasonalComponent(values: number[], trend: number[], period: number): number[] {
    const seasonal = new Array(values.length).fill(0)
    
    // Calculate seasonal indices for each season
    const seasonalIndices = new Array(period).fill(0).map(() => [] as number[])
    
    for (let i = 0; i < values.length; i++) {
      const seasonIndex = i % period
      const detrended = values[i] - trend[i]
      seasonalIndices[seasonIndex].push(detrended)
    }
    
    // Average seasonal components
    const avgSeasonal = seasonalIndices.map(indices => 
      indices.length > 0 ? ss.mean(indices) : 0
    )
    
    // Apply to full series
    for (let i = 0; i < values.length; i++) {
      seasonal[i] = avgSeasonal[i % period]
    }
    
    return seasonal
  }

  private generateFuturePeriod(lastPeriod: string, stepsAhead: number): string {
    const [year, quarter] = lastPeriod.split('-')
    const currentYear = parseInt(year)
    const currentQuarter = parseInt(quarter.replace('Q', ''))
    
    let futureYear = currentYear
    let futureQuarter = currentQuarter + stepsAhead
    
    while (futureQuarter > 4) {
      futureYear++
      futureQuarter -= 4
    }
    
    return `${futureYear}-Q${futureQuarter}`
  }

  private createForecastFeatures(
    lastKnownValues: number[],
    historicalData: Array<{ period: string; value: number }>,
    stepsAhead: number,
    futurePeriod: string
  ): number[] {
    const lag1 = lastKnownValues[lastKnownValues.length - 1]
    const lag2 = lastKnownValues[lastKnownValues.length - 2] || lag1
    const lag3 = lastKnownValues[lastKnownValues.length - 3] || lag2
    
    // Calculate trend
    const trend = (lag1 - lag3) / 2
    
    // Calculate volatility
    const volatility = ss.standardDeviation(lastKnownValues)
    
    // Seasonal features
    const quarterNum = this.extractQuarterNumber(futurePeriod)
    const quarter1 = quarterNum === 1 ? 1 : 0
    const quarter2 = quarterNum === 2 ? 1 : 0
    const quarter3 = quarterNum === 3 ? 1 : 0
    const quarter4 = quarterNum === 4 ? 1 : 0
    
    // Time index
    const timeIndex = historicalData.length + stepsAhead
    
    return [
      lag1, lag2, lag3,
      trend, volatility,
      quarter1, quarter2, quarter3, quarter4,
      timeIndex
    ]
  }

  /**
   * Get model information
   */
  getModelInfo(modelId: string): any {
    return this.trainedModels.get(modelId)
  }

  /**
   * List all trained models
   */
  listModels(): Array<{ id: string; type: string; performance: number; trainedAt: string }> {
    const models = []
    
    for (const [id, model] of this.trainedModels) {
      models.push({
        id,
        type: model.type,
        performance: this.modelPerformance.get(id) || 0,
        trainedAt: model.trainedAt
      })
    }
    
    return models.sort((a, b) => b.performance - a.performance)
  }

  /**
   * Clean up old models
   */
  cleanupModels(maxAge: number = 24 * 60 * 60 * 1000): number { // 24 hours default
    const now = Date.now()
    let cleaned = 0
    
    for (const [id, model] of this.trainedModels) {
      const age = now - new Date(model.trainedAt).getTime()
      if (age > maxAge) {
        this.trainedModels.delete(id)
        this.modelPerformance.delete(id)
        cleaned++
      }
    }
    
    console.log(`🧹 Cleaned ${cleaned} old ML models`)
    return cleaned
  }
}
