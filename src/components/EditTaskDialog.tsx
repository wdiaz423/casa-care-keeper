import { useState, useEffect } from 'react';
import { Pencil } from 'lucide-react';
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

interface EditTaskDialogProps {
  task: MaintenanceTask;
  onSave: (id: string, updates: Partial<MaintenanceTask>) => void;
}

export function EditTaskDialog({ task, onSave }: EditTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [category, setCategory] = useState<MaintenanceCategory>(task.category);
  const [description, setDescription] = useState(task.description || '');
  const [freqValue, setFreqValue] = useState(String(task.frequencyValue));
  const [freqUnit, setFreqUnit] = useState<FrequencyUnit>(task.frequencyUnit);

  useEffect(() => {
    if (open) {
      setTitle(task.title);
      setCategory(task.category);
      setDescription(task.description || '');
      setFreqValue(String(task.frequencyValue));
      setFreqUnit(task.frequencyUnit);
    }
  }, [open, task]);

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSave(task.id, {
      title: title.trim(),
      category,
      description: description.trim() || undefined,
      frequencyValue: parseInt(freqValue) || 1,
      frequencyUnit: freqUnit,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:bg-muted hover:text-foreground" title="Editar">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">Editar tarea</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="edit-title">Nombre de la tarea</Label>
            <Input id="edit-title" value={title} onChange={e => setTitle(e.target.value)} className="mt-1" />
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
            <Textarea value={description} onChange={e => setDescription(e.target.value)} className="mt-1" rows={2} />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
          <Button onClick={handleSubmit} disabled={!title.trim()}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
