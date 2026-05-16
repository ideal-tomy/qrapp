import { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { CategoryChips } from '../components/CategoryChips';
import { SubcategoryChips } from '../components/SubcategoryChips';
import { PinnedScroll } from '../components/PinnedScroll';
import {
  filterQRCodes,
  getParentCategories,
  getSubFilterChips,
  isParentCategoryFilter,
} from '../lib/category';
import { loadLibraryFilters, saveLibraryFilters } from '../lib/libraryFilters';
import { QRCard } from '../components/QRCard';
import { ActionSheet } from '../components/ActionSheet';
import { ConfirmSheet } from '../components/ConfirmSheet';
import { FullscreenQR } from '../components/FullscreenQR';
import { SaveSheet, type SaveData } from '../components/SaveSheet';
import {
  CategoryFormSheet,
  type CategoryFormDefaults,
  type CategoryFormResult,
} from '../components/CategoryFormSheet';
import { haptic } from '../lib/haptic';
import { copyURL, shareURL } from '../lib/share';

export function LibraryScreen() {
  const {
    qrcodes,
    categories,
    deleteQR,
    togglePin,
    updateQR,
    incrementUse,
    showToast,
    addCategory,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [subFilter, setSubFilter] = useState<string | null>(null);
  const [pendingSubcategory, setPendingSubcategory] = useState<string | undefined>();
  const filtersRestored = useRef(false);
  const [actionSheetId, setActionSheetId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [fullscreenId, setFullscreenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saveSheetOpen, setSaveSheetOpen] = useState(false);
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [categoryFormDefaults, setCategoryFormDefaults] = useState<CategoryFormDefaults>({});

  const actionQR = actionSheetId ? qrcodes.find((q) => q.id === actionSheetId) ?? null : null;
  const fullscreenQR = fullscreenId ? qrcodes.find((q) => q.id === fullscreenId) ?? null : null;
  const editingQR = editingId ? qrcodes.find((q) => q.id === editingId) ?? null : null;

  useEffect(() => {
    if (filtersRestored.current || categories.length === 0) return;
    const saved = loadLibraryFilters(categories);
    setCategoryFilter(saved.categoryFilter);
    setSubFilter(saved.subFilter);
    filtersRestored.current = true;
  }, [categories]);

  useEffect(() => {
    if (!filtersRestored.current) return;
    saveLibraryFilters({ categoryFilter, subFilter });
  }, [categoryFilter, subFilter]);

  const parentCategories = getParentCategories(categories);

  const showSubChips = isParentCategoryFilter(categoryFilter, categories);

  const subFilterChips = useMemo(
    () => (showSubChips ? getSubFilterChips(categories, categoryFilter, qrcodes) : []),
    [showSubChips, categories, categoryFilter, qrcodes],
  );

  const filteredQR = useMemo(
    () =>
      filterQRCodes(qrcodes, {
        categoryFilter,
        subFilter: showSubChips ? subFilter : undefined,
        searchQuery,
      }),
    [qrcodes, categoryFilter, subFilter, searchQuery, showSubChips],
  );

  const handleCategoryFilterChange = (id: string) => {
    setCategoryFilter(id);
    setSubFilter(null);
  };

  const pinnedQR = qrcodes.filter((q) => q.isPinned);

  const getCategory = (id?: string) => parentCategories.find((c) => c.id === id);

  const sectionLabel =
    categoryFilter === 'pinned'
      ? 'お気に入り'
      : categoryFilter === 'all'
        ? 'すべて'
        : parentCategories.find((c) => c.id === categoryFilter)?.name ?? '';

  const handleCopy = async (url: string) => {
    const ok = await copyURL(url);
    haptic(10);
    showToast(ok ? 'URLをコピーしました' : 'コピーに失敗しました');
  };

  const handleShare = async (url: string, title?: string) => {
    haptic(10);
    const shared = await shareURL(url, title);
    if (!shared) {
      const ok = await copyURL(url);
      showToast(ok ? 'URLをコピーしました' : 'シェアに失敗しました');
    }
  };

  const openActionSheet = (id: string) => {
    setActionSheetId(id);
    incrementUse(id);
  };

  const handleDeleteRequest = (id: string) => {
    setActionSheetId(null);
    setDeleteConfirmId(id);
    haptic(10);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;
    await deleteQR(deleteConfirmId);
    setDeleteConfirmId(null);
    setFullscreenId(null);
    setEditingId(null);
    setSaveSheetOpen(false);
    haptic(15);
    showToast('削除しました');
  };

  const handleSave = async (data: SaveData) => {
    if (!editingId) return;
    await updateQR(editingId, data);
    setSaveSheetOpen(false);
    setEditingId(null);
    showToast('更新しました');
  };

  const handleAddCategory = async ({ name, isSub, parentId }: CategoryFormResult) => {
    const parent = parentId ? categories.find((c) => c.id === parentId) : undefined;
    const added = await addCategory({
      name,
      icon: isSub ? (parent?.icon ?? 'folder') : 'folder',
      color: isSub ? (parent?.color ?? '#14b8a6') : '#14b8a6',
      parentId: isSub ? parentId : undefined,
    });
    setCategoryFormOpen(false);
    setCategoryFormDefaults({});
    if (isSub && parentId) {
      setPendingSubcategory(added.name);
    }
    showToast(isSub ? 'サブカテゴリを追加しました' : 'カテゴリを追加しました');
  };

  return (
    <>
      <motion.div
        key="library"
        className="screen"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.18 }}
      >
        <h1 className="screen-title">保存済み</h1>

        <div className="bg-white/[0.04] border border-white/[0.07] rounded-xl px-3.5 py-2.5 mb-3 flex items-center gap-2.5">
          <Search size={16} className="text-white/40 shrink-0" />
          <input
            className="flex-1 bg-transparent border-0 outline-none text-[#f5f5f7] text-sm font-inherit"
            placeholder="名前・URL・カテゴリ・メモで検索"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <CategoryChips
          categories={categories}
          value={categoryFilter}
          onChange={handleCategoryFilterChange}
        />

        <AnimatePresence>
          {showSubChips && (
            <SubcategoryChips
              chips={subFilterChips}
              value={subFilter}
              onChange={setSubFilter}
            />
          )}
        </AnimatePresence>

        {categoryFilter === 'all' && !searchQuery && (
          <PinnedScroll
            items={pinnedQR}
            onSelect={(id) => setFullscreenId(id)}
            onPress={openActionSheet}
          />
        )}

        <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2.5">
          {sectionLabel} ({filteredQR.length})
        </p>

        <motion.div layout className="flex flex-col gap-2.5">
          <AnimatePresence>
            {filteredQR.map((q) => (
              <QRCard
                key={q.id}
                qr={q}
                category={getCategory(q.categoryId)}
                onPress={() => openActionSheet(q.id)}
              />
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredQR.length === 0 && (
          <p className="text-center py-10 text-white/40 text-sm">該当するQRコードがありません</p>
        )}
      </motion.div>

      <AnimatePresence>
        {actionSheetId && actionQR && (
          <ActionSheet
            qr={actionQR}
            onClose={() => setActionSheetId(null)}
            onOpenQR={() => {
              setFullscreenId(actionSheetId);
              setActionSheetId(null);
            }}
            onTogglePin={async () => {
              await togglePin(actionSheetId);
              setActionSheetId(null);
              showToast(actionQR.isPinned ? 'お気に入りを解除しました' : 'お気に入りに追加しました');
            }}
            onEdit={() => {
              setEditingId(actionSheetId);
              setActionSheetId(null);
              setSaveSheetOpen(true);
            }}
            onDelete={() => handleDeleteRequest(actionSheetId)}
            onCopy={async () => {
              await handleCopy(actionQR.url);
              setActionSheetId(null);
            }}
            onShare={async () => {
              await handleShare(actionQR.url, actionQR.title);
              setActionSheetId(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteConfirmId && (
          <ConfirmSheet
            message="このQRを削除しますか？"
            confirmLabel="削除する"
            danger
            onConfirm={handleDeleteConfirm}
            onCancel={() => setDeleteConfirmId(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {fullscreenId && fullscreenQR && (
          <FullscreenQR
            qr={fullscreenQR}
            category={getCategory(fullscreenQR.categoryId)}
            onClose={() => setFullscreenId(null)}
            onCopy={() => handleCopy(fullscreenQR.url)}
            onShare={() => handleShare(fullscreenQR.url, fullscreenQR.title)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {saveSheetOpen && editingQR && (
          <SaveSheet
            editingQR={editingQR}
            url={editingQR.url}
            categories={categories}
            onSave={handleSave}
            onClose={() => {
              setSaveSheetOpen(false);
              setEditingId(null);
            }}
            onAddCategory={() => {
              setCategoryFormDefaults({ isSub: false });
              setCategoryFormOpen(true);
            }}
            onAddSubcategory={(parentId) => {
              setCategoryFormDefaults({ isSub: true, parentId });
              setCategoryFormOpen(true);
            }}
            pendingSubcategory={pendingSubcategory}
            onPendingSubcategoryConsumed={() => setPendingSubcategory(undefined)}
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
