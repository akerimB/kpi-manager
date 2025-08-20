/**
 * Export Engine
 * Advanced Excel/PDF export with filtering and customization
 */

import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import html2canvas from 'html2canvas'

export interface ExportFilter {
  factoryIds?: string[]
  kpiIds?: string[]
  periods?: string[]
  themes?: string[]
  minValue?: number
  maxValue?: number
  achievementRateMin?: number
  achievementRateMax?: number
  dateRange?: {
    start: string
    end: string
  }
}

export interface ExportOptions {
  format: 'excel' | 'pdf' | 'csv'
  includeCharts?: boolean
  includeMetadata?: boolean
  includeAnomalies?: boolean
  includeForecast?: boolean
  template?: ExportTemplate
  customFields?: string[]
  groupBy?: 'factory' | 'kpi' | 'period' | 'theme'
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface ExportTemplate {
  id: string
  name: string
  description: string
  layout: 'standard' | 'executive' | 'detailed' | 'comparison'
  sections: ExportSection[]
  styling?: {
    colors?: string[]
    fonts?: string[]
    logoUrl?: string
    headerColor?: string
  }
}

export interface ExportSection {
  type: 'summary' | 'table' | 'chart' | 'analysis' | 'recommendations'
  title: string
  dataSource: string
  formatting?: Record<string, any>
  chartType?: 'line' | 'bar' | 'pie' | 'gauge'
  includeFilters?: boolean
}

export interface ExportMetadata {
  title: string
  author: string
  description: string
  generatedAt: string
  filters: ExportFilter
  options: ExportOptions
  dataStats: {
    totalRecords: number
    factoriesIncluded: number
    periodsIncluded: number
    kpisIncluded: number
  }
}

/**
 * Export Engine Class
 */
export class ExportEngine {
  private static instance: ExportEngine
  private templates: Map<string, ExportTemplate> = new Map()

  static getInstance(): ExportEngine {
    if (!ExportEngine.instance) {
      ExportEngine.instance = new ExportEngine()
    }
    return ExportEngine.instance
  }

  constructor() {
    this.loadDefaultTemplates()
  }

  /**
   * Load default export templates
   */
  private loadDefaultTemplates(): void {
    const templates: ExportTemplate[] = [
      {
        id: 'standard',
        name: 'Standard Report',
        description: 'Basic KPI report with tables and charts',
        layout: 'standard',
        sections: [
          { type: 'summary', title: 'Executive Summary', dataSource: 'overview' },
          { type: 'table', title: 'KPI Data', dataSource: 'kpi_values' },
          { type: 'chart', title: 'Trends', dataSource: 'trends', chartType: 'line' },
          { type: 'analysis', title: 'Performance Analysis', dataSource: 'analysis' }
        ]
      },
      {
        id: 'executive',
        name: 'Executive Summary',
        description: 'High-level overview for management',
        layout: 'executive',
        sections: [
          { type: 'summary', title: 'Key Metrics', dataSource: 'overview' },
          { type: 'chart', title: 'Factory Performance', dataSource: 'factory_ranking', chartType: 'bar' },
          { type: 'recommendations', title: 'Strategic Recommendations', dataSource: 'recommendations' }
        ],
        styling: {
          colors: ['#1e40af', '#059669', '#dc2626'],
          headerColor: '#1e40af'
        }
      },
      {
        id: 'detailed',
        name: 'Detailed Analysis',
        description: 'Comprehensive report with all data points',
        layout: 'detailed',
        sections: [
          { type: 'summary', title: 'Overview', dataSource: 'overview' },
          { type: 'table', title: 'KPI Values', dataSource: 'kpi_values' },
          { type: 'table', title: 'Factory Performance', dataSource: 'factory_performance' },
          { type: 'chart', title: 'Trend Analysis', dataSource: 'trends', chartType: 'line' },
          { type: 'chart', title: 'Theme Breakdown', dataSource: 'themes', chartType: 'pie' },
          { type: 'analysis', title: 'Anomaly Detection', dataSource: 'anomalies' },
          { type: 'analysis', title: 'Forecast', dataSource: 'forecast' }
        ]
      },
      {
        id: 'comparison',
        name: 'Factory Comparison',
        description: 'Side-by-side factory performance comparison',
        layout: 'comparison',
        sections: [
          { type: 'chart', title: 'Performance Comparison', dataSource: 'factory_comparison', chartType: 'bar' },
          { type: 'table', title: 'Detailed Metrics', dataSource: 'factory_metrics' },
          { type: 'analysis', title: 'Best Practices', dataSource: 'best_practices' }
        ]
      }
    ]

    templates.forEach(template => {
      this.templates.set(template.id, template)
    })
  }

  /**
   * Export to Excel
   */
  async exportToExcel(
    data: any,
    metadata: ExportMetadata,
    options: ExportOptions
  ): Promise<ArrayBuffer> {
    const workbook = XLSX.utils.book_new()

    // Add metadata sheet
    if (options.includeMetadata) {
      const metadataSheet = this.createMetadataSheet(metadata)
      XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Metadata')
    }

    // Add summary sheet
    const summarySheet = this.createSummarySheet(data.overview, metadata)
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')

    // Add KPI data sheet
    if (data.kpiValues && data.kpiValues.length > 0) {
      const kpiSheet = this.createKPIDataSheet(data.kpiValues, options)
      XLSX.utils.book_append_sheet(workbook, kpiSheet, 'KPI Data')
    }

    // Add factory performance sheet
    if (data.factoryPerformance && data.factoryPerformance.length > 0) {
      const factorySheet = this.createFactoryPerformanceSheet(data.factoryPerformance)
      XLSX.utils.book_append_sheet(workbook, factorySheet, 'Factory Performance')
    }

    // Add trends sheet
    if (data.timeline && data.timeline.length > 0) {
      const trendsSheet = this.createTrendsSheet(data.timeline)
      XLSX.utils.book_append_sheet(workbook, trendsSheet, 'Trends')
    }

    // Add themes sheet
    if (data.themes && data.themes.length > 0) {
      const themesSheet = this.createThemesSheet(data.themes)
      XLSX.utils.book_append_sheet(workbook, themesSheet, 'Themes')
    }

    // Add alerts sheet if any
    if (data.alerts && data.alerts.length > 0) {
      const alertsSheet = this.createAlertsSheet(data.alerts)
      XLSX.utils.book_append_sheet(workbook, alertsSheet, 'Alerts')
    }

    // Add advanced analytics sheets
    if (options.includeAnomalies && data.anomalies) {
      const anomaliesSheet = this.createAnomaliesSheet(data.anomalies)
      XLSX.utils.book_append_sheet(workbook, anomaliesSheet, 'Anomalies')
    }

    if (options.includeForecast && data.forecast) {
      const forecastSheet = this.createForecastSheet(data.forecast)
      XLSX.utils.book_append_sheet(workbook, forecastSheet, 'Forecast')
    }

    // Generate buffer
    return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
  }

  /**
   * Export to PDF
   */
  async exportToPDF(
    data: any,
    metadata: ExportMetadata,
    options: ExportOptions
  ): Promise<ArrayBuffer> {
    const pdf = new jsPDF('p', 'mm', 'a4')
    const template = options.template || this.templates.get('standard')!

    // Add header
    this.addPDFHeader(pdf, metadata, template)

    let currentY = 40

    // Process sections based on template
    for (const section of template.sections) {
      currentY = await this.addPDFSection(pdf, section, data, currentY, options)
      
      // Add new page if needed
      if (currentY > 250) {
        pdf.addPage()
        currentY = 20
      }
    }

    // Add footer
    this.addPDFFooter(pdf, metadata)

    return pdf.output('arraybuffer')
  }

  /**
   * Export to CSV
   */
  exportToCSV(data: any[], headers: string[]): string {
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header]
          // Escape commas and quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value || ''
        }).join(',')
      )
    ].join('\n')

    return csvContent
  }

  /**
   * Create metadata sheet for Excel
   */
  private createMetadataSheet(metadata: ExportMetadata): XLSX.WorkSheet {
    const data = [
      ['Report Information'],
      ['Title', metadata.title],
      ['Author', metadata.author],
      ['Description', metadata.description],
      ['Generated At', metadata.generatedAt],
      [''],
      ['Filters Applied'],
      ['Factory IDs', metadata.filters.factoryIds?.join(', ') || 'All'],
      ['KPI IDs', metadata.filters.kpiIds?.join(', ') || 'All'],
      ['Periods', metadata.filters.periods?.join(', ') || 'All'],
      ['Themes', metadata.filters.themes?.join(', ') || 'All'],
      [''],
      ['Data Statistics'],
      ['Total Records', metadata.dataStats.totalRecords],
      ['Factories Included', metadata.dataStats.factoriesIncluded],
      ['Periods Included', metadata.dataStats.periodsIncluded],
      ['KPIs Included', metadata.dataStats.kpisIncluded]
    ]

    return XLSX.utils.aoa_to_sheet(data)
  }

  /**
   * Create summary sheet for Excel
   */
  private createSummarySheet(overview: any, metadata: ExportMetadata): XLSX.WorkSheet {
    const data = [
      ['KPI Management System - Executive Summary'],
      [''],
      ['Overall Performance'],
      ['Average Success Rate', `${overview.avgSuccess}%`],
      ['Trend', overview.trend > 0 ? `+${overview.trend}%` : `${overview.trend}%`],
      ['Total KPIs', overview.kpiCount],
      ['Active Factories', overview.factoryCount],
      ['Active Actions', overview.actionCount],
      [''],
      ['Report Details'],
      ['Generated At', metadata.generatedAt],
      ['Author', metadata.author]
    ]

    const worksheet = XLSX.utils.aoa_to_sheet(data)
    
    // Style the header
    worksheet['A1'] = { v: 'KPI Management System - Executive Summary', s: { font: { bold: true, size: 16 } } }
    
    return worksheet
  }

  /**
   * Create KPI data sheet for Excel
   */
  private createKPIDataSheet(kpiValues: any[], options: ExportOptions): XLSX.WorkSheet {
    const headers = ['KPI ID', 'KPI Name', 'Factory', 'Period', 'Value', 'Target', 'Achievement Rate', 'Status']
    
    const data = [
      headers,
      ...kpiValues.map(kv => [
        kv.kpiId,
        kv.kpiName,
        kv.factoryName,
        kv.period,
        kv.value,
        kv.targetValue,
        kv.achievementRate ? `${kv.achievementRate}%` : '',
        kv.achievementRate >= 100 ? 'Target Met' : 
        kv.achievementRate >= 80 ? 'Near Target' : 'Below Target'
      ])
    ]

    const worksheet = XLSX.utils.aoa_to_sheet(data)
    
    // Auto-width columns
    const colWidths = headers.map(() => ({ wch: 15 }))
    worksheet['!cols'] = colWidths

    return worksheet
  }

  /**
   * Create factory performance sheet for Excel
   */
  private createFactoryPerformanceSheet(factoryPerformance: any[]): XLSX.WorkSheet {
    const headers = ['Rank', 'Factory ID', 'Factory Name', 'Average Score', 'KPI Count', 'Performance Level']
    
    const data = [
      headers,
      ...factoryPerformance.map((factory, index) => [
        index + 1,
        factory.factoryId,
        factory.factoryName,
        `${factory.avgScore}%`,
        factory.kpiCount,
        factory.avgScore >= 90 ? 'Excellent' :
        factory.avgScore >= 80 ? 'Good' :
        factory.avgScore >= 70 ? 'Average' : 'Needs Improvement'
      ])
    ]

    return XLSX.utils.aoa_to_sheet(data)
  }

  /**
   * Create trends sheet for Excel
   */
  private createTrendsSheet(timeline: any[]): XLSX.WorkSheet {
    const headers = ['Period', 'Average Success Rate', 'Trend']
    
    const data = [
      headers,
      ...timeline.map((point, index) => {
        const prevPoint = timeline[index - 1]
        const trend = prevPoint ? point.avgSuccess - prevPoint.avgSuccess : 0
        return [
          point.period,
          `${point.avgSuccess}%`,
          trend > 0 ? `+${trend.toFixed(1)}%` : `${trend.toFixed(1)}%`
        ]
      })
    ]

    return XLSX.utils.aoa_to_sheet(data)
  }

  /**
   * Create themes sheet for Excel
   */
  private createThemesSheet(themes: any[]): XLSX.WorkSheet {
    const headers = ['Theme', 'Average Performance', 'KPI Count', 'Status']
    
    const data = [
      headers,
      ...themes.map(theme => [
        theme.name,
        `${theme.avg}%`,
        theme.count,
        theme.avg >= 80 ? 'Strong' :
        theme.avg >= 60 ? 'Moderate' : 'Weak'
      ])
    ]

    return XLSX.utils.aoa_to_sheet(data)
  }

  /**
   * Create alerts sheet for Excel
   */
  private createAlertsSheet(alerts: any[]): XLSX.WorkSheet {
    const headers = ['Alert ID', 'Rule Name', 'Priority', 'Status', 'KPI', 'Factory', 'Triggered At']
    
    const data = [
      headers,
      ...alerts.map(alert => [
        alert.id,
        alert.ruleName,
        alert.priority.toUpperCase(),
        alert.status.toUpperCase(),
        alert.data.kpiName,
        alert.data.factoryName,
        new Date(alert.triggeredAt).toLocaleString()
      ])
    ]

    return XLSX.utils.aoa_to_sheet(data)
  }

  /**
   * Create anomalies sheet for Excel
   */
  private createAnomaliesSheet(anomalies: any): XLSX.WorkSheet {
    const headers = ['Period', 'Value', 'Expected Value', 'Deviation %', 'Severity', 'Type']
    
    const data = [
      headers,
      ...anomalies.anomalies.map((anomaly: any) => [
        anomaly.period,
        anomaly.value,
        anomaly.expectedValue,
        `${anomaly.deviation}%`,
        anomaly.severity.toUpperCase(),
        anomaly.type.toUpperCase()
      ])
    ]

    return XLSX.utils.aoa_to_sheet(data)
  }

  /**
   * Create forecast sheet for Excel
   */
  private createForecastSheet(forecast: any): XLSX.WorkSheet {
    const headers = ['Period', 'Predicted Value', 'Confidence Low', 'Confidence High', 'Probability']
    
    const data = [
      headers,
      ...forecast.predictions.map((pred: any) => [
        pred.period,
        pred.predicted,
        pred.confidence.low,
        pred.confidence.high,
        `${(pred.probability * 100).toFixed(1)}%`
      ])
    ]

    return XLSX.utils.aoa_to_sheet(data)
  }

  /**
   * Add PDF header
   */
  private addPDFHeader(pdf: jsPDF, metadata: ExportMetadata, template: ExportTemplate): void {
    // Logo (if available)
    if (template.styling?.logoUrl) {
      // Add logo - would need actual image loading
    }

    // Title
    pdf.setFontSize(20)
    pdf.setFont('helvetica', 'bold')
    pdf.text(metadata.title, 20, 20)

    // Subtitle
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`Generated on ${new Date(metadata.generatedAt).toLocaleDateString()}`, 20, 30)
    
    // Line separator
    pdf.setLineWidth(0.5)
    pdf.line(20, 35, 190, 35)
  }

  /**
   * Add PDF section
   */
  private async addPDFSection(
    pdf: jsPDF,
    section: ExportSection,
    data: any,
    currentY: number,
    options: ExportOptions
  ): Promise<number> {
    // Section title
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text(section.title, 20, currentY)
    currentY += 10

    switch (section.type) {
      case 'summary':
        return this.addPDFSummary(pdf, data.overview, currentY)
      
      case 'table':
        return this.addPDFTable(pdf, data[section.dataSource], currentY, section.title)
      
      case 'chart':
        return await this.addPDFChart(pdf, data[section.dataSource], currentY, section)
      
      case 'analysis':
        return this.addPDFAnalysis(pdf, data[section.dataSource], currentY)
      
      default:
        return currentY + 5
    }
  }

  /**
   * Add PDF summary
   */
  private addPDFSummary(pdf: jsPDF, overview: any, currentY: number): number {
    const summaryData = [
      ['Metric', 'Value'],
      ['Average Success Rate', `${overview.avgSuccess}%`],
      ['Trend', overview.trend > 0 ? `+${overview.trend}%` : `${overview.trend}%`],
      ['Total KPIs', overview.kpiCount.toString()],
      ['Active Factories', overview.factoryCount.toString()]
    ]

    autoTable(pdf, {
      startY: currentY,
      head: [summaryData[0]],
      body: summaryData.slice(1),
      margin: { left: 20 },
      styles: { fontSize: 10 }
    })

    return (pdf as any).lastAutoTable.finalY + 10
  }

  /**
   * Add PDF table
   */
  private addPDFTable(pdf: jsPDF, tableData: any[], currentY: number, title: string): number {
    if (!tableData || tableData.length === 0) {
      pdf.setFontSize(10)
      pdf.text('No data available', 20, currentY)
      return currentY + 10
    }

    // Determine headers based on data type
    let headers: string[] = []
    let rows: any[][] = []

    if (title.includes('KPI')) {
      headers = ['KPI', 'Factory', 'Value', 'Target', 'Achievement %']
      rows = tableData.slice(0, 20).map(item => [
        item.kpiName || item.name,
        item.factoryName || item.factory,
        item.value || item.currentValue,
        item.targetValue || item.target,
        `${item.achievementRate || item.achievement || 0}%`
      ])
    } else if (title.includes('Factory')) {
      headers = ['Factory', 'Score', 'KPIs', 'Performance']
      rows = tableData.slice(0, 15).map(item => [
        item.factoryName || item.name,
        `${item.avgScore || item.score}%`,
        item.kpiCount || item.count,
        item.avgScore >= 80 ? 'Good' : 'Needs Improvement'
      ])
    } else {
      // Generic table
      headers = Object.keys(tableData[0] || {}).slice(0, 5)
      rows = tableData.slice(0, 20).map(item => 
        headers.map(header => item[header] || '')
      )
    }

    autoTable(pdf, {
      startY: currentY,
      head: [headers],
      body: rows,
      margin: { left: 20 },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 30 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 30 }
      }
    })

    return (pdf as any).lastAutoTable.finalY + 10
  }

  /**
   * Add PDF chart (placeholder - would need actual chart rendering)
   */
  private async addPDFChart(
    pdf: jsPDF,
    chartData: any,
    currentY: number,
    section: ExportSection
  ): Promise<number> {
    // Placeholder for chart
    pdf.setFontSize(10)
    pdf.text(`[${section.chartType?.toUpperCase()} CHART: ${section.title}]`, 20, currentY)
    pdf.text('Chart rendering would be implemented with canvas/svg conversion', 20, currentY + 10)
    
    return currentY + 30
  }

  /**
   * Add PDF analysis
   */
  private addPDFAnalysis(pdf: jsPDF, analysisData: any, currentY: number): number {
    if (!analysisData) {
      pdf.setFontSize(10)
      pdf.text('No analysis data available', 20, currentY)
      return currentY + 10
    }

    pdf.setFontSize(10)
    
    if (analysisData.anomalies) {
      pdf.text(`Anomalies Detected: ${analysisData.anomalies.length}`, 20, currentY)
      currentY += 8
      
      if (analysisData.anomalies.length > 0) {
        const topAnomalies = analysisData.anomalies.slice(0, 3)
        topAnomalies.forEach((anomaly: any, index: number) => {
          pdf.text(`${index + 1}. ${anomaly.period}: ${anomaly.type} (${anomaly.severity})`, 25, currentY)
          currentY += 6
        })
      }
    }

    if (analysisData.recommendations) {
      currentY += 5
      pdf.text('Key Recommendations:', 20, currentY)
      currentY += 8
      
      analysisData.recommendations.slice(0, 3).forEach((rec: string, index: number) => {
        const wrappedText = pdf.splitTextToSize(`${index + 1}. ${rec}`, 150)
        pdf.text(wrappedText, 25, currentY)
        currentY += wrappedText.length * 6
      })
    }

    return currentY + 10
  }

  /**
   * Add PDF footer
   */
  private addPDFFooter(pdf: jsPDF, metadata: ExportMetadata): void {
    const pageCount = pdf.getNumberOfPages()
    
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i)
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'normal')
      
      // Footer line
      pdf.setLineWidth(0.3)
      pdf.line(20, 280, 190, 280)
      
      // Footer text
      pdf.text('KPI Management System', 20, 285)
      pdf.text(`Page ${i} of ${pageCount}`, 170, 285)
      pdf.text(`Generated: ${new Date(metadata.generatedAt).toLocaleDateString()}`, 20, 290)
    }
  }

  /**
   * Get available templates
   */
  getTemplates(): ExportTemplate[] {
    return Array.from(this.templates.values())
  }

  /**
   * Get template by ID
   */
  getTemplate(id: string): ExportTemplate | undefined {
    return this.templates.get(id)
  }

  /**
   * Add custom template
   */
  addTemplate(template: ExportTemplate): void {
    this.templates.set(template.id, template)
  }
}
