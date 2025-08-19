import { prisma } from '@/lib/prisma'

function sectorToSampleNace(sector: string): string {
  const s = sector.toLowerCase()
  if (s.includes('gıda')) return '10.11'
  if (s.includes('tekstil') || s.includes('hazır giyim')) return '13.20'
  if (s.includes('mobilya')) return '31.00'
  if (s.includes('kimya')) return '20.13'
  if (s.includes('plastik')) return '22.29'
  if (s.includes('mermer') || s.includes('doğal taş')) return '23.70'
  if (s.includes('çelik')) return '24.10'
  if (s.includes('metal')) return '25.11'
  if (s.includes('elektrik') || s.includes('elektronik')) return '26.40'
  if (s.includes('demir dışı')) return '27.90'
  if (s.includes('makine')) return '28.49'
  if (s.includes('otomotiv')) return '29.10'
  if (s.includes('medikal')) return '32.50'
  if (s.includes('su ürün')) return '03.11'
  return '25.11'
}

async function main() {
  const periods = ['2024-Q4']
  const factories = await prisma.modelFactory.findMany()
  const kpis = await prisma.kpi.findMany({ select: { id: true, targetValue: true } })

  for (const f of factories) {
    const sectors = await prisma.factorySectorWeight.findMany({ where: { factoryId: f.id } })
    const top = sectors.sort((a, b) => (b.share || 0) - (a.share || 0))[0]
    const nace = top ? sectorToSampleNace(top.sector) : '25.11'

    for (const p of periods) {
      for (const k of kpis) {
        const tv = k.targetValue ?? 100
        const val = tv * (0.7 + Math.random() * 0.4)
        await prisma.kpiValue.upsert({
          where: { kpiId_factoryId_period: { kpiId: k.id, factoryId: f.id, period: p } },
          update: { value: val, year: 2024, quarter: 4, nace4d: nace },
          create: { kpiId: k.id, factoryId: f.id, period: p, value: val, year: 2024, quarter: 4, nace4d: nace }
        })
      }
    }
  }
  console.log('Demo KPI values populated for', factories.length, 'factories and', kpis.length, 'KPIs.')
}

main().catch((e) => { console.error(e); process.exit(1) })

