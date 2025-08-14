import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'
import jwt from 'jsonwebtoken'

// Basit JSON tabanlı yükleme; gerçek dosya için S3/GCS entegre edilebilir

export async function GET(request: NextRequest) {
  try {
    // Auth (salt okunur olabilir ama basit doğrulama ekleyelim)
    const auth = request.headers.get('authorization') || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
    if (token) {
      try { jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-here') } catch {}
    }
    const { searchParams } = request.nextUrl
    const kpiId = searchParams.get('kpiId')
    const factoryId = searchParams.get('factoryId')
    const period = searchParams.get('period')

    if (!kpiId || !factoryId || !period) {
      return NextResponse.json({ error: 'kpiId, factoryId ve period zorunludur' }, { status: 400 })
    }

    const evidences = await prisma.kpiEvidence.findMany({
      where: { kpiId, factoryId, period },
      orderBy: { uploadedAt: 'desc' }
    })

    return NextResponse.json(evidences)
  } catch (error) {
    console.error('KPI evidences fetch error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Auth zorunlu
    const auth = request.headers.get('authorization') || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
    if (!token) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    let payload: any
    try { payload = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-here') } catch { return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 }) }

    const body = await request.json()
    const { kpiId, factoryId, period, fileName, fileType, fileSize, fileUrl, description, category, uploadedBy, fileKey } = body

    if (!kpiId || !factoryId || !period || !fileName || !fileType || !fileSize || !fileUrl) {
      return NextResponse.json({ error: 'Zorunlu alanlar eksik' }, { status: 400 })
    }

    // Rol bazlı kontrol: Model fabrika sadece kendi fabrikasına yazabilir
    if ((payload as any)?.role === 'MODEL_FACTORY' && (payload as any)?.factoryId && (payload as any).factoryId !== factoryId) {
      return NextResponse.json({ error: 'Bu fabrikaya kanıt ekleme yetkiniz yok' }, { status: 403 })
    }

    const created = await prisma.kpiEvidence.create({
      data: {
        kpiId,
        factoryId,
        period,
        fileName,
        fileType,
        fileSize: Number(fileSize),
        fileUrl,
        description: description || null,
        category: category || null,
        uploadedBy: uploadedBy || null,
        fileKey: fileKey || null,
        // Opsiyonel kanıt alanları
        firmIdHash: (body.firmIdHash as string) || null,
        nace2d: (body.nace2d as string) || null,
        nace4d: (body.nace4d as string) || null,
        province: (body.province as string) || null,
        zoneType: (body.zoneType as string) || null,
        employees: body.employees !== undefined ? Number(body.employees) : null,
        revenue: body.revenue !== undefined ? Number(body.revenue) : null,
        hasExport: body.hasExport === true,
        meta: body.meta ? body.meta : undefined,
      }
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('KPI evidence create error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Auth zorunlu
    const auth = request.headers.get('authorization') || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
    if (!token) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    let payload: any
    try { payload = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-here') } catch { return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 }) }

    const { searchParams } = request.nextUrl
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'id gerekli' }, { status: 400 })
    }

    const evidence = await prisma.kpiEvidence.findUnique({ where: { id } })
    if (!evidence) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

    // Model fabrika kendi fabrikasındaki kanıtı silebilir, diğer rollerde serbest
    if ((payload as any)?.role === 'MODEL_FACTORY' && (payload as any)?.factoryId && (payload as any).factoryId !== evidence.factoryId) {
      return NextResponse.json({ error: 'Bu kanıtı silme yetkiniz yok' }, { status: 403 })
    }
    await prisma.kpiEvidence.delete({ where: { id } })

    // S3'ten de sil (varsa)
    const bucket = process.env.S3_BUCKET
    const region = process.env.AWS_REGION || 'eu-central-1'
    if (bucket && evidence?.fileKey) {
      const s3 = new S3Client({ region })
      try {
        await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: evidence.fileKey }))
      } catch (err) {
        console.error('S3 delete error:', err)
      }
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('KPI evidence delete error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}


