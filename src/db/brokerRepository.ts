// ─────────────────────────────────────────────
//  LISTA · Database · Broker Repository
// ─────────────────────────────────────────────

import { getDatabase } from './database';

export type BrokerRecord = {
  id: number;
  broker_name: string;
  date: string;
  synced: number;
  created_at: string;
  updated_at: string;
};

export type CreateBrokerInput = {
  broker_name: string;
  date: string;
};

export async function createBrokerRecord(input: CreateBrokerInput): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO broker_records (broker_name, date) VALUES (?, ?)`,
    [input.broker_name, input.date]
  );
  return result.lastInsertRowId;
}

export async function getAllBrokerRecords(): Promise<BrokerRecord[]> {
  const db = await getDatabase();
  return db.getAllAsync<BrokerRecord>(
    `SELECT * FROM broker_records ORDER BY date DESC, created_at DESC`
  );
}

export async function getBrokerRecordById(id: number): Promise<BrokerRecord | null> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<BrokerRecord>(
    `SELECT * FROM broker_records WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function searchBrokerRecords(query: string): Promise<BrokerRecord[]> {
  const db = await getDatabase();
  const q = `%${query}%`;
  return db.getAllAsync<BrokerRecord>(
    `SELECT * FROM broker_records
     WHERE broker_name LIKE ? OR date LIKE ?
     ORDER BY date DESC, created_at DESC`,
    [q, q]
  );
}

export async function markBrokerSynced(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE broker_records SET synced = 1, updated_at = datetime('now') WHERE id = ?`,
    [id]
  );
}

export async function getUnsyncedBrokerCount(): Promise<number> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM broker_records WHERE synced = 0`
  );
  return rows[0]?.count ?? 0;
}

export async function deleteBrokerRecord(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM broker_records WHERE id = ?`, [id]);
}
