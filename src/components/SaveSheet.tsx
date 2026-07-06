import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { motion, type PanInfo } from 'framer-motion';
import type { QRCode, Category } from '../types';
import { CatIcon } from './CatIcon';
import { haptic, HAPTIC } from '../lib/haptic';
import { getDomain } from '../lib/qr';
import { getParentCategories, getSubcategories } from '../lib/category';
import { PREFECTURES, categoryNeedsPrefecture } from '../lib/prefecture';

export interface SaveData {
  title: string;
  memo?: string;
  prefecture?: string;
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
  pendingSubcategory?: string;
  onPendingSubcategoryConsumed?: () => void;
}

function isMapsUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return lower.includes('maps.') || lower.includes('goo.gl');
}

export function SaveSheet({
  editingQR,
  url,
  categories,
  onSave,
  onClose,
  onAddCategory,
  onAddSubcategory,
  pendingSubcategory,
  onPendingSubcategoryConsumed,
}: SaveSheetProps) {
  const [title, setTitle] = useState(
    () => editingQR?.title ?? (url ? getDomain(url) : ''),
  );
  const [memo, setMemo] = useState(editingQR?.memo ?? '');
  const [prefecture, setPrefecture] = useState(editingQR?.prefecture ?? '');
  const [categoryId, setCategoryId] = useState<string | undefined>(editingQR?.categoryId);
  const [subcategory, setSubcategory] = useState<string | undefined>(editingQR?.subcategory);

  const parentCategories = getParentCategories(categories);
  const subs = categoryId ? getSubcategories(categories, categoryId) : [];
  const selectedParent = parentCategories.find((c) => c.id === categoryId);
  const showPrefecture = categoryNeedsPrefecture(selectedParent);
  const mapsHint = !editingQR && url && isMapsUrl(url) && title === getDomain(url);

  useEffect(() => {
    if (pendingSubcategory) {
      setSubcategory(pendingSubcategory);
      onPendingSubcategoryConsumed?.();
    }
  }, [pendingSubcategory, onPendingSubcategoryConsumed]);

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      memo: memo.trim() || undefined,
      prefecture: showPrefecture && prefecture ? prefecture : undefined,
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
        className="sheet max-h-[90vh] overflow-y-auto no-scrollbar"
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
        <motion.div className="sheet-handle" role="presentation" />
        <h3 className="text-lg font-bold m-0 mb-1">{editingQR ? 'QRを編集' : 'QRを保存'}</h3>
        <p className="text-xs text-white/55 m-0 mb-[18px]">
          {editingQR ? '内容を変更します' : 'タイトルとカテゴリを設定してください'}
        </p>

        <motion.div className="mb-3">
          <label className="input-label">タイトル *</label>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例: 焼肉トラジ 銀座"
          />
          {mapsHint && (
            <p className="text-[11px] text-[#14b8a6]/90 mt-1.5 m-0">
              Google Maps のURLです。店名・場所名を入力すると探しやすくなります
            </p>
          )}
        </motion.div>

        <motion.div className="mb-[18px]">
          <label className="input-label">特徴・特記事項 (任意)</label>
          <textarea
            className="input min-h-[72px] resize-y leading-relaxed"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="例: 予約必須、駐車場あり、混雑しやすい など"
            rows={3}
          />
        </motion.div>

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
                if (!categoryNeedsPrefecture(cat)) {
                  setPrefecture('');
                }
                haptic(HAPTIC.light);
              }}
              style={
                categoryId === cat.id
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
                className="text-[10px]"
                style={{ color: categoryId === cat.id ? '#fff' : 'rgba(255,255,255,0.6)' }}
              >
                {cat.name}
              </motion.div>
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
            <motion.div className="text-[10px] text-white/50">追加</motion.div>
          </motion.button>
        </div>

        {showPrefecture && (
          <motion.div className="mb-4">
            <label className="input-label">都道府県 (任意)</label>
            <select
              className="input appearance-none cursor-pointer"
              value={prefecture}
              onChange={(e) => setPrefecture(e.target.value)}
            >
              <option value="">選択してください</option>
              {PREFECTURES.map((pref) => (
                <option key={pref} value={pref}>
                  {pref}
                </option>
              ))}
            </select>
          </motion.div>
        )}

        {categoryId && (
          <>
            <label className="input-label">
              サブカテゴリ（任意）{selectedParent ? ` · ${selectedParent.name}` : ''}
            </label>
            <motion.div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-5 pb-1">
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
                className="chip border-dashed"
                onClick={() => {
                  haptic(HAPTIC.light);
                  onAddSubcategory?.(categoryId);
                }}
              >
                その他…
              </motion.button>
            </motion.div>
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
