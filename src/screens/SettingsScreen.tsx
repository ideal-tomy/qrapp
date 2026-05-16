import { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, ChevronRight, Download, Upload, GripVertical } from 'lucide-react';
import { AnimatePresence, motion, Reorder } from 'framer-motion';
import { useStore } from '../store/useStore';
import { CatIcon } from '../components/CatIcon';
import {
  CategoryFormSheet,
  type CategoryFormDefaults,
  type CategoryFormResult,
} from '../components/CategoryFormSheet';
import { CategoryDetailSheet } from '../components/CategoryDetailSheet';
import { downloadBackup, importBackup } from '../lib/backup';
import { haptic, HAPTIC } from '../lib/haptic';
import { getParentCategories, getSubcategories } from '../lib/category';
import { useLongPress } from '../hooks/useLongPress';
import type { Category } from '../types';

export function SettingsScreen() {
  const {
    qrcodes,
    categories,
    addCategory,
    deleteCategory,
    reorderCategories,
    loadAll,
    showToast,
  } = useStore();
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [categoryFormDefaults, setCategoryFormDefaults] = useState<CategoryFormDefaults>({});
  const [detailCategoryId, setDetailCategoryId] = useState<string | null>(null);
  const [parentReorderMode, setParentReorderMode] = useState(false);
  const [orderedParents, setOrderedParents] = useState<Category[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const parentCategories = getParentCategories(categories);
  const detailCategory = detailCategoryId
    ? parentCategories.find((c) => c.id === detailCategoryId) ?? null
    : null;

  const enterParentReorder = useCallback(() => {
    setOrderedParents(getParentCategories(useStore.getState().categories));
    setParentReorderMode(true);
    haptic(HAPTIC.medium);
  }, []);

  const finishParentReorder = useCallback(
    async (save: boolean) => {
      if (save && orderedParents.length > 0) {
        await reorderCategories(orderedParents.map((c) => c.id));
        showToast('並び順を保存しました');
        haptic(HAPTIC.light);
      }
      setParentReorderMode(false);
    },
    [orderedParents, reorderCategories, showToast],
  );

  const longPress = useLongPress(() => {
    if (!parentReorderMode) {
      enterParentReorder();
      showToast('並べ替えモード');
    }
  });

  useEffect(() => {
    if (!parentReorderMode) {
      setOrderedParents(parentCategories);
    }
  }, [parentCategories, parentReorderMode]);

  const openCategoryForm = (defaults: CategoryFormDefaults = {}) => {
    setCategoryFormDefaults(defaults);
    setCategoryFormOpen(true);
  };

  const handleAddCategory = async ({ name, isSub, parentId }: CategoryFormResult) => {
    const parent = parentId ? categories.find((c) => c.id === parentId) : undefined;
    await addCategory({
      name,
      icon: isSub ? (parent?.icon ?? 'folder') : 'folder',
      color: isSub ? (parent?.color ?? '#14b8a6') : '#14b8a6',
      parentId: isSub ? parentId : undefined,
    });
    setCategoryFormOpen(false);
    setCategoryFormDefaults({});
    showToast(isSub ? 'サブカテゴリを追加しました' : 'カテゴリを追加しました');
    haptic(HAPTIC.medium);
  };

  const handleDeleteSub = (subId: string, subName: string) => {
    if (!confirm(`「${subName}」を削除しますか？\nこのサブが付いたQRからサブのみ外れます。`)) return;
    void deleteCategory(subId);
    showToast('サブカテゴリを削除しました');
    haptic(HAPTIC.medium);
  };

  const handleDeleteParent = (cat: Category) => {
    if (!confirm(`「${cat.name}」を削除しますか？\n関連するQRのカテゴリは未設定になります。`)) return;
    void deleteCategory(cat.id);
    setDetailCategoryId(null);
    showToast('カテゴリを削除しました');
    haptic(HAPTIC.medium);
  };

  const handleExport = async () => {
    haptic(HAPTIC.medium);
    await downloadBackup();
    showToast('バックアップをダウンロードしました');
  };

  const handleImport = async (file: File) => {
    if (!confirm('現在のデータを上書きして復元しますか？')) return;
    try {
      const { qrCount, catCount } = await importBackup(file);
      await loadAll();
      showToast(`${qrCount}件のQR・${catCount}件のカテゴリを復元しました`);
      haptic(HAPTIC.success);
    } catch {
      showToast('復元に失敗しました');
      haptic(HAPTIC.error);
    }
  };

  const renderParentRow = (cat: Category, reorderMode: boolean) => {
    const count = qrcodes.filter((q) => q.categoryId === cat.id).length;
    const subCount = getSubcategories(categories, cat.id).length;

    if (reorderMode) {
      return (
        <Reorder.Item
          key={cat.id}
          value={cat}
          className="qr-card py-3 px-3.5 cursor-grab active:cursor-grabbing border-[#14b8a6]/30 list-none"
          whileDrag={{ scale: 1.02, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
        >
          <GripVertical size={18} className="text-white/40 shrink-0" />
          <motion.div
            className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
            style={{ background: `${cat.color}26` }}
          >
            <CatIcon name={cat.icon} size={18} color={cat.color} />
          </motion.div>
          <motion.div className="flex-1">
            <p className="text-sm font-semibold m-0">{cat.name}</p>
            <p className="text-[11px] text-white/50 m-0">
              {count}件{subCount > 0 ? ` · ${subCount}サブ` : ''}
            </p>
          </motion.div>
        </Reorder.Item>
      );
    }

    return (
      <motion.div
        key={cat.id}
        whileTap={{ scale: 0.98 }}
        className="qr-card py-3 px-3.5 cursor-pointer"
        onPointerDown={longPress.onPointerDown}
        onPointerUp={longPress.onPointerUp}
        onPointerLeave={longPress.onPointerLeave}
        onPointerCancel={longPress.onPointerCancel}
        onClick={() => {
          if (longPress.consumeIfLongPress()) return;
          haptic(HAPTIC.light);
          setDetailCategoryId(cat.id);
        }}
      >
        <motion.div
          className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
          style={{ background: `${cat.color}26` }}
        >
          <CatIcon name={cat.icon} size={18} color={cat.color} />
        </motion.div>
        <div className="flex-1">
          <p className="text-sm font-semibold m-0">{cat.name}</p>
          <p className="text-[11px] text-white/50 m-0">
            {count}件{subCount > 0 ? ` · ${subCount}サブ` : ''}
          </p>
        </div>
        <ChevronRight size={18} className="text-white/30" />
      </motion.div>
    );
  };

  return (
    <>
      <motion.div
        key="settings"
        className="screen"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.18 }}
      >
        <h1 className="screen-title">その他</h1>

        <div className="flex items-center justify-between mb-2.5">
          <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider m-0">
            カテゴリ
          </p>
          {parentCategories.length > 0 &&
            (parentReorderMode ? (
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => void finishParentReorder(true)}
                className="text-xs text-[#14b8a6] bg-transparent border-0 cursor-pointer font-inherit p-0"
              >
                完了
              </motion.button>
            ) : (
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={enterParentReorder}
                className="text-xs text-white/50 bg-transparent border-0 cursor-pointer font-inherit p-0"
              >
                並べ替え
              </motion.button>
            ))}
        </div>

        {parentReorderMode && (
          <p className="text-[11px] text-white/40 m-0 mb-2">ドラッグして並べ替え · 長押しでも開始</p>
        )}

        <motion.div className="flex flex-col gap-2 mb-5">
          {parentReorderMode ? (
            <Reorder.Group
              axis="y"
              values={orderedParents}
              onReorder={setOrderedParents}
              className="flex flex-col gap-2 list-none m-0 p-0"
            >
              {orderedParents.map((cat) => renderParentRow(cat, true))}
            </Reorder.Group>
          ) : (
            parentCategories.map((cat) => renderParentRow(cat, false))
          )}

          {!parentReorderMode && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                haptic(HAPTIC.medium);
                openCategoryForm({ isSub: false });
              }}
              className="qr-card border-dashed opacity-70 justify-center bg-transparent cursor-pointer font-inherit"
            >
              <Plus size={16} className="text-white/50" />
              <span className="text-[13px] text-white/60">カテゴリを追加</span>
            </motion.button>
          )}

          {parentReorderMode && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => void finishParentReorder(false)}
              className="qr-card border-dashed opacity-70 justify-center bg-transparent cursor-pointer font-inherit"
            >
              <span className="text-[13px] text-white/60">キャンセル</span>
            </motion.button>
          )}
        </motion.div>

        <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2.5">
          データ
        </p>
        <motion.div className="flex flex-col gap-2 mb-5">
          <motion.div
            whileTap={{ scale: 0.98 }}
            className="qr-card py-3 px-3.5 cursor-pointer"
            onClick={handleExport}
          >
            <Download size={18} color="#14b8a6" />
            <p className="flex-1 text-sm font-medium m-0">バックアップ (JSON)</p>
            <ChevronRight size={18} className="text-white/30" />
          </motion.div>
          <motion.div
            whileTap={{ scale: 0.98 }}
            className="qr-card py-3 px-3.5 cursor-pointer"
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={18} color="#14b8a6" />
            <p className="flex-1 text-sm font-medium m-0">復元</p>
            <ChevronRight size={18} className="text-white/30" />
          </motion.div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImport(file);
              e.target.value = '';
            }}
          />
        </motion.div>

        <p className="text-center text-[11px] text-white/30 mt-8">QRポケット</p>
      </motion.div>

      <AnimatePresence>
        {detailCategory && !parentReorderMode && (
          <CategoryDetailSheet
            category={detailCategory}
            categories={categories}
            qrCount={qrcodes.filter((q) => q.categoryId === detailCategory.id).length}
            onClose={() => setDetailCategoryId(null)}
            onAddSub={() => {
              openCategoryForm({ isSub: true, parentId: detailCategory.id });
            }}
            onDeleteSub={handleDeleteSub}
            onDeleteParent={() => handleDeleteParent(detailCategory)}
            onReorderSubs={(ids) => {
              void reorderCategories(ids, detailCategory.id).then(() => {
                showToast('並び順を保存しました');
              });
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {categoryFormOpen && (
          <CategoryFormSheet
            categories={categories}
            defaults={categoryFormDefaults}
            onSubmit={handleAddCategory}
            onClose={() => {
              setCategoryFormOpen(false);
              setCategoryFormDefaults({});
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
