import { prisma } from '@/lib/prisma'

type CanonicalSector =
  | 'Gıda/İçecek'
  | 'Tekstil'
  | 'Mobilya'
  | 'Diğer'
  | 'Kimya'
  | 'Plastik/Kauçuk'
  | 'Mermer/Doğal Taş'
  | 'Çelik'
  | 'Metal (Fabrikasyon)'
  | 'Elektrik-Elektronik'
  | 'Demir Dışı Metaller'
  | 'Makine'
  | 'Otomotiv'
  | 'Medikal Cihaz'
  | 'Su Ürünleri'

const TARGET_FACTORIES: { name: string; code: string; city?: string; sectors: CanonicalSector[] }[] = [
  { name: 'Ankara', code: 'ANKARA', sectors: ['Elektrik-Elektronik', 'Medikal Cihaz', 'Makine', 'Metal (Fabrikasyon)'] },
  { name: 'Bursa', code: 'BURSA', sectors: ['Otomotiv', 'Makine', 'Tekstil', 'Gıda/İçecek'] },
  { name: 'Gaziantep', code: 'GAZIANTEP', sectors: ['Tekstil', 'Gıda/İçecek', 'Plastik/Kauçuk', 'Makine'] },
  { name: 'İzmir', code: 'IZMIR', sectors: ['Kimya', 'Makine', 'Elektrik-Elektronik', 'Gıda/İçecek'] },
  { name: 'Kayseri', code: 'KAYSERI', sectors: ['Mobilya', 'Elektrik-Elektronik', 'Demir Dışı Metaller', 'Makine'] },
  { name: 'Konya', code: 'KONYA', sectors: ['Makine', 'Otomotiv', 'Metal (Fabrikasyon)', 'Gıda/İçecek'] },
  { name: 'Mersin', code: 'MERSIN', sectors: ['Gıda/İçecek', 'Plastik/Kauçuk', 'Mermer/Doğal Taş', 'Metal (Fabrikasyon)'] },
  { name: 'Adana', code: 'ADANA', sectors: ['Kimya', 'Tekstil', 'Gıda/İçecek'] },
  { name: 'Eskişehir', code: 'ESKISEHIR', sectors: ['Raylı Sistemler' as any, 'Havacılık' as any, 'Makine', 'Beyaz Eşya' as any] },
  { name: 'Samsun', code: 'SAMSUN', sectors: ['Medikal Cihaz', 'Gıda/İçecek', 'Çelik'] },
  // Planlanan 5 merkez
  { name: 'Denizli', code: 'DENIZLI', sectors: ['Tekstil', 'Demir Dışı Metaller', 'Mermer/Doğal Taş'] },
  { name: 'Kocaeli', code: 'KOCAELI', sectors: ['Otomotiv', 'Kimya', 'Makine'] },
  { name: 'Malatya', code: 'MALATYA', sectors: ['Gıda/İçecek', 'Tekstil'] },
  { name: 'Tekirdağ', code: 'TEKIRDAG', sectors: ['Tekstil', 'Otomotiv', 'Makine'] },
  { name: 'Trabzon', code: 'TRABZON', sectors: ['Su Ürünleri', 'Çelik', 'Lojistik' as any] },
]

function canonicalizeSector(label: string): CanonicalSector | 'SKIP' {
  const l = label.toLowerCase()
  if (l.includes('gıda')) return 'Gıda/İçecek'
  if (l.includes('içecek')) return 'Gıda/İçecek'
  if (l.includes('tekstil')) return 'Tekstil'
  if (l.includes('mobilya')) return 'Mobilya'
  if (l.includes('kimya')) return 'Kimya'
  if (l.includes('plastik') || l.includes('kauçuk') || l.includes('ambalaj')) return 'Plastik/Kauçuk'
  if (l.includes('mermer') || l.includes('seramik') || l.includes('metalik olmayan')) return 'Mermer/Doğal Taş'
  if (l.includes('çelik') || l.includes('ana metal')) return 'Çelik'
  if (l.includes('metal')) return 'Metal (Fabrikasyon)'
  if (l.includes('elektrik') || l.includes('elektronik')) return 'Elektrik-Elektronik'
  if (l.includes('bakır') || l.includes('alüminyum')) return 'Demir Dışı Metaller'
  if (l.includes('makine')) return 'Makine'
  if (l.includes('otomotiv') || l.includes('raylı') || l.includes('havacılık') || l.includes('gemi') || l.includes('boat')) return 'Otomotiv'
  if (l.includes('medikal') || l.includes('tıbbi')) return 'Medikal Cihaz'
  if (l.includes('su ürün')) return 'Su Ürünleri'
  if (l.includes('lojistik') || l.includes('liman')) return 'SKIP' // üretim sektörü değil
  return 'Diğer'
}

async function ensureFactories() {
  const allowedNames = TARGET_FACTORIES.map(f => f.name)
  const existing = await prisma.modelFactory.findMany({ select: { id: true, name: true } })
  const toDelete = existing.filter(e => !allowedNames.includes(e.name))

  for (const f of toDelete) {
    // Bağımlı kayıtları temizle (sırayla)
    await prisma.factoryTargetWeight.deleteMany({ where: { factoryId: f.id } })
    await prisma.factorySectorWeight.deleteMany({ where: { factoryId: f.id } })
    await prisma.kpiEvidence.deleteMany({ where: { factoryId: f.id } })
    await prisma.kpiValue.deleteMany({ where: { factoryId: f.id } })
    await prisma.user.updateMany({ where: { factoryId: f.id }, data: { factoryId: null } })
    await prisma.modelFactory.delete({ where: { id: f.id } })
  }

  for (const tf of TARGET_FACTORIES) {
    await prisma.modelFactory.upsert({
      where: { code: tf.code },
      update: { name: tf.name, city: tf.name, isActive: true },
      create: { code: tf.code, name: tf.name, city: tf.name, isActive: true },
    })
  }
}

async function ensureSectorWeights() {
  for (const tf of TARGET_FACTORIES) {
    const factory = await prisma.modelFactory.findFirst({ where: { code: tf.code } })
    if (!factory) continue

    const existing = await prisma.factorySectorWeight.findMany({ where: { factoryId: factory.id } })
    const existingSet = new Set(existing.map(e => e.sector))

    const desiredSectors = Array.from(new Set(tf.sectors.map(s => canonicalizeSector(String(s))).filter(s => s !== 'SKIP'))) as CanonicalSector[]
    const missing = desiredSectors.filter(s => !existingSet.has(s))

    // Payları dağıt: kalan payı eşit dağıt, toplamı 1'e normalize et
    const currentSum = existing.reduce((s, e) => s + (e.share || 0), 0)
    let residual = Math.max(0, 1 - currentSum)
    const addShare = missing.length > 0 ? residual / missing.length : 0

    for (const sector of missing) {
      await prisma.factorySectorWeight.upsert({
        where: { factoryId_sector: { factoryId: factory.id, sector } },
        update: { share: addShare || 0.05 },
        create: { factoryId: factory.id, sector, share: addShare || 0.05 },
      })
    }

    // Normalize
    const all = await prisma.factorySectorWeight.findMany({ where: { factoryId: factory.id } })
    const sum = all.reduce((s, e) => s + (e.share || 0), 0) || 1
    for (const e of all) {
      const norm = Number(((e.share || 0) / sum).toFixed(6))
      await prisma.factorySectorWeight.update({ where: { id: e.id }, data: { share: norm } })
    }
  }
}

async function ensureFactoryTargetWeights() {
  // Tüm SH'leri al, fabrikalara eşit dağıtım uygula (yoksa)
  const targets = await prisma.strategicTarget.findMany({ select: { id: true, code: true } })
  for (const tf of TARGET_FACTORIES) {
    const factory = await prisma.modelFactory.findFirst({ where: { code: tf.code } })
    if (!factory) continue
    for (const t of targets) {
      const exists = await prisma.factoryTargetWeight.findFirst({ where: { factoryId: factory.id, strategicTargetId: t.id } })
      if (!exists) {
        await prisma.factoryTargetWeight.create({ data: { factoryId: factory.id, strategicTargetId: t.id, weight: 1 } })
      }
    }
    // Normalize fabrika bazında (toplam 1 olacak şekilde)
    const all = await prisma.factoryTargetWeight.findMany({ where: { factoryId: factory.id } })
    const sum = all.reduce((s, r) => s + (r.weight || 0), 0) || 1
    for (const r of all) {
      const norm = Number(((r.weight || 0) / sum).toFixed(6))
      await prisma.factoryTargetWeight.update({ where: { id: r.id }, data: { weight: norm } })
    }
  }
}

async function ensureSampleEvidence() {
  // Her fabrikada 1 örnek kanıt oluştur (ilk KPI için)
  const firstKpi = await prisma.kpi.findFirst({ select: { id: true } })
  if (!firstKpi) return
  for (const tf of TARGET_FACTORIES) {
    const factory = await prisma.modelFactory.findFirst({ where: { code: tf.code } })
    if (!factory) continue
    const exists = await prisma.kpiEvidence.findFirst({ where: { kpiId: firstKpi.id, factoryId: factory.id, period: '2024-Q4' } })
    if (!exists) {
      await prisma.kpiEvidence.create({
        data: {
          kpiId: firstKpi.id,
          factoryId: factory.id,
          period: '2024-Q4',
          fileKey: null,
          fileName: 'dummy.pdf',
          fileType: 'application/pdf',
          fileSize: 12345,
          fileUrl: 'https://example.com/dummy.pdf',
          description: 'Örnek kanıt',
          category: 'OTHER',
          uploadedBy: null,
        }
      })
    }
  }
}

async function main() {
  await ensureFactories()
  await ensureSectorWeights()
  await ensureFactoryTargetWeights()
  await ensureSampleEvidence()
  console.log('Sync completed')
}

main().catch(err => { console.error(err); process.exit(1) })


