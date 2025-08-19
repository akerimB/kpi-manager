'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  FileText, Download, Trash2, Brain, Eye, Calendar, 
  Building2, MapPin, Users, DollarSign, TrendingUp, Filter
} from 'lucide-react'
import { EVIDENCE_CATEGORIES } from '@/lib/evidence-config'

interface Evidence {
  id: string
  kpiId: string
  factoryId: string
  period: string
  fileName: string
  fileType: string
  fileSize: number
  fileUrl: string
  fileKey?: string
  description?: string
  category?: string
  uploadedBy?: string
  uploadedAt: string
  // Sektörel veri alanları
  firmIdHash?: string
  nace2d?: string
  nace4d?: string
  province?: string
  zoneType?: string
  employees?: number
  revenue?: number
  hasExport?: boolean
  meta?: any
}

interface EvidenceAnalysis {
  id: string
  summary: string
  score: number
  recommendations: string[]
  sectorBenchmark?: {
    avgScore: number
    ranking: string
  }
  metadata: {
    processedAt: string
    aiModel: string
    confidence: number
  }
}

interface EvidenceListPanelProps {
  kpiId: string
  kpiNumber: number
  factoryId: string
  period: string
  evidences: Evidence[]
  onEvidenceDeleted: () => void
  onAnalysisRequested: (evidenceId: string) => void
}

export default function EvidenceListPanel({
  kpiId,
  kpiNumber,
  factoryId,
  period,
  evidences,
  onEvidenceDeleted,
  onAnalysisRequested
}: EvidenceListPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set())
  const [analyses, setAnalyses] = useState<Record<string, EvidenceAnalysis>>({})
  const [expandedAnalysis, setExpandedAnalysis] = useState<string | null>(null)

  // Filtered evidences
  const filteredEvidences = useMemo(() => {
    if (selectedCategory === 'ALL') return evidences
    return evidences.filter(ev => (ev.category || 'OTHER') === selectedCategory)
  }, [evidences, selectedCategory])

  // Evidence statistics
  const stats = useMemo(() => {
    const total = evidences.length
    const byCategory = evidences.reduce((acc, ev) => {
      const cat = ev.category || 'OTHER'
      acc[cat] = (acc[cat] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const totalSize = evidences.reduce((sum, ev) => sum + ev.fileSize, 0)
    const avgSize = total > 0 ? totalSize / total : 0
    
    return { total, byCategory, totalSize, avgSize }
  }, [evidences])

  // Kanıt analizi isteği
  const handleAnalyzeEvidence = useCallback(async (evidenceId: string) => {
    setAnalyzingIds(prev => new Set([...prev, evidenceId]))
    
    try {
      const authToken = localStorage.getItem('authToken')
      const response = await fetch('/api/kpi-evidence/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          evidenceId,
          kpiNumber,
          factoryId,
          period
        })
      })
      
      if (response.ok) {
        const analysis = await response.json()
        setAnalyses(prev => ({ ...prev, [evidenceId]: analysis }))
        setExpandedAnalysis(evidenceId)
      } else {
        alert('Analiz yapılamadı')
      }
    } catch (error) {
      console.error('Analysis error:', error)
      alert('Analiz sırasında hata oluştu')
    } finally {
      setAnalyzingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(evidenceId)
        return newSet
      })
    }
  }, [kpiNumber, factoryId, period])

  // Dosya indirme
  const handleDownloadEvidence = useCallback(async (evidence: Evidence) => {
    try {
      if (evidence.fileKey) {
        const authToken = localStorage.getItem('authToken')
        const response = await fetch(`/api/kpi-evidence/get-url?key=${encodeURIComponent(evidence.fileKey)}`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        })
        const data = await response.json()
        if (data.url) {
          window.open(data.url, '_blank')
        }
      } else {
        window.open(evidence.fileUrl, '_blank')
      }
    } catch (error) {
      console.error('Download error:', error)
      alert('Dosya indirilemedi')
    }
  }, [])

  // Kanıt silme
  const handleDeleteEvidence = useCallback(async (evidenceId: string) => {
    if (!confirm('Bu kanıtı silmek istediğinizden emin misiniz?')) return
    
    try {
      const authToken = localStorage.getItem('authToken')
      const response = await fetch(`/api/kpi-evidence?id=${evidenceId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      
      if (response.ok) {
        onEvidenceDeleted()
        // Analysis'i de temizle
        setAnalyses(prev => {
          const newAnalyses = { ...prev }
          delete newAnalyses[evidenceId]
          return newAnalyses
        })
      } else {
        alert('Kanıt silinemedi')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Silme sırasında hata oluştu')
    }
  }, [onEvidenceDeleted])

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
    return `${Math.round(bytes / (1024 * 1024))} MB`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (evidences.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz kanıt eklenmemiş</h3>
          <p className="text-gray-500">Bu KPI için kanıt yükleyerek başlayın</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* İstatistikler */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-blue-600" />
            KPI {kpiNumber} Kanıtları
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-blue-800">Toplam Kanıt</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{formatFileSize(stats.totalSize)}</div>
              <div className="text-sm text-green-800">Toplam Boyut</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{Object.keys(stats.byCategory).length}</div>
              <div className="text-sm text-purple-800">Kategori Türü</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{formatFileSize(stats.avgSize)}</div>
              <div className="text-sm text-orange-800">Ortalama Boyut</div>
            </div>
          </div>

          {/* Kategori Filtresi */}
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="ALL">Tüm Kategoriler ({stats.total})</option>
              {EVIDENCE_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat} ({stats.byCategory[cat] || 0})
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Kanıt Listesi */}
      <div className="space-y-3">
        {filteredEvidences.map(evidence => (
          <Card key={evidence.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Dosya Bilgisi */}
                  <div className="flex items-center gap-3 mb-3">
                    <FileText className="h-5 w-5 text-gray-500" />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{evidence.fileName}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        <span>{formatFileSize(evidence.fileSize)}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(evidence.uploadedAt)}
                        </span>
                        {evidence.category && (
                          <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                            {evidence.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Açıklama */}
                  {evidence.description && (
                    <p className="text-sm text-gray-700 mb-3 italic">
                      "{evidence.description}"
                    </p>
                  )}

                  {/* AI Çıkarılan Sektörel Veriler */}
                  {(evidence.nace2d || evidence.province || evidence.employees || evidence.revenue) && (
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-blue-600 flex items-center gap-1">
                          🤖 AI Çıkarılan Veriler
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                      {evidence.nace2d && (
                        <div className="flex items-center gap-2 text-sm">
                          <Building2 className="h-4 w-4 text-gray-500" />
                          <span>NACE: {evidence.nace2d}</span>
                        </div>
                      )}
                      {evidence.province && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span>{evidence.province}</span>
                        </div>
                      )}
                      {evidence.employees && (
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span>{evidence.employees} kişi</span>
                        </div>
                      )}
                      {evidence.revenue && (
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="h-4 w-4 text-gray-500" />
                          <span>{(evidence.revenue / 1000000).toFixed(1)}M TL</span>
                        </div>
                      )}
                      </div>
                    </div>
                  )}

                  {/* AI Analizi Sonucu */}
                  {analyses[evidence.id] && expandedAnalysis === evidence.id && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                      <h5 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                        <Brain className="h-4 w-4" />
                        AI Analiz Sonucu
                      </h5>
                      <div className="space-y-3">
                        <div className="flex items-center gap-4">
                          <div className="text-sm">
                            <span className="text-blue-700 font-medium">Skor:</span>
                            <span className="ml-2 px-2 py-1 bg-blue-200 rounded-full text-blue-800 font-medium">
                              {analyses[evidence.id].score}/100
                            </span>
                          </div>
                          {analyses[evidence.id].sectorBenchmark && (
                            <div className="text-sm">
                              <span className="text-blue-700 font-medium">Sektör Ortalaması:</span>
                              <span className="ml-2">{analyses[evidence.id].sectorBenchmark.avgScore}/100</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-blue-800">{analyses[evidence.id].summary}</p>
                        </div>
                        {analyses[evidence.id].recommendations.length > 0 && (
                          <div>
                            <h6 className="text-sm font-medium text-blue-900 mb-1">Öneriler:</h6>
                            <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
                              {analyses[evidence.id].recommendations.map((rec, idx) => (
                                <li key={idx}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div className="text-xs text-blue-600">
                          Analiz: {formatDate(analyses[evidence.id].metadata.processedAt)} • 
                          Güven: %{Math.round(analyses[evidence.id].metadata.confidence * 100)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Eylem Butonları */}
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleDownloadEvidence(evidence)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="İndir"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => handleAnalyzeEvidence(evidence.id)}
                    disabled={analyzingIds.has(evidence.id)}
                    className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50"
                    title="AI Analizi"
                  >
                    {analyzingIds.has(evidence.id) ? (
                      <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Brain className="h-4 w-4" />
                    )}
                  </button>

                  {analyses[evidence.id] && (
                    <button
                      onClick={() => setExpandedAnalysis(
                        expandedAnalysis === evidence.id ? null : evidence.id
                      )}
                      className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                      title="Analizi Göster/Gizle"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleDeleteEvidence(evidence.id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    title="Sil"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
