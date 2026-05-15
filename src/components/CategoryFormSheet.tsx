import { useState } from 'react';
import { motion, type PanInfo } from 'framer-motion';
import { haptic, HAPTIC } from '../lib/haptic';

interface CategoryFormSheetProps {
  title: string;
  placeholder?: string;
  onSubmit: (name: string) => void;
  onClose: () => void;
}

export function CategoryFormSheet({
  title,
  placeholder = 'カテゴリ名',
  onSubmit,
  onClose,
}: CategoryFormSheetProps) {
  const [name, setName] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit(name.trim());
    haptic(HAPTIC.medium);
  };

  return (
    <motion.div
      className="sheet-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="sheet"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={(_: unknown, info: PanInfo) => {
          if (info.offset.y > 120) onClose();
        }}
      >
        <div className="sheet-handle" />
        <h3 className="text-lg font-bold m-0 mb-4">{title}</h3>
        <div className="mb-4">
          <label className="input-label">名前 *</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={placeholder}
            autoFocus
          />
        </div>
        <motion.button
          type="button"
          className="btn-primary"
          whileTap={{ scale: 0.97 }}
          onClick={handleSubmit}
          disabled={!name.trim()}
        >
          追加する
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
