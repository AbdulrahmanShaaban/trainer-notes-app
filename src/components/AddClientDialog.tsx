import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { addClient, addWeightLog } from '@/db/database';
import { toast } from 'sonner';

interface AddClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddClientDialog({ open, onOpenChange }: AddClientDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    height: '',
    startWeight: '',
    goal: '',
    injuries: '',
    startDate: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const clientId = await addClient({
        name: formData.name,
        age: parseInt(formData.age),
        height: parseFloat(formData.height),
        startWeight: parseFloat(formData.startWeight),
        goal: formData.goal,
        injuries: formData.injuries,
        startDate: formData.startDate,
      });

      // Add initial weight log
      await addWeightLog({
        clientId,
        weight: parseFloat(formData.startWeight),
        date: formData.startDate,
      });

      toast.success('Client added successfully!');
      onOpenChange(false);
      setFormData({
        name: '',
        age: '',
        height: '',
        startWeight: '',
        goal: '',
        injuries: '',
        startDate: new Date().toISOString().split('T')[0],
      });
    } catch (error) {
      toast.error('Failed to add client');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border/50 max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              required
              className="bg-secondary border-border/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">Age *</Label>
              <Input
                id="age"
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="25"
                required
                className="bg-secondary border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Height (cm) *</Label>
              <Input
                id="height"
                type="number"
                step="0.1"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                placeholder="175"
                required
                className="bg-secondary border-border/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startWeight">Start Weight (kg) *</Label>
              <Input
                id="startWeight"
                type="number"
                step="0.1"
                value={formData.startWeight}
                onChange={(e) => setFormData({ ...formData, startWeight: e.target.value })}
                placeholder="75"
                required
                className="bg-secondary border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="bg-secondary border-border/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal">Goal *</Label>
            <Input
              id="goal"
              value={formData.goal}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
              placeholder="Lose 10kg, Build muscle, etc."
              required
              className="bg-secondary border-border/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="injuries">Injuries/Limitations</Label>
            <Textarea
              id="injuries"
              value={formData.injuries}
              onChange={(e) => setFormData({ ...formData, injuries: e.target.value })}
              placeholder="Lower back pain, knee issues, etc."
              className="bg-secondary border-border/50 min-h-[80px]"
            />
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
              {isLoading ? 'Adding...' : 'Add Client'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
