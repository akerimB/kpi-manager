import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Token gereklidir' }, { status: 400 })
    }

    // Token'ı doğrula
    const decoded = jwt.verify(token, JWT_SECRET) as any

    // Kullanıcıyı veritabanından al
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        factory: true
      }
    })

    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 })
    }

    // Kullanıcı bilgilerini hazırla
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      factoryId: user.factoryId,
      factory: user.factory ? {
        id: user.factory.id,
        name: user.factory.name,
        code: user.factory.code
      } : null,
      permissions: user.permissions ? JSON.parse(user.permissions) : null
    }

    return NextResponse.json({
      valid: true,
      user: userResponse
    })

  } catch (error) {
    console.error('Token verification error:', error)
    return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 })
  }
} 