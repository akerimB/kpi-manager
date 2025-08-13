export const ALLOWED_MIME_TYPES: string[] = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  'application/vnd.ms-excel', // xls
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/msword', // doc
  'text/csv',
]

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024 // 25MB

export type EvidenceCategory = 'REPORT' | 'IMAGE' | 'CERTIFICATE' | 'LOG' | 'EMAIL' | 'OTHER'

export const EVIDENCE_CATEGORIES: EvidenceCategory[] = [
  'REPORT', 'IMAGE', 'CERTIFICATE', 'LOG', 'EMAIL', 'OTHER'
]


