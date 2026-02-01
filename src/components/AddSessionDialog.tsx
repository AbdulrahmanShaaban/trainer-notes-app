import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { addSession, addExercise } from '@/db/database';
import { toast } from 'sonner';

interface ExerciseEntry {
  id: string;
  name: string;
  weight: string;
  reps: string;
  rir: string;
  notes: string;
}

interface AddSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: number;
}

export default function AddSessionDialog({ open, onOpenChange, clientId }: AddSessionDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionNotes, setSessionNotes] = useState('');
  const [exercises, setExercises] = useState<ExerciseEntry[]>([
    { id: crypto.randomUUID(), name: '', weight: '', reps: '', rir: '', notes: '' },
  ]);

  const addExerciseEntry = () => {
    setExercises([
      ...exercises,
      { id: crypto.randomUUID(), name: '', weight: '', reps: '', rir: '', notes: '' },
    ]);
  };

  const removeExerciseEntry = (id: string) => {
    if (exercises.length > 1) {
      setExercises(exercises.filter((e) => e.id !== id));
    }
  };

  const updateExercise = (id: string, field: keyof ExerciseEntry, value: string) => {
    setExercises(
      exercises.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validExercises = exercises.filter(
      (ex) => ex.name.trim() && ex.weight && ex.reps
    );
    
    if (validExercises.length === 0) {
      toast.error('Add at least one exercise with name, weight, and reps');
      return;
    }

    setIsLoading(true);

    try {
      const sessionId = await addSession({
        clientId,
        date: sessionDate,
        notes: sessionNotes,
      });

      for (let i = 0; i < validExercises.length; i++) {
        const ex = validExercises[i];
        await addExercise({
          sessionId,
          name: ex.name,
          weight: parseFloat(ex.weight),
          reps: parseInt(ex.reps),
          rir: ex.rir ? parseInt(ex.rir) : 0,
          notes: ex.notes,
          order: i,
        });
      }

      toast.success('Session logged successfully!');
      onOpenChange(false);
      
      // Reset form
      setSessionDate(new Date().toISOString().split('T')[0]);
      setSessionNotes('');
      setExercises([
        { id: crypto.randomUUID(), name: '', weight: '', reps: '', rir: '', notes: '' },
      ]);
    } catch (error) {
      toast.error('Failed to log session');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border/50 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Session</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="bg-secondary border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label>Session Notes</Label>
              <Input
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="General notes..."
                className="bg-secondary border-border/50"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-base">Exercises</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addExerciseEntry}
                className="text-primary"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>

            <AnimatePresence mode="popLayout">
              {exercises.map((exercise, index) => (
                <motion.div
                  key={exercise.id}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-secondary/50 rounded-xl p-4 space-y-3 relative"
                >
                  {exercises.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeExerciseEntry(exercise.id)}
                      className="absolute top-2 right-2 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}

                  <div className="pr-6">
                    <Label className="text-xs text-muted-foreground">
                      Exercise {index + 1}
                    </Label>
                    <Input
                      value={exercise.name}
                      onChange={(e) => updateExercise(exercise.id, 'name', e.target.value)}
                      placeholder="Bench Press, Squat, etc."
                      className="bg-background border-border/50 mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Weight (kg)</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={exercise.weight}
                        onChange={(e) => updateExercise(exercise.id, 'weight', e.target.value)}
                        placeholder="0"
                        className="bg-background border-border/50 mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Reps</Label>
                      <Input
                        type="number"
                        value={exercise.reps}
                        onChange={(e) => updateExercise(exercise.id, 'reps', e.target.value)}
                        placeholder="0"
                        className="bg-background border-border/50 mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">RIR</Label>
                      <Input
                        type="number"
                        min="0"
                        max="10"
                        value={exercise.rir}
                        onChange={(e) => updateExercise(exercise.id, 'rir', e.target.value)}
                        placeholder="0"
                        className="bg-background border-border/50 mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Notes</Label>
                    <Input
                      value={exercise.notes}
                      onChange={(e) => updateExercise(exercise.id, 'notes', e.target.value)}
                      placeholder="Form notes, pain, etc."
                      className="bg-background border-border/50 mt-1"
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 gradient-primary"
            >
              {isLoading ? 'Saving...' : 'Save Session'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
