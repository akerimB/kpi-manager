import fs from 'fs'
import path from 'path'
import * as XLSX from 'xlsx'

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

function exportWorkbookToCsvFiles(xlsxFilePath: string, outputDir: string) {
  const workbook = XLSX.readFile(xlsxFilePath)
  const base = path.basename(xlsxFilePath, path.extname(xlsxFilePath))

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    if (!sheet) continue

    const csv = XLSX.utils.sheet_to_csv(sheet, { FS: ',', RS: '\n' })
    const safeSheet = sheetName.replace(/[^a-zA-Z0-9_-]+/g, '_')
    const outPath = path.join(outputDir, `${base}__${safeSheet}.csv`)
    fs.writeFileSync(outPath, csv, 'utf8')
    console.log(`Exported: ${outPath}`)
  }
}

async function main() {
  const repoRoot = process.cwd()
  const weightsDir = path.join(repoRoot, 'weights')
  const outDir = path.join(weightsDir, 'exports')
  ensureDir(outDir)

  const entries = fs.readdirSync(weightsDir)
  const xlsxFiles = entries
    .filter((f) => f.toLowerCase().endsWith('.xlsx'))
    .map((f) => path.join(weightsDir, f))

  if (xlsxFiles.length === 0) {
    console.log('No .xlsx files found under weights/')
    return
  }

  for (const f of xlsxFiles) {
    exportWorkbookToCsvFiles(f, outDir)
  }
}

main().catch((err) => {
  console.error('xlsx export error:', err)
  process.exit(1)
})


