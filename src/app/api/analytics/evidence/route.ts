import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || '2024-Q4'
    const factoryParam = searchParams.get('factory')
    const groupBy = (searchParams.get('groupBy') || 'sector').toLowerCase() // 'nace2d' | 'sector'
    const minN = Math.max(1, Number(searchParams.get('minN') || '5'))

    async function resolveFactoryId(param: string | null): Promise<string | null> {
      if (!param) return null
      if (param.length > 20) return param
      const byCode = await prisma.modelFactory.findFirst({ where: { code: param } })
      if (byCode) return byCode.id
      const byName = await prisma.modelFactory.findFirst({ where: { name: param } })
      if (byName) return byName.id
      return null
    }
    const factoryId = await resolveFactoryId(factoryParam)

    const evidences = await prisma.kpiEvidence.findMany({
      where: factoryId ? { period, factoryId } : { period },
      select: {
        id: true,
        firmIdHash: true,
        nace4d: true,
        nace2d: true,
        province: true,
        zoneType: true,
        employees: true,
        revenue: true,
        hasExport: true,
      }
    })

    function toNace2d(n4?: string | null, n2?: string | null): string | null {
      if (n2) return n2
      if (!n4) return null
      const m = String(n4).match(/\d{2}/)
      return m ? m[0] : null
    }

    function mapNaceToSector(nace?: string | null): string | null {
      if (!nace) return null
      const m = (nace as string).match(/\d{2}/)
      if (!m) return null
      const code = parseInt(m[0], 10)
      if ([10,11,12].includes(code)) return 'Gıda/İçecek'
      if ([13,14,15].includes(code)) return 'Tekstil'
      if (code === 16 || code === 31) return 'Mobilya'
      if ([17,18,19].includes(code)) return 'Diğer'
      if (code === 20) return 'Kimya'
      if (code === 22) return 'Plastik/Kauçuk'
      if (code === 23) return 'Mermer/Doğal Taş'
      if (code === 24) return 'Çelik'
      if (code === 25) return 'Metal (Fabrikasyon)'
      if (code === 26) return 'Elektrik-Elektronik'
      if (code === 27) return 'Demir Dışı Metaller'
      if (code === 28) return 'Makine'
      if ([29,30].includes(code)) return 'Otomotiv'
      if (code === 32) return 'Medikal Cihaz'
      if (code === 3) return 'Su Ürünleri'
      return 'Diğer'
    }

    type Agg = { key: string; count: number; employees: number; revenue: number; firms: number }
    const map = new Map<string, Agg>()
    for (const ev of evidences) {
      const k = groupBy === 'nace2d' ? (toNace2d(ev.nace4d, ev.nace2d) || 'NA') : (mapNaceToSector(ev.nace4d || ev.nace2d) || 'Diğer')
      const key = String(k)
      const rec = map.get(key) || { key, count: 0, employees: 0, revenue: 0, firms: 0 }
      rec.count += 1
      rec.employees += Number(ev.employees || 0)
      rec.revenue += Number(ev.revenue || 0)
      // firms: approx by unique firmIdHash per key (coarse: increment when firmIdHash exists)
      if (ev.firmIdHash) rec.firms += 1
      map.set(key, rec)
    }

    // k-anonimlik: n < minN olanları maskele
    const rows = Array.from(map.values())
      .filter(r => r.count >= minN)
      .sort((a, b) => b.count - a.count)

    return NextResponse.json({ period, factoryId, groupBy, minN, rows })
  } catch (error) {
    console.error('Evidence analytics error:', error)
    return NextResponse.json({ error: 'Sunucu hatası', detail: String(error) }, { status: 500 })
  }
}


