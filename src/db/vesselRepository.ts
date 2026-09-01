// ─────────────────────────────────────────────
//  LISTA · Database · Vessel Repository
// ─────────────────────────────────────────────

import { getDatabase } from './database';

export type VesselEntry = {
  id: number;
  broker_record_id: number;
  vessel_name: string;
  num_tubs: number;
  specie: string;
  synced: number;
  created_at: string;
};

export type CreateVesselInput = {
  broker_record_id: number;
  vessel_name: string;
  num_tubs: number;
  specie: string;
};

export type VesselSummaryRow = {
  broker_id: number;
  broker_name: string;
  date: string;
  specie: string;
  total_tubs: number;
  vessel_count: number;
};

export async function addVesselEntry(input: CreateVesselInput): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO vessel_entries (broker_record_id, vessel_name, num_tubs, specie)
     VALUES (?, ?, ?, ?)`,
    [input.broker_record_id, input.vessel_name, input.num_tubs, input.specie]
  );
  // Mark parent broker as unsynced when new vessel is added
  await db.runAsync(
    `UPDATE broker_records SET synced = 0, updated_at = datetime('now') WHERE id = ?`,
    [input.broker_record_id]
  );
  return result.lastInsertRowId;
}

export async function getVesselEntriesForBroker(brokerId: number): Promise<VesselEntry[]> {
  const db = await getDatabase();
  return db.getAllAsync<VesselEntry>(
    `SELECT * FROM vessel_entries WHERE broker_record_id = ? ORDER BY created_at DESC`,
    [brokerId]
  );
}

export async function getVesselSummary(): Promise<VesselSummaryRow[]> {
  const db = await getDatabase();
  return db.getAllAsync<VesselSummaryRow>(
    `SELECT
       br.id       AS broker_id,
       br.broker_name,
       br.date,
       ve.specie,
       SUM(ve.num_tubs)  AS total_tubs,
       COUNT(ve.id)      AS vessel_count
     FROM broker_records br
     LEFT JOIN vessel_entries ve ON ve.broker_record_id = br.id
     GROUP BY br.id, ve.specie
     ORDER BY br.date DESC, br.broker_name ASC, ve.specie ASC`
  );
}

export async function deleteVesselEntry(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM vessel_entries WHERE id = ?`, [id]);
}
