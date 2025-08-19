// Evidence dosyalarının KPI türüne uygunluk validation sistemi

export interface EvidenceValidationRule {
  kpiType: string
  shCodes: string[]
  allowedFileTypes: string[]
  requiredFileNamePatterns: RegExp[]
  forbiddenFileNamePatterns: RegExp[]
  expectedFileSize: {
    min: number // bytes
    max: number // bytes
  }
  semanticValidation: {
    mustHaveKeywords: string[]
    shouldNotHaveKeywords: string[]
  }
}

export const EVIDENCE_VALIDATION_RULES: EvidenceValidationRule[] = [
  // Eğitim/Farkındalık KPI'ları
  {
    kpiType: 'training_education',
    shCodes: ['SH1.1', 'SH1.2'],
    allowedFileTypes: ['csv', 'xlsx', 'pdf'],
    requiredFileNamePatterns: [
      /anket|survey|egitim|training|katilim|participation/i,
      /on_|son_|pre_|post_|before_|after_/i
    ],
    forbiddenFileNamePatterns: [
      /dummy|test|sample|ornək/i,
      /gelir|revenue|financial|mali/i
    ],
    expectedFileSize: {
      min: 1024, // 1KB
      max: 25 * 1024 * 1024 // 25MB
    },
    semanticValidation: {
      mustHaveKeywords: ['eğitim', 'anket', 'katılım', 'farkındalık', 'training'],
      shouldNotHaveKeywords: ['oee', 'gelir', 'kâr', 'financial']
    }
  },

  // Proje Bazlı KPI'lar
  {
    kpiType: 'project_based',
    shCodes: ['SH1.3', 'SH1.4', 'SH1.5', 'SH1.6'],
    allowedFileTypes: ['pdf', 'xlsx', 'csv', 'docx'],
    requiredFileNamePatterns: [
      /proje|project|yonlendirme|guidance|destek|support/i,
      /kosgeb|tubitak|ab_|eu_|hibe|grant/i
    ],
    forbiddenFileNamePatterns: [
      /dummy|test|sample/i,
      /anket|survey/i
    ],
    expectedFileSize: {
      min: 10240, // 10KB
      max: 100 * 1024 * 1024 // 100MB
    },
    semanticValidation: {
      mustHaveKeywords: ['proje', 'destek', 'yönlendirme', 'sürdürülebilirlik'],
      shouldNotHaveKeywords: ['anket', 'eğitim', 'oee']
    }
  },

  // Finansal KPI'lar
  {
    kpiType: 'financial',
    shCodes: ['SH2.1', 'SH2.2', 'SH2.3', 'SH2.4', 'SH2.5'],
    allowedFileTypes: ['xlsx', 'pdf', 'csv'],
    requiredFileNamePatterns: [
      /gelir|revenue|kar|profit|butce|budget|mali|financial/i,
      /tablo|table|rapor|report|fatura|invoice/i
    ],
    forbiddenFileNamePatterns: [
      /dummy|test|sample/i,
      /anket|survey|egitim|training/i
    ],
    expectedFileSize: {
      min: 5120, // 5KB
      max: 50 * 1024 * 1024 // 50MB
    },
    semanticValidation: {
      mustHaveKeywords: ['gelir', 'kâr', 'bütçe', 'finansal', 'mali'],
      shouldNotHaveKeywords: ['anket', 'eğitim', 'oee', 'farkındalık']
    }
  },

  // Operasyonel KPI'lar
  {
    kpiType: 'operational',
    shCodes: ['SH3.1', 'SH3.2', 'SH3.3', 'SH3.4', 'SH3.5', 'SH3.6', 'SH3.7', 'SH3.8'],
    allowedFileTypes: ['csv', 'json', 'xlsx', 'pdf'],
    requiredFileNamePatterns: [
      /oee|mes|scada|performans|performance|verimlilik|efficiency/i,
      /durus|downtime|vardiya|shift|makine|machine/i
    ],
    forbiddenFileNamePatterns: [
      /dummy|test|sample/i,
      /anket|survey|gelir|revenue/i
    ],
    expectedFileSize: {
      min: 2048, // 2KB
      max: 500 * 1024 * 1024 // 500MB (büyük log dosyaları)
    },
    semanticValidation: {
      mustHaveKeywords: ['oee', 'performans', 'verimlilik', 'operasyonel'],
      shouldNotHaveKeywords: ['anket', 'gelir', 'farkındalık']
    }
  },

  // Paydaş Etkisi KPI'ları
  {
    kpiType: 'outreach',
    shCodes: ['SH4.1', 'SH4.2', 'SH4.3', 'SH4.4', 'SH4.5', 'SH4.6', 'SH4.7', 'SH4.8'],
    allowedFileTypes: ['pdf', 'xlsx', 'csv', 'zip'],
    requiredFileNamePatterns: [
      /paydas|stakeholder|marka|brand|isbirligi|cooperation/i,
      /tavsiye|recommendation|memnuniyet|satisfaction/i
    ],
    forbiddenFileNamePatterns: [
      /dummy|test|sample/i,
      /gelir|revenue|oee|makine/i
    ],
    expectedFileSize: {
      min: 1024, // 1KB
      max: 200 * 1024 * 1024 // 200MB
    },
    semanticValidation: {
      mustHaveKeywords: ['paydaş', 'marka', 'işbirliği', 'memnuniyet'],
      shouldNotHaveKeywords: ['oee', 'gelir', 'makine']
    }
  }
]

export interface ValidationResult {
  isValid: boolean
  score: number // 0-100
  errors: string[]
  warnings: string[]
  suggestions: string[]
}

export function validateEvidence(
  fileName: string,
  fileType: string,
  fileSize: number,
  shCode: string,
  description?: string
): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    score: 100,
    errors: [],
    warnings: [],
    suggestions: []
  }

  // SH kodundan KPI türünü belirle
  const kpiType = determineKPIType(shCode)
  const rule = EVIDENCE_VALIDATION_RULES.find(r => r.kpiType === kpiType)

  if (!rule) {
    result.errors.push(`Bilinmeyen KPI türü: ${kpiType}`)
    result.isValid = false
    result.score = 0
    return result
  }

  // Dosya türü kontrolü
  const fileExt = fileType.toLowerCase()
  if (!rule.allowedFileTypes.includes(fileExt)) {
    result.errors.push(`${kpiType} KPI'ları için ${fileExt} dosya türü uygun değil. İzin verilen: ${rule.allowedFileTypes.join(', ')}`)
    result.score -= 30
  }

  // Dosya boyutu kontrolü
  if (fileSize < rule.expectedFileSize.min) {
    result.warnings.push(`Dosya boyutu çok küçük (${fileSize} bytes < ${rule.expectedFileSize.min} bytes)`)
    result.score -= 10
  }
  if (fileSize > rule.expectedFileSize.max) {
    result.errors.push(`Dosya boyutu çok büyük (${fileSize} bytes > ${rule.expectedFileSize.max} bytes)`)
    result.score -= 20
  }

  // Dosya adı pattern kontrolü
  const fileName_lower = fileName.toLowerCase()
  const hasRequiredPattern = rule.requiredFileNamePatterns.some(pattern => pattern.test(fileName_lower))
  if (!hasRequiredPattern) {
    result.warnings.push(`Dosya adı ${kpiType} KPI'sı için tipik pattern içermiyor`)
    result.score -= 15
  }

  const hasForbiddenPattern = rule.forbiddenFileNamePatterns.some(pattern => pattern.test(fileName_lower))
  if (hasForbiddenPattern) {
    result.errors.push(`Dosya adı ${kpiType} KPI'sı için uygunsuz kelimeler içeriyor`)
    result.score -= 25
  }

  // Semantik validasyon
  const text = `${fileName} ${description || ''}`.toLowerCase()
  const hasMustHaveKeywords = rule.semanticValidation.mustHaveKeywords.some(keyword => 
    text.includes(keyword.toLowerCase())
  )
  if (!hasMustHaveKeywords) {
    result.warnings.push(`İçerik ${kpiType} KPI'sı için beklenen anahtar kelimeleri içermiyor`)
    result.score -= 10
  }

  const hasShouldNotHaveKeywords = rule.semanticValidation.shouldNotHaveKeywords.some(keyword => 
    text.includes(keyword.toLowerCase())
  )
  if (hasShouldNotHaveKeywords) {
    result.warnings.push(`İçerik ${kpiType} KPI'sı için uygunsuz anahtar kelimeler içeriyor`)
    result.score -= 15
  }

  // Öneriler
  if (result.score < 70) {
    result.suggestions.push(`${kpiType} KPI'sı için daha uygun dosya adı kullanın`)
    result.suggestions.push(`Dosya içeriğinin KPI türüyle uyumlu olduğundan emin olun`)
  }

  // Dummy dosya kontrolü
  if (fileName_lower.includes('dummy') || fileName_lower.includes('test') || fileName_lower.includes('sample')) {
    result.errors.push('Placeholder/dummy dosyalar kabul edilmez')
    result.score = Math.min(result.score, 20)
  }

  // Final validation
  if (result.score < 70) {
    result.isValid = false
  }

  return result
}

function determineKPIType(shCode: string): string {
  if (shCode.startsWith('SH1.1') || shCode.startsWith('SH1.2')) {
    return 'training_education'
  }
  if (shCode.startsWith('SH1.3') || shCode.startsWith('SH1.4') || shCode.startsWith('SH1.5') || shCode.startsWith('SH1.6')) {
    return 'project_based'
  }
  if (shCode.startsWith('SH2')) {
    return 'financial'
  }
  if (shCode.startsWith('SH3')) {
    return 'operational'
  }
  if (shCode.startsWith('SH4')) {
    return 'outreach'
  }
  return 'unknown'
}

export function getValidationSuggestions(kpiType: string): string[] {
  const rule = EVIDENCE_VALIDATION_RULES.find(r => r.kpiType === kpiType)
  if (!rule) return []

  return [
    `Dosya türü: ${rule.allowedFileTypes.join(', ')} kullanın`,
    `Dosya adında şu kelimeler bulunmalı: ${rule.semanticValidation.mustHaveKeywords.join(', ')}`,
    `Dosya boyutu: ${rule.expectedFileSize.min} - ${rule.expectedFileSize.max} bytes arasında olmalı`,
    `Şu kelimeleri kullanmayın: ${rule.semanticValidation.shouldNotHaveKeywords.join(', ')}`
  ]
}
