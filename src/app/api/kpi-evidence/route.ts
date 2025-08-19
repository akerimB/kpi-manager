import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateEvidence, getValidationSuggestions } from '@/lib/evidence-validation'
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
    const kpiNumber = searchParams.get('kpiNumber')
    const search = searchParams.get('search')

    // Evidence Management sayfası için geniş listeleme
    if (factoryId && !kpiId && !period) {
      let whereCondition: any = { factoryId }

      // KPI number filtresi
      if (kpiNumber) {
        whereCondition.kpi = {
          number: parseInt(kpiNumber)
        }
      }

      // Dönem filtresi
      if (period) {
        whereCondition.period = period
      }

      // Arama filtresi
      if (search) {
        whereCondition.OR = [
          { fileName: { contains: search, mode: 'insensitive' } },
          { 
            kpi: {
              description: { contains: search, mode: 'insensitive' }
            }
          }
        ]
      }

      const evidences = await prisma.kpiEvidence.findMany({
        where: whereCondition,
        include: {
          kpi: {
            select: {
              number: true,
              description: true,
              strategicTarget: {
                select: {
                  code: true,
                  title: true
                }
              }
            }
          }
        },
        orderBy: { uploadedAt: 'desc' }
      })

      // İstatistikler hesapla
      const allEvidences = await prisma.kpiEvidence.findMany({
        where: { factoryId },
        select: { 
          id: true, 
          aiAnalysis: true 
        }
      })

      const total = allEvidences.length
      const validated = allEvidences.filter(e => 
        e.aiAnalysis && (e.aiAnalysis as any).isValid === true
      ).length
      const invalid = allEvidences.filter(e => 
        e.aiAnalysis && (e.aiAnalysis as any).isValid === false
      ).length
      const pending = total - validated - invalid

      const stats = { total, validated, invalid, pending }

      return NextResponse.json({ evidences, stats })
    }

    // Orijinal API davranışı (belirli KPI için)
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

    // KPI bilgisini al (validation için SH kodu gerekli)
    const kpi = await prisma.kpi.findUnique({
      where: { id: kpiId },
      include: {
        strategicTarget: {
          select: {
            code: true,
            title: true
          }
        }
      }
    })

    if (!kpi) {
      return NextResponse.json({ error: 'KPI bulunamadı' }, { status: 404 })
    }

    // Evidence validation
    const shCode = kpi.strategicTarget.code
    const validationResult = validateEvidence(fileName, fileType, Number(fileSize), shCode, description)
    
    if (!validationResult.isValid) {
      return NextResponse.json({ 
        error: 'Evidence validation hatası',
        validationErrors: validationResult.errors,
        validationWarnings: validationResult.warnings,
        suggestions: getValidationSuggestions(shCode.substring(0, 4)),
        validationScore: validationResult.score
      }, { status: 400 })
    }

    // Uyarılar varsa logla ama devam et
    if (validationResult.warnings.length > 0) {
      console.log('⚠️ Evidence validation warnings:', {
        fileName,
        shCode,
        warnings: validationResult.warnings,
        score: validationResult.score
      })
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
        // AI will populate these fields after analysis
        firmIdHash: null,
        nace2d: null,
        nace4d: null,
        province: null,
        zoneType: null,
        employees: null,
        revenue: null,
        hasExport: false,
        meta: null,
      }
    })

    // Trigger automatic AI analysis in background
    try {
      // Find the KPI number for AI analysis
      const kpi = await prisma.kpi.findUnique({ where: { id: kpiId } })
      if (kpi) {
        // Background AI analysis - don't wait for it
        fetch(`${request.nextUrl.origin}/api/kpi-evidence/analyze`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': request.headers.get('authorization') || ''
          },
          body: JSON.stringify({ 
            evidenceId: created.id, 
            kpiNumber: kpi.number,
            factoryId,
            period 
          })
        }).catch(err => console.error('Background AI analysis failed:', err))
      }
    } catch (err) {
      console.error('Failed to trigger AI analysis:', err)
    }

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


