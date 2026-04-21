import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useHomeMembers } from '@/hooks/use-home-members';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface Props {
  homeId: string | null;
  max?: number;
}

function getInitials(name?: string) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

export function HomeMembersAvatars({ homeId, max = 3 }: Props) {
  const navigate = useNavigate();
  const { members, loading } = useHomeMembers(homeId);

  if (!homeId || loading || members.length === 0) return null;

  const visible = members.slice(0, max);
  const extra = Math.max(0, members.length - max);

  return (
    <button
      onClick={() => navigate('/members')}
      className="flex items-center -space-x-2 hover:-space-x-1 transition-all px-1 group"
      title="Gestionar miembros"
    >
      {visible.map((m, i) => (
        <Tooltip key={m.id}>
          <TooltipTrigger asChild>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="ring-2 ring-card rounded-full"
              style={{ zIndex: max - i }}
            >
              <Avatar className="h-7 w-7 border border-border/30">
                {m.avatarUrl && <AvatarImage src={m.avatarUrl} alt={m.displayName} />}
                <AvatarFallback className="bg-primary/15 text-primary text-[10px] font-semibold">
                  {getInitials(m.displayName)}
                </AvatarFallback>
              </Avatar>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            {m.displayName || 'Usuario'} · {m.role}
          </TooltipContent>
        </Tooltip>
      ))}
      {extra > 0 && (
        <div
          className="h-7 w-7 rounded-full bg-muted ring-2 ring-card flex items-center justify-center text-[10px] font-semibold text-muted-foreground"
          style={{ zIndex: 0 }}
        >
          +{extra}
        </div>
      )}
    </button>
  );
}
