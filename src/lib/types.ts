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
  date: string; // ISO date
  notes?: string;
}

export interface MaintenanceTask {
  id: string;
  title: string;
  category: MaintenanceCategory;
  description?: string;
  frequencyValue: number;
  frequencyUnit: FrequencyUnit;
  lastCompleted: string; // ISO date
  completionHistory: CompletionRecord[];
  notes?: string;
}

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
