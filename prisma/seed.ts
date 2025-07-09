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
        
        await prisma.action.upsert({
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
    { code: 'MF05', name: 'Kayseri Model Fabrikası', city: 'Kayseri', region: 'İç Anadolu' }
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

async function seedUsers() {
  console.log('👥 Seeding Users...')
  
  // Admin kullanıcı
  await prisma.user.upsert({
    where: { email: 'admin@kpi.gov.tr' },
    update: {},
    create: {
      email: 'admin@kpi.gov.tr',
      name: 'Sistem Yöneticisi',
      role: 'ADMIN'
    }
  })
  
  // Üst yönetim kullanıcısı
  await prisma.user.upsert({
    where: { email: 'yonetim@kpi.gov.tr' },
    update: {},
    create: {
      email: 'yonetim@kpi.gov.tr',
      name: 'Üst Yönetim',
      role: 'UPPER_MANAGEMENT'
    }
  })
  
  // Model fabrika kullanıcıları
  const factories = await prisma.modelFactory.findMany()
  for (const factory of factories) {
    await prisma.user.upsert({
      where: { email: `${factory.code.toLowerCase()}@kpi.gov.tr` },
      update: {},
      create: {
        email: `${factory.code.toLowerCase()}@kpi.gov.tr`,
        name: `${factory.name} Kullanıcısı`,
        role: 'MODEL_FACTORY',
        factoryId: factory.id
      }
    })
  }
}

async function seedSampleKpiValues() {
  console.log('📈 Seeding Sample KPI Values...')
  
  const factories = await prisma.modelFactory.findMany()
  const kpis = await prisma.kpi.findMany()
  
  const periods = ['2023-Q4', '2024-Q1', '2024-Q2', '2024-Q3']
  
  for (const factory of factories) {
    for (const period of periods) {
      const [yearStr, quarterStr] = period.split('-Q')
      const year = parseInt(yearStr)
      const quarter = parseInt(quarterStr)
      
      for (const kpi of kpis.slice(0, 10)) { // İlk 10 KPI için örnek veri
        const baseValue = Math.random() * 100 + 50 // 50-150 arası temel değer
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