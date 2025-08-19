'use client'

import { useEffect, useState } from 'react'
import { getCurrentUser } from '@/lib/user-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Upload, CheckCircle, AlertTriangle, Clock, Search } from 'lucide-react'

interface Evidence {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  kpi: {
    number: number
    description: string
    strategicTarget: {
      code: string
      title: string
    }
  }
  period: string
  aiAnalysis?: {
    isValid: boolean
    naceMatch: boolean
    qualityScore: number
    summary: string
    recommendations: string[]
  }
  meta: any
  uploadedAt: string
  factoryId: string
}

export default function EvidenceManagementPage() {
  const [user, setUser] = useState<any>(null)
  const [isClient, setIsClient] = useState(false)
  const [evidences, setEvidences] = useState<Evidence[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPeriod, setFilterPeriod] = useState('')
  const [filterKPI, setFilterKPI] = useState('')
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    setIsClient(true)
    setUser(getCurrentUser())
  }, [])

  useEffect(() => {
    if (!user || user.userRole !== 'MODEL_FACTORY' || !user.factoryId) return
    
    const fetchEvidences = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('factoryId', user.factoryId)
        if (filterPeriod) params.set('period', filterPeriod)
        if (filterKPI) params.set('kpiNumber', filterKPI)
        if (searchTerm) params.set('search', searchTerm)

        const response = await fetch(`/api/kpi-evidence?${params.toString()}`)
        const data = await response.json()
        setEvidences(data.evidences || [])
        setStats(data.stats || null)
      } catch (error) {
        console.error('Evidence fetch error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvidences()
  }, [user, searchTerm, filterPeriod, filterKPI])

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user || user.userRole !== 'MODEL_FACTORY') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-blue-600 text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erişim Engellendi</h2>
          <p className="text-gray-600">Bu sayfa sadece Model Fabrika kullanıcıları için erişilebilir.</p>
        </div>
      </div>
    )
  }

  const getStatusIcon = (evidence: Evidence) => {
    if (evidence.aiAnalysis?.isValid) {
      return <CheckCircle className="h-5 w-5 text-green-500" />
    } else if (evidence.aiAnalysis?.isValid === false) {
      return <AlertTriangle className="h-5 w-5 text-red-500" />
    } else {
      return <Clock className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusText = (evidence: Evidence) => {
    if (evidence.aiAnalysis?.isValid) return 'Doğrulandı'
    if (evidence.aiAnalysis?.isValid === false) return 'Geçersiz'
    return 'Beklemede'
  }

  const filteredEvidences = evidences.filter(evidence => {
    const matchesSearch = !searchTerm || 
      evidence.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evidence.kpi.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesPeriod = !filterPeriod || evidence.period === filterPeriod
    const matchesKPI = !filterKPI || evidence.kpi.number.toString() === filterKPI
    
    return matchesSearch && matchesPeriod && matchesKPI
  })

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Kanıt Yönetimi</h1>
        <p className="text-gray-600">KPI kanıtlarınızı yönetin, analiz edin ve takip edin</p>
      </div>

      {/* İstatistikler */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Toplam Kanıt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Doğrulandı</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.validated}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Beklemede</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Geçersiz</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{stats.invalid}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtreler */}
      <Card>
        <CardHeader>
          <CardTitle>Filtreler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Dosya adı veya KPI ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Tüm Dönemler</option>
              <option value="2024-Q4">2024 4. Çeyrek</option>
              <option value="2024-Q3">2024 3. Çeyrek</option>
              <option value="2024-Q2">2024 2. Çeyrek</option>
              <option value="2024-Q1">2024 1. Çeyrek</option>
            </select>
            <select
              value={filterKPI}
              onChange={(e) => setFilterKPI(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Tüm KPI'lar</option>
              {Array.from(new Set(evidences.map(e => e.kpi.number))).sort((a, b) => a - b).map(kpiNum => (
                <option key={kpiNum} value={kpiNum.toString()}>KPI {kpiNum}</option>
              ))}
            </select>
            <button
              onClick={() => {
                setSearchTerm('')
                setFilterPeriod('')
                setFilterKPI('')
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Filtreleri Temizle
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Kanıt Listesi */}
      <Card>
        <CardHeader>
          <CardTitle>Kanıt Listesi</CardTitle>
          <CardDescription>
            {filteredEvidences.length} kanıt bulundu
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Kanıtlar yükleniyor...</p>
            </div>
          ) : filteredEvidences.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Henüz kanıt bulunamadı.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvidences.map((evidence) => (
                <div key={evidence.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <div>
                        <div className="font-medium">{evidence.fileName}</div>
                        <div className="text-sm text-gray-500">
                          KPI {evidence.kpi.number} - {evidence.kpi.description.substring(0, 50)}...
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(evidence)}
                      <span className="text-sm font-medium">{getStatusText(evidence)}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Dönem:</span> {evidence.period}
                    </div>
                    <div>
                      <span className="font-medium">Stratejik Hedef:</span> {evidence.kpi.strategicTarget.code}
                    </div>
                    <div>
                      <span className="font-medium">Dosya Boyutu:</span> {Math.round(evidence.fileSize / 1024)} KB
                    </div>
                    <div>
                      <span className="font-medium">Yüklenme:</span> {new Date(evidence.uploadedAt).toLocaleDateString('tr-TR')}
                    </div>
                  </div>

                  {evidence.aiAnalysis && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">AI Analiz Sonucu</span>
                        <span className="text-sm font-medium">
                          Kalite Skoru: {evidence.aiAnalysis.qualityScore}/100
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        {evidence.aiAnalysis.summary}
                      </div>
                      {evidence.aiAnalysis.recommendations.length > 0 && (
                        <div className="text-sm">
                          <span className="font-medium">Öneriler:</span>
                          <ul className="list-disc list-inside ml-2 text-gray-600">
                            {evidence.aiAnalysis.recommendations.map((rec, index) => (
                              <li key={index}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
