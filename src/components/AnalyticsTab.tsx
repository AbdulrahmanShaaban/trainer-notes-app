import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Area, AreaChart } from 'recharts';
import { type WeightLog } from '@/db/database';
import { analyzeExerciseProgress, analyzeWeightTrend, type ProgressAnalysis, type WeightTrend } from '@/db/analytics';
import { format } from 'date-fns';

interface AnalyticsTabProps {
  clientId: number;
  weightLogs: WeightLog[];
}

export default function AnalyticsTab({ clientId, weightLogs }: AnalyticsTabProps) {
  const [exerciseProgress, setExerciseProgress] = useState<ProgressAnalysis[]>([]);
  const [weightTrend, setWeightTrend] = useState<WeightTrend | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      setIsLoading(true);
      try {
        const [progress, trend] = await Promise.all([
          analyzeExerciseProgress(clientId),
          analyzeWeightTrend(clientId),
        ]);
        setExerciseProgress(progress);
        setWeightTrend(trend);
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, [clientId, weightLogs]);

  if (isLoading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Loading analytics...
      </div>
    );
  }

  const chartData = weightLogs.map((log) => ({
    date: format(new Date(log.date), 'MM/dd'),
    weight: log.weight,
  }));

  return (
    <div className="space-y-6">
      {/* Weight Trend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-xl p-4"
      >
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          Weight Trend
          {weightTrend && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              weightTrend.trend === 'losing' 
                ? 'bg-success/20 text-success' 
                : weightTrend.trend === 'gaining'
                ? 'bg-warning/20 text-warning'
                : 'bg-muted text-muted-foreground'
            }`}>
              {weightTrend.trend === 'losing' && <TrendingDown className="w-3 h-3 inline mr-1" />}
              {weightTrend.trend === 'gaining' && <TrendingUp className="w-3 h-3 inline mr-1" />}
              {weightTrend.trend === 'stable' && <Minus className="w-3 h-3 inline mr-1" />}
              {weightTrend.weeklyChange > 0 ? '+' : ''}{weightTrend.weeklyChange.toFixed(2)} kg/week
            </span>
          )}
        </h3>

        {chartData.length < 2 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Need at least 2 weight logs to show trend
          </p>
        ) : (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                />
                <YAxis 
                  domain={['dataMin - 1', 'dataMax + 1']}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Area
                  type="monotone"
                  dataKey="weight"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#weightGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </motion.div>

      {/* Exercise Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-xl p-4"
      >
        <h3 className="font-semibold mb-4">Exercise Progress</h3>

        {exerciseProgress.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Need at least 3 sessions with the same exercises to analyze progress
          </p>
        ) : (
          <div className="space-y-3">
            {exerciseProgress.map((analysis) => (
              <div
                key={analysis.exerciseName}
                className="bg-secondary/50 rounded-lg p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{analysis.exerciseName}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    analysis.trend === 'improving'
                      ? 'bg-success/20 text-success'
                      : analysis.trend === 'stagnant'
                      ? 'bg-warning/20 text-warning'
                      : 'bg-destructive/20 text-destructive'
                  }`}>
                    {analysis.trend === 'improving' && <TrendingUp className="w-3 h-3" />}
                    {analysis.trend === 'stagnant' && <Minus className="w-3 h-3" />}
                    {analysis.trend === 'declining' && <TrendingDown className="w-3 h-3" />}
                    {analysis.trend}
                  </span>
                </div>

                {analysis.suggestion && (
                  <div className="flex items-start gap-2 mt-2 p-2 bg-background/50 rounded-md">
                    <AlertCircle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">{analysis.suggestion}</p>
                  </div>
                )}

                <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                  {analysis.lastThreeSessions.map((session, i) => (
                    <span key={i} className="bg-background/50 px-2 py-1 rounded">
                      {session.maxWeight}kg
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Quick Insights */}
      {(weightTrend || exerciseProgress.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-xl p-4"
        >
          <h3 className="font-semibold mb-4">Quick Insights</h3>
          <div className="space-y-2">
            {weightTrend && (
              <div className="flex items-start gap-2 text-sm">
                {weightTrend.trend === 'stable' ? (
                  <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                )}
                <span className="text-muted-foreground">
                  {weightTrend.trend === 'losing' && 'Client is in a caloric deficit - great for fat loss goals'}
                  {weightTrend.trend === 'gaining' && 'Client is in a caloric surplus - great for muscle building'}
                  {weightTrend.trend === 'stable' && 'Weight is stable - good for maintenance or recomp'}
                </span>
              </div>
            )}
            
            {exerciseProgress.filter(p => p.trend === 'stagnant').length > 0 && (
              <div className="flex items-start gap-2 text-sm">
                <AlertCircle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground">
                  {exerciseProgress.filter(p => p.trend === 'stagnant').length} exercise(s) showing no progress - consider variations
                </span>
              </div>
            )}

            {exerciseProgress.filter(p => p.trend === 'improving').length > 0 && (
              <div className="flex items-start gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground">
                  {exerciseProgress.filter(p => p.trend === 'improving').length} exercise(s) showing progress - keep it up!
                </span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
