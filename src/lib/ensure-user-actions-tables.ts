import { prisma } from '@/lib/prisma'

async function tableExists(tableName: string): Promise<boolean> {
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(`SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`)
    return Array.isArray(rows) && rows.length > 0
  } catch (_err) {
    return false
  }
}

export async function ensureUserActionsTables(): Promise<void> {
  // Only for SQLite dev environment fallback
  const uaExists = await tableExists('user_actions')
  const uaeExists = await tableExists('user_action_events')
  const uanExists = await tableExists('user_action_notes')

  const stmts: string[] = []

  if (!uaExists) {
    stmts.push(`
      CREATE TABLE IF NOT EXISTS "user_actions" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "saCode" TEXT,
        "shCode" TEXT,
        "kpiIds" TEXT,
        "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
        "status" TEXT NOT NULL DEFAULT 'PLANNED',
        "linkedActionId" TEXT,
        "startDate" DATETIME,
        "endDate" DATETIME,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        CONSTRAINT "fk_user_actions_user" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "fk_user_actions_action" FOREIGN KEY ("linkedActionId") REFERENCES "actions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
      );
    `)
    stmts.push(`CREATE INDEX IF NOT EXISTS "idx_user_actions_userId" ON "user_actions" ("userId")`)
  }

  if (!uaeExists) {
    stmts.push(`
      CREATE TABLE IF NOT EXISTS "user_action_events" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userActionId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "start" DATETIME NOT NULL,
        "end" DATETIME,
        "location" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "fk_user_action_events_action" FOREIGN KEY ("userActionId") REFERENCES "user_actions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `)
    stmts.push(`CREATE INDEX IF NOT EXISTS "idx_user_action_events_ua" ON "user_action_events" ("userActionId")`)
  }

  if (!uanExists) {
    stmts.push(`
      CREATE TABLE IF NOT EXISTS "user_action_notes" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userActionId" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "fk_user_action_notes_action" FOREIGN KEY ("userActionId") REFERENCES "user_actions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `)
    stmts.push(`CREATE INDEX IF NOT EXISTS "idx_user_action_notes_ua" ON "user_action_notes" ("userActionId")`)
  }

  if (stmts.length) {
    for (const s of stmts) {
      await prisma.$executeRawUnsafe(s)
    }
  }
}


