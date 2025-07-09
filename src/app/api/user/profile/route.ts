import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here'

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Token gereklidir' }, { status: 401 })
    }

    // Token'ı doğrula
    const decoded = jwt.verify(token, JWT_SECRET) as any
    const { name, email } = await request.json()

    // Kullanıcıyı güncelle
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        name,
        email
      }
    })

    return NextResponse.json({
      message: 'Profil başarıyla güncellendi',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email
      }
    })

  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Profil güncellenirken hata oluştu' }, { status: 500 })
  }
} 