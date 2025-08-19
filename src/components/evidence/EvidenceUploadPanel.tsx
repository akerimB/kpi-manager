'use client'

import { useState, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, File, X, AlertCircle, CheckCircle, Brain, Download, FileText } from 'lucide-react'
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES, EVIDENCE_CATEGORIES } from '@/lib/evidence-config'

interface EvidenceUploadPanelProps {
  kpiId: string
  kpiNumber: number
  kpiDescription: string
  factoryId: string
  period: string
  onUploadComplete: () => void
  onAnalysisRequested?: (evidenceId: string) => void
}

interface EvidenceFormData {
  description: string
  category: string
  // Sektörel veri alanları
  firmIdHash: string
  nace2d: string
  nace4d: string
  province: string
  zoneType: string
  employees: number | null
  revenue: number | null
  hasExport: boolean
}

interface UploadFile {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  error?: string
  id: string
}

export default function EvidenceUploadPanel({ 
  kpiId, 
  kpiNumber, 
  kpiDescription, 
  factoryId, 
  period, 
  onUploadComplete,
  onAnalysisRequested 
}: EvidenceUploadPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [files, setFiles] = useState<UploadFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState<EvidenceFormData>({
    description: '',
    category: 'REPORT',
    firmIdHash: '',
    nace2d: '',
    nace4d: '',
    province: '',
    zoneType: 'OSB',
    employees: null,
    revenue: null,
    hasExport: false
  })

  const naceOptions = useMemo(() => [
    { code: '10', name: 'Gıda Ürünleri İmalatı' },
    { code: '11', name: 'İçecek İmalatı' },
    { code: '13', name: 'Tekstil Ürünleri İmalatı' },
    { code: '14', name: 'Giyim Eşyası İmalatı' },
    { code: '15', name: 'Deri ve İlgili Ürünler İmalatı' },
    { code: '16', name: 'Ağaç ve Ağaç Ürünleri İmalatı' },
    { code: '17', name: 'Kağıt ve Kağıt Ürünleri İmalatı' },
    { code: '18', name: 'Basım ve Kayıt Hizmetleri' },
    { code: '20', name: 'Kimyasal Madde ve Ürünlerin İmalatı' },
    { code: '21', name: 'Temel Eczacılık Ürünleri İmalatı' },
    { code: '22', name: 'Kauçuk ve Plastik Ürünleri İmalatı' },
    { code: '23', name: 'Diğer Metalik Olmayan Mineral Ürünlerin İmalatı' },
    { code: '24', name: 'Ana Metal Sanayi' },
    { code: '25', name: 'Fabrikasyon Metal Ürünleri İmalatı' },
    { code: '26', name: 'Bilgisayar, Elektronik ve Optik Ürünlerin İmalatı' },
    { code: '27', name: 'Elektrikli Teçhizat İmalatı' },
    { code: '28', name: 'Başka Yerde Sınıflandırılmamış Makine ve Ekipman İmalatı' },
    { code: '29', name: 'Motorlu Kara Taşıtları İmalatı' },
    { code: '30', name: 'Diğer Ulaşım Araçları İmalatı' },
    { code: '31', name: 'Mobilya İmalatı' },
    { code: '32', name: 'Diğer İmalatlar' }
  ], [])

  const zoneTypeOptions = [
    'OSB', 'Serbest Bölge', 'Teknopark', 'Endüstri Bölgesi', 'Şehir Merkezi', 'Diğer'
  ]

  // Dosya seçimi ve validation
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    
    const newFiles: UploadFile[] = selectedFiles.map((file, index) => {
      let error: string | undefined
      
      // Dosya boyutu kontrolü
      if (file.size > MAX_FILE_SIZE_BYTES) {
        error = 'Dosya boyutu 25MB\'yi aşamaz'
      }
      
      // MIME type kontrolü
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        error = 'İzin verilmeyen dosya türü'
      }
      
      return {
        file,
        progress: 0,
        status: error ? 'error' : 'pending',
        error,
        id: `upload_${Date.now()}_${index}`
      }
    })
    
    setFiles(prev => [...prev, ...newFiles])
    event.target.value = '' // Reset input
  }, [])

  // Dosya kaldırma
  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }, [])

  // Form validation
  const isFormValid = useMemo(() => {
    return files.some(f => f.status !== 'error') &&
           formData.description.trim().length > 0 &&
           formData.category.length > 0
  }, [files, formData])

  // Upload işlemi
  const handleUpload = useCallback(async () => {
    if (!isFormValid) return
    
    setUploading(true)
    
    const authToken = localStorage.getItem('authToken')
    if (!authToken) {
      alert('Oturum süresi dolmuş')
      return
    }
    
    try {
      for (const fileItem of files) {
        if (fileItem.status === 'error' || fileItem.status === 'completed') continue
        
        // Progress güncelle
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id ? { ...f, status: 'uploading', progress: 0 } : f
        ))
        
        // 1. Presigned URL al
        const presignRes = await fetch('/api/kpi-evidence/presign', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            fileName: fileItem.file.name,
            fileType: fileItem.file.type,
            kpiId,
            period,
            factoryId
          })
        })
        
        if (!presignRes.ok) {
          throw new Error('Presigned URL alınamadı')
        }
        
        const { url, fileKey } = await presignRes.json()
        
        // 2. S3'e yükle
        const uploadRes = await fetch(url, {
          method: 'PUT',
          body: fileItem.file,
          headers: {
            'Content-Type': fileItem.file.type
          }
        })
        
        if (!uploadRes.ok) {
          throw new Error('Dosya yüklenemedi')
        }
        
        // 3. Database'e kaydet
        const evidenceRes = await fetch('/api/kpi-evidence', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            kpiId,
            factoryId,
            period,
            fileName: fileItem.file.name,
            fileType: fileItem.file.type,
            fileSize: fileItem.file.size,
            fileUrl: url.split('?')[0], // Query params'ı kaldır
            fileKey,
            description: formData.description,
            category: formData.category,
            // Sektörel veri alanları
            firmIdHash: formData.firmIdHash || null,
            nace2d: formData.nace2d || null,
            nace4d: formData.nace4d || null,
            province: formData.province || null,
            zoneType: formData.zoneType || null,
            employees: formData.employees,
            revenue: formData.revenue,
            hasExport: formData.hasExport,
            meta: {
              uploadSource: 'evidence_panel',
              kpiNumber,
              kpiDescription: kpiDescription.substring(0, 100)
            }
          })
        })
        
        if (!evidenceRes.ok) {
          throw new Error('Database kaydı başarısız')
        }
        
        // Progress tamamlandı
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id ? { ...f, status: 'completed', progress: 100 } : f
        ))
      }
      
      // Başarılı upload sonrası
      setTimeout(() => {
        setFiles([])
        setFormData({
          description: '',
          category: 'REPORT',
          firmIdHash: '',
          nace2d: '',
          nace4d: '',
          province: '',
          zoneType: 'OSB',
          employees: null,
          revenue: null,
          hasExport: false
        })
        setIsOpen(false)
        onUploadComplete()
      }, 1000)
      
    } catch (error) {
      console.error('Upload error:', error)
      alert('Yükleme sırasında hata: ' + error)
    } finally {
      setUploading(false)
    }
  }, [files, formData, isFormValid, kpiId, factoryId, period, kpiNumber, kpiDescription, onUploadComplete])

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
      >
        <Upload className="h-4 w-4" />
        Kanıt Ekle
      </button>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-lg">
          <span>KPI {kpiNumber} Kanıt Yükleme</span>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </CardTitle>
        <p className="text-sm text-gray-600">{kpiDescription}</p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Dosya Seçimi */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Dosya Seçimi
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 mb-2">
              Dosyaları seçin veya sürükle-bırak yapın
            </p>
            <input
              type="file"
              multiple
              accept={ALLOWED_MIME_TYPES.join(',')}
              onChange={handleFileSelect}
              className="hidden"
              id="file-input"
            />
            <label
              htmlFor="file-input"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
            >
              Dosya Seç
            </label>
            <p className="text-xs text-gray-500 mt-2">
              Desteklenen formatlar: PDF, Excel, Word, CSV, JPG, PNG • Max 25MB
            </p>
          </div>
        </div>

        {/* Seçilen Dosyalar */}
        {files.length > 0 && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Seçilen Dosyalar
            </label>
            {files.map(fileItem => (
              <div key={fileItem.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <File className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">{fileItem.file.name}</p>
                    <p className="text-xs text-gray-500">
                      {Math.round(fileItem.file.size / 1024)} KB
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {fileItem.status === 'error' && (
                    <AlertCircle className="h-4 w-4 text-red-500" title={fileItem.error} />
                  )}
                  {fileItem.status === 'completed' && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  {fileItem.status === 'uploading' && (
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${fileItem.progress}%` }}
                      />
                    </div>
                  )}
                  <button
                    onClick={() => removeFile(fileItem.id)}
                    className="text-gray-400 hover:text-red-500"
                    disabled={fileItem.status === 'uploading'}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Form Alanları */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Açıklama */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kanıt Açıklaması *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Bu kanıtın KPI ile ilişkisini ve içeriğini açıklayın..."
            />
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kanıt Kategorisi *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {EVIDENCE_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* NACE 2D */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sektör (NACE 2D)
            </label>
            <select
              value={formData.nace2d}
              onChange={(e) => setFormData(prev => ({ ...prev, nace2d: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seçiniz</option>
              {naceOptions.map(option => (
                <option key={option.code} value={option.code}>{option.code} - {option.name}</option>
              ))}
            </select>
          </div>

          {/* NACE 4D */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alt Sektör (NACE 4D)
            </label>
            <input
              type="text"
              value={formData.nace4d}
              onChange={(e) => setFormData(prev => ({ ...prev, nace4d: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="örn: 25.62"
            />
          </div>

          {/* İl */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              İl
            </label>
            <input
              type="text"
              value={formData.province}
              onChange={(e) => setFormData(prev => ({ ...prev, province: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="örn: Ankara"
            />
          </div>

          {/* Bölge Türü */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bölge Türü
            </label>
            <select
              value={formData.zoneType}
              onChange={(e) => setFormData(prev => ({ ...prev, zoneType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {zoneTypeOptions.map(zone => (
                <option key={zone} value={zone}>{zone}</option>
              ))}
            </select>
          </div>

          {/* Çalışan Sayısı */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Çalışan Sayısı
            </label>
            <input
              type="number"
              value={formData.employees || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, employees: e.target.value ? Number(e.target.value) : null }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="örn: 150"
            />
          </div>

          {/* Ciro */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Yıllık Ciro (TL)
            </label>
            <input
              type="number"
              value={formData.revenue || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, revenue: e.target.value ? Number(e.target.value) : null }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="örn: 5000000"
            />
          </div>

          {/* İhracat */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasExport"
              checked={formData.hasExport}
              onChange={(e) => setFormData(prev => ({ ...prev, hasExport: e.target.checked }))}
              className="mr-2"
            />
            <label htmlFor="hasExport" className="text-sm text-gray-700">
              İhracat yapıyor
            </label>
          </div>
        </div>

        {/* Upload Butonu */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            İptal
          </button>
          <button
            onClick={handleUpload}
            disabled={!isFormValid || uploading}
            className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Yükleniyor...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Kanıt Yükle
              </>
            )}
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
