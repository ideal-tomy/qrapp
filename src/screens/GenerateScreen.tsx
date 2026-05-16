import { useState } from 'react';
import { QrCode, Clipboard, Copy, Share2, Bookmark } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { normalizeURL } from '../lib/qr';
import { haptic, HAPTIC } from '../lib/haptic';
import { copyURL, shareURL } from '../lib/share';
import { useStore } from '../store/useStore';
import { QRImage } from '../components/QRImage';
import { SaveSheet, type SaveData } from '../components/SaveSheet';
import { SuccessFlash } from '../components/SuccessFlash';
import {
  CategoryFormSheet,
  type CategoryFormDefaults,
  type CategoryFormResult,
} from '../components/CategoryFormSheet';

export function GenerateScreen() {
  const { categories, addQR, updateQR, setActiveTab, showToast, addCategory } = useStore();
  const [urlInput, setUrlInput] = useState('');
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [saveSheetOpen, setSaveSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [successFlash, setSuccessFlash] = useState(false);
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [categoryFormDefaults, setCategoryFormDefaults] = useState<CategoryFormDefaults>({});
  const [pendingSubcategory, setPendingSubcategory] = useState<string | undefined>();

  const editingQR = editingId ? useStore.getState().qrcodes.find((q) => q.id === editingId) ?? null : null;

  const handleGenerate = () => {
    const url = normalizeURL(urlInput);
    if (!url) return;
    setGeneratedUrl(url);
    haptic(10);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrlInput(text);
        haptic(HAPTIC.light);
      }
    } catch {
      /* permission denied */
    }
  };

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

  const handleSave = async (data: SaveData) => {
    if (editingId) {
      await updateQR(editingId, data);
      setSaveSheetOpen(false);
      setEditingId(null);
      showToast('更新しました');
      return;
    }

    await addQR({ url: generatedUrl, ...data });
    setSaveSheetOpen(false);
    setSuccessFlash(true);
    haptic(HAPTIC.success);
    setTimeout(() => {
      setSuccessFlash(false);
      setActiveTab('library');
      setGeneratedUrl('');
      setUrlInput('');
    }, 1000);
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
        key="generate"
        className="screen"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.18 }}
      >
        <h1 className="screen-title">QR生成</h1>

        <div className="card mb-3.5">
          <div className="flex gap-2 mb-3">
            <input
              className="input flex-1"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="URLを入力またはペースト"
            />
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={handlePaste}
              className="w-[46px] shrink-0 bg-[#14b8a6]/15 border border-[#14b8a6]/30 rounded-[10px] text-[#14b8a6] flex items-center justify-center cursor-pointer"
            >
              <Clipboard size={18} />
            </motion.button>
          </div>
          <motion.button
            type="button"
            className="btn-primary"
            whileTap={{ scale: 0.97 }}
            onClick={handleGenerate}
            disabled={!urlInput.trim()}
          >
            <QrCode size={18} />
            生成
          </motion.button>
        </div>

        <AnimatePresence>
          {generatedUrl && (
            <motion.div
              className="card text-center"
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            >
              <div className="inline-block mb-3.5">
                <QRImage value={generatedUrl} size={180} layoutId="preview-qr" />
              </div>
              <p className="text-xs text-white/60 mb-3.5 break-all px-3 m-0">{generatedUrl}</p>
              <div className="flex gap-2">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCopy(generatedUrl)}
                  className="btn-ghost"
                >
                  <Copy size={14} /> コピー
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleShare(generatedUrl)}
                  className="btn-ghost"
                >
                  <Share2 size={14} /> シェア
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    haptic(HAPTIC.medium);
                    setSaveSheetOpen(true);
                  }}
                  className="btn-ghost"
                  style={{ background: '#14b8a6', borderColor: '#14b8a6', color: 'white' }}
                >
                  <Bookmark size={14} /> 保存
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {saveSheetOpen && (
          <SaveSheet
            editingQR={editingQR}
            url={generatedUrl}
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

      <SuccessFlash show={successFlash} />
    </>
  );
}
