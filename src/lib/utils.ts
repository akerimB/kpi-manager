import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Tema çevirileri
export const themeLabels = {
  LEAN: 'Yalın',
  DIGITAL: 'Dijital', 
  GREEN: 'Yeşil',
  RESILIENCE: 'Dirençlilik'
} as const

// Tema renkleri
export const themeColors = {
  LEAN: 'bg-blue-500',
  DIGITAL: 'bg-purple-500',
  GREEN: 'bg-green-500', 
  RESILIENCE: 'bg-orange-500'
} as const

// Rol çevirileri
export const roleLabels = {
  MODEL_FACTORY: 'Model Fabrika',
  UPPER_MANAGEMENT: 'Üst Yönetim',
  ADMIN: 'Sistem Yöneticisi'
} as const

// Dönem formatı
export function formatPeriod(year: number, quarter?: number): string {
  if (quarter) {
    return `${year}-Q${quarter}`
  }
  return year.toString()
}

// Yüzde formatı
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`
}

// Sayı formatı
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('tr-TR').format(value)
}

// Tarih formatı
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
} 