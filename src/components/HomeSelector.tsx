import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, MapPin, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Home } from '@/lib/types';
import { HOME_ICONS, HOME_COLORS } from '@/lib/types';

interface HomeSelectorProps {
  homes: Home[];
  selectedHomeId: string | null;
  onSelect: (id: string) => void;
  onAdd: (home: Omit<Home, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<Omit<Home, 'id'>>) => void;
  onDelete: (id: string) => void;
}

function HomeForm({
  initial,
  onSubmit,
  submitLabel,
}: {
  initial?: Partial<Home>;
  onSubmit: (data: Omit<Home, 'id'>) => void;
  submitLabel: string;
}) {
  const [name, setName] = useState(initial?.name || '');
  const [address, setAddress] = useState(initial?.address || '');
  const [color, setColor] = useState(initial?.color || HOME_COLORS[0]);
  const [icon, setIcon] = useState(initial?.icon || 'home');

  const handle = () => {
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), address: address.trim() || undefined, color, icon });
  };

  return (
    <div className="space-y-4 py-2">
      <div>
        <Label>Nombre del hogar</Label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Casa principal" className="mt-1" />
      </div>
      <div>
        <Label>Dirección (opcional)</Label>
        <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Ej: Calle 123, Ciudad" className="mt-1" />
      </div>
      <div>
        <Label>Color</Label>
        <div className="flex gap-2 mt-2 flex-wrap">
          {HOME_COLORS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`h-8 w-8 rounded-full transition-all duration-200 ${color === c ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110' : 'hover:scale-105'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      <div>
        <Label>Icono</Label>
        <div className="flex gap-2 mt-2 flex-wrap">
          {HOME_ICONS.map(i => (
            <button
              key={i.value}
              onClick={() => setIcon(i.value)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${icon === i.value ? 'bg-primary text-primary-foreground scale-105' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
            >
              {i.label}
            </button>
          ))}
        </div>
      </div>
      <DialogFooter>
        <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
        <Button onClick={handle} disabled={!name.trim()}>{submitLabel}</Button>
      </DialogFooter>
    </div>
  );
}

function getIconEmoji(icon: string) {
  return HOME_ICONS.find(i => i.value === icon)?.label.split(' ')[0] || '🏠';
}

export function HomeSelector({ homes, selectedHomeId, onSelect, onAdd, onUpdate, onDelete }: HomeSelectorProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [editHome, setEditHome] = useState<Home | null>(null);

  const selected = homes.find(h => h.id === selectedHomeId);

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2 px-3 h-10 font-body">
            {selected ? (
              <>
                <motion.span
                  key={selected.id}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-lg icon-wiggle"
                >
                  {getIconEmoji(selected.icon)}
                </motion.span>
                <span className="font-semibold text-foreground max-w-[120px] truncate">{selected.name}</span>
              </>
            ) : (
              <span className="text-muted-foreground">Seleccionar hogar</span>
            )}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <AnimatePresence>
            {homes.map((home, i) => (
              <DropdownMenuItem
                key={home.id}
                onClick={() => onSelect(home.id)}
                className={`flex items-center gap-3 py-2.5 cursor-pointer ${selectedHomeId === home.id ? 'bg-primary/10' : ''}`}
              >
                <span
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                  style={{ backgroundColor: home.color + '20', color: home.color }}
                >
                  {getIconEmoji(home.icon)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{home.name}</p>
                  {home.address && (
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                      <MapPin className="h-3 w-3 shrink-0" />{home.address}
                    </p>
                  )}
                </div>
                <div className="flex gap-0.5 shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditHome(home); }}
                    className="p-1 rounded hover:bg-muted transition-colors"
                  >
                    <Pencil className="h-3 w-3 text-muted-foreground" />
                  </button>
                  {homes.length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(home.id); }}
                      className="p-1 rounded hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </button>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </AnimatePresence>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setAddOpen(true)} className="gap-2 cursor-pointer text-primary">
            <Plus className="h-4 w-4" />
            Agregar hogar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Add home dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Nuevo hogar</DialogTitle>
          </DialogHeader>
          <HomeForm
            onSubmit={(data) => { onAdd(data); setAddOpen(false); }}
            submitLabel="Agregar"
          />
        </DialogContent>
      </Dialog>

      {/* Edit home dialog */}
      <Dialog open={!!editHome} onOpenChange={(open) => !open && setEditHome(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Editar hogar</DialogTitle>
          </DialogHeader>
          {editHome && (
            <HomeForm
              initial={editHome}
              onSubmit={(data) => { onUpdate(editHome.id, data); setEditHome(null); }}
              submitLabel="Guardar"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
