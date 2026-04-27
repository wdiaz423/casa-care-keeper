import { CATEGORIES, type MaintenanceCategory } from '@/lib/types';

interface CategoryBadgeProps {
  category: MaintenanceCategory;
  size?: 'sm' | 'md';
}

export function CategoryBadge({ category, size = 'sm' }: CategoryBadgeProps) {
  const cat = CATEGORIES[category] || { emoji: '📋', label: category || 'General' };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-secondary text-secondary-foreground font-body font-medium ${
      size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'
    }`}>
      <span>{cat.emoji}</span>
      <span>{cat.label}</span>
    </span>
  );
}


