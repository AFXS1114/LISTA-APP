// ─────────────────────────────────────────────
//  LISTA · Database · Migration Engine
//  Automatically applies incremental schema
//  updates without data loss.
// ─────────────────────────────────────────────

import { SQLiteDatabase } from 'expo-sqlite';

export const CURRENT_SCHEMA_VERSION = 1;

// Each migration is a list of SQL statements to run in order.
// To add a new migration: bump CURRENT_SCHEMA_VERSION and add a
// new entry at migrations[newVersion].
const migrations: Record<number, string[]> = {
  1: [
    `CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER NOT NULL
    )`,

    `INSERT INTO schema_version (version) VALUES (0)`,

    `CREATE TABLE IF NOT EXISTS broker_records (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      broker_name TEXT    NOT NULL,
      date        TEXT    NOT NULL,
      synced      INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    )`,

    `CREATE TABLE IF NOT EXISTS vessel_entries (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      broker_record_id INTEGER NOT NULL REFERENCES broker_records(id) ON DELETE CASCADE,
      vessel_name      TEXT    NOT NULL,
      num_tubs         INTEGER NOT NULL,
      specie           TEXT    NOT NULL,
      synced           INTEGER NOT NULL DEFAULT 0,
      created_at       TEXT    NOT NULL DEFAULT (datetime('now'))
    )`,

    `CREATE INDEX IF NOT EXISTS idx_vessel_broker
      ON vessel_entries(broker_record_id)`,
  ],
  // Example future migration (v2):
  // 2: [
  //   `ALTER TABLE broker_records ADD COLUMN notes TEXT`,
  // ],
};

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  // Create schema_version table if it doesn't exist at all
  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL)`
  );

  const rows = await db.getAllAsync<{ version: number }>(
    'SELECT version FROM schema_version LIMIT 1'
  );

  let currentVersion = rows.length > 0 ? rows[0].version : 0;

  if (currentVersion === 0) {
    // Fresh install — run all migrations from 1 to CURRENT
    for (let v = 1; v <= CURRENT_SCHEMA_VERSION; v++) {
      await applyMigration(db, v);
    }
    await db.runAsync('UPDATE schema_version SET version = ?', [CURRENT_SCHEMA_VERSION]);
  } else if (currentVersion < CURRENT_SCHEMA_VERSION) {
    // Existing install — apply only the delta
    for (let v = currentVersion + 1; v <= CURRENT_SCHEMA_VERSION; v++) {
      await applyMigration(db, v);
    }
    await db.runAsync('UPDATE schema_version SET version = ?', [CURRENT_SCHEMA_VERSION]);
  }
  // If currentVersion === CURRENT_SCHEMA_VERSION, nothing to do.
}

async function applyMigration(db: SQLiteDatabase, version: number): Promise<void> {
  const stmts = migrations[version];
  if (!stmts) return;
  console.log(`[DB] Applying migration v${version} (${stmts.length} statements)`);
  for (const sql of stmts) {
    await db.execAsync(sql);
  }
}
