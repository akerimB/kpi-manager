import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST() {
  try {
    // Demo kullanıcıları oluştur
    const demoUsers = [
      {
        email: 'admin@kobimodel.gov.tr',
        password: 'Admin123!',
        name: 'System Admin',
        role: 'ADMIN',
        factoryId: null
      },
      {
        email: 'ust.yonetim@kobimodel.gov.tr',
        password: 'UstYon123!',
        name: 'Üst Yönetim',
        role: 'UPPER_MANAGEMENT',
        factoryId: null
      },
      {
        email: 'adana@kobimodel.gov.tr',
        password: 'Adana123!',
        name: 'Adana Model Fabrika',
        role: 'MODEL_FACTORY',
        factoryId: 'cmebmec0a0007gpvewan8fteb'
      },
      {
        email: 'ankara@kobimodel.gov.tr',
        password: 'Ankara123!',
        name: 'Ankara Model Fabrika',
        role: 'MODEL_FACTORY',
        factoryId: 'cmebmec020000gpveb9ewqio0'
      },
      {
        email: 'bursa@kobimodel.gov.tr',
        password: 'Bursa123!',
        name: 'Bursa Model Fabrika',
        role: 'MODEL_FACTORY',
        factoryId: 'cmebmec060001gpved4wzoa1i'
      }
    ]
    
    const createdUsers = []
    
    for (const userData of demoUsers) {
      // Kullanıcı zaten varsa atla
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      })
      
      if (existingUser) {
        createdUsers.push({ ...userData, status: 'already_exists' })
        continue
      }
      
      // Şifreyi hash'le
      const hashedPassword = await bcrypt.hash(userData.password, 10)
      
      // Kullanıcı oluştur
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          name: userData.name,
          role: userData.role as any,
          factoryId: userData.factoryId,
          isActive: true
        }
      })
      
      createdUsers.push({ 
        ...userData, 
        id: user.id,
        status: 'created' 
      })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Demo kullanıcıları oluşturuldu',
      users: createdUsers
    })
    
  } catch (error) {
    console.error('Create demo users error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
