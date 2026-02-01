import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, User, Search, Dumbbell } from 'lucide-react';
import { useClients } from '@/hooks/useDatabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ClientCard from '@/components/ClientCard';
import AddClientDialog from '@/components/AddClientDialog';

export default function ClientsPage() {
  const clients = useClients();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-card border-b border-border/50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-lg">FitCoach Pro</h1>
                <p className="text-xs text-muted-foreground">Personal Training Manager</p>
              </div>
            </div>
            <Button 
              onClick={() => setIsAddDialogOpen(true)}
              className="gradient-primary glow-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-6">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary border-border/50 focus:border-primary"
          />
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="stat-card text-center">
            <p className="text-2xl font-bold text-primary">{clients.length}</p>
            <p className="text-xs text-muted-foreground">Active Clients</p>
          </div>
          <div className="stat-card text-center">
            <p className="text-2xl font-bold text-accent">
              {clients.filter(c => {
                const days = Math.floor((Date.now() - new Date(c.startDate).getTime()) / (1000 * 60 * 60 * 24));
                return days <= 30;
              }).length}
            </p>
            <p className="text-xs text-muted-foreground">New This Month</p>
          </div>
          <div className="stat-card text-center">
            <p className="text-2xl font-bold text-chart-3">0</p>
            <p className="text-xs text-muted-foreground">Sessions Today</p>
          </div>
        </div>

        {/* Clients List */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredClients.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <div className="w-20 h-20 rounded-full bg-secondary mx-auto mb-4 flex items-center justify-center">
                  <User className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">No clients yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add your first client to get started
                </p>
                <Button 
                  onClick={() => setIsAddDialogOpen(true)}
                  className="gradient-primary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Client
                </Button>
              </motion.div>
            ) : (
              filteredClients.map((client, index) => (
                <motion.div
                  key={client.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ClientCard client={client} />
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </main>

      <AddClientDialog 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen} 
      />
    </div>
  );
}
