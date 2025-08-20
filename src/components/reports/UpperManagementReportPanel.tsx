'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, FileSpreadsheet, FileText, TrendingUp, Brain, BarChart3, Calendar, Building2, Layers } from 'lucide-react'

type UMReportType = 'executive_summary' | 'factory_benchmark' | 'trend_forecast' | 'ai_insights' | 'comprehensive'

interface UpperManagementReportPanelProps {
  defaultPeriod?: string
}

type FactoryOption = { id: string; name: string; code?: string; city?: string }

export default function UpperManagementReportPanel({ defaultPeriod = '2024-Q4' }: UpperManagementReportPanelProps) {
  const [startPeriod, setStartPeriod] = useState(defaultPeriod)
  const [endPeriod, setEndPeriod] = useState(defaultPeriod)
  const [includeAllFactories, setIncludeAllFactories] = useState(true)
  const [factories, setFactories] = useState<FactoryOption[]>([])
  const [selectedFactoryIds, setSelectedFactoryIds] = useState<string[]>([])
  const [downloading, setDownloading] = useState<Record<UMReportType, boolean>>({
    executive_summary: false,
    factory_benchmark: false,
    trend_forecast: false,
    ai_insights: false,
    comprehensive: false
  })

  const reportTypes = [
    {
      type: 'executive_summary' as UMReportType,
      title: 'Yönetsel Özet Raporu',
      description: 'Tüm fabrikalar için üst düzey KPI özeti, riskler ve fırsatlar',
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      type: 'factory_benchmark' as UMReportType,
      title: 'Fabrika Benchmark Raporu',
      description: 'Fabrika bazında sıralama, yüzdelik dilimler ve kıyas',
      icon: Building2,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200'
    },
    {
      type: 'trend_forecast' as UMReportType,
      title: 'Trend ve Tahmin Raporu',
      description: 'Son 4 dönem trendleri ve basit istatistiksel tahmin',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      type: 'ai_insights' as UMReportType,
      title: 'AI İçgörüleri Raporu',
      description: 'Yapay zeka destekli iyileştirme önerileri ve risk analizi',
      icon: Brain,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      type: 'comprehensive' as UMReportType,
      title: 'Kapsamlı Yönetim Raporu',
      description: 'Tüm analizlerin tek dosyada birleşimi',
      icon: Layers,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200'
    }
  ]

  useEffect(() => {
    // load factories
    const fetchFactories = async () => {
      try {
        const res = await fetch('/api/factories')
        if (!res.ok) return
        const data = await res.json()
        const mapped: FactoryOption[] = (data || []).map((f: any) => ({ id: f.id, name: f.name, code: f.code, city: f.city }))
        setFactories(mapped)
      } catch (e) {
        // noop
      }
    }
    fetchFactories()
  }, [])

  const downloadReport = async (reportType: UMReportType, format: 'excel' | 'pdf' = 'excel') => {
    setDownloading(prev => ({ ...prev, [reportType]: true }))
    try {
      const endpoint = format === 'excel' ? '/api/reports/upper/export-excel' : '/api/reports/upper/export-pdf'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          startPeriod, 
          endPeriod, 
          reportType,
          factoryIds: includeAllFactories ? undefined : selectedFactoryIds
        })
      })

      if (!response.ok) throw new Error(`${format.toUpperCase()} export failed: ${response.status}`)

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const contentDisposition = response.headers.get('Content-Disposition')
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `upper_${reportType}_${startPeriod}_to_${endPeriod}.${format === 'excel' ? 'xlsx' : 'html'}`
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error(`${format} export error:`, error)
      alert('Rapor indirilemedi: ' + error)
    } finally {
      setDownloading(prev => ({ ...prev, [reportType]: false }))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5 text-blue-600" />
          Üst Yönetim Raporları
        </CardTitle>
        <CardDescription>
          Kurum genelindeki performans ve trend raporlarını indirin
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Controls */}
        <div className="flex flex-col gap-4 mb-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <input
                value={startPeriod}
                onChange={e => setStartPeriod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Başlangıç: 2024-Q1"
              />
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <input
                value={endPeriod}
                onChange={e => setEndPeriod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Bitiş: 2024-Q4"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={includeAllFactories} onChange={e => setIncludeAllFactories(e.target.checked)} />
              Tüm fabrikalar
            </label>
          </div>

          {!includeAllFactories && (
            <div className="border border-gray-200 rounded-lg p-3">
              <div className="text-sm font-medium text-gray-700 mb-2">Raporlanacak Model Fabrikalar</div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-56 overflow-auto">
                {factories.map(f => (
                  <label key={f.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedFactoryIds.includes(f.id)}
                      onChange={e => {
                        const checked = e.target.checked
                        setSelectedFactoryIds(prev => checked ? [...prev, f.id] : prev.filter(x => x !== f.id))
                      }}
                    />
                    <span className="text-gray-700">{f.name} {f.city ? `• ${f.city}` : ''}</span>
                  </label>
                ))}
              </div>
              <div className="text-xs text-gray-500 mt-2">Seçilmezse rapor indirilemez.</div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {reportTypes.map(report => {
            const Icon = report.icon
            const isDownloading = downloading[report.type]
            return (
              <div key={report.type} className={`p-4 rounded-lg border ${report.borderColor} ${report.bgColor} hover:shadow-sm transition`}> 
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-white ${report.borderColor} border`}>
                      <Icon className={`h-5 w-5 ${report.color}`} />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 mb-1">{report.title}</div>
                      <div className="text-sm text-gray-600">{report.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => downloadReport(report.type, 'excel')}
                      disabled={isDownloading || (!includeAllFactories && selectedFactoryIds.length === 0)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                        isDownloading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : `${report.bgColor} ${report.color} hover:bg-opacity-80 border ${report.borderColor}`
                      }`}
                    >
                      {isDownloading ? (
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                      ) : (
                        <FileSpreadsheet className="h-4 w-4" />
                      )}
                      Excel
                    </button>
                    <button
                      onClick={() => downloadReport(report.type, 'pdf')}
                      disabled={isDownloading || (!includeAllFactories && selectedFactoryIds.length === 0)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                        isDownloading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                      }`}
                    >
                      <FileText className="h-4 w-4" />
                      PDF
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}


