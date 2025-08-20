/**
 * Export API
 * Handle Excel/PDF/CSV exports with advanced filtering
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ExportEngine, ExportFilter, ExportOptions, ExportMetadata } from '@/lib/export-engine'
import { OptimizedKPILoader } from '@/lib/query-optimizer'

const exportEngine = ExportEngine.getInstance()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      filters = {}, 
      options = { format: 'excel' }, 
      templateId = 'standard',
      title = 'KPI Report',
      author = 'KPI Management System'
    } = body

    // Validate format
    if (!['excel', 'pdf', 'csv'].includes(options.format)) {
      return NextResponse.json(
        { error: 'Invalid export format' },
        { status: 400 }
      )
    }

    // Get template
    const template = exportEngine.getTemplate(templateId)
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Load data based on filters
    const data = await loadExportData(filters, options)
    
    // Create metadata
    const metadata: ExportMetadata = {
      title,
      author,
      description: `KPI Management System export generated on ${new Date().toLocaleDateString()}`,
      generatedAt: new Date().toISOString(),
      filters,
      options: { ...options, template },
      dataStats: {
        totalRecords: data.kpiValues?.length || 0,
        factoriesIncluded: data.factoryPerformance?.length || 0,
        periodsIncluded: data.timeline?.length || 0,
        kpisIncluded: new Set(data.kpiValues?.map((kv: any) => kv.kpiId)).size || 0
      }
    }

    let fileBuffer: ArrayBuffer
    let contentType: string
    let filename: string

    switch (options.format) {
      case 'excel':
        fileBuffer = await exportEngine.exportToExcel(data, metadata, options)
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        filename = `kpi-report-${Date.now()}.xlsx`
        break

      case 'pdf':
        fileBuffer = await exportEngine.exportToPDF(data, metadata, options)
        contentType = 'application/pdf'
        filename = `kpi-report-${Date.now()}.pdf`
        break

      case 'csv':
        const csvData = exportEngine.exportToCSV(
          data.kpiValues || [],
          ['kpiName', 'factoryName', 'period', 'value', 'targetValue', 'achievementRate']
        )
        fileBuffer = new TextEncoder().encode(csvData).buffer
        contentType = 'text/csv'
        filename = `kpi-data-${Date.now()}.csv`
        break

      default:
        throw new Error('Unsupported format')
    }

    // Return file
    const response = new NextResponse(fileBuffer)
    response.headers.set('Content-Type', contentType)
    response.headers.set('Content-Disposition', `attachment; filename="${filename}"`)
    response.headers.set('Content-Length', fileBuffer.byteLength.toString())

    return response

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { 
        error: 'Export failed',
        detail: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

/**
 * GET - Get export templates and options
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') || 'templates'

    switch (type) {
      case 'templates':
        const templates = exportEngine.getTemplates()
        return NextResponse.json({
          success: true,
          templates
        })

      case 'filters':
        // Get available filter options
        const [factories, kpis, periods] = await Promise.all([
          prisma.modelFactory.findMany({
            select: { id: true, name: true }
          }),
          prisma.kpi.findMany({
            select: { id: true, number: true, name: true, themes: true }
          }),
          prisma.kpiValue.findMany({
            select: { period: true },
            distinct: ['period'],
            orderBy: { period: 'desc' }
          })
        ])

        const themes = Array.from(new Set(
          kpis.flatMap(kpi => 
            kpi.themes ? kpi.themes.split(',').map(t => t.trim()) : []
          )
        )).filter(Boolean)

        return NextResponse.json({
          success: true,
          filterOptions: {
            factories: factories.map(f => ({ id: f.id, name: f.name })),
            kpis: kpis.map(k => ({ id: k.id, name: `${k.number}. ${k.name}` })),
            periods: periods.map(p => p.period).sort().reverse(),
            themes
          }
        })

      case 'preview':
        // Generate preview data for export
        const sampleFilters = {
          periods: [searchParams.get('period') || '2024-Q4']
        }
        const previewData = await loadExportData(sampleFilters, { format: 'excel' })
        
        return NextResponse.json({
          success: true,
          preview: {
            totalRecords: previewData.kpiValues?.length || 0,
            sampleData: previewData.kpiValues?.slice(0, 5) || [],
            factories: previewData.factoryPerformance?.length || 0,
            periods: previewData.timeline?.length || 0
          }
        })

      default:
        return NextResponse.json(
          { error: 'Invalid type parameter' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Export GET error:', error)
    return NextResponse.json(
      { error: 'Failed to get export data' },
      { status: 500 }
    )
  }
}

/**
 * Load export data based on filters
 */
async function loadExportData(filters: ExportFilter, options: ExportOptions): Promise<any> {
  try {
    const loader = OptimizedKPILoader.getInstance()
    
    // Determine periods
    let periods = filters.periods
    if (!periods || periods.length === 0) {
      periods = ['2024-Q4'] // Default to current quarter
    }

    // Load main data
    const kpiData = await loader.loadKPIData({
      periods,
      factoryIds: filters.factoryIds,
      kpiIds: filters.kpiIds,
      includeTargets: true,
      includeFactoryInfo: true
    })

    // Transform data for export
    const exportData: any = {
      overview: {
        avgSuccess: 0,
        trend: 0,
        kpiCount: 0,
        factoryCount: 0,
        actionCount: 0
      },
      kpiValues: [],
      factoryPerformance: [],
      timeline: [],
      themes: []
    }

    // Process KPI values
    if (kpiData.kpiValues && kpiData.kpiValues.length > 0) {
      exportData.kpiValues = kpiData.kpiValues
        .filter(kv => {
          // Apply additional filters
          if (filters.minValue !== undefined && kv.value < filters.minValue) return false
          if (filters.maxValue !== undefined && kv.value > filters.maxValue) return false
          
          if (filters.achievementRateMin !== undefined || filters.achievementRateMax !== undefined) {
            const achievementRate = kv.targetValue ? (kv.value / kv.targetValue) * 100 : 0
            if (filters.achievementRateMin !== undefined && achievementRate < filters.achievementRateMin) return false
            if (filters.achievementRateMax !== undefined && achievementRate > filters.achievementRateMax) return false
          }
          
          if (filters.themes && filters.themes.length > 0) {
            const kpi = kpiData.kpis.find((k: any) => k.id === kv.kpiId)
            if (!kpi || !kpi.themes) return false
            const kpiThemes = Array.isArray(kpi.themes) ? kpi.themes : kpi.themes.split(',').map((t: string) => t.trim())
            return filters.themes.some(theme => kpiThemes.includes(theme))
          }
          
          return true
        })
        .map(kv => {
          const kpi = kpiData.kpis.find((k: any) => k.id === kv.kpiId)
          const achievementRate = kv.targetValue ? Math.round((kv.value / kv.targetValue) * 100) : 0
          
          return {
            ...kv,
            kpiName: kpi?.name || 'Unknown KPI',
            achievementRate,
            status: achievementRate >= 100 ? 'Target Met' : 
                    achievementRate >= 80 ? 'Near Target' : 'Below Target'
          }
        })

      // Calculate overview stats
      const values = exportData.kpiValues.map((kv: any) => kv.achievementRate).filter((v: any) => !isNaN(v))
      exportData.overview.avgSuccess = values.length > 0 ? Math.round(values.reduce((a: number, b: number) => a + b, 0) / values.length) : 0
      exportData.overview.kpiCount = new Set(exportData.kpiValues.map((kv: any) => kv.kpiId)).size
      exportData.overview.factoryCount = new Set(exportData.kpiValues.map((kv: any) => kv.factoryId)).size
    }

    // Process factory performance
    if (options.format !== 'csv') {
      const factoryGroups = new Map()
      exportData.kpiValues.forEach((kv: any) => {
        if (!factoryGroups.has(kv.factoryId)) {
          factoryGroups.set(kv.factoryId, {
            factoryId: kv.factoryId,
            factoryName: kv.factoryName,
            scores: [],
            kpiCount: 0
          })
        }
        const group = factoryGroups.get(kv.factoryId)
        if (!isNaN(kv.achievementRate)) {
          group.scores.push(kv.achievementRate)
        }
        group.kpiCount++
      })

      exportData.factoryPerformance = Array.from(factoryGroups.values())
        .map((group: any) => ({
          ...group,
          avgScore: group.scores.length > 0 ? Math.round(group.scores.reduce((a: number, b: number) => a + b, 0) / group.scores.length) : 0
        }))
        .sort((a: any, b: any) => b.avgScore - a.avgScore)

      // Process timeline
      const periodGroups = new Map()
      exportData.kpiValues.forEach((kv: any) => {
        if (!periodGroups.has(kv.period)) {
          periodGroups.set(kv.period, { period: kv.period, scores: [] })
        }
        if (!isNaN(kv.achievementRate)) {
          periodGroups.get(kv.period).scores.push(kv.achievementRate)
        }
      })

      exportData.timeline = Array.from(periodGroups.values())
        .map((group: any) => ({
          period: group.period,
          avgSuccess: group.scores.length > 0 ? Math.round(group.scores.reduce((a: number, b: number) => a + b, 0) / group.scores.length) : 0
        }))
        .sort((a: any, b: any) => a.period.localeCompare(b.period))

      // Process themes
      const themeGroups = new Map()
      exportData.kpiValues.forEach((kv: any) => {
        const kpi = kpiData.kpis.find((k: any) => k.id === kv.kpiId)
        if (kpi && kpi.themes) {
          const themes = Array.isArray(kpi.themes) ? kpi.themes : kpi.themes.split(',').map((t: string) => t.trim())
          themes.forEach((theme: string) => {
            if (!themeGroups.has(theme)) {
              themeGroups.set(theme, { name: theme, scores: [], count: 0 })
            }
            const group = themeGroups.get(theme)
            if (!isNaN(kv.achievementRate)) {
              group.scores.push(kv.achievementRate)
            }
            group.count++
          })
        }
      })

      exportData.themes = Array.from(themeGroups.values())
        .map((group: any) => ({
          name: group.name,
          avg: group.scores.length > 0 ? Math.round(group.scores.reduce((a: number, b: number) => a + b, 0) / group.scores.length) : 0,
          count: group.count
        }))
        .sort((a: any, b: any) => b.avg - a.avg)
    }

    // Add advanced analytics if requested
    if (options.includeAnomalies) {
      // Add anomaly detection results
      exportData.anomalies = {
        anomalies: [],
        overallHealth: 'healthy',
        patternsDetected: []
      }
    }

    if (options.includeForecast) {
      // Add forecast results
      exportData.forecast = {
        predictions: [],
        accuracy: 0,
        method: 'linear',
        confidence: 0
      }
    }

    return exportData

  } catch (error) {
    console.error('Error loading export data:', error)
    throw error
  }
}
