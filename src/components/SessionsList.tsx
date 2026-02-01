import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ChevronDown, Dumbbell } from 'lucide-react';
import { type Session } from '@/db/database';
import { useSessionExercises } from '@/hooks/useDatabase';

interface SessionsListProps {
  sessions: Session[];
  clientId: number;
}

export default function SessionsList({ sessions, clientId }: SessionsListProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <Dumbbell className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">No sessions logged yet</p>
        <p className="text-sm text-muted-foreground/70">Tap the + button to add a session</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <SessionCard
          key={session.id}
          session={session}
          isExpanded={expandedId === session.id}
          onToggle={() => setExpandedId(expandedId === session.id ? null : session.id!)}
        />
      ))}
    </div>
  );
}

interface SessionCardProps {
  session: Session;
  isExpanded: boolean;
  onToggle: () => void;
}

function SessionCard({ session, isExpanded, onToggle }: SessionCardProps) {
  const exercises = useSessionExercises(session.id);

  return (
    <motion.div
      layout
      className="glass-card rounded-xl overflow-hidden"
    >
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between text-left"
      >
        <div>
          <p className="font-semibold">
            {format(new Date(session.date), 'EEEE, MMM dd')}
          </p>
          <p className="text-sm text-muted-foreground">
            {exercises.length} exercise{exercises.length !== 1 ? 's' : ''}
          </p>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-4 pb-4 border-t border-border/50 pt-3">
              {session.notes && (
                <p className="text-sm text-muted-foreground mb-3 italic">
                  "{session.notes}"
                </p>
              )}
              
              <div className="space-y-2">
                {exercises.map((exercise) => (
                  <div
                    key={exercise.id}
                    className="bg-secondary/50 rounded-lg p-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">{exercise.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {exercise.weight}kg × {exercise.reps} reps
                          {exercise.rir > 0 && ` @ RIR ${exercise.rir}`}
                        </p>
                      </div>
                      <span className="text-xs text-primary font-medium">
                        {(exercise.weight * exercise.reps).toFixed(0)} vol
                      </span>
                    </div>
                    {exercise.notes && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        {exercise.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
