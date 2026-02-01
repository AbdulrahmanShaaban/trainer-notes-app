import { useNavigate } from 'react-router-dom';
import { ChevronRight, Calendar, Target, AlertTriangle } from 'lucide-react';
import { type Client } from '@/db/database';
import { formatDistanceToNow } from 'date-fns';

interface ClientCardProps {
  client: Client;
}

export default function ClientCard({ client }: ClientCardProps) {
  const navigate = useNavigate();

  const daysSinceStart = Math.floor(
    (Date.now() - new Date(client.startDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <button
      onClick={() => navigate(`/client/${client.id}`)}
      className="w-full glass-card rounded-xl p-4 text-left transition-all duration-300 hover:bg-card hover:glow-primary group"
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
          <span className="text-lg font-bold text-primary-foreground">
            {client.name.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{client.name}</h3>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {daysSinceStart} days
            </span>
            <span className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              {client.goal}
            </span>
          </div>
          {client.injuries && (
            <div className="flex items-center gap-1 mt-1 text-xs text-warning">
              <AlertTriangle className="w-3 h-3" />
              <span className="truncate">{client.injuries}</span>
            </div>
          )}
        </div>

        {/* Arrow */}
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </button>
  );
}
