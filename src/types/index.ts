export type Role = "COLABORADOR" | "ANALISTA" | "ADMINISTRADOR"
export type DocumentStatus = "RASCUNHO" | "EM_REVISAO" | "APROVADO" | "REJEITADO"

export interface User {
  id: string
  name: string
  email: string
  role: Role
  createdAt: string
}

export interface DocumentVersion {
  id: string
  versionNumber: number
  content: string
  createdAt: string
  createdBy: Pick<User, "id" | "name">
}

export interface Document {
  id: string
  title: string
  description: string
  status: DocumentStatus
  currentVersion: number
  owner: Pick<User, "id" | "name" | "email">
  assignedTo?: Pick<User, "id" | "name"> | null
  versions: DocumentVersion[]
  createdAt: string
  updatedAt: string
}

export interface AuditLog {
  id: string
  action: string
  userId: string
  userName: string
  targetId?: string | null
  targetType?: string | null
  details?: string | null
  ipAddress: string
  userAgent: string
  createdAt: string
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}
