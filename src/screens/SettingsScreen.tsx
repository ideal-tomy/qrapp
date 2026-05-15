import { useRef, useState } from 'react';
import { Plus, ChevronRight, Download, Upload } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { CatIcon } from '../components/CatIcon';
import { CategoryFormSheet } from '../components/CategoryFormSheet';
import { downloadBackup, importBackup } from '../lib/backup';
import { haptic, HAPTIC } from '../lib/haptic';

export function SettingsScreen() {
  const { qrcodes, categories, addCategory, deleteCategory, loadAll, showToast } = useStore();
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const parentCategories = categories.filter((c) => !c.parentId);

  const handleAddCategory = async (name: string) => {
    await addCategory({
      name,
      icon: 'folder',
      color: '#14b8a6',
    });
    setCategoryFormOpen(false);
    showToast('カテゴリを追加しました');
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

        <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2.5">
          カテゴリ
        </p>
        <div className="flex flex-col gap-2 mb-5">
          {parentCategories.map((cat) => {
            const count = qrcodes.filter((q) => q.categoryId === cat.id).length;
            const subCount = categories.filter((c) => c.parentId === cat.id).length;
            return (
              <motion.div
                key={cat.id}
                whileTap={{ scale: 0.98 }}
                className="qr-card py-3 px-3.5"
                onClick={() => {
                  if (confirm(`「${cat.name}」を削除しますか？\n関連するQRのカテゴリは未設定になります。`)) {
                    deleteCategory(cat.id);
                    showToast('カテゴリを削除しました');
                    haptic(HAPTIC.medium);
                  }
                }}
              >
                <div
                  className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                  style={{ background: `${cat.color}26` }}
                >
                  <CatIcon name={cat.icon} size={18} color={cat.color} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold m-0">{cat.name}</p>
                  <p className="text-[11px] text-white/50 m-0">
                    {count}件{subCount > 0 ? ` · ${subCount}サブ` : ''}
                  </p>
                </div>
                <ChevronRight size={18} className="text-white/30" />
              </motion.div>
            );
          })}
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              haptic(HAPTIC.medium);
              setCategoryFormOpen(true);
            }}
            className="qr-card border-dashed opacity-70 justify-center bg-transparent cursor-pointer font-inherit"
          >
            <Plus size={16} className="text-white/50" />
            <span className="text-[13px] text-white/60">カテゴリを追加</span>
          </motion.button>
        </div>

        <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2.5">
          データ
        </p>
        <div className="flex flex-col gap-2 mb-5">
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
        </div>

        <p className="text-center text-[11px] text-white/30 mt-8">QRポケット</p>
      </motion.div>

      <AnimatePresence>
        {categoryFormOpen && (
          <CategoryFormSheet
            title="カテゴリを追加"
            onSubmit={handleAddCategory}
            onClose={() => setCategoryFormOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
