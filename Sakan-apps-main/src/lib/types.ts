export type MaintenanceCategory = 
  | 'plumbing'
  | 'electrical'
  | 'hvac'
  | 'appliances'
  | 'exterior'
  | 'garden'
  | 'cleaning'
  | 'painting'
  | 'general';

export type TaskStatus = 'on-track' | 'due-soon' | 'overdue';

export type FrequencyUnit = 'days' | 'weeks' | 'months' | 'years';

export interface CompletionRecord {
  id: string;
  date: string;
  notes?: string;
  userId?: string;
  completedByName?: string;
  completedByAvatar?: string | null;
}

export interface MaintenanceTask {
  id: string;
  title: string;
  category: MaintenanceCategory;
  description?: string;
  frequencyValue: number;
  frequencyUnit: FrequencyUnit;
  lastCompleted: string;
  completionHistory: CompletionRecord[];
  notes?: string;
  homeId?: string;
}

export interface Home {
  id: string;
  name: string;
  address?: string;
  color: string;
  icon: string;
}

export const HOME_ICONS = [
  { value: 'home', label: '🏠 Casa' },
  { value: 'building', label: '🏢 Edificio' },
  { value: 'warehouse', label: '🏗️ Bodega' },
  { value: 'tree-palm', label: '🏖️ Playa' },
  { value: 'mountain', label: '⛰️ Montaña' },
  { value: 'store', label: '🏪 Local' },
];

export const HOME_COLORS = [
  '#E97B2C', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#F59E0B', '#06B6D4', '#EF4444',
];

export const CATEGORIES: Record<MaintenanceCategory, { label: string; emoji: string }> = {
  plumbing: { label: 'Plomería', emoji: '🔧' },
  electrical: { label: 'Eléctrico', emoji: '⚡' },
  hvac: { label: 'Climatización', emoji: '❄️' },
  appliances: { label: 'Electrodomésticos', emoji: '🏠' },
  exterior: { label: 'Exterior', emoji: '🏗️' },
  garden: { label: 'Jardín', emoji: '🌿' },
  cleaning: { label: 'Limpieza', emoji: '🧹' },
  painting: { label: 'Pintura', emoji: '🎨' },
  general: { label: 'General', emoji: '🔩' },
};

export const FREQUENCY_LABELS: Record<FrequencyUnit, string> = {
  days: 'días',
  weeks: 'semanas',
  months: 'meses',
  years: 'años',
};
