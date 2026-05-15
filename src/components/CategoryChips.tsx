import { motion } from 'framer-motion';
import type { Category } from '../types';
import { haptic, HAPTIC } from '../lib/haptic';

interface CategoryChipsProps {
  categories: Category[];
  value: string;
  onChange: (id: string) => void;
}

export function CategoryChips({ categories, value, onChange }: CategoryChipsProps) {
  const parents = categories.filter((c) => !c.parentId);
  const chips = [
    { id: 'all', label: 'すべて' },
    { id: 'pinned', label: '⭐ お気に入り' },
    ...parents.map((c) => ({ id: c.id, label: c.name })),
  ];

  return (
    <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-3.5">
      {chips.map((chip) => (
        <motion.button
          key={chip.id}
          type="button"
          className={`chip ${value === chip.id ? 'active' : ''}`}
          whileTap={{ scale: 0.94 }}
          onClick={() => {
            onChange(chip.id);
            haptic(HAPTIC.light);
          }}
        >
          {chip.label}
        </motion.button>
      ))}
    </div>
  );
}
