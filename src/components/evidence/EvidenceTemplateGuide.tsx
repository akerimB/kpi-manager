'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  FileText, Download, Info, CheckCircle, AlertCircle, 
  HelpCircle, Lightbulb, Target, FileX 
} from 'lucide-react'
import { getCoreEvidenceTemplate, generateEvidenceFileName } from '@/lib/evidence-templates-core'

interface EvidenceTemplateGuideProps {
  kpiNumber: number
  kpiDescription: string
  period: string
}

export default function EvidenceTemplateGuide({ 
  kpiNumber, 
  kpiDescription, 
  period 
}: EvidenceTemplateGuideProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const template = getCoreEvidenceTemplate(kpiNumber)
  
  if (!template) {
    return (
      <Card className="mb-4 border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-gray-600">
            <Info className="h-4 w-4" />
            <span className="text-sm">Bu KPI için özel kanıt rehberi henüz hazırlanmamış.</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const requiredEvidences = template.requiredEvidences.filter(e => e.type === 'required')
  const recommendedEvidences = template.requiredEvidences.filter(e => e.type === 'recommended')
  const optionalEvidences = template.requiredEvidences.filter(e => e.type === 'optional')

  return (
    <Card className="mb-4 border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            <span className="text-blue-900">KPI {kpiNumber} Kanıt Rehberi</span>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-600 hover:text-blue-800"
          >
            {isExpanded ? <FileX className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
          </button>
        </CardTitle>
        <p className="text-sm text-blue-800">{template.shCode} - {template.kpiTitle}</p>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Özet İstatistikler */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="text-lg font-bold text-red-600">{requiredEvidences.length}</div>
              <div className="text-xs text-red-800">Zorunlu</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-lg font-bold text-yellow-600">{recommendedEvidences.length}</div>
              <div className="text-xs text-yellow-800">Önerilen</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="text-lg font-bold text-green-600">{optionalEvidences.length}</div>
              <div className="text-xs text-green-800">İsteğe Bağlı</div>
            </div>
          </div>

          {/* Zorunlu Kanıtlar */}
          {requiredEvidences.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-red-900 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Zorunlu Kanıtlar
              </h4>
              {requiredEvidences.map((evidence, idx) => (
                <div key={idx} className="p-3 bg-white rounded-lg border border-red-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900 mb-1">
                        {evidence.fileName}
                      </h5>
                      <p className="text-sm text-gray-600 mb-2">
                        {evidence.description}
                      </p>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                          {evidence.category}
                        </span>
                        <span className="text-gray-500">
                          Formatlar: {evidence.fileType.join(', ')}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const fileName = generateEvidenceFileName(
                          template.shCode,
                          evidence.fileName.replace(`${template.shCode}_`, ''),
                          period,
                          evidence.fileType[0].toLowerCase()
                        )
                        navigator.clipboard.writeText(fileName)
                        alert(`Dosya adı kopyalandı: ${fileName}`)
                      }}
                      className="ml-3 p-2 text-gray-400 hover:text-blue-600"
                      title="Örnek dosya adını kopyala"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Önerilen Kanıtlar */}
          {recommendedEvidences.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-yellow-900 flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Önerilen Kanıtlar
              </h4>
              {recommendedEvidences.map((evidence, idx) => (
                <div key={idx} className="p-3 bg-white rounded-lg border border-yellow-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900 mb-1">
                        {evidence.fileName}
                      </h5>
                      <p className="text-sm text-gray-600 mb-2">
                        {evidence.description}
                      </p>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                          {evidence.category}
                        </span>
                        <span className="text-gray-500">
                          Formatlar: {evidence.fileType.join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* AI Analiz Yöntemleri */}
          <div className="space-y-2">
            <h4 className="font-medium text-purple-900 flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              AI Analiz Yöntemleri
            </h4>
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <ul className="space-y-1">
                {template.aiAnalysisMethods.map((method, idx) => (
                  <li key={idx} className="text-sm text-purple-800 flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    {method}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Validasyon Kuralları */}
          <div className="space-y-2">
            <h4 className="font-medium text-indigo-900 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Validasyon Kuralları
            </h4>
            <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
              <div className="space-y-2 text-sm text-indigo-800">
                <div>
                  <strong>Gerekli Alanlar:</strong> {template.validationRules.requiredFields.join(', ')}
                </div>
                <div>
                  <strong>Dosya Boyutu:</strong> {Math.round(template.validationRules.fileSize.min / 1024)}KB - {Math.round(template.validationRules.fileSize.max / (1024 * 1024))}MB
                </div>
                <div>
                  <strong>Zaman Çerçevesi:</strong> {template.validationRules.timeframe}
                </div>
              </div>
            </div>
          </div>

          {/* Örnek Dosya Adları */}
          <div className="space-y-2">
            <h4 className="font-medium text-green-900 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Örnek Dosya Adları
            </h4>
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="space-y-1">
                {template.sampleNaming.map((name, idx) => (
                  <div key={idx} className="text-sm text-green-800 font-mono bg-white px-2 py-1 rounded border">
                    {name}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 pt-3 border-t border-blue-200">
            <button
              onClick={() => {
                // Template download functionality burada implement edilecek
                alert('Template indirme özelliği geliştiriliyor...')
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-100"
            >
              <Download className="h-4 w-4" />
              Template İndir
            </button>
            <button
              onClick={() => {
                const allFileNames = template.sampleNaming.join('\n')
                navigator.clipboard.writeText(allFileNames)
                alert('Tüm örnek dosya adları kopyalandı!')
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100"
            >
              <FileText className="h-4 w-4" />
              Dosya Adlarını Kopyala
            </button>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
