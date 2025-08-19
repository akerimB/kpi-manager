'use client';

import { getCurrentUser, getUserApiParams } from '@/lib/user-context';
import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, TrendingUp, TrendingDown, Calendar, Factory, Search, AlertCircle, CheckCircle } from 'lucide-react';
import { Upload, Paperclip, Trash2 } from 'lucide-react';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES, EVIDENCE_CATEGORIES } from '@/lib/evidence-config'
import EvidenceUploadPanel from '@/components/evidence/EvidenceUploadPanel'
import EvidenceListPanel from '@/components/evidence/EvidenceListPanel'
import EvidenceTemplateGuide from '@/components/evidence/EvidenceTemplateGuide'

interface KPI {
  id: string;
  name: string;
  description: string;
  themes: string;
  shCode: string;
  unit?: string;
  targetValue?: number;
  strategicTarget: {
    id: string;
    code: string;
    title?: string;
    strategicGoal: {
      id: string;
      code: string;
      title: string;
    }
  };
  kpiValues: Array<{
    id: string;
    value: number;
    period: string;
  }>;
}

interface Factory {
  id: string;
  name: string;
  code: string;
}

interface KPIValue {
  id: string;
  kpiId: string;
  period: string;
  value: number;
  target: number;
  previousValue?: number;
}

interface KpiEvidence {
  id: string;
  kpiId: string;
  factoryId: string;
  period: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  description?: string;
  category?: string;
  uploadedAt: string;
}

export default function KPIEntryPage() {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [factories, setFactories] = useState<Factory[]>([]);
  const [kpiValues, setKpiValues] = useState<KPIValue[]>([]);
  const [selectedFactory, setSelectedFactory] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('2024-Q4');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [evidences, setEvidences] = useState<Record<string, KpiEvidence[]>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadItems, setUploadItems] = useState<Array<{ id: string; name: string; progress: number }>>([])
  const [evidenceFilters, setEvidenceFilters] = useState<Record<string, string>>({})
  const [analyzingIds, setAnalyzingIds] = useState<Record<string, boolean>>({})

  // Kullanıcı bağlamını al
  const [userContext, setUserContext] = useState<any>(null)
  const [isClient, setIsClient] = useState(false)

  // Memoized values to prevent unnecessary re-renders
  const isAuthenticated = useMemo(() => !!userContext, [userContext])
  const apiParams = useMemo(() => 
    userContext ? getUserApiParams(userContext) : '', 
    [userContext]
  )

  useEffect(() => {
    setIsClient(true)
    setUserContext(getCurrentUser())
  }, [])

  // Authentication kontrolü - only after userContext is properly set
  useEffect(() => {
    if (isClient && userContext === null) {
      // Only redirect if we've checked and userContext is definitely null
      setTimeout(() => {
        const user = getCurrentUser()
        if (!user) {
          window.location.href = '/login'
        }
      }, 100)
      return
    }
  }, [isClient, userContext])

  // Memoized fetch function
  const fetchInitialData = useCallback(async () => {
    if (!userContext || !apiParams) return

    try {
      console.log('Starting data fetch...')
      const baseUrl = window.location.origin
      
      const [kpisRes, factoriesRes] = await Promise.all([
        fetch(`${baseUrl}/api/kpis?${apiParams}`),
        fetch(`${baseUrl}/api/factories?${apiParams}`)
      ])
      
      console.log('Got responses:', { kpisStatus: kpisRes.status, factoriesStatus: factoriesRes.status })
      
      if (!kpisRes.ok || !factoriesRes.ok) {
        console.error('API request failed:', { kpisStatus: kpisRes.status, factoriesStatus: factoriesRes.status })
        setLoading(false)
        return
      }
      
      const kpisData = await kpisRes.json()
      const factoriesData = await factoriesRes.json()
      
      console.log('Fetched data:', { kpisCount: kpisData.length, factoriesCount: factoriesData.length })
      
      // Ensure kpisData is an array
      if (Array.isArray(kpisData)) {
        setKpis(kpisData)
      } else {
        console.error('KPIs data is not an array:', kpisData)
        setKpis([])
      }
      
      // Ensure factoriesData is an array
      if (Array.isArray(factoriesData)) {
        setFactories(factoriesData)
        
        // Model fabrika kullanıcısı için kendi fabrikasını seç
        if (userContext.userRole === 'MODEL_FACTORY' && userContext.factoryId) {
          const userFactory = factoriesData.find(f => f.id === userContext.factoryId)
          if (userFactory) {
            setSelectedFactory(userFactory.code)
          }
        } else if (factoriesData.length > 0) {
          setSelectedFactory(factoriesData[0].code)
        }
      } else {
        console.error('Factories data is not an array:', factoriesData)
        setFactories([])
      }
      
    } catch (error) {
      console.error('Error fetching data:', error)
      setKpis([])
      setFactories([])
    } finally {
      setLoading(false)
    }
  }, [userContext, apiParams])

  // Fetch initial data
  useEffect(() => {
    fetchInitialData()
  }, [fetchInitialData])

  const fetchKPIValues = useCallback(async () => {
    try {
      // Factory code'unu factory ID'ye çevir
      const selectedFactoryData = factories.find(f => f.code === selectedFactory);
      if (!selectedFactoryData) {
        console.error('Selected factory not found');
        setKpiValues([]);
        return;
      }
      
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/kpi-values?factory=${selectedFactoryData.id}&period=${selectedPeriod}`);
      const data = await response.json();
      setKpiValues(Array.isArray(data) ? data : []);

      // Kanıtları da çek
      const evidencesByKpi: Record<string, KpiEvidence[]> = {};
      for (const kv of Array.isArray(data) ? data : []) {
        try {
          const res = await fetch(`${baseUrl}/api/kpi-evidence?kpiId=${kv.kpiId}&factoryId=${selectedFactoryData.id}&period=${selectedPeriod}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
          });
          const evs = await res.json();
          evidencesByKpi[kv.kpiId] = Array.isArray(evs) ? evs : [];
        } catch {}
      }
      setEvidences(evidencesByKpi);
    } catch (error) {
      console.error('Error fetching KPI values:', error);
      setKpiValues([]);
    }
  }, [selectedFactory, selectedPeriod, factories]);

  // Fetch KPI values when factory or period changes
  useEffect(() => {
    if (selectedFactory && selectedPeriod && factories.length > 0) {
      fetchKPIValues();
    }
  }, [fetchKPIValues, selectedFactory, selectedPeriod, factories.length]);

  const handleValueChange = (kpiId: string, value: number) => {
    setKpiValues(prev => {
      const existing = prev.find(kv => kv.kpiId === kpiId);
      if (existing) {
        return prev.map(kv => 
          kv.kpiId === kpiId ? { ...kv, value } : kv
        );
      } else {
        const newValue: KPIValue = {
          id: `temp-${kpiId}`,
          kpiId,
          period: selectedPeriod,
          value,
          target: 100, // Default target
        };
        return [...prev, newValue];
      }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus('idle');

    try {
      // Factory code'unu factory ID'ye çevir
      const selectedFactoryData = factories.find(f => f.code === selectedFactory);
      if (!selectedFactoryData) {
        console.error('Selected factory not found');
        setSaveStatus('error');
        setSaving(false);
        return;
      }

      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/kpi-values`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: kpiValues.map(kv => ({
            kpiId: kv.kpiId,
            value: kv.value,
            period: selectedPeriod,
            factoryId: selectedFactoryData.id
          }))
        }),
      });

      if (response.ok) {
        setSaveStatus('success');
        await fetchKPIValues(); // Refresh data
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Error saving KPI values:', error);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const handleEvidenceUpload = async (kpiId: string, file: File, description?: string, category?: string) => {
    if (!selectedFactory || factories.length === 0) return;
    const selectedFactoryData = factories.find(f => f.code === selectedFactory);
    if (!selectedFactoryData) return;

    // client-side tip/boyut doğrulama
    const allowed = new Set(ALLOWED_MIME_TYPES)
    if (!allowed.has(file.type) || file.size > MAX_FILE_SIZE_BYTES) {
      alert('İzin verilmeyen dosya tipi veya boyutu büyük (max 25MB)')
      return
    }

    setUploading(true);
    try {
      // 1) Presign al
      const presignRes = await fetch('/api/kpi-evidence/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type || 'application/octet-stream',
          kpiId,
          period: selectedPeriod,
          factoryId: selectedFactoryData.id
        })
      })
      if (!presignRes.ok) throw new Error('Presign alınamadı')
      const { uploadUrl, publicUrl, key } = await presignRes.json()

      // 2) PUT ile S3'e yükle (progress)
      const itemId = `${kpiId}-${Date.now()}-${file.name}`
      setUploadItems(prev => [...prev, { id: itemId, name: file.name, progress: 0 }])
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100)
            setUploadItems(prev => prev.map(it => it.id === itemId ? { ...it, progress: pct } : it))
          }
        }
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setUploadItems(prev => prev.filter(it => it.id !== itemId))
            resolve()
          } else {
            reject(new Error('S3 yükleme başarısız'))
          }
        }
        xhr.onerror = () => reject(new Error('S3 yükleme hatası'))
        xhr.open('PUT', uploadUrl)
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
        xhr.send(file)
      })

      // 3) Metadata kaydet
      const res = await fetch('/api/kpi-evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
        body: JSON.stringify({
          kpiId,
          factoryId: selectedFactoryData.id,
          period: selectedPeriod,
          fileName: file.name,
          fileType: file.name.split('.').pop()?.toLowerCase() || 'unknown',
          fileSize: file.size,
          fileUrl: publicUrl,
          description: description || '',
          category: category || 'OTHER',
          uploadedBy: userContext?.user?.id,
          fileKey: key,
          // AI will extract metadata from file content
        })
      })

      if (res.ok) {
        const created: KpiEvidence = await res.json();
        setEvidences(prev => ({
          ...prev,
          [kpiId]: [created, ...(prev[kpiId] || [])]
        }))
      } else {
        const errorData = await res.json()
        
        // Validation hatası özel işleme
        if (errorData.validationErrors || errorData.validationWarnings) {
          let message = '❌ Evidence Validation Hatası:\n\n'
          
          if (errorData.validationErrors?.length > 0) {
            message += '🚫 Hatalar:\n'
            errorData.validationErrors.forEach((error: string) => {
              message += `• ${error}\n`
            })
          }
          
          if (errorData.validationWarnings?.length > 0) {
            message += '\n⚠️ Uyarılar:\n'
            errorData.validationWarnings.forEach((warning: string) => {
              message += `• ${warning}\n`
            })
          }
          
          if (errorData.suggestions?.length > 0) {
            message += '\n💡 Öneriler:\n'
            errorData.suggestions.forEach((suggestion: string) => {
              message += `• ${suggestion}\n`
            })
          }
          
          message += `\n📊 Validation Skoru: ${errorData.validationScore || 0}/100`
          
          alert(message)
        } else {
          alert(errorData.error || 'Evidence yükleme hatası')
        }
      }
    } finally {
      setUploading(false);
    }
  }

  const handleEvidenceDelete = async (kpiId: string, evidenceId: string) => {
    try {
      const res = await fetch(`/api/kpi-evidence?id=${evidenceId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } });
      if (res.ok) {
        setEvidences(prev => ({
          ...prev,
          [kpiId]: (prev[kpiId] || []).filter(e => e.id !== evidenceId)
        }))
      }
    } catch {}
  }

  const handleEvidenceAnalyze = async (kpiId: string, evidenceId: string) => {
    try {
      setAnalyzingIds(prev => ({ ...prev, [evidenceId]: true }))
      const res = await fetch('/api/kpi-evidence/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
        body: JSON.stringify({ evidenceId })
      })
      const data = await res.json()
      const summary = data?.summary || 'Analiz sonucu alınamadı'
      alert(summary)
    } catch (e) {
      alert('Analiz sırasında hata oluştu')
    } finally {
      setAnalyzingIds(prev => ({ ...prev, [evidenceId]: false }))
    }
  }

  const getKPIValue = (kpiId: string) => {
    const kpiValue = kpiValues.find(kv => kv.kpiId === kpiId);
    return kpiValue?.value || 0;
  };

  const getPreviousValue = (kpiId: string) => {
    const kpiValue = kpiValues.find(kv => kv.kpiId === kpiId);
    return kpiValue?.previousValue;
  };

  const getPercentageChange = (current: number, previous?: number) => {
    if (!previous || previous === 0) return null;
    return ((current - previous) / previous) * 100;
  };

  const getThemeColor = (themes: string) => {
    if (!themes) return 'bg-gray-100 text-gray-800';
    if (themes.includes('LEAN')) return 'bg-blue-100 text-blue-800';
    if (themes.includes('DIGITAL')) return 'bg-purple-100 text-purple-800';
    if (themes.includes('GREEN')) return 'bg-green-100 text-green-800';
    if (themes.includes('RESILIENCE')) return 'bg-amber-100 text-amber-800';
    return 'bg-gray-100 text-gray-800';
  };

  const filteredKpis = (Array.isArray(kpis) ? kpis : []).filter(kpi =>
    kpi && (
      kpi.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kpi.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kpi.shCode.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const selectedFactoryName = factories.find(f => f.code === selectedFactory)?.name || selectedFactory;

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!userContext) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-blue-600 text-6xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Giriş Gerekli</h2>
          <p className="text-gray-600 mb-4">Bu sayfayı görüntülemek için giriş yapmanız gerekiyor.</p>
          <a href="/login" className="text-blue-600 hover:text-blue-800">Giriş Yap</a>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Veriler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam KPI</p>
                <p className="text-2xl font-bold text-gray-900">{kpis?.length || 0}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Girilen Değer</p>
                <p className="text-2xl font-bold text-gray-900">{kpiValues.filter(kv => kv.value > 0).length}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tamamlanma</p>
                <p className="text-2xl font-bold text-gray-900">
                  {kpis?.length ? Math.round((kpiValues.filter(kv => kv.value > 0).length / kpis.length) * 100) : 0}%
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Factory className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ortalama Değer</p>
                <p className="text-2xl font-bold text-gray-900">
                  {kpiValues.length > 0 ? Math.round(kpiValues.reduce((sum, kv) => sum + kv.value, 0) / kpiValues.length) : 0}
                </p>
              </div>
              <div className="h-12 w-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Veri Giriş Parametreleri</h2>
          <p className="text-sm text-gray-600 mb-6">Lütfen KPI girişi yapacağınız fabrika ve dönemi seçin</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model Fabrika
              </label>
              <select
                value={selectedFactory}
                onChange={(e) => setSelectedFactory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {factories.map((factory) => (
                  <option key={factory.id} value={factory.code}>
                    {factory.name} ({factory.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dönem
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="2024-Q4">2024 - 4. Çeyrek</option>
                <option value="2024-Q3">2024 - 3. Çeyrek</option>
                <option value="2024-Q2">2024 - 2. Çeyrek</option>
                <option value="2024-Q1">2024 - 1. Çeyrek</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                KPI Ara
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="KPI adı, açıklama veya SH kodu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* KPI Card Grid Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              KPI Değerleri - {selectedFactoryName} - {selectedPeriod} dönemi
            </h2>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Kaydediliyor...' : 'Kaydet'}</span>
            </button>
          </div>
          
          {/* Save Status */}
          {saveStatus === 'success' && (
            <div className="mt-3 flex items-center space-x-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">KPI değerleri başarıyla kaydedildi!</span>
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="mt-3 flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Kaydetme sırasında bir hata oluştu!</span>
            </div>
          )}
        </div>

        {/* KPI Cards Grid */}
        {filteredKpis.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Search className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">KPI Bulunamadı</h3>
            <p className="text-gray-500">Arama kriterlerinize uygun KPI bulunamadı. Lütfen arama terimini değiştirin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredKpis.map((kpi, index) => {
              if (!kpi || !kpi.id) return null;
              
              const currentValue = getKPIValue(kpi.id);
              const previousValue = getPreviousValue(kpi.id);
              const percentageChange = getPercentageChange(currentValue, previousValue);

              return (
                <div key={kpi.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">#{index + 1}</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 text-sm leading-tight">
                          {kpi.name || 'KPI'}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${getThemeColor(kpi.themes || '')}`}>
                          {kpi.themes || 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500 mb-1">SH Kodu</div>
                      <div className="font-semibold text-gray-900 text-sm">{kpi.shCode || 'N/A'}</div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 text-sm mb-4 overflow-hidden" style={{display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'}}>
                    {kpi.description || 'Açıklama mevcut değil'}
                  </p>

                  {/* Values Section */}
                <div className="space-y-6">
                    {/* Previous Value */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Önceki Dönem</div>
                        <div className="font-semibold text-gray-700">
                          {previousValue !== undefined && previousValue !== null ? previousValue.toLocaleString() : '0'}
                        </div>
                      </div>
                      {percentageChange !== null && (
                        <div className="flex items-center space-x-1">
                          {percentageChange >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          )}
                          <span className={`text-sm font-medium ${
                            percentageChange >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {percentageChange >= 0 ? '+' : ''}{percentageChange.toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Current Value Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mevcut Dönem Değeri
                      </label>
                      <input
                        type="number"
                        value={currentValue}
                        onChange={(e) => handleValueChange(kpi.id, Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        step="0.01"
                        min="0"
                        placeholder="Değer girin"
                      />
                    </div>

                    {/* KPI Template Guide */}
                    <EvidenceTemplateGuide 
                      kpiNumber={index + 1}
                      kpiDescription={kpi.description}
                      period={selectedPeriod}
                    />

                    {/* Evidence Upload - Simplified */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Kanıt Ekle</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 text-sm">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Kategori</label>
                          <select
                            className="w-full p-2 border border-gray-300 rounded-md"
                            onChange={(e) => {
                              (window as any).__evidenceCategory = e.target.value
                            }}
                          >
                            {EVIDENCE_CATEGORIES.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Açıklama (opsiyonel)</label>
                          <input
                            type="text"
                            className="w-full p-2 border border-gray-300 rounded-md"
                            placeholder="Kısa açıklama"
                            onChange={(e) => { (window as any).__evidenceDescription = e.target.value }}
                          />
                        </div>
                      </div>
                      <div
                        className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-gray-50 cursor-pointer"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault()
                          const files = Array.from(e.dataTransfer.files || [])
                          const valid = files.filter(f => f.size <= 25 * 1024 * 1024) // 25MB limit
                          valid.forEach(file => handleEvidenceUpload(kpi.id, file, (window as any).__evidenceDescription, (window as any).__evidenceCategory))
                        }}
                      >
                        <div className="flex items-center justify-center">
                          <label className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700">
                            <Upload className="h-4 w-4 mr-2" /> Dosya Seç
                            <input
                              type="file"
                              multiple
                              className="hidden"
                              onChange={(e) => {
                                const files = Array.from(e.target.files || [])
                                const valid = files.filter(f => f.size <= 25 * 1024 * 1024)
                                valid.forEach(file => handleEvidenceUpload(kpi.id, file, (window as any).__evidenceDescription, (window as any).__evidenceCategory))
                              }}
                            />
                          </label>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">PDF, görüntü, Excel, Word vb. (maks 25MB/dosya)<br/>
                        <span className="text-blue-600">🤖 AI otomatik olarak sektör bilgilerini dosyadan çıkaracak</span></p>
                      </div>
                      {uploading && uploadItems.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {uploadItems.map(item => (
                            <div key={item.id}>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${item.progress}%` }}></div>
                              </div>
                              <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>{item.name}</span>
                                <span>{item.progress}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Evidence List */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Kanıtlar</label>
                      <div className="mb-2">
                        <select
                          className="w-48 p-2 border border-gray-300 rounded-md text-sm"
                          value={evidenceFilters[kpi.id] || ''}
                          onChange={(e) => setEvidenceFilters(prev => ({ ...prev, [kpi.id]: e.target.value }))}
                        >
                          <option value="">Tümü</option>
                          {EVIDENCE_CATEGORIES.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        {(evidences[kpi.id] || []).length === 0 ? (
                          <div className="text-xs text-gray-500">Henüz kanıt eklenmemiş</div>
                        ) : (
                          (evidences[kpi.id] || [])
                            .filter(ev => {
                              const f = evidenceFilters[kpi.id]
                              if (!f) return true
                              return (ev.category || 'OTHER') === f
                            })
                            .map(ev => (
                            <div key={ev.id} className="flex items-center justify-between p-2 border rounded-md">
                              <div className="flex items-center space-x-2">
                                <Paperclip className="h-4 w-4 text-gray-500" />
                                <button
                                  className="text-sm text-blue-600 hover:underline"
                                  onClick={async () => {
                                    try {
                                      if (ev.fileKey) {
                                        const res = await fetch(`/api/kpi-evidence/get-url?key=${encodeURIComponent(ev.fileKey)}`, {
                                          headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
                                        })
                                        const data = await res.json()
                                        if (data.url) window.open(data.url, '_blank')
                                      } else {
                                        window.open(ev.fileUrl, '_blank')
                                      }
                                    } catch {}
                                  }}
                                >
                                  {ev.fileName}
                                </button>
                                <span className="text-xs text-gray-400">{Math.round(ev.fileSize / 1024)} KB</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                  (ev.category || 'OTHER') === 'REPORT' ? 'bg-blue-100 text-blue-700' :
                                  (ev.category || 'OTHER') === 'IMAGE' ? 'bg-green-100 text-green-700' :
                                  (ev.category || 'OTHER') === 'CERTIFICATE' ? 'bg-purple-100 text-purple-700' :
                                  (ev.category || 'OTHER') === 'LOG' ? 'bg-amber-100 text-amber-700' :
                                  (ev.category || 'OTHER') === 'EMAIL' ? 'bg-teal-100 text-teal-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>{ev.category || 'OTHER'}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <button
                                  className="text-blue-600 hover:text-blue-700 text-xs"
                                  onClick={() => handleEvidenceAnalyze(kpi.id, ev.id)}
                                  disabled={!!analyzingIds[ev.id]}
                                  title="Analiz (YZ)"
                                >
                                  {analyzingIds[ev.id] ? 'Analiz...' : 'Analiz (YZ)'}
                                </button>
                                <button
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => handleEvidenceDelete(kpi.id, ev.id)}
                                  title="Sil"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
} 