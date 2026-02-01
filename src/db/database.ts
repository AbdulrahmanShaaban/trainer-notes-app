import Dexie, { type EntityTable } from 'dexie';

// Types
export interface Client {
  id?: number;
  name: string;
  age: number;
  height: number;
  startWeight: number;
  goal: string;
  injuries: string;
  startDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id?: number;
  clientId: number;
  date: string;
  notes: string;
  createdAt: string;
}

export interface Exercise {
  id?: number;
  sessionId: number;
  name: string;
  weight: number;
  reps: number;
  rir: number;
  notes: string;
  order: number;
}

export interface WeightLog {
  id?: number;
  clientId: number;
  weight: number;
  date: string;
  createdAt: string;
}

export interface Program {
  id?: number;
  clientId: number;
  name: string;
  description: string;
  exercises: string; // JSON string of exercise templates
  createdAt: string;
  updatedAt: string;
}

// Database
class FitCoachDatabase extends Dexie {
  clients!: EntityTable<Client, 'id'>;
  sessions!: EntityTable<Session, 'id'>;
  exercises!: EntityTable<Exercise, 'id'>;
  weightLogs!: EntityTable<WeightLog, 'id'>;
  programs!: EntityTable<Program, 'id'>;

  constructor() {
    super('FitCoachDB');
    
    this.version(1).stores({
      clients: '++id, name, startDate',
      sessions: '++id, clientId, date',
      exercises: '++id, sessionId, name, order',
      weightLogs: '++id, clientId, date',
      programs: '++id, clientId, name',
    });
  }
}

export const db = new FitCoachDatabase();

// Helper functions
export async function addClient(client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
  const now = new Date().toISOString();
  return await db.clients.add({
    ...client,
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateClient(id: number, updates: Partial<Client>): Promise<void> {
  await db.clients.update(id, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteClient(id: number): Promise<void> {
  await db.transaction('rw', [db.clients, db.sessions, db.exercises, db.weightLogs, db.programs], async () => {
    const sessions = await db.sessions.where('clientId').equals(id).toArray();
    for (const session of sessions) {
      if (session.id) {
        await db.exercises.where('sessionId').equals(session.id).delete();
      }
    }
    await db.sessions.where('clientId').equals(id).delete();
    await db.weightLogs.where('clientId').equals(id).delete();
    await db.programs.where('clientId').equals(id).delete();
    await db.clients.delete(id);
  });
}

export async function addSession(session: Omit<Session, 'id' | 'createdAt'>): Promise<number> {
  return await db.sessions.add({
    ...session,
    createdAt: new Date().toISOString(),
  });
}

export async function addExercise(exercise: Omit<Exercise, 'id'>): Promise<number> {
  return await db.exercises.add(exercise);
}

export async function addWeightLog(log: Omit<WeightLog, 'id' | 'createdAt'>): Promise<number> {
  return await db.weightLogs.add({
    ...log,
    createdAt: new Date().toISOString(),
  });
}

export async function getClientSessions(clientId: number): Promise<Session[]> {
  return await db.sessions.where('clientId').equals(clientId).reverse().sortBy('date');
}

export async function getSessionExercises(sessionId: number): Promise<Exercise[]> {
  return await db.exercises.where('sessionId').equals(sessionId).sortBy('order');
}

export async function getClientWeightHistory(clientId: number): Promise<WeightLog[]> {
  return await db.weightLogs.where('clientId').equals(clientId).sortBy('date');
}
