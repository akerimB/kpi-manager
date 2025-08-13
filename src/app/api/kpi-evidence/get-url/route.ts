import { NextRequest, NextResponse } from 'next/server'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import jwt from 'jsonwebtoken'

const region = process.env.AWS_REGION || 'eu-central-1'
const bucket = process.env.S3_BUCKET || ''
const s3 = new S3Client({ region })

export async function GET(request: NextRequest) {
  try {
    if (!bucket) return NextResponse.json({ error: 'S3_BUCKET tanımlı değil' }, { status: 500 })

    const auth = request.headers.get('authorization') || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
    if (!token) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    try { jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-here') } catch { return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 }) }

    const { searchParams } = request.nextUrl
    const key = searchParams.get('key')
    if (!key) return NextResponse.json({ error: 'key gerekli' }, { status: 400 })

    const cmd = new GetObjectCommand({ Bucket: bucket, Key: key })
    const url = await getSignedUrl(s3, cmd, { expiresIn: 60 * 5 })
    return NextResponse.json({ url })
  } catch (error) {
    console.error('get-url error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}


