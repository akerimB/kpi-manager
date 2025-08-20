'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Settings,
  Filter,
  Eye,
  Calendar,
  Building,
  BarChart3,
  Palette,
  Check,
  X,
  LoaderCircle
} from 'lucide-react'

interface ExportTemplate {
  id: string
  name: string
  description: string
  layout: string
  sections: any[]
}

interface FilterOptions {
  factories: Array<{ id: string; name: string }>
  kpis: Array<{ id: string; name: string }>
  periods: string[]
  themes: string[]
}

export default function ExportPanel() {
  const [templates, setTemplates] = useState<ExportTemplate[]>([])
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState('standard')
  const [selectedFormat, setSelectedFormat] = useState<'excel' | 'pdf' | 'csv'>('excel')
  const [filters, setFilters] = useState({
    factoryIds: [] as string[],
    kpiIds: [] as string[],
    periods: [] as string[],
    themes: [] as string[],
    minValue: undefined as number | undefined,
    maxValue: undefined as number | undefined,
    achievementRateMin: undefined as number | undefined,
    achievementRateMax: undefined as number | undefined
  })
  const [options, setOptions] = useState({
    includeCharts: true,
    includeMetadata: true,
    includeAnomalies: false,
    includeForecast: false
  })
  const [preview, setPreview] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    loadTemplatesAndOptions()
  }, [])

  const loadTemplatesAndOptions = async () => {
    try {
      setLoading(true)
      const [templatesRes, filtersRes] = await Promise.all([
        fetch('/api/export?type=templates'),
        fetch('/api/export?type=filters')
      ])

      const [templatesData, filtersData] = await Promise.all([
        templatesRes.json(),
        filtersRes.json()
      ])

      if (templatesData.success) {
        setTemplates(templatesData.templates)
      }

      if (filtersData.success) {
        setFilterOptions(filtersData.filterOptions)
        // Set default period to current quarter
        if (filtersData.filterOptions.periods.length > 0) {
          setFilters(prev => ({
            ...prev,
            periods: [filtersData.filterOptions.periods[0]]
          }))
        }
      }
    } catch (error) {
      console.error('Failed to load export options:', error)
    } finally {
      setLoading(false)
    }
  }

  const generatePreview = async () => {
    try {
      const period = filters.periods[0] || '2024-Q4'
      const response = await fetch(`/api/export?type=preview&period=${period}`)
      const data = await response.json()

      if (data.success) {
        setPreview(data.preview)
      }
    } catch (error) {
      console.error('Failed to generate preview:', error)
    }
  }

  const handleExport = async () => {
    try {
      setExporting(true)

      const exportRequest = {
        filters,
        options: {
          format: selectedFormat,
          ...options
        },
        templateId: selectedTemplate,
        title: `KPI Report - ${new Date().toLocaleDateString()}`,
        author: 'KPI Management System'
      }

      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(exportRequest)
      })

      if (response.ok) {
        // Download file
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        
        const contentDisposition = response.headers.get('Content-Disposition')
        const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || 
                        `kpi-report-${Date.now()}.${selectedFormat === 'excel' ? 'xlsx' : selectedFormat}`
        
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        const error = await response.json()
        console.error('Export failed:', error)
        alert('Export failed: ' + error.error)
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('Export failed: ' + String(error))
    } finally {
      setExporting(false)
    }
  }

  const updateFilters = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const toggleFilterItem = (filterKey: string, itemId: string) => {
    setFilters(prev => {
      const currentArray = prev[filterKey as keyof typeof prev] as string[]
      const newArray = currentArray.includes(itemId)
        ? currentArray.filter(id => id !== itemId)
        : [...currentArray, itemId]
      return { ...prev, [filterKey]: newArray }
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Export Reports</h1>
          <p className="text-gray-600">Generate customized KPI reports in Excel, PDF, or CSV format</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={generatePreview}
          >
            <Eye className="w-4 h-4 mr-1" />
            Preview
          </Button>
          
          <Button
            onClick={handleExport}
            disabled={exporting}
            className="min-w-[120px]"
          >
            {exporting ? (
              <>
                <LoaderCircle className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Format Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileSpreadsheet className="w-5 h-5 mr-2" />
                Export Format
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { format: 'excel', icon: FileSpreadsheet, label: 'Excel', desc: 'Full-featured spreadsheet' },
                  { format: 'pdf', icon: FileText, label: 'PDF', desc: 'Professional report' },
                  { format: 'csv', icon: BarChart3, label: 'CSV', desc: 'Data only' }
                ].map(({ format, icon: Icon, label, desc }) => (
                  <button
                    key={format}
                    onClick={() => setSelectedFormat(format as any)}
                    className={`p-4 border rounded-lg text-center transition-colors ${
                      selectedFormat === format
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-8 h-8 mx-auto mb-2" />
                    <div className="font-medium">{label}</div>
                    <div className="text-xs text-gray-600">{desc}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Template Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="w-5 h-5 mr-2" />
                Report Template
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`p-4 border rounded-lg text-left transition-colors ${
                      selectedTemplate === template.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{template.name}</h3>
                      {selectedTemplate === template.id && (
                        <Check className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{template.description}</p>
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">
                        {template.sections.length} sections
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Filter className="w-5 h-5 mr-2" />
                  Data Filters
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  <Settings className="w-4 h-4 mr-1" />
                  Advanced
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Periods */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Time Periods
                </label>
                <div className="flex flex-wrap gap-2">
                  {filterOptions?.periods.slice(0, 8).map(period => (
                    <button
                      key={period}
                      onClick={() => toggleFilterItem('periods', period)}
                      className={`px-3 py-1 rounded text-sm border transition-colors ${
                        filters.periods.includes(period)
                          ? 'bg-blue-100 border-blue-300 text-blue-700'
                          : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>

              {/* Factories */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building className="w-4 h-4 inline mr-1" />
                  Factories ({filters.factoryIds.length > 0 ? filters.factoryIds.length : 'All'})
                </label>
                <div className="max-h-32 overflow-y-auto border rounded p-2 bg-gray-50">
                  {filterOptions?.factories.map(factory => (
                    <label key={factory.id} className="flex items-center py-1">
                      <input
                        type="checkbox"
                        checked={filters.factoryIds.includes(factory.id)}
                        onChange={() => toggleFilterItem('factoryIds', factory.id)}
                        className="mr-2"
                      />
                      <span className="text-sm">{factory.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Themes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Themes
                </label>
                <div className="flex flex-wrap gap-2">
                  {filterOptions?.themes.map(theme => (
                    <button
                      key={theme}
                      onClick={() => toggleFilterItem('themes', theme)}
                      className={`px-3 py-1 rounded text-sm border transition-colors ${
                        filters.themes.includes(theme)
                          ? 'bg-blue-100 border-blue-300 text-blue-700'
                          : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {theme}
                    </button>
                  ))}
                </div>
              </div>

              {/* Advanced Filters */}
              {showAdvanced && (
                <div className="border-t pt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Min Value
                      </label>
                      <input
                        type="number"
                        value={filters.minValue || ''}
                        onChange={(e) => updateFilters('minValue', e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="Minimum KPI value"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Value
                      </label>
                      <input
                        type="number"
                        value={filters.maxValue || ''}
                        onChange={(e) => updateFilters('maxValue', e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="Maximum KPI value"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Min Achievement %
                      </label>
                      <input
                        type="number"
                        value={filters.achievementRateMin || ''}
                        onChange={(e) => updateFilters('achievementRateMin', e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="0-100"
                        min="0"
                        max="100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Achievement %
                      </label>
                      <input
                        type="number"
                        value={filters.achievementRateMax || ''}
                        onChange={(e) => updateFilters('achievementRateMax', e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="0-100"
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Export Options */}
          <Card>
            <CardHeader>
              <CardTitle>Export Options</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { key: 'includeMetadata', label: 'Include Metadata', desc: 'Report information and filters' },
                  { key: 'includeCharts', label: 'Include Charts', desc: 'Visual charts and graphs' },
                  { key: 'includeAnomalies', label: 'Include Anomalies', desc: 'Anomaly detection results' },
                  { key: 'includeForecast', label: 'Include Forecast', desc: 'Predictive analysis' }
                ].map(({ key, label, desc }) => (
                  <label key={key} className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={options[key as keyof typeof options]}
                      onChange={(e) => setOptions(prev => ({ ...prev, [key]: e.target.checked }))}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-sm">{label}</div>
                      <div className="text-xs text-gray-600">{desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Export Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {preview ? (
                <div className="space-y-3">
                  <div className="text-center p-4 bg-gray-50 rounded">
                    <FileSpreadsheet className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                    <h3 className="font-medium">KPI Report</h3>
                    <p className="text-sm text-gray-600">{selectedFormat.toUpperCase()} Format</p>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Records:</span>
                      <span className="font-medium">{preview.totalRecords.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Factories:</span>
                      <span className="font-medium">{preview.factories}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Periods:</span>
                      <span className="font-medium">{preview.periods}</span>
                    </div>
                  </div>

                  {preview.sampleData && preview.sampleData.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Sample Data</h4>
                      <div className="text-xs bg-gray-50 p-2 rounded max-h-32 overflow-y-auto">
                        {preview.sampleData.slice(0, 3).map((item: any, index: number) => (
                          <div key={index} className="py-1 border-b last:border-b-0">
                            <div className="font-medium">{item.kpiName}</div>
                            <div className="text-gray-600">{item.factoryName} - {item.period}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Click Preview to see export details</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Export</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedFormat('excel')
                  setSelectedTemplate('executive')
                  setTimeout(handleExport, 100)
                }}
                className="w-full justify-start"
                disabled={exporting}
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Executive Summary (Excel)
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedFormat('pdf')
                  setSelectedTemplate('standard')
                  setTimeout(handleExport, 100)
                }}
                className="w-full justify-start"
                disabled={exporting}
              >
                <FileText className="w-4 h-4 mr-2" />
                Standard Report (PDF)
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedFormat('csv')
                  setTimeout(handleExport, 100)
                }}
                className="w-full justify-start"
                disabled={exporting}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Data Export (CSV)
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
