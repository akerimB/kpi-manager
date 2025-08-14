import { PrismaClient } from '../src/generated/prisma'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

// CSV okuma fonksiyonu
function parseCSV(content: string): string[][] {
  const lines = content.trim().split('\n')
  return lines.map(line => {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  })
}

async function seedStrategicGoals() {
  console.log('🎯 Seeding Strategic Goals...')
  
  const strategicGoals = [
    { code: 'SA1', title: 'KOBİ Dönüşüm Etkisi' },
    { code: 'SA2', title: 'Finansal Sürdürülebilirlik' },
    { code: 'SA3', title: 'Kurumsal Kapasite & Operasyonel Mükemmellik' },
    { code: 'SA4', title: 'Paydaş İlişkileri & Marka Değeri' }
  ]

  for (const sg of strategicGoals) {
    console.log(`Creating strategic goal: ${sg.code}`)
    await prisma.strategicGoal.upsert({
      where: { code: sg.code },
      update: { title: sg.title },
      create: sg
    })
  }
}

async function seedStrategicTargets() {
  console.log('🎯 Seeding Strategic Targets...')
  
  try {
    const csvPath = path.join(process.cwd(), 'SA_to_SH_Mapping.csv')
    console.log('Reading from:', csvPath)
    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    const rows = parseCSV(csvContent)
    
    const dataRows = rows.slice(1)
    console.log(`Found ${dataRows.length} strategic targets`)
    
    for (const row of dataRows) {
      const [saCode, saTitle, shCode] = row
      console.log(`Processing: SA=${saCode}, SH=${shCode}`)
      
      if (!saCode || !shCode) {
        console.log('Skipping row due to missing data')
        continue
      }
      
      const strategicGoal = await prisma.strategicGoal.findUnique({
        where: { code: saCode }
      })
      
      if (strategicGoal) {
        console.log(`Found strategic goal ${saCode}, creating target ${shCode}`)
        await prisma.strategicTarget.upsert({
          where: { code: shCode },
          update: { strategicGoalId: strategicGoal.id },
          create: {
            code: shCode,
            strategicGoalId: strategicGoal.id
          }
        })
      } else {
        console.log(`Strategic goal ${saCode} not found`)
      }
    }
  } catch (error) {
    console.error('Error seeding strategic targets:', error)
  }
}

async function seedKPIs() {
  console.log('📊 Seeding KPIs...')
  
  try {
    const csvPath = path.join(process.cwd(), 'KPI_to_SH_Mapping.csv')
    console.log('Reading from:', csvPath)
    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    const rows = parseCSV(csvContent)
    
    const dataRows = rows.slice(1)
    console.log(`Found ${dataRows.length} KPIs`)
    
    for (const row of dataRows) {
      const [kpiNumber, shCode, description] = row
      console.log(`Processing KPI ${kpiNumber} for ${shCode}`)
      
      if (!kpiNumber || !shCode || !description) {
        console.log('Skipping KPI due to missing data')
        continue
      }
      
      const strategicTarget = await prisma.strategicTarget.findUnique({
        where: { code: shCode }
      })
      
      if (strategicTarget) {
        const themes = []
        const desc = description.toLowerCase()
        
        if (desc.includes('yalın') || desc.includes('lean')) themes.push('LEAN')
        if (desc.includes('dijital') || desc.includes('digital')) themes.push('DIGITAL')
        if (desc.includes('yeşil') || desc.includes('green') || desc.includes('karbon')) themes.push('GREEN')
        if (desc.includes('dirençli') || desc.includes('resilience')) themes.push('RESILIENCE')
        
        if (themes.length === 0) {
          if (shCode.startsWith('SH1')) themes.push('LEAN', 'DIGITAL', 'GREEN', 'RESILIENCE')
          else if (shCode.startsWith('SH2')) themes.push('LEAN')
          else if (shCode.startsWith('SH3')) themes.push('DIGITAL')
          else if (shCode.startsWith('SH4')) themes.push('RESILIENCE')
        }

        console.log(`Creating KPI ${kpiNumber} with themes: ${themes.join(', ')}`)
        await prisma.kpi.upsert({
          where: { number: parseInt(kpiNumber) },
          update: {
            description,
            themes: themes.join(','),
            strategicTargetId: strategicTarget.id
          },
          create: {
            number: parseInt(kpiNumber),
            description,
            themes: themes.join(','),
            strategicTargetId: strategicTarget.id
          }
        })
      } else {
        console.log(`Strategic target ${shCode} not found for KPI ${kpiNumber}`)
      }
    }
  } catch (error) {
    console.error('Error seeding KPIs:', error)
  }
}

async function seedPhases() {
  console.log('⏰ Seeding Phases...')
  
  const phases = [
    {
      name: 'Faz 1',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2026-12-31'),
      description: 'İlk uygulama fazı (2025-2026)'
    },
    {
      name: 'Faz 2',
      startDate: new Date('2027-01-01'),
      endDate: new Date('2028-12-31'),
      description: 'İkinci uygulama fazı (2027-2028)'
    },
    {
      name: 'Faz 3',
      startDate: new Date('2029-01-01'),
      endDate: new Date('2030-12-31'),
      description: 'Üçüncü uygulama fazı (2029-2030)'
    },
    {
      name: 'Sürekli',
      description: 'Sürekli devam eden eylemler'
    }
  ]

  for (const phase of phases) {
    await prisma.phase.upsert({
      where: { name: phase.name },
      update: phase,
      create: phase
    })
  }
}

async function seedActions() {
  console.log('🎬 Seeding Actions...')
  
  try {
    // Eylem_Listesi.csv dosyasını okuma
    const csvPath = path.join(process.cwd(), 'Eylem_Listesi.csv')
    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    const rows = parseCSV(csvContent)
    
    // Header'ı atla
    const dataRows = rows.slice(1)
    
    for (const row of dataRows) {
      const [eCode, description, shCode] = row
      
      if (!eCode || !description || !shCode) continue
      
      // SH'yi bul
      const strategicTarget = await prisma.strategicTarget.findUnique({
        where: { code: shCode }
      })
      
      if (strategicTarget) {
        // Sorumlu birim çıkarma
        let responsibleUnit = null
        const responsibleMatch = description.match(/\(Ana Sorumlu: ([^)]+)\)/)
        if (responsibleMatch) {
          responsibleUnit = responsibleMatch[1]
        }
        
        // Öncelik belirleme
        let priority = 'MEDIUM'
        if (description.includes('kritik') || description.includes('acil')) priority = 'HIGH'
        if (description.includes('düşük öncelik')) priority = 'LOW'
        
        const upserted = await prisma.action.upsert({
          where: { code: eCode },
          update: {
            description,
            strategicTargetId: strategicTarget.id,
            responsibleUnit,
            priority: priority
          },
          create: {
            code: eCode,
            description,
            strategicTargetId: strategicTarget.id,
            responsibleUnit,
            priority: priority
          }
        })
        // Faz ataması (mantıksal)
        const phases = await prisma.phase.findMany()
        const byName = (name: string) => phases.find(p => (p.name || '').toLowerCase() === name.toLowerCase())
        const descLower = (description || '').toLowerCase()
        let phaseName: string | null = null
        // Açık faz ifadeleri önceliklidir
        if (descLower.includes('faz 1')) phaseName = 'Faz 1'
        else if (descLower.includes('faz 2')) phaseName = 'Faz 2'
        else if (descLower.includes('faz 3')) phaseName = 'Faz 3'
        else if (
          descLower.includes('sürekli') ||
          descLower.includes('periyodik') ||
          descLower.includes('düzenli') ||
          descLower.includes('devam') ||
          descLower.includes('sürekli iyileştirme')
        ) phaseName = 'Sürekli'
        // E koduna göre sezgisel atama
        if (!phaseName) {
          if (eCode.startsWith('E1.')) phaseName = 'Faz 1' // farkındalık/eğitim/başlatma
          else if (eCode.startsWith('E2.')) phaseName = 'Faz 2' // gelir/ürünleştirme/ticarileşme
          else if (eCode.startsWith('E3.')) phaseName = 'Faz 2' // kapasite/operasyonel yetkinlik
          else if (eCode.startsWith('E4.')) phaseName = 'Faz 3' // paydaş/marka/ileri işbirlikleri
        }
        const selectedPhase = phaseName ? byName(phaseName) : undefined
        await prisma.action.update({
          where: { id: upserted.id },
          data: {
            completionPercent: Math.round(Math.random() * 100),
            phaseId: selectedPhase ? selectedPhase.id : undefined
          }
        })
      }
    }
  } catch (error) {
    console.error('Error seeding actions:', error)
  }
}

async function seedModelFactories() {
  console.log('🏭 Seeding Model Factories...')
  
  const factories = [
    { code: 'MF01', name: 'İstanbul Model Fabrikası', city: 'İstanbul', region: 'Marmara' },
    { code: 'MF02', name: 'Ankara Model Fabrikası', city: 'Ankara', region: 'İç Anadolu' },
    { code: 'MF03', name: 'İzmir Model Fabrikası', city: 'İzmir', region: 'Ege' },
    { code: 'MF04', name: 'Bursa Model Fabrikası', city: 'Bursa', region: 'Marmara' },
    { code: 'MF05', name: 'Kayseri Model Fabrikası', city: 'Kayseri', region: 'İç Anadolu' },
    { code: 'MF06', name: 'Gaziantep Model Fabrikası', city: 'Gaziantep', region: 'Güneydoğu' },
    { code: 'MF07', name: 'Konya Model Fabrikası', city: 'Konya', region: 'İç Anadolu' },
    { code: 'MF08', name: 'Samsun Model Fabrikası', city: 'Samsun', region: 'Karadeniz' },
    { code: 'MF09', name: 'Antalya Model Fabrikası', city: 'Antalya', region: 'Akdeniz' },
    { code: 'MF10', name: 'Erzurum Model Fabrikası', city: 'Erzurum', region: 'Doğu Anadolu' }
  ]

  for (const factory of factories) {
    await prisma.modelFactory.upsert({
      where: { code: factory.code },
      update: factory,
      create: {
        ...factory,
        established: new Date('2024-01-01')
      }
    })
  }
}

// Her eylem için bütçe oluştur/güncelle
async function seedActionBudgets() {
  console.log('💰 Seeding Action Budgets...')
  const actions = await prisma.action.findMany()
  for (const action of actions) {
    const planned = Math.round(Math.random() * 2_000_000 + 200_000) // 200k - 2.2M
    const actual = Math.round(planned * (0.6 + Math.random() * 0.8)) // %60 - %140
    const capexOpex = Math.random() > 0.7 ? 'CAPEX' : 'OPEX'
    await prisma.actionBudget.upsert({
      where: { actionId: action.id },
      update: {
        plannedAmount: planned,
        actualAmount: actual,
        capexOpex,
        currency: 'TRY'
      },
      create: {
        actionId: action.id,
        plannedAmount: planned,
        actualAmount: actual,
        capexOpex,
        currency: 'TRY'
      }
    })
  }
}

async function seedUsers() {
  console.log('👥 Seeding Users...')
  
  // Fabrikaları al
  const factories = await prisma.modelFactory.findMany()
  
  // Kullanıcı örnekleri oluştur
  console.log('👥 Kullanıcı örnekleri oluşturuluyor...')
  
  // Model Fabrika Kullanıcıları
  const factoryUser1 = await prisma.user.upsert({
    where: { email: 'fabrika1@example.com' },
    update: {},
    create: {
      email: 'fabrika1@example.com',
      name: 'Fabrika 1 Kullanıcısı',
      role: 'MODEL_FACTORY',
      factoryId: factories[0].id,
      isActive: true,
      permissions: JSON.stringify({
        canViewAllFactories: false,
        canExportData: false,
        canManageActions: false,
        canViewAnalytics: false,
        canCreateSimulations: false
      })
    }
  })

  const factoryUser2 = await prisma.user.upsert({
    where: { email: 'fabrika2@example.com' },
    update: {},
    create: {
      email: 'fabrika2@example.com',
      name: 'Fabrika 2 Kullanıcısı',
      role: 'MODEL_FACTORY',
      factoryId: factories[1].id,
      isActive: true,
      permissions: JSON.stringify({
        canViewAllFactories: false,
        canExportData: false,
        canManageActions: false,
        canViewAnalytics: false,
        canCreateSimulations: false
      })
    }
  })

  // Üst Yönetim Kullanıcısı
  const upperManagement = await prisma.user.upsert({
    where: { email: 'yonetim@example.com' },
    update: {},
    create: {
      email: 'yonetim@example.com',
      name: 'Üst Yönetim Kullanıcısı',
      role: 'UPPER_MANAGEMENT',
      factoryId: null,
      isActive: true,
      permissions: JSON.stringify({
        canViewAllFactories: true,
        canExportData: true,
        canManageActions: true,
        canViewAnalytics: true,
        canCreateSimulations: true
      })
    }
  })

  // Admin Kullanıcısı
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Sistem Yöneticisi',
      role: 'ADMIN',
      factoryId: null,
      isActive: true,
      permissions: JSON.stringify({
        canViewAllFactories: true,
        canExportData: true,
        canManageActions: true,
        canViewAnalytics: true,
        canCreateSimulations: true
      })
    }
  })

  console.log(`✅ ${4} kullanıcı oluşturuldu`)
  console.log(`   - Model Fabrika Kullanıcıları: ${factoryUser1.name}, ${factoryUser2.name}`)
  console.log(`   - Üst Yönetim: ${upperManagement.name}`)
  console.log(`   - Admin: ${admin.name}`)
}

async function seedSampleKpiValues() {
  console.log('📈 Seeding Sample KPI Values...')
  
  const factories = await prisma.modelFactory.findMany()
  const kpis = await prisma.kpi.findMany()
  
  const periods = ['2023-Q4', '2024-Q1', '2024-Q2', '2024-Q3', '2024-Q4']
  
  for (const factory of factories) {
    for (const period of periods) {
      const [yearStr, quarterStr] = period.split('-Q')
      const year = parseInt(yearStr)
      const quarter = parseInt(quarterStr)
      
      for (const kpi of kpis) { // Tüm KPI'lar için veri
        const baseValue = Math.random() * 80 + 40 // 40-120 arası temel değer
        const randomVariation = (Math.random() - 0.5) * 20 // -10 ile +10 arası varyasyon
        const value = Math.max(0, baseValue + randomVariation)
        
        await prisma.kpiValue.upsert({
          where: {
            kpiId_factoryId_period: {
              kpiId: kpi.id,
              factoryId: factory.id,
              period
            }
          },
          update: {
            value
          },
          create: {
            value,
            period,
            year,
            quarter,
            kpiId: kpi.id,
            factoryId: factory.id,
            enteredAt: new Date()
          }
        })
      }
    }
  }
}

async function seedActionKpiRelationships() {
  console.log('🔗 Seeding Action-KPI Relationships...')
  
  // Yardımcı: anahtar kelime skorlaması
  const KEYWORDS: Array<{ terms: string[]; theme?: 'LEAN'|'DIGITAL'|'GREEN'|'RESILIENCE'; weight: number }>= [
    { terms: ['yalın', 'israf', 'verim', '5s', 'kaizen', 'standartlaş', 'sürekli iyileştirme'], theme: 'LEAN', weight: 2.0 },
    { terms: ['dijital', 'erp', 'crm', 'lms', 'otomasyon', 'platform', 'siber', 'veri', 'ar/vr', 'simülasyon', 'dijital ikiz'], theme: 'DIGITAL', weight: 2.0 },
    { terms: ['yeşil', 'enerji', 'karbon', 'çevre', 'sürdürülebil', 'emisyon'], theme: 'GREEN', weight: 2.0 },
    { terms: ['risk', 'güvenlik', 'direnç', 'kriz', 'acil', 'süreklilik'], theme: 'RESILIENCE', weight: 2.0 },
    { terms: ['eğitim', 'müfredat', 'sertifika', 'atölye', 'mentorluk', 'staj'], weight: 1.2 },
    { terms: ['pazarlama', 'fiyat', 'satış', 'gelir', 'müşteri', 'nps'], weight: 1.2 },
    { terms: ['işbirliği', 'üniversite', 'tez', 'yayın', 'konferans'], weight: 1.0 },
    { terms: ['bütçe', 'maliyet', 'finans', 'hibe', 'fon'], weight: 1.0 },
  ]

  const normalize = (s: string) => s.toLowerCase()

  const actions = await prisma.action.findMany({ include: { strategicTarget: true } })
  const kpis = await prisma.kpi.findMany({ include: { strategicTarget: true } })

  // CSV'den manuel KPI ipuçları (opsiyonel sütun: KPI_Hint)
  let actionCodeToKpiHint = new Map<string, string>()
  try {
    const eCsvPath = path.join(process.cwd(), 'Eylem_Listesi.csv')
    const eCsvContent = fs.readFileSync(eCsvPath, 'utf-8')
    const eRows = parseCSV(eCsvContent)
    if (eRows.length > 1) {
      const header = eRows[0].map(h => h.trim())
      const codeIdx = header.findIndex(h => ['E_code', 'E_CODE', 'ecode', 'ECode'].includes(h))
      const hintIdx = header.findIndex(h => ['KPI_Hint', 'KPI_HINT', 'kpi_hint', 'KPIHint'].includes(h))
      if (codeIdx >= 0 && hintIdx >= 0) {
        for (const row of eRows.slice(1)) {
          const code = (row[codeIdx] || '').trim()
          const hint = (row[hintIdx] || '').trim()
          if (code && hint) actionCodeToKpiHint.set(code, hint)
        }
      }
    }
  } catch (err) {
    // sütun yoksa sorun değil
  }

  for (const action of actions) {
    const actionText = normalize(action.description)
    const actionThemes: string[] = []
    if (action.strategicTarget.code.startsWith('SH1')) actionThemes.push('LEAN','DIGITAL','GREEN','RESILIENCE')
    if (action.strategicTarget.code.startsWith('SH2')) actionThemes.push('LEAN')
    if (action.strategicTarget.code.startsWith('SH3')) actionThemes.push('DIGITAL')
    if (action.strategicTarget.code.startsWith('SH4')) actionThemes.push('RESILIENCE')

    // Önce aynı SH altındaki KPI'ları aday al
    let candidateKpis = kpis.filter(k => k.strategicTargetId === action.strategicTargetId)

    // Manuel ipuçları uygula
    const hintRaw = actionCodeToKpiHint.get(action.code || '') || ''
    const tokens = hintRaw.split(/[;,|]/).map(t => t.trim()).filter(Boolean)
    const hintedNumbers = new Set<number>()
    const hintedThemes = new Set<string>()
    const hintedSH = new Set<string>()
    for (const t of tokens) {
      const up = t.toUpperCase()
      if (/^\d+$/.test(up)) hintedNumbers.add(parseInt(up))
      else if (/^KPI\s*:\s*\d+$/.test(up)) hintedNumbers.add(parseInt(up.replace(/[^0-9]/g, '')))
      else if (/^SH\d+\.\d+$/.test(up)) hintedSH.add(up)
      else if (['LEAN','DIGITAL','GREEN','RESILIENCE'].includes(up)) hintedThemes.add(up)
    }
    // Sayı ile verilen KPI'ları adaylara ekle (aynı SH olmasa da)
    if (hintedNumbers.size > 0) {
      const hintedKpis = kpis.filter(k => hintedNumbers.has(k.number))
      const byId = new Set(candidateKpis.map(k => k.id))
      for (const hk of hintedKpis) if (!byId.has(hk.id)) candidateKpis.push(hk)
    }

    const scored = candidateKpis.map((k) => {
      const kThemes = (k.themes || '').split(',').map(t => t.trim()).filter(Boolean)
      // SH eşleşme tabanı
      let score = 1.0
      // Tema kesişimi
      if (kThemes.some(t => actionThemes.includes(t))) score += 1.0
      // Anahtar kelimeler
      for (const kw of KEYWORDS) {
        if (kw.terms.some(term => actionText.includes(term))) {
          score += kw.weight
          if (kw.theme && kThemes.includes(kw.theme)) score += 0.8
        }
      }
      // Manuel ipuçları bonusları
      if (hintedNumbers.has(k.number)) score += 5.0
      if (hintedSH.has(k.strategicTarget.code.toUpperCase())) score += 2.0
      if (kThemes.some(t => hintedThemes.has(t))) score += 1.5
      // Kod sezgisi: E1/E2/E3/E4 ile SH1/2/3/4 uyumu zaten var; ek küçük bonus
      score += 0.2
      return { kpi: k, score }
    })

    scored.sort((a, b) => b.score - a.score)
    const top = scored.slice(0, Math.min(3, Math.max(1, Math.round(Math.random()*2)+1)))

    for (const { kpi, score } of top) {
      // Etki skoru: eylem önceliği + skor normalize
      let base: number = 0.5
      const pr = (action.priority || '').toUpperCase()
      if (pr === 'CRITICAL') base = 0.9
      else if (pr === 'HIGH') base = 0.75
      else if (pr === 'MEDIUM') base = 0.55
      else base = 0.35
      const normScore = Math.min(1, score / 6)
      const impactScore = Math.max(0.2, Math.min(1.0, (base * 0.6) + (normScore * 0.4)))
      const impactCategory = impactScore > 0.75 ? 'HIGH' : impactScore > 0.5 ? 'MEDIUM' : 'LOW'

      await prisma.actionKpi.upsert({
        where: { actionId_kpiId: { actionId: action.id, kpiId: kpi.id } },
        update: { impactScore, impactCategory },
        create: { actionId: action.id, kpiId: kpi.id, impactScore, impactCategory }
      })
    }
  }

  console.log('✅ Action-KPI relationships seeded (reasoned)')
}

async function main() {
  console.log('🌱 Starting seed process...')
  
  await seedStrategicGoals()
  await seedStrategicTargets()
  await seedKPIs()
  await seedPhases()
  await seedActions()
  await seedModelFactories()
  await seedUsers()
  await seedSampleKpiValues()
  await seedActionKpiRelationships()
  await seedActionBudgets()
  
  console.log('✅ Seed process completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seed process failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 