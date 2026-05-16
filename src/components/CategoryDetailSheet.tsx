import { Trash2, Plus } from 'lucide-react';
import { motion, useDragControls, type PanInfo } from 'framer-motion';
import type { Category } from '../types';
import { CatIcon } from './CatIcon';
import { haptic, HAPTIC } from '../lib/haptic';
import { getSubcategories } from '../lib/category';
import { CategoryReorderGroup } from './CategoryReorderGroup';

interface CategoryDetailSheetProps {
  category: Category;
  categories: Category[];
  qrCount: number;
  onClose: () => void;
  onAddSub: () => void;
  onDeleteSub: (subId: string, subName: string) => void;
  onDeleteParent: () => void;
  onReorderSubs: (orderedIds: string[]) => void;
}

export function CategoryDetailSheet({
  category,
  categories,
  qrCount,
  onClose,
  onAddSub,
  onDeleteSub,
  onDeleteParent,
  onReorderSubs,
}: CategoryDetailSheetProps) {
  const subs = getSubcategories(categories, category.id);
  const sheetDrag = useDragControls();

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
        dragListener={false}
        dragControls={sheetDrag}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={(_: unknown, info: PanInfo) => {
          if (info.offset.y > 120) onClose();
        }}
      >
        <div
          className="sheet-handle cursor-grab active:cursor-grabbing"
          style={{ touchAction: 'none' }}
          onPointerDown={(e) => sheetDrag.start(e)}
        />
        <motion.div className="flex items-center gap-3 mb-4">
          <motion.div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${category.color}26` }}
          >
            <CatIcon name={category.icon} size={22} color={category.color} />
          </motion.div>
          <motion.div>
            <h3 className="text-lg font-bold m-0">{category.name}</h3>
            <p className="text-xs text-white/50 m-0 mt-0.5">{qrCount}件のQR</p>
          </motion.div>
        </motion.div>

        <div className="mb-2">
          <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider m-0">
            サブカテゴリ
          </p>
          {subs.length > 0 && (
            <p className="text-[11px] text-white/35 m-0 mt-1">長押しで並べ替え</p>
          )}
        </div>

        {subs.length === 0 ? (
          <p className="text-sm text-white/40 mb-3 m-0">サブカテゴリはまだありません</p>
        ) : (
          <CategoryReorderGroup
            items={subs}
            onOrderChange={onReorderSubs}
            className="flex flex-col list-none m-0 p-0 mb-3"
            itemClassName="flex items-center justify-between bg-white/[0.04] border border-white/[0.07] rounded-xl px-3.5 py-2.5 mb-1.5"
            renderItem={(sub) => (
              <>
                <span className="text-sm flex-1">{sub.name}</span>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    haptic(HAPTIC.light);
                    onDeleteSub(sub.id, sub.name);
                  }}
                  className="bg-transparent border-0 text-white/40 cursor-pointer p-1 shrink-0"
                  aria-label={`${sub.name}を削除`}
                >
                  <Trash2 size={16} />
                </motion.button>
              </>
            )}
          />
        )}

        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            haptic(HAPTIC.light);
            onAddSub();
          }}
          className="btn-ghost w-full mb-4 justify-center"
        >
          <Plus size={16} /> サブカテゴリを追加
        </motion.button>

        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            haptic(HAPTIC.medium);
            onDeleteParent();
          }}
          className="w-full py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-medium cursor-pointer font-inherit"
        >
          「{category.name}」を削除
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
