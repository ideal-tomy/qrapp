import { useCallback, useEffect, useState } from 'react';
import { Trash2, Plus, GripVertical } from 'lucide-react';
import { motion, Reorder, type PanInfo } from 'framer-motion';
import type { Category } from '../types';
import { CatIcon } from './CatIcon';
import { haptic, HAPTIC } from '../lib/haptic';
import { getSubcategories } from '../lib/category';
import { useLongPress } from '../hooks/useLongPress';

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
  const subsFromStore = getSubcategories(categories, category.id);
  const [subReorderMode, setSubReorderMode] = useState(false);
  const [orderedSubs, setOrderedSubs] = useState<Category[]>(subsFromStore);

  useEffect(() => {
    if (!subReorderMode) {
      setOrderedSubs(subsFromStore);
    }
  }, [subsFromStore, subReorderMode]);

  const enterSubReorder = useCallback(() => {
    setOrderedSubs(subsFromStore);
    setSubReorderMode(true);
    haptic(HAPTIC.medium);
  }, [subsFromStore]);

  const finishSubReorder = useCallback(
    (save: boolean) => {
      if (save && orderedSubs.length > 0) {
        onReorderSubs(orderedSubs.map((s) => s.id));
      }
      setSubReorderMode(false);
    },
    [orderedSubs, onReorderSubs],
  );

  const longPress = useLongPress(enterSubReorder);

  const subs = subReorderMode ? orderedSubs : subsFromStore;

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
        drag={subReorderMode ? false : 'y'}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={(_: unknown, info: PanInfo) => {
          if (!subReorderMode && info.offset.y > 120) onClose();
        }}
      >
        <div className="sheet-handle" />
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

        <motion.div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider m-0">
            サブカテゴリ
          </p>
          {subsFromStore.length > 0 &&
            (subReorderMode ? (
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => finishSubReorder(true)}
                className="text-xs text-[#14b8a6] bg-transparent border-0 cursor-pointer font-inherit p-0"
              >
                完了
              </motion.button>
            ) : (
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={enterSubReorder}
                className="text-xs text-white/50 bg-transparent border-0 cursor-pointer font-inherit p-0"
              >
                並べ替え
              </motion.button>
            ))}
        </motion.div>

        {subReorderMode && (
          <p className="text-[11px] text-white/40 m-0 mb-2">ドラッグして並べ替え</p>
        )}

        {subs.length === 0 ? (
          <p className="text-sm text-white/40 mb-3 m-0">サブカテゴリはまだありません</p>
        ) : subReorderMode ? (
          <Reorder.Group
            axis="y"
            values={orderedSubs}
            onReorder={setOrderedSubs}
            className="flex flex-col gap-1.5 mb-3 list-none m-0 p-0"
          >
            {orderedSubs.map((sub) => (
              <Reorder.Item
                key={sub.id}
                value={sub}
                className="flex items-center gap-2 bg-white/[0.04] border border-[#14b8a6]/30 rounded-xl px-3 py-2.5 cursor-grab active:cursor-grabbing"
                whileDrag={{ scale: 1.02, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
              >
                <GripVertical size={16} className="text-white/40 shrink-0" />
                <span className="text-sm flex-1">{sub.name}</span>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        ) : (
          <motion.div className="flex flex-col gap-1.5 mb-3">
            {subs.map((sub) => (
              <motion.div
                key={sub.id}
                className="flex items-center justify-between bg-white/[0.04] border border-white/[0.07] rounded-xl px-3.5 py-2.5"
                onPointerDown={longPress.onPointerDown}
                onPointerUp={longPress.onPointerUp}
                onPointerLeave={longPress.onPointerLeave}
                onPointerCancel={longPress.onPointerCancel}
              >
                <span className="text-sm">{sub.name}</span>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    haptic(HAPTIC.light);
                    onDeleteSub(sub.id, sub.name);
                  }}
                  className="bg-transparent border-0 text-white/40 cursor-pointer p-1"
                  aria-label={`${sub.name}を削除`}
                >
                  <Trash2 size={16} />
                </motion.button>
              </motion.div>
            ))}
          </motion.div>
        )}

        {!subReorderMode && (
          <>
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
          </>
        )}

        {subReorderMode && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => finishSubReorder(false)}
            className="btn-ghost w-full"
          >
            キャンセル
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  );
}
