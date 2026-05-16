import { Copy, Share2, Star, Edit3, Trash2, Maximize2 } from 'lucide-react';
import { motion, type PanInfo } from 'framer-motion';
import type { QRCode } from '../types';
import { QRImage } from './QRImage';

interface ActionSheetProps {
  qr: QRCode | null;
  onClose: () => void;
  onOpenQR: () => void;
  onTogglePin: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCopy: () => void;
  onShare: () => void;
}

export function ActionSheet({
  qr,
  onClose,
  onOpenQR,
  onTogglePin,
  onEdit,
  onDelete,
  onCopy,
  onShare,
}: ActionSheetProps) {
  if (!qr) return null;

  const items = [
    { icon: Maximize2, label: 'QRを表示', onClick: onOpenQR },
    { icon: Copy, label: 'URLをコピー', onClick: onCopy },
    { icon: Share2, label: 'シェア', onClick: onShare },
    {
      icon: Star,
      label: qr.isPinned ? 'お気に入り解除' : 'お気に入りに追加',
      onClick: onTogglePin,
      color: '#fbbf24',
    },
    { icon: Edit3, label: '編集', onClick: onEdit },
    { icon: Trash2, label: '削除', onClick: onDelete, danger: true },
  ];

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
          if (info.offset.y > 100) onClose();
        }}
      >
        <div className="sheet-handle" />

        <div className="flex gap-3 items-center mb-[18px]">
          <QRImage value={qr.url} size={50} />
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold mb-0.5 m-0">{qr.title}</p>
            <p className="text-[11px] text-white/50 truncate m-0">
              {qr.url.replace(/^https?:\/\//, '')}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-0.5">
          {items.map((item, i) => {
            const Icon = item.icon;
            const radius =
              i === 0
                ? 'rounded-t-xl rounded-b'
                : i === items.length - 1
                  ? 'rounded-b-xl rounded-t'
                  : 'rounded';
            return (
              <motion.button
                key={item.label}
                type="button"
                whileTap={{ scale: 0.97, backgroundColor: 'rgba(255,255,255,0.08)' }}
                onClick={item.onClick}
                className={`p-3.5 bg-white/[0.04] border border-white/[0.06] flex items-center gap-3 cursor-pointer font-inherit text-sm font-medium ${radius}`}
                style={{ color: item.danger ? '#f87171' : (item.color ?? '#f5f5f7') }}
              >
                <Icon size={18} />
                {item.label}
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
