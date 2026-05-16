import { useCallback, useRef, useState } from 'react';
import { Plus, ChevronRight, Download, Upload } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { CatIcon } from '../components/CatIcon';
import {
  CategoryFormSheet,
  type CategoryFormDefaults,
  type CategoryFormResult,
} from '../components/CategoryFormSheet';
import { CategoryDetailSheet } from '../components/CategoryDetailSheet';
import { CategoryReorderGroup } from '../components/CategoryReorderGroup';
import { downloadBackup, importBackup } from '../lib/backup';
import { haptic, HAPTIC } from '../lib/haptic';
import { getParentCategories, getSubcategories } from '../lib/category';
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
  const fileRef = useRef<HTMLInputElement>(null);

  const parentCategories = getParentCategories(categories);
  const detailCategory = detailCategoryId
    ? parentCategories.find((c) => c.id === detailCategoryId) ?? null
    : null;

  const handleParentReorder = useCallback(
    (orderedIds: string[]) => {
      void reorderCategories(orderedIds);
    },
    [reorderCategories],
  );

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

  const renderParentRowContent = (cat: Category) => {
    const count = qrcodes.filter((q) => q.categoryId === cat.id).length;
    const subCount = getSubcategories(categories, cat.id).length;

    return (
      <>
        <motion.div
          className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
          style={{ background: `${cat.color}26` }}
        >
          <CatIcon name={cat.icon} size={18} color={cat.color} />
        </motion.div>
        <motion.div className="flex-1 min-w-0">
          <p className="text-sm font-semibold m-0">{cat.name}</p>
          <p className="text-[11px] text-white/50 m-0">
            {count}件{subCount > 0 ? ` · ${subCount}サブ` : ''}
          </p>
        </motion.div>
        <ChevronRight size={18} className="text-white/30 shrink-0" />
      </>
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

        <div className="mb-2.5">
          <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider m-0">
            カテゴリ
          </p>
          {parentCategories.length > 0 && (
            <p className="text-[11px] text-white/35 m-0 mt-1">長押しで並べ替え</p>
          )}
        </div>

        <motion.div className="flex flex-col mb-5">
          {parentCategories.length > 0 && (
            <CategoryReorderGroup
              items={parentCategories}
              onOrderChange={handleParentReorder}
              onItemClick={(cat) => {
                haptic(HAPTIC.light);
                setDetailCategoryId(cat.id);
              }}
              className="flex flex-col list-none m-0 p-0"
              itemClassName="qr-card py-3 px-3.5 mb-2 cursor-pointer"
              renderItem={renderParentRowContent}
            />
          )}

          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              haptic(HAPTIC.medium);
              openCategoryForm({ isSub: false });
            }}
            className="qr-card border-dashed opacity-70 justify-center bg-transparent cursor-pointer font-inherit mt-0"
          >
            <Plus size={16} className="text-white/50" />
            <span className="text-[13px] text-white/60">カテゴリを追加</span>
          </motion.button>
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
        {detailCategory && (
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
              void reorderCategories(ids, detailCategory.id);
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
