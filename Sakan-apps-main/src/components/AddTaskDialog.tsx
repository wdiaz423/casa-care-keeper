import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { CATEGORIES, FREQUENCY_LABELS, type MaintenanceCategory, type FrequencyUnit, type MaintenanceTask } from '@/lib/types';
import { generateId } from '@/lib/maintenance-utils';

interface AddTaskDialogProps {
  onAdd: (task: MaintenanceTask) => void;
}

export function AddTaskDialog({ onAdd }: AddTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<MaintenanceCategory>('general');
  const [description, setDescription] = useState('');
  const [freqValue, setFreqValue] = useState('1');
  const [freqUnit, setFreqUnit] = useState<FrequencyUnit>('months');

  const reset = () => {
    setTitle(''); setCategory('general'); setDescription(''); setFreqValue('1'); setFreqUnit('months');
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    onAdd({
      id: generateId(),
      title: title.trim(),
      category,
      description: description.trim() || undefined,
      frequencyValue: parseInt(freqValue) || 1,
      frequencyUnit: freqUnit,
      lastCompleted: new Date().toISOString(),
      completionHistory: [],
    });
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva tarea
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">Agregar tarea de mantenimiento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="title">Nombre de la tarea</Label>
            <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: Revisar calentador" className="mt-1" />
          </div>
          <div>
            <Label>Categoría</Label>
            <Select value={category} onValueChange={v => setCategory(v as MaintenanceCategory)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORIES).map(([key, val]) => (
                  <SelectItem key={key} value={key}>{val.emoji} {val.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Cada</Label>
              <Input type="number" min="1" value={freqValue} onChange={e => setFreqValue(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Periodo</Label>
              <Select value={freqUnit} onValueChange={v => setFreqUnit(v as FrequencyUnit)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(FREQUENCY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Descripción (opcional)</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Notas adicionales..." className="mt-1" rows={2} />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
          <Button onClick={handleSubmit} disabled={!title.trim()}>Agregar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
