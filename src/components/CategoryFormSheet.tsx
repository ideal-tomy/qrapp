import { useState } from 'react';
import { motion, type PanInfo } from 'framer-motion';
import type { Category } from '../types';
import { CatIcon } from './CatIcon';
import { haptic, HAPTIC } from '../lib/haptic';
import { getParentCategories } from '../lib/category';

export interface CategoryFormDefaults {
  isSub?: boolean;
  parentId?: string;
}

export interface CategoryFormResult {
  name: string;
  isSub: boolean;
  parentId?: string;
}

interface CategoryFormSheetProps {
  categories: Category[];
  defaults?: CategoryFormDefaults;
  onSubmit: (data: CategoryFormResult) => void;
  onClose: () => void;
}

export function CategoryFormSheet({
  categories,
  defaults = {},
  onSubmit,
  onClose,
}: CategoryFormSheetProps) {
  const parentCategories = getParentCategories(categories);
  const initialIsSub = defaults.isSub ?? false;
  const initialParentId =
    defaults.parentId ?? (initialIsSub && parentCategories[0] ? parentCategories[0].id : undefined);

  const [name, setName] = useState('');
  const [isSub, setIsSub] = useState(initialIsSub);
  const [parentId, setParentId] = useState<string | undefined>(initialParentId);

  const canSubmit = name.trim() && (!isSub || parentId);

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      name: name.trim(),
      isSub,
      parentId: isSub ? parentId : undefined,
    });
    haptic(HAPTIC.medium);
  };

  const switchToSub = () => {
    setIsSub(true);
    if (!parentId && parentCategories[0]) {
      setParentId(parentCategories[0].id);
    }
    haptic(HAPTIC.light);
  };

  const switchToParent = () => {
    setIsSub(false);
    haptic(HAPTIC.light);
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
        <motion.div className="sheet-handle" />
        <h3 className="text-lg font-bold m-0 mb-4">カテゴリを追加</h3>

        <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2">
          種類
        </p>
        <div className="flex gap-2 mb-4">
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={switchToParent}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium cursor-pointer font-inherit border ${
              !isSub
                ? 'bg-[#14b8a6]/20 border-[#14b8a6] text-[#14b8a6]'
                : 'bg-white/[0.04] border-white/[0.08] text-white/60'
            }`}
          >
            親カテゴリ
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={switchToSub}
            disabled={parentCategories.length === 0}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium cursor-pointer font-inherit border disabled:opacity-40 ${
              isSub
                ? 'bg-[#14b8a6]/20 border-[#14b8a6] text-[#14b8a6]'
                : 'bg-white/[0.04] border-white/[0.08] text-white/60'
            }`}
          >
            サブカテゴリ
          </motion.button>
        </div>

        {isSub && (
          <>
            <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2">
              親を選択
            </p>
            <motion.div className="grid grid-cols-4 gap-2 mb-4 max-h-[140px] overflow-y-auto no-scrollbar">
              {parentCategories.map((cat) => (
                <motion.button
                  key={cat.id}
                  type="button"
                  whileTap={{ scale: 0.92 }}
                  className="cat-tile"
                  onClick={() => {
                    setParentId(cat.id);
                    haptic(HAPTIC.light);
                  }}
                  style={
                    parentId === cat.id
                      ? { borderColor: cat.color, background: `${cat.color}26` }
                      : undefined
                  }
                >
                  <motion.div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: `${cat.color}33` }}
                  >
                    <CatIcon name={cat.icon} size={16} color={cat.color} />
                  </motion.div>
                  <motion.div
                    className="text-[10px] truncate w-full text-center"
                    style={{
                      color: parentId === cat.id ? '#fff' : 'rgba(255,255,255,0.6)',
                    }}
                  >
                    {cat.name}
                  </motion.div>
                </motion.button>
              ))}
            </motion.div>
          </>
        )}

        <motion.div className="mb-4">
          <label className="input-label">名前 *</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={isSub ? '例: ラーメン' : '例: イベント'}
            autoFocus
          />
        </motion.div>

        <motion.button
          type="button"
          className="btn-primary"
          whileTap={{ scale: 0.97 }}
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          追加する
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
