import fs from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'

function parseCsv(filePath: string): string[][] {
  const raw = fs.readFileSync(filePath, 'utf8')
  return raw.split(/\r?\n/).filter(Boolean).map(line => {
    // naive CSV split (no embedded commas in our files except quoted ones rarely)
    // basic handling: strip optional quotes
    return line.split(',').map(cell => cell.replace(/^"|"$/g, ''))
  })
}

async function upsertFactoriesFromMFList(mfFocusPath: string) {
  const rows = parseCsv(mfFocusPath)
  const header = rows.shift()
  if (!header) return
  const nameIdx = 0
  for (const row of rows) {
    const name = row[nameIdx]
    if (!name) continue
    const code = name.toUpperCase().normalize('NFD').replace(/[^A-Z0-9]+/g, '').slice(0, 10)
    await prisma.modelFactory.upsert({
      where: { code },
      update: { name, city: name },
      create: { code, name, city: name }
    })
  }
}

async function importSectorShares(filePath: string) {
  const rows = parseCsv(filePath)
  const header = rows.shift()
  if (!header) return
  const idxCity = 0, idxSector = 1, idxMethod = 2, idxShare = 3
  for (const row of rows) {
    const city = row[idxCity]
    const sector = row[idxSector]
    const share = parseFloat(row[idxShare] || '0')
    if (!city || !sector || !(share >= 0)) continue
    const factory = await prisma.modelFactory.findFirst({ where: { name: city } })
    if (!factory) continue
    await prisma.factorySectorWeight.upsert({
      where: { factoryId_sector: { factoryId: factory.id, sector } },
      update: { share },
      create: { factoryId: factory.id, sector, share }
    })
  }
}

async function importTargetWeights(weightsWidePath: string) {
  const rows = parseCsv(weightsWidePath)
  const header = rows.shift()
  if (!header) return
  const factoryNameIdx = 0
  for (const row of rows) {
    const factoryName = row[factoryNameIdx]
    if (!factoryName) continue
    const factory = await prisma.modelFactory.findFirst({ where: { name: factoryName } })
    if (!factory) continue
    for (let c = 1; c < header.length; c++) {
      const shCode = header[c]
      const weight = parseFloat(row[c] || '0')
      if (!shCode || !(weight >= 0)) continue
      const target = await prisma.strategicTarget.findFirst({ where: { code: shCode } })
      if (!target) continue
      await prisma.factoryTargetWeight.upsert({
        where: { factoryId_strategicTargetId: { factoryId: factory.id, strategicTargetId: target.id } },
        update: { weight },
        create: { factoryId: factory.id, strategicTargetId: target.id, weight }
      })
    }
  }
}

async function main() {
  const root = process.cwd()
  const expDir = path.join(root, 'weights/exports')
  await upsertFactoriesFromMFList(path.join(expDir, 'MF_Target_Weights_v4_Param_Sensitivity__MF_Focus.csv'))
  await importSectorShares(path.join(expDir, 'MF_Target_Weights_v4_Param_Sensitivity__Data_SectorShares.csv'))
  await importTargetWeights(path.join(expDir, 'MF_Target_Weights_v4_Param_Sensitivity__Weights_Wide.csv'))
  console.log('Import completed')
}

main().catch(e => { console.error(e); process.exit(1) })


