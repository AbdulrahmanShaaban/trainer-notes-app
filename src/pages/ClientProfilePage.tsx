import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Calendar, Target, Ruler, Weight, 
  AlertTriangle, Plus, TrendingUp, Activity, ClipboardList,
  MoreVertical, Trash2, Edit
} from 'lucide-react';
import { format } from 'date-fns';
import { useClient, useClientSessions, useClientWeightLogs } from '@/hooks/useDatabase';
import { deleteClient } from '@/db/database';
import { getClientStats } from '@/db/analytics';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import SessionsList from '@/components/SessionsList';
import AddSessionDialog from '@/components/AddSessionDialog';
import AnalyticsTab from '@/components/AnalyticsTab';
import WeightLogDialog from '@/components/WeightLogDialog';
import { toast } from 'sonner';

export default function ClientProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const client = useClient(id ? parseInt(id) : undefined);
  const sessions = useClientSessions(id ? parseInt(id) : undefined);
  const weightLogs = useClientWeightLogs(id ? parseInt(id) : undefined);
  
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);
  const [isWeightDialogOpen, setIsWeightDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [stats, setStats] = useState({ totalSessions: 0, totalExercises: 0, lastSessionDate: null as string | null, avgSessionExercises: 0 });

  useEffect(() => {
    if (id) {
      getClientStats(parseInt(id)).then(setStats);
    }
  }, [id, sessions]);

  if (!client) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading client...</p>
      </div>
    );
  }

  const handleDelete = async () => {
    if (!client.id) return;
    try {
      await deleteClient(client.id);
      toast.success('Client deleted');
      navigate('/');
    } catch (error) {
      toast.error('Failed to delete client');
    }
  };

  const currentWeight = weightLogs.length > 0 
    ? weightLogs[weightLogs.length - 1].weight 
    : client.startWeight;
  const weightChange = currentWeight - client.startWeight;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-card border-b border-border/50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm">Back</span>
            </button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-card border-border/50">
                <DropdownMenuItem className="gap-2">
                  <Edit className="w-4 h-4" />
                  Edit Client
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="gap-2 text-destructive focus:text-destructive"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Client
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Profile Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container py-6"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-foreground">
              {client.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">{client.name}</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Target className="w-4 h-4" />
              {client.goal}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          <div className="stat-card text-center">
            <Calendar className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-sm font-bold">{client.age}</p>
            <p className="text-xs text-muted-foreground">Age</p>
          </div>
          <div className="stat-card text-center">
            <Ruler className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-sm font-bold">{client.height}cm</p>
            <p className="text-xs text-muted-foreground">Height</p>
          </div>
          <div className="stat-card text-center">
            <Weight className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-sm font-bold">{currentWeight}kg</p>
            <p className="text-xs text-muted-foreground">Weight</p>
          </div>
          <div className="stat-card text-center">
            <TrendingUp className={`w-4 h-4 mx-auto mb-1 ${weightChange <= 0 ? 'text-success' : 'text-warning'}`} />
            <p className={`text-sm font-bold ${weightChange <= 0 ? 'text-success' : 'text-warning'}`}>
              {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)}
            </p>
            <p className="text-xs text-muted-foreground">Change</p>
          </div>
        </div>

        {/* Injuries Warning */}
        {client.injuries && (
          <div className="glass-card rounded-xl p-3 border-warning/30 bg-warning/5 mb-6">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-warning">Injuries/Limitations</p>
                <p className="text-sm text-muted-foreground">{client.injuries}</p>
              </div>
            </div>
          </div>
        )}

        {/* Training Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="stat-card text-center">
            <Activity className="w-5 h-5 mx-auto mb-2 text-primary" />
            <p className="text-xl font-bold">{stats.totalSessions}</p>
            <p className="text-xs text-muted-foreground">Sessions</p>
          </div>
          <div className="stat-card text-center">
            <ClipboardList className="w-5 h-5 mx-auto mb-2 text-accent" />
            <p className="text-xl font-bold">{stats.totalExercises}</p>
            <p className="text-xs text-muted-foreground">Exercises</p>
          </div>
          <div className="stat-card text-center">
            <Calendar className="w-5 h-5 mx-auto mb-2 text-chart-3" />
            <p className="text-xl font-bold">
              {stats.lastSessionDate 
                ? format(new Date(stats.lastSessionDate), 'dd/MM') 
                : '-'}
            </p>
            <p className="text-xs text-muted-foreground">Last Session</p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="container">
        <Tabs defaultValue="sessions" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-secondary mb-4">
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="weight">Weight</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="sessions" className="space-y-4">
            <SessionsList sessions={sessions} clientId={client.id!} />
          </TabsContent>

          <TabsContent value="weight" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Weight History</h3>
              <Button 
                size="sm" 
                onClick={() => setIsWeightDialogOpen(true)}
                className="gradient-primary"
              >
                <Plus className="w-4 h-4 mr-1" />
                Log Weight
              </Button>
            </div>
            {weightLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Weight className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No weight logs yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {[...weightLogs].reverse().map((log, index) => (
                  <div key={log.id} className="glass-card rounded-lg p-3 flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(log.date), 'MMM dd, yyyy')}
                    </span>
                    <span className="font-bold">{log.weight} kg</span>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsTab clientId={client.id!} weightLogs={weightLogs} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6">
        <Button
          onClick={() => setIsSessionDialogOpen(true)}
          size="lg"
          className="gradient-primary glow-primary rounded-full w-14 h-14 p-0"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>

      <AddSessionDialog
        open={isSessionDialogOpen}
        onOpenChange={setIsSessionDialogOpen}
        clientId={client.id!}
      />

      <WeightLogDialog
        open={isWeightDialogOpen}
        onOpenChange={setIsWeightDialogOpen}
        clientId={client.id!}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="glass-card border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {client.name} and all their sessions, exercises, and weight logs. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
