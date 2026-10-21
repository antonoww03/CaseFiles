import { Pool } from 'pg';
import type { InterviewLine } from './interview.js';
import type { Note } from './gameplay.js';
import { initialProgress, type InvestigationProgress } from './expansion.js';
import { newImmersiveState, type ImmersiveState } from './immersive.js';
import { initialLiving, type LivingState } from './living.js';
import { initialCinematic, type CinematicState } from './cinematic.js';
import { newGame09, type Game09State } from './game09.js';
import { initialUniverse, restoreUniverse, type UniverseState } from './universe.js';

export type StoredSession = {
  id: string;
  found: Set<string>;
  links: Set<string>;
  notes: Note[];
  verified: Set<string>;
  analyses: Set<string>;
  pressure: Record<string, number>;
  hintsUsed: number;
  accusationCount: number;
  finalReport: Record<string, unknown> | null;
  expansion: InvestigationProgress;
  immersive: ImmersiveState;
  living: LivingState;
  cinematic: CinematicState;
  game09: Game09State;
  universe: UniverseState;
  messages: Record<string, InterviewLine[]>;
  disclosed: Record<string, string[]>;
  lastActive: number;
  interviewCount: number;
  aiCalls: number;
  interviewBusy: boolean;
};

type Persisted = {
  found: string[];
  links: string[];
  notes?: Note[];
  verified?: string[];
  analyses?: string[];
  pressure?: Record<string, number>;
  hintsUsed?: number;
  accusationCount?: number;
  finalReport?: Record<string, unknown> | null;
  expansion?: InvestigationProgress;
  immersive?: ImmersiveState;
  living?: LivingState;
  cinematic?: CinematicState;
  game09?: Game09State;
  universe?: UniverseState;
  messages: Record<string, InterviewLine[]>;
  disclosed: Record<string, string[]>;
  interviewCount: number;
  aiCalls: number;
};
let pool: Pool | undefined;

/**
 * pg 8 currently treats sslmode=require like verify-full, but pg 9 will not.
 * Preserve full certificate and hostname validation without changing the
 * stored DATABASE_URL secret in Render or logging its contents.
 */
export function secureDatabaseUrl(value: string): string {
  const url = new URL(value);
  if (url.searchParams.get('sslmode')?.toLowerCase() === 'require') {
    url.searchParams.set('sslmode', 'verify-full');
  }
  return url.toString();
}

export async function initializeStorage(): Promise<'postgres'|'memory'> {
  const uri = process.env.DATABASE_URL?.trim();
  if (!uri) return 'memory';
  const instance = new Pool({
    connectionString: secureDatabaseUrl(uri),
    max: 4,
    idleTimeoutMillis: 15000,
    connectionTimeoutMillis: 10000
  });
  try {
    await instance.query('CREATE SCHEMA IF NOT EXISTS casefiles');
    await instance.query(`
      CREATE TABLE IF NOT EXISTS casefiles.sessions (
        id uuid PRIMARY KEY,
        state jsonb NOT NULL,
        last_active timestamptz NOT NULL DEFAULT now()
      )
    `);
    await instance.query('CREATE INDEX IF NOT EXISTS casefiles_sessions_last_active ON casefiles.sessions (last_active)');
    await instance.query(`CREATE TABLE IF NOT EXISTS casefiles.community_records (
      kind text NOT NULL CHECK(kind IN ('room','story','profile')),
      id text NOT NULL,
      payload jsonb NOT NULL,
      version bigint NOT NULL DEFAULT 0,
      updated_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY(kind,id)
    )`);
    await instance.query('CREATE INDEX IF NOT EXISTS casefiles_community_recent ON casefiles.community_records(kind,updated_at DESC)');
    pool = instance;
    return 'postgres';
  } catch (error) {
    await instance.end();
    throw error;
  }
}

export function storagePool(): Pool | undefined { return pool; }

export function persistentStorageEnabled(): boolean {
  return pool !== undefined;
}

export async function saveSession(session: StoredSession): Promise<void> {
  if (!pool) return;
  const state: Persisted = {
    found: [...session.found],
    links: [...session.links],
    notes: session.notes,
    verified: [...session.verified],
    analyses: [...session.analyses],
    pressure: session.pressure,
    hintsUsed: session.hintsUsed,
    accusationCount: session.accusationCount,
    finalReport: session.finalReport,
    expansion: session.expansion,
    immersive: session.immersive,
    living: session.living,
    cinematic: session.cinematic,
    game09: session.game09,
    universe: session.universe,
    messages: session.messages,
    disclosed: session.disclosed,
    interviewCount: session.interviewCount,
    aiCalls: session.aiCalls
  };
  await pool.query(
    `INSERT INTO casefiles.sessions(id, state, last_active)
     VALUES($1, $2::jsonb, to_timestamp($3 / 1000.0))
     ON CONFLICT (id) DO UPDATE SET state = EXCLUDED.state, last_active = EXCLUDED.last_active`,
    [session.id, JSON.stringify(state), session.lastActive]
  );
}

export function isValidSessionId(id: string): boolean {
  // Reject malformed bearer tokens BEFORE PostgreSQL's uuid cast (401, not 503).
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export async function restoreSession(id: string): Promise<StoredSession|null> {
  if (!pool || !isValidSessionId(id)) return null;
  const result = await pool.query<{ id: string; state: Persisted; last_active: Date }>(
    "SELECT id, state, last_active FROM casefiles.sessions WHERE id = $1::uuid",
    [id]
  );
  if (!result.rowCount) return null;
  const row = result.rows[0];
  const saved = row.state;
  return {
    id: row.id,
    found: new Set(Array.isArray(saved.found) ? saved.found : []),
    links: new Set(Array.isArray(saved.links) ? saved.links : []),
    notes: Array.isArray(saved.notes) ? saved.notes : [],
    verified: new Set(Array.isArray(saved.verified) ? saved.verified : []),
    analyses: new Set(Array.isArray(saved.analyses) ? saved.analyses : []),
    pressure: saved.pressure || {},
    hintsUsed: saved.hintsUsed || 0,
    accusationCount: saved.accusationCount || 0,
    finalReport: saved.finalReport || null,
    expansion: saved.expansion || initialProgress(),
    immersive: saved.immersive || newImmersiveState(),
    living: saved.living || initialLiving(),
    cinematic: saved.cinematic || initialCinematic(),
    game09: saved.game09 || newGame09(),
    universe: saved.universe ? restoreUniverse(saved.universe,new Set(Array.isArray(saved.found)?saved.found:[]),saved.living?.case2?.found||[]) : initialUniverse(),
    messages: saved.messages || {},
    disclosed: saved.disclosed || {},
    lastActive: row.last_active.getTime(),
    interviewCount: saved.interviewCount || 0,
    aiCalls: saved.aiCalls || 0,
    interviewBusy: false
  };
}
