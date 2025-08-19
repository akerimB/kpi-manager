import { prisma } from '@/lib/prisma'

async function main() {
  const factories = await prisma.modelFactory.findMany({ select: { id: true, code: true } })
  const kpis = await prisma.kpi.findMany({ select: { id: true, number: true } })
  const period = '2024-Q4'
  let created = 0

  for (const f of factories) {
    for (const k of kpis.slice(0, 5)) { // her fabrika için 5 KPI’a örnek kanıt
      const exists = await prisma.kpiEvidence.findFirst({ where: { kpiId: k.id, factoryId: f.id, period } })
      if (exists) continue
      await prisma.kpiEvidence.create({
        data: {
          kpiId: k.id,
          factoryId: f.id,
          period,
          fileName: `sample_${f.code}_KPI${k.number}.pdf`,
          fileType: 'application/pdf',
          fileSize: 1024 * 64,
          fileUrl: 'https://example.com/sample.pdf',
          description: 'Örnek kanıt dosyası',
          category: 'REPORT',
          nace4d: ['25.62', '10.11', '26.40', '20.14'][Math.floor(Math.random()*4)],
          province: f.code,
          zoneType: 'OSB',
          employees: 50 + Math.floor(Math.random()*450),
          revenue: 1_000_000 + Math.floor(Math.random()*9_000_000),
          hasExport: Math.random() > 0.5,
          meta: { ornek: true }
        }
      })
      created++
    }
  }

  console.log(`Sample evidences created: ${created}`)
}

main().catch(e => { console.error(e); process.exit(1) })


