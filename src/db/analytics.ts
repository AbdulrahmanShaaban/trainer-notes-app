import { db, type Exercise, type WeightLog, type Session } from './database';

export interface ProgressAnalysis {
  exerciseName: string;
  trend: 'improving' | 'stagnant' | 'declining';
  lastThreeSessions: {
    date: string;
    maxWeight: number;
    totalVolume: number;
  }[];
  suggestion?: string;
}

export interface WeightTrend {
  trend: 'losing' | 'gaining' | 'stable';
  weeklyChange: number;
  totalChange: number;
  data: { date: string; weight: number }[];
}

// Analyze exercise progress for a client
export async function analyzeExerciseProgress(clientId: number): Promise<ProgressAnalysis[]> {
  const sessions = await db.sessions
    .where('clientId')
    .equals(clientId)
    .reverse()
    .limit(10)
    .sortBy('date');

  if (sessions.length < 3) return [];

  const exerciseMap = new Map<string, { date: string; maxWeight: number; totalVolume: number }[]>();

  for (const session of sessions) {
    if (!session.id) continue;
    const exercises = await db.exercises.where('sessionId').equals(session.id).toArray();
    
    for (const exercise of exercises) {
      const name = exercise.name.toLowerCase().trim();
      if (!exerciseMap.has(name)) {
        exerciseMap.set(name, []);
      }
      
      const volume = exercise.weight * exercise.reps;
      const existing = exerciseMap.get(name)!;
      const sessionData = existing.find(e => e.date === session.date);
      
      if (sessionData) {
        sessionData.maxWeight = Math.max(sessionData.maxWeight, exercise.weight);
        sessionData.totalVolume += volume;
      } else {
        existing.push({
          date: session.date,
          maxWeight: exercise.weight,
          totalVolume: volume,
        });
      }
    }
  }

  const analyses: ProgressAnalysis[] = [];

  for (const [exerciseName, data] of exerciseMap) {
    if (data.length < 3) continue;

    const lastThree = data.slice(0, 3);
    const volumes = lastThree.map(d => d.totalVolume);
    
    let trend: 'improving' | 'stagnant' | 'declining';
    let suggestion: string | undefined;

    const avgRecent = (volumes[0] + volumes[1]) / 2;
    const avgOlder = volumes[2];
    const changePercent = ((avgRecent - avgOlder) / avgOlder) * 100;

    if (changePercent > 5) {
      trend = 'improving';
    } else if (changePercent < -5) {
      trend = 'declining';
      suggestion = `Consider deloading or checking recovery for ${exerciseName}`;
    } else {
      trend = 'stagnant';
      suggestion = `No progress on ${exerciseName} in last 3 sessions. Consider progressive overload or variation.`;
    }

    analyses.push({
      exerciseName: exerciseName.charAt(0).toUpperCase() + exerciseName.slice(1),
      trend,
      lastThreeSessions: lastThree,
      suggestion,
    });
  }

  return analyses;
}

// Analyze weight trend for a client
export async function analyzeWeightTrend(clientId: number): Promise<WeightTrend | null> {
  const logs = await db.weightLogs
    .where('clientId')
    .equals(clientId)
    .sortBy('date');

  if (logs.length < 2) return null;

  const data = logs.map(log => ({ date: log.date, weight: log.weight }));
  const firstWeight = logs[0].weight;
  const lastWeight = logs[logs.length - 1].weight;
  const totalChange = lastWeight - firstWeight;

  // Calculate weekly change based on recent data
  const recentLogs = logs.slice(-7);
  const weeklyChange = recentLogs.length >= 2
    ? (recentLogs[recentLogs.length - 1].weight - recentLogs[0].weight) / (recentLogs.length / 7)
    : 0;

  let trend: 'losing' | 'gaining' | 'stable';
  if (weeklyChange < -0.2) {
    trend = 'losing';
  } else if (weeklyChange > 0.2) {
    trend = 'gaining';
  } else {
    trend = 'stable';
  }

  return { trend, weeklyChange, totalChange, data };
}

// Get session summary stats for a client
export async function getClientStats(clientId: number): Promise<{
  totalSessions: number;
  totalExercises: number;
  lastSessionDate: string | null;
  avgSessionExercises: number;
}> {
  const sessions = await db.sessions.where('clientId').equals(clientId).toArray();
  
  let totalExercises = 0;
  for (const session of sessions) {
    if (session.id) {
      const exercises = await db.exercises.where('sessionId').equals(session.id).count();
      totalExercises += exercises;
    }
  }

  const sortedSessions = [...sessions].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return {
    totalSessions: sessions.length,
    totalExercises,
    lastSessionDate: sortedSessions[0]?.date || null,
    avgSessionExercises: sessions.length > 0 ? Math.round(totalExercises / sessions.length) : 0,
  };
}
