// AI ile dosya içeriğinden NACE kodu çıkarma sistemi

export interface NACEExtractionResult {
  nace4d?: string
  nace2d?: string
  confidence: number // 0-1
  sector: string
  reasoning: string
  extractedFrom: 'filename' | 'content' | 'metadata' | 'inference'
}

// NACE kod mapping (en yaygın kodlar)
const NACE_MAPPING: { [key: string]: { nace4d: string, nace2d: string, sector: string } } = {
  // Gıda sektörü
  'gıda': { nace4d: '1089', nace2d: '10', sector: 'Gıda' },
  'food': { nace4d: '1089', nace2d: '10', sector: 'Gıda' },
  'et': { nace4d: '1011', nace2d: '10', sector: 'Gıda' },
  'süt': { nace4d: '1051', nace2d: '10', sector: 'Gıda' },
  'ekmek': { nace4d: '1071', nace2d: '10', sector: 'Gıda' },
  'içecek': { nace4d: '1107', nace2d: '11', sector: 'Gıda' },
  
  // Tekstil sektörü
  'tekstil': { nace4d: '1391', nace2d: '13', sector: 'Tekstil' },
  'textile': { nace4d: '1391', nace2d: '13', sector: 'Tekstil' },
  'iplik': { nace4d: '1310', nace2d: '13', sector: 'Tekstil' },
  'kumaş': { nace4d: '1320', nace2d: '13', sector: 'Tekstil' },
  'dokuma': { nace4d: '1320', nace2d: '13', sector: 'Tekstil' },
  'giyim': { nace4d: '1413', nace2d: '14', sector: 'Giyim' },
  
  // Metal sektörü
  'metal': { nace4d: '2420', nace2d: '24', sector: 'Metal' },
  'çelik': { nace4d: '2410', nace2d: '24', sector: 'Metal' },
  'steel': { nace4d: '2410', nace2d: '24', sector: 'Metal' },
  'demir': { nace4d: '2410', nace2d: '24', sector: 'Metal' },
  'alüminyum': { nace4d: '2442', nace2d: '24', sector: 'Metal' },
  'bakır': { nace4d: '2444', nace2d: '24', sector: 'Metal' },
  'döküm': { nace4d: '2451', nace2d: '24', sector: 'Metal' },
  
  // Makine sektörü
  'makine': { nace4d: '2829', nace2d: '28', sector: 'Makine' },
  'machine': { nace4d: '2829', nace2d: '28', sector: 'Makine' },
  'motor': { nace4d: '2811', nace2d: '28', sector: 'Makine' },
  'pompa': { nace4d: '2813', nace2d: '28', sector: 'Makine' },
  'kompresör': { nace4d: '2813', nace2d: '28', sector: 'Makine' },
  
  // Otomotiv sektörü
  'otomotiv': { nace4d: '2910', nace2d: '29', sector: 'Otomotiv' },
  'automotive': { nace4d: '2910', nace2d: '29', sector: 'Otomotiv' },
  'araç': { nace4d: '2910', nace2d: '29', sector: 'Otomotiv' },
  'motor': { nace4d: '2910', nace2d: '29', sector: 'Otomotiv' },
  'lastik': { nace4d: '2211', nace2d: '22', sector: 'Otomotiv' },
  
  // Kimya sektörü
  'kimya': { nace4d: '2059', nace2d: '20', sector: 'Kimya' },
  'chemical': { nace4d: '2059', nace2d: '20', sector: 'Kimya' },
  'boya': { nace4d: '2030', nace2d: '20', sector: 'Kimya' },
  'plastic': { nace4d: '2229', nace2d: '22', sector: 'Plastik' },
  'plastik': { nace4d: '2229', nace2d: '22', sector: 'Plastik' },
  
  // Elektrik-Elektronik
  'elektrik': { nace4d: '2711', nace2d: '27', sector: 'Elektrikli' },
  'electronic': { nace4d: '2611', nace2d: '26', sector: 'Elektrikli' },
  'kablo': { nace4d: '2732', nace2d: '27', sector: 'Elektrikli' },
  
  // Mobilya
  'mobilya': { nace4d: '3109', nace2d: '31', sector: 'Mobilya' },
  'furniture': { nace4d: '3109', nace2d: '31', sector: 'Mobilya' },
  'ahşap': { nace4d: '1629', nace2d: '16', sector: 'Mobilya' },
  'wood': { nace4d: '1629', nace2d: '16', sector: 'Mobilya' }
}

// İl kodları ile NACE ilişkisi (sanayi yoğunluğu)
const PROVINCE_SECTOR_TENDENCY: { [province: string]: string[] } = {
  'ISTANBUL': ['Tekstil', 'Kimya', 'Elektrikli', 'Gıda'],
  'ANKARA': ['Makine', 'Elektrikli', 'Metal'],
  'IZMIR': ['Gıda', 'Kimya', 'Tekstil', 'Metal'],
  'BURSA': ['Otomotiv', 'Tekstil', 'Makine'],
  'KAYSERI': ['Mobilya', 'Metal', 'Tekstil', 'Makine'],
  'GAZIANTEP': ['Gıda', 'Makine', 'Tekstil'],
  'KONYA': ['Gıda', 'Makine', 'Metal'],
  'KOCAELI': ['Otomotiv', 'Kimya', 'Metal'],
  'ADANA': ['Gıda', 'Tekstil'],
  'MERSIN': ['Gıda', 'Kimya'],
  'DENIZLI': ['Tekstil', 'Kimya'],
  'ESKISEHIR': ['Makine', 'Elektrikli'],
  'SAKARYA': ['Otomotiv', 'Metal'],
  'MANISA': ['Gıda', 'Elektrikli']
}

export function extractNACEFromFilename(fileName: string, province?: string): NACEExtractionResult {
  const cleanFileName = fileName.toLowerCase()
    .replace(/[0-9\-_\.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  let bestMatch: NACEExtractionResult = {
    confidence: 0,
    sector: 'Diğer',
    reasoning: 'Dosya adından sektör belirlenemedi',
    extractedFrom: 'filename'
  }

  // Direct NACE kod arama (sadece NACE pattern'ları, yıl değil)
  const naceMatch = fileName.match(/(?:nace[_\s]*)?(\d{4})(?![_\s]*\d{4})/gi)
  if (naceMatch && !fileName.match(/20\d{2}/)) { // Yıl formatını hariç tut
    const nace4d = naceMatch[0].replace(/nace[_\s]*/gi, '')
    const nace2d = nace4d.substring(0, 2)
    const sector = mapNACEToSector(nace2d)
    
    // NACE kodu geçerli mi kontrol et
    const naceCode = parseInt(nace2d)
    if (naceCode >= 10 && naceCode <= 99) {
      return {
        nace4d,
        nace2d,
        confidence: 0.95,
        sector,
        reasoning: `Dosya adında doğrudan NACE kodu bulundu: ${nace4d}`,
        extractedFrom: 'filename'
      }
    }
  }

  // Anahtar kelime araması (daha spesifik kelimeler öncelikli)
  const keywordMatches: Array<{keyword: string, naceInfo: any, confidence: number}> = []
  
  Object.entries(NACE_MAPPING).forEach(([keyword, naceInfo]) => {
    if (cleanFileName.includes(keyword)) {
      let confidence = keyword.length > 5 ? 0.8 : keyword.length > 3 ? 0.7 : 0.6
      
      // Spesifik kelimeler için bonus
      if (['plastik', 'tekstil', 'otomotiv', 'makine'].includes(keyword)) {
        confidence += 0.1
      }
      
      keywordMatches.push({ keyword, naceInfo, confidence })
    }
  })
  
  // En yüksek confidence'ı seç
  keywordMatches.sort((a, b) => b.confidence - a.confidence)
  if (keywordMatches.length > 0) {
    const best = keywordMatches[0]
    bestMatch = {
      nace4d: best.naceInfo.nace4d,
      nace2d: best.naceInfo.nace2d,
      confidence: best.confidence,
      sector: best.naceInfo.sector,
      reasoning: `"${best.keyword}" anahtar kelimesinden ${best.naceInfo.sector} sektörü belirlendi`,
      extractedFrom: 'filename'
    }
  }

  // İl bazında sektör eğilimi
  if (province && bestMatch.confidence < 0.5) {
    const provinceTendencies = PROVINCE_SECTOR_TENDENCY[province.toUpperCase()]
    if (provinceTendencies && provinceTendencies.length > 0) {
      const defaultSector = provinceTendencies[0]
      const naceInfo = Object.values(NACE_MAPPING).find(n => n.sector === defaultSector)
      
      if (naceInfo) {
        bestMatch = {
          nace4d: naceInfo.nace4d,
          nace2d: naceInfo.nace2d,
          confidence: 0.3,
          sector: defaultSector,
          reasoning: `${province} ili için tipik sektör: ${defaultSector}`,
          extractedFrom: 'inference'
        }
      }
    }
  }

  return bestMatch
}

export function extractNACEFromContent(
  content: string, 
  fileName: string,
  province?: string
): NACEExtractionResult {
  // İçerik analizi için OpenAI benzeri işlem
  // Şu anda basit keyword matching
  const cleanContent = content.toLowerCase().substring(0, 2000) // İlk 2000 karakter
  
  let bestMatch = extractNACEFromFilename(fileName, province)
  
  // İçerikten sektör kelimeleri arama
  Object.entries(NACE_MAPPING).forEach(([keyword, naceInfo]) => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
    const matches = cleanContent.match(regex)
    
    if (matches && matches.length > 0) {
      const frequency = matches.length
      const confidence = Math.min(0.9, 0.5 + (frequency * 0.1)) // Frekansa göre güven
      
      if (confidence > bestMatch.confidence) {
        bestMatch = {
          nace4d: naceInfo.nace4d,
          nace2d: naceInfo.nace2d,
          confidence,
          sector: naceInfo.sector,
          reasoning: `İçerikte "${keyword}" ${frequency} kez geçti, ${naceInfo.sector} sektörü belirlendi`,
          extractedFrom: 'content'
        }
      }
    }
  })

  return bestMatch
}

// OpenAI ile gelişmiş NACE çıkarma (opsiyonel)
export async function extractNACEWithAI(
  fileName: string,
  content: string,
  province?: string
): Promise<NACEExtractionResult> {
  // OpenAI API mevcutsa kullan
  if (process.env.OPENAI_API_KEY) {
    try {
      const prompt = `
Dosya Adı: ${fileName}
İçerik Özeti: ${content.substring(0, 500)}
İl: ${province || 'Bilinmeyor'}

Bu dosyadan hangi NACE sektörü çıkarılabilir? 
Türkiye NACE kodları kullanarak 4 haneli NACE kodu öner.
Yanıt JSON formatında: {"nace4d": "XXXX", "sector": "Sektör Adı", "confidence": 0.8, "reasoning": "açıklama"}
`

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 200,
          temperature: 0.1
        })
      })

      if (response.ok) {
        const data = await response.json()
        const aiResult = JSON.parse(data.choices[0].message.content)
        
        return {
          nace4d: aiResult.nace4d,
          nace2d: aiResult.nace4d.substring(0, 2),
          confidence: aiResult.confidence,
          sector: aiResult.sector,
          reasoning: `AI: ${aiResult.reasoning}`,
          extractedFrom: 'content'
        }
      }
    } catch (error) {
      console.warn('OpenAI NACE extraction failed:', error)
    }
  }

  // Fallback: rule-based extraction
  return extractNACEFromContent(content, fileName, province)
}

function mapNACEToSector(nace2d: string): string {
  const code = parseInt(nace2d)
  const sectorMap: { [key: number]: string } = {
    10: 'Gıda', 11: 'Gıda', 12: 'Gıda',
    13: 'Tekstil', 14: 'Giyim', 15: 'Giyim',
    16: 'Mobilya', 17: 'Mobilya', 18: 'Mobilya',
    20: 'Kimya', 21: 'Kimya', 22: 'Plastik',
    24: 'Metal', 25: 'Metal',
    26: 'Bilgisayar', 27: 'Elektrikli', 28: 'Makine',
    29: 'Otomotiv', 30: 'Otomotiv',
    31: 'Mobilya', 32: 'Diğer'
  }
  
  return sectorMap[code] || 'Diğer'
}

// Batch processing için utility
export function processBatchNACEExtraction(
  files: Array<{fileName: string, content?: string, province?: string}>
): Array<NACEExtractionResult & {fileName: string}> {
  return files.map(file => ({
    fileName: file.fileName,
    ...extractNACEFromFilename(file.fileName, file.province)
  }))
}
