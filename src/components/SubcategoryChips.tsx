import { motion } from 'framer-motion';
import { haptic, HAPTIC } from '../lib/haptic';
import type { SubFilterChip } from '../lib/category';

interface SubcategoryChipsProps {
  chips: SubFilterChip[];
  value: string | null;
  onChange: (subFilter: string | null) => void;
}

export function SubcategoryChips({ chips, value, onChange }: SubcategoryChipsProps) {
  if (chips.length <= 1) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="flex gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-3"
    >
      {chips.map((chip) => {
        const isAll = chip.id === 'all';
        const active = isAll ? value === null : value === chip.id;
        return (
          <motion.button
            key={chip.id}
            type="button"
            className={`chip ${active ? 'active' : ''}`}
            whileTap={{ scale: 0.94 }}
            onClick={() => {
              onChange(isAll ? null : chip.id);
              haptic(HAPTIC.light);
            }}
          >
            {chip.label}
          </motion.button>
        );
      })}
    </motion.div>
  );
}
