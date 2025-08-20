/**
 * Data Validation and Error Handling for Analytics APIs
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Base schemas
export const PeriodSchema = z.string().regex(/^\d{4}-Q[1-4]$/, 'Invalid period format. Expected: YYYY-QX')
export const UserRoleSchema = z.enum(['MODEL_FACTORY', 'UPPER_MANAGEMENT', 'ADMIN'])
export const FactoryIdSchema = z.string().min(20, 'Factory ID too short').max(30, 'Factory ID too long')

// API request schemas
export const AnalyticsOverviewRequestSchema = z.object({
  userRole: UserRoleSchema.default('UPPER_MANAGEMENT'),
  factoryId: FactoryIdSchema.optional(),
  periods: z.array(PeriodSchema).min(1).max(12).default(['2024-Q4']),
  period: PeriodSchema.optional()
})

export const ExecutiveSummaryRequestSchema = z.object({
  userRole: UserRoleSchema,
  period: PeriodSchema.default('2024-Q4'),
  periods: z.array(PeriodSchema).optional()
})

export const FactoryPerformanceRequestSchema = z.object({
  factoryId: FactoryIdSchema,
  period: PeriodSchema.default('2024-Q4')
})

// KPI Value validation
export const KPIValueSchema = z.object({
  value: z.number().min(0, 'KPI value cannot be negative'),
  targetValue: z.number().min(0.001, 'Target value must be positive').nullable(),
  period: PeriodSchema,
  factoryId: FactoryIdSchema.optional()
})

// Error types
export enum ValidationErrorType {
  INVALID_PERIOD = 'INVALID_PERIOD',
  INVALID_USER_ROLE = 'INVALID_USER_ROLE',
  INVALID_FACTORY_ID = 'INVALID_FACTORY_ID',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_DATA_RANGE = 'INVALID_DATA_RANGE',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS'
}

export interface ValidationError {
  type: ValidationErrorType
  field: string
  message: string
  receivedValue?: any
}

export interface ValidationResult<T> {
  success: boolean
  data?: T
  errors?: ValidationError[]
}

/**
 * Request validator middleware
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  request: NextRequest
): ValidationResult<T> {
  try {
    const searchParams = request.nextUrl.searchParams
    
    // Convert searchParams to object
    const params: Record<string, any> = {}
    
    // Handle single values
    for (const [key, value] of searchParams.entries()) {
      if (key === 'periods') {
        // Handle multiple periods
        if (!params.periods) params.periods = []
        params.periods.push(value)
      } else {
        params[key] = value
      }
    }
    
    // Handle legacy period parameter
    if (params.period && !params.periods) {
      params.periods = [params.period]
    }
    
    const result = schema.safeParse(params)
    
    if (result.success) {
      return {
        success: true,
        data: result.data
      }
    } else {
      const errors: ValidationError[] = result.error.errors.map(err => ({
        type: getErrorType(err.code),
        field: err.path.join('.'),
        message: err.message,
        receivedValue: err.path.reduce((obj, key) => obj?.[key], params)
      }))
      
      return {
        success: false,
        errors
      }
    }
  } catch (error) {
    return {
      success: false,
      errors: [{
        type: ValidationErrorType.INVALID_DATA_RANGE,
        field: 'request',
        message: 'Request validation failed',
        receivedValue: error
      }]
    }
  }
}

/**
 * Role-based access control
 */
export function validateAccess(
  userRole: string,
  factoryId?: string,
  requestedFactoryId?: string
): ValidationResult<boolean> {
  if (userRole === 'MODEL_FACTORY') {
    if (!factoryId) {
      return {
        success: false,
        errors: [{
          type: ValidationErrorType.MISSING_REQUIRED_FIELD,
          field: 'factoryId',
          message: 'Model factory users must provide factory ID'
        }]
      }
    }
    
    if (requestedFactoryId && requestedFactoryId !== factoryId) {
      return {
        success: false,
        errors: [{
          type: ValidationErrorType.UNAUTHORIZED_ACCESS,
          field: 'factoryId',
          message: 'Model factory users can only access their own factory data'
        }]
      }
    }
  }
  
  return { success: true, data: true }
}

/**
 * Data range validation
 */
export function validateDataRange(
  periods: string[],
  maxPeriods: number = 12
): ValidationResult<string[]> {
  if (periods.length > maxPeriods) {
    return {
      success: false,
      errors: [{
        type: ValidationErrorType.INVALID_DATA_RANGE,
        field: 'periods',
        message: `Maximum ${maxPeriods} periods allowed`,
        receivedValue: periods.length
      }]
    }
  }
  
  // Sort periods chronologically
  const sortedPeriods = [...periods].sort((a, b) => {
    const [yearA, quarterA] = a.split('-')
    const [yearB, quarterB] = b.split('-')
    const valueA = parseInt(yearA) * 4 + parseInt(quarterA.replace('Q', ''))
    const valueB = parseInt(yearB) * 4 + parseInt(quarterB.replace('Q', ''))
    return valueA - valueB
  })
  
  return {
    success: true,
    data: sortedPeriods
  }
}

/**
 * Missing data handler
 */
export interface MissingDataOptions {
  allowPartialData?: boolean
  requireMinimumDataPoints?: number
  fallbackStrategy?: 'zero' | 'skip' | 'interpolate' | 'previous'
}

export function handleMissingData<T>(
  data: T[],
  options: MissingDataOptions = {}
): ValidationResult<T[]> {
  const {
    allowPartialData = true,
    requireMinimumDataPoints = 1,
    fallbackStrategy = 'skip'
  } = options
  
  if (data.length < requireMinimumDataPoints) {
    if (!allowPartialData) {
      return {
        success: false,
        errors: [{
          type: ValidationErrorType.INVALID_DATA_RANGE,
          field: 'data',
          message: `Minimum ${requireMinimumDataPoints} data points required`,
          receivedValue: data.length
        }]
      }
    }
  }
  
  return {
    success: true,
    data
  }
}

/**
 * Create error response
 */
export function createValidationErrorResponse(
  errors: ValidationError[],
  status: number = 400
): NextResponse {
  return NextResponse.json({
    error: 'Validation failed',
    details: errors,
    timestamp: new Date().toISOString(),
    type: 'VALIDATION_ERROR'
  }, { status })
}

/**
 * Utility functions
 */
function getErrorType(zodErrorCode: string): ValidationErrorType {
  switch (zodErrorCode) {
    case 'invalid_string':
    case 'invalid_enum_value':
      return ValidationErrorType.INVALID_USER_ROLE
    case 'too_small':
    case 'too_big':
      return ValidationErrorType.INVALID_DATA_RANGE
    default:
      return ValidationErrorType.MISSING_REQUIRED_FIELD
  }
}

/**
 * Period utilities
 */
export const PeriodUtils = {
  getCurrentPeriod(): string {
    const now = new Date()
    const year = now.getFullYear()
    const quarter = Math.ceil((now.getMonth() + 1) / 3)
    return `${year}-Q${quarter}`
  },
  
  getPreviousPeriod(period: string): string {
    const [year, quarter] = period.split('-')
    const currentYear = parseInt(year)
    const currentQuarter = parseInt(quarter.replace('Q', ''))
    
    if (currentQuarter === 1) {
      return `${currentYear - 1}-Q4`
    } else {
      return `${currentYear}-Q${currentQuarter - 1}`
    }
  },
  
  getLastNPeriods(n: number, from?: string): string[] {
    const periods: string[] = []
    let current = from || PeriodUtils.getCurrentPeriod()
    
    for (let i = 0; i < n; i++) {
      periods.push(current)
      current = PeriodUtils.getPreviousPeriod(current)
    }
    
    return periods.reverse() // Chronological order
  },
  
  validatePeriodRange(start: string, end: string): boolean {
    const [startYear, startQ] = start.split('-')
    const [endYear, endQ] = end.split('-')
    
    const startValue = parseInt(startYear) * 4 + parseInt(startQ.replace('Q', ''))
    const endValue = parseInt(endYear) * 4 + parseInt(endQ.replace('Q', ''))
    
    return startValue <= endValue
  }
}

/**
 * Safe number parsing
 */
export function safeParseNumber(
  value: any,
  defaultValue: number = 0,
  min?: number,
  max?: number
): number {
  if (value === null || value === undefined || value === '') {
    return defaultValue
  }
  
  const parsed = typeof value === 'number' ? value : parseFloat(String(value))
  
  if (isNaN(parsed) || !isFinite(parsed)) {
    return defaultValue
  }
  
  if (min !== undefined && parsed < min) {
    return min
  }
  
  if (max !== undefined && parsed > max) {
    return max
  }
  
  return parsed
}

/**
 * Safe array access
 */
export function safeArrayAccess<T>(
  array: T[],
  index: number,
  defaultValue?: T
): T | undefined {
  if (!Array.isArray(array) || index < 0 || index >= array.length) {
    return defaultValue
  }
  
  return array[index]
}
