import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { motion, type PanInfo } from 'framer-motion';
import type { QRCode, Category } from '../types';
import { CatIcon } from './CatIcon';
import { haptic, HAPTIC } from '../lib/haptic';
import { getDomain } from '../lib/qr';

export interface SaveData {
  title: string;
  memo?: string;
  categoryId?: string;
  subcategory?: string;
}

interface SaveSheetProps {
  editingQR: QRCode | null;
  url: string;
  categories: Category[];
  onSave: (data: SaveData) => void;
  onClose: () => void;
  onAddCategory?: () => void;
  onAddSubcategory?: (parentId: string) => void;
}

export function SaveSheet({
  editingQR,
  url,
  categories,
  onSave,
  onClose,
  onAddCategory,
  onAddSubcategory,
}: SaveSheetProps) {
  const [title, setTitle] = useState(editingQR?.title ?? '');
  const [memo, setMemo] = useState(editingQR?.memo ?? '');
  const [categoryId, setCategoryId] = useState<string | undefined>(editingQR?.categoryId);
  const [subcategory, setSubcategory] = useState<string | undefined>(editingQR?.subcategory);

  const parentCategories = categories.filter((c) => !c.parentId);
  const subs = categoryId ? categories.filter((c) => c.parentId === categoryId) : [];

  useEffect(() => {
    if (!editingQR && url && !title) {
      setTitle(getDomain(url));
    }
  }, [url, editingQR, title]);

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      memo: memo.trim() || undefined,
      categoryId,
      subcategory,
    });
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
        <h3 className="text-lg font-bold m-0 mb-1">{editingQR ? 'QRを編集' : 'QRを保存'}</h3>
        <p className="text-xs text-white/55 m-0 mb-[18px]">
          {editingQR ? '内容を変更します' : 'タイトルとカテゴリを設定してください'}
        </p>

        <div className="mb-3">
          <label className="input-label">タイトル *</label>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例: 焼肉トラジ 銀座"
          />
        </div>

        <div className="mb-[18px]">
          <label className="input-label">メモ (任意)</label>
          <input className="input" value={memo} onChange={(e) => setMemo(e.target.value)} />
        </div>

        <label className="input-label">カテゴリ</label>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {parentCategories.map((cat) => (
            <motion.button
              key={cat.id}
              type="button"
              whileTap={{ scale: 0.92 }}
              className="cat-tile"
              onClick={() => {
                setCategoryId(cat.id);
                setSubcategory(undefined);
                haptic(HAPTIC.light);
              }}
              style={
                categoryId === cat.id
                  ? { borderColor: cat.color, background: `${cat.color}26` }
                  : undefined
              }
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${cat.color}33` }}
              >
                <CatIcon name={cat.icon} size={16} color={cat.color} />
              </div>
              <div
                className="text-[10px]"
                style={{ color: categoryId === cat.id ? '#fff' : 'rgba(255,255,255,0.6)' }}
              >
                {cat.name}
              </div>
            </motion.button>
          ))}
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            className="cat-tile border-dashed opacity-60"
            onClick={() => {
              haptic(HAPTIC.light);
              onAddCategory?.();
            }}
          >
            <Plus size={16} color="rgba(255,255,255,0.5)" />
            <div className="text-[10px] text-white/50">追加</div>
          </motion.button>
        </div>

        {subs.length > 0 && categoryId && (
          <>
            <label className="input-label">
              サブカテゴリ ({parentCategories.find((c) => c.id === categoryId)?.name})
            </label>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-5 pb-1">
              {subs.map((sub) => (
                <motion.button
                  key={sub.id}
                  type="button"
                  whileTap={{ scale: 0.92 }}
                  className={`chip ${subcategory === sub.name ? 'active' : ''}`}
                  onClick={() => {
                    setSubcategory(subcategory === sub.name ? undefined : sub.name);
                    haptic(HAPTIC.light);
                  }}
                >
                  {sub.name}
                </motion.button>
              ))}
              <motion.button
                type="button"
                whileTap={{ scale: 0.92 }}
                className="chip"
                onClick={() => {
                  haptic(HAPTIC.light);
                  onAddSubcategory?.(categoryId);
                }}
              >
                + 追加
              </motion.button>
            </div>
          </>
        )}

        <motion.button
          type="button"
          className="btn-primary"
          whileTap={{ scale: 0.97 }}
          onClick={handleSubmit}
          disabled={!title.trim()}
        >
          {editingQR ? '更新する' : '保存する'}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
