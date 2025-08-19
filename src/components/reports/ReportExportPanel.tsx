'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, FileSpreadsheet, FileText, TrendingUp, Brain, BarChart3, Calendar } from 'lucide-react'

interface ReportExportPanelProps {
  factoryId: string
  period?: string
}

type ReportType = 'kpi_performance' | 'benchmark' | 'trend_analysis' | 'ai_insights' | 'comprehensive'

export default function ReportExportPanel({ factoryId, period = '2024-Q4' }: ReportExportPanelProps) {
  const [downloading, setDownloading] = useState<Record<ReportType, boolean>>({
    kpi_performance: false,
    benchmark: false,
    trend_analysis: false,
    ai_insights: false,
    comprehensive: false
  })

  const downloadReport = async (reportType: ReportType, format: 'excel' | 'pdf' = 'excel') => {
    if (!factoryId) {
      alert('Factory ID bulunamadı')
      return
    }

    setDownloading(prev => ({ ...prev, [reportType]: true }))

    try {
      const endpoint = format === 'excel' ? '/api/reports/export-excel' : '/api/reports/export-pdf'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          factoryId,
          period,
          reportType
        })
      })

      if (!response.ok) {
        throw new Error(`Export failed: ${response.status}`)
      }

      // Dosyayı indir
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      // Dosya adını response header'ından al
      const contentDisposition = response.headers.get('Content-Disposition')
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `report_${reportType}_${period}.${format === 'excel' ? 'xlsx' : 'html'}`
      
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

  const reportTypes = [
    {
      type: 'kpi_performance' as ReportType,
      title: 'KPI Performans Raporu',
      description: 'Dönemsel KPI başarı oranları ve detay analizi',
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      type: 'benchmark' as ReportType,
      title: 'Benchmark Karşılaştırması',
      description: 'Diğer fabrikalarla performans karşılaştırması',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      type: 'trend_analysis' as ReportType,
      title: 'Trend Analizi',
      description: 'Son 4 dönem performans trendi ve değişim analizi',
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      type: 'ai_insights' as ReportType,
      title: 'AI Önerileri',
      description: 'Yapay zeka destekli öneriler ve risk analizi',
      icon: Brain,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      type: 'comprehensive' as ReportType,
      title: 'Kapsamlı Rapor',
      description: 'Tüm analizleri içeren detaylı performans raporu',
      icon: FileSpreadsheet,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200'
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5 text-emerald-600" />
          Rapor İndirme
        </CardTitle>
        <CardDescription>
          Performans verilerinizi Excel formatında indirin • {period} dönemi
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {reportTypes.map((report) => {
            const Icon = report.icon
            const isDownloading = downloading[report.type]
            
            return (
              <div
                key={report.type}
                className={`p-4 rounded-lg border ${report.borderColor} ${report.bgColor} transition-colors hover:shadow-sm`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-white ${report.borderColor} border`}>
                      <Icon className={`h-5 w-5 ${report.color}`} />
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">
                        {report.title}
                      </h4>
                      <p className="text-sm text-gray-600 mb-3">
                        {report.description}
                      </p>
                      
                      {/* Rapor özellikleri */}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <FileSpreadsheet className="h-3 w-3" />
                          Excel (.xlsx)
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {period}
                        </span>
                        {report.type === 'comprehensive' && (
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                            Kapsamlı
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => downloadReport(report.type, 'excel')}
                      disabled={isDownloading}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                        isDownloading
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : `${report.bgColor} ${report.color} hover:bg-opacity-80 border ${report.borderColor}`
                      }`}
                      title="Excel formatında indir"
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
                      disabled={isDownloading}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                        isDownloading
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : `bg-red-50 text-red-600 hover:bg-red-100 border border-red-200`
                      }`}
                      title="PDF formatında indir"
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

        {/* Kullanım Bilgileri */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h5 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-600" />
            Rapor Kullanım Bilgileri
          </h5>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Excel dosyaları birden fazla sayfada organize edilmiştir</li>
            <li>• Grafik ve formüller Excel'de düzenlenebilir</li>
            <li>• Kapsamlı rapor tüm analiz türlerini içerir</li>
            <li>• Veriler otomatik olarak filtrelenebilir ve sıralanabilir</li>
          </ul>
        </div>

        {/* İstatistik */}
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-lg font-bold text-blue-600">41</div>
            <div className="text-xs text-blue-800">KPI</div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-600">4</div>
            <div className="text-xs text-green-800">Dönem</div>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <div className="text-lg font-bold text-purple-600">15</div>
            <div className="text-xs text-purple-800">Fabrika</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
