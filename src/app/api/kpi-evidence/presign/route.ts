import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { ALLOWED_MIME_TYPES } from '@/lib/evidence-config'
import jwt from 'jsonwebtoken'

const region = process.env.AWS_REGION || 'eu-central-1'
const bucket = process.env.S3_BUCKET || ''

const s3 = new S3Client({ region })

export async function POST(request: NextRequest) {
  try {
    if (!bucket) {
      return NextResponse.json({ error: 'S3_BUCKET tanımlı değil' }, { status: 500 })
    }

    // Auth
    const auth = request.headers.get('authorization') || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
    if (!token) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    let payload: any
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-here') as any
    } catch {
      return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 })
    }

    const { fileName, fileType, kpiId, period, factoryId } = await request.json()
    if (!fileName || !fileType || !kpiId || !period || !factoryId) {
      return NextResponse.json({ error: 'Zorunlu alanlar eksik' }, { status: 400 })
    }

    // MIME whitelist
    const allowed = new Set(ALLOWED_MIME_TYPES)
    if (!allowed.has(fileType)) {
      return NextResponse.json({ error: 'İzin verilmeyen dosya tipi' }, { status: 415 })
    }

    // Rol bazlı kontrol: Model fabrika sadece kendi fabrikasına yükleyebilir
    if (payload?.role === 'MODEL_FACTORY' && payload?.factoryId && payload.factoryId !== factoryId) {
      return NextResponse.json({ error: 'Bu fabrikaya yükleme yetkiniz yok' }, { status: 403 })
    }

    const key = `kpi-evidence/${factoryId}/${kpiId}/${period}/${Date.now()}-${encodeURIComponent(fileName)}`

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: fileType,
    })

    const url = await getSignedUrl(s3, command, { expiresIn: 60 * 5 })

    return NextResponse.json({ uploadUrl: url, publicUrl: `https://${bucket}.s3.${region}.amazonaws.com/${key}`, key })
  } catch (error) {
    console.error('Presign error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}


