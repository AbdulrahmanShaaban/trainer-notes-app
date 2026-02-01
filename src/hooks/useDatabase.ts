import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Client } from '@/db/database';

export function useClients() {
  const clients = useLiveQuery(() => db.clients.toArray());
  return clients ?? [];
}

export function useClient(id: number | undefined) {
  const client = useLiveQuery(
    () => (id ? db.clients.get(id) : undefined),
    [id]
  );
  return client;
}

export function useClientSessions(clientId: number | undefined) {
  const sessions = useLiveQuery(
    () => (clientId 
      ? db.sessions.where('clientId').equals(clientId).reverse().sortBy('date') 
      : []
    ),
    [clientId]
  );
  return sessions ?? [];
}

export function useSessionExercises(sessionId: number | undefined) {
  const exercises = useLiveQuery(
    () => (sessionId 
      ? db.exercises.where('sessionId').equals(sessionId).sortBy('order') 
      : []
    ),
    [sessionId]
  );
  return exercises ?? [];
}

export function useClientWeightLogs(clientId: number | undefined) {
  const logs = useLiveQuery(
    () => (clientId 
      ? db.weightLogs.where('clientId').equals(clientId).sortBy('date') 
      : []
    ),
    [clientId]
  );
  return logs ?? [];
}

export function useClientPrograms(clientId: number | undefined) {
  const programs = useLiveQuery(
    () => (clientId 
      ? db.programs.where('clientId').equals(clientId).toArray() 
      : []
    ),
    [clientId]
  );
  return programs ?? [];
}
