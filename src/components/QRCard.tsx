import { Star, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import type { QRCode, Category } from '../types';
import { QRImage } from './QRImage';
import { haptic, HAPTIC } from '../lib/haptic';

interface QRCardProps {
  qr: QRCode;
  category: Category | undefined;
  onOpen: () => void;
  onMenu: () => void;
}

export function QRCard({ qr, category, onOpen, onMenu }: QRCardProps) {
  return (
    <motion.div
      layout
      layoutId={`card-${qr.id}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className="qr-card"
      onClick={onOpen}
      onContextMenu={(e: React.MouseEvent) => {
        e.preventDefault();
        onMenu();
        haptic(HAPTIC.medium);
      }}
      whileTap={{ scale: 0.98 }}
    >
      {category && <div className="qr-card-stripe" style={{ background: category.color }} />}
      <QRImage value={qr.url} size={56} layoutId={`qr-${qr.id}-card`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="text-sm font-semibold truncate flex-1 m-0">{qr.title}</p>
          {qr.isPinned && <Star size={11} fill="#fbbf24" color="#fbbf24" />}
        </div>
        <p className="text-[11px] text-white/50 truncate mb-1 m-0">
          {qr.url.replace(/^https?:\/\//, '')}
        </p>
        {category && (
          <span
            className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.06] font-medium"
            style={{ color: category.color }}
          >
            {category.name}
            {qr.subcategory ? ` / ${qr.subcategory}` : ''}
          </span>
        )}
      </div>
      <motion.button
        type="button"
        whileTap={{ scale: 0.9 }}
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          onMenu();
          haptic(10);
        }}
        className="bg-transparent border-0 text-white/40 cursor-pointer p-1"
      >
        <ChevronRight size={18} />
      </motion.button>
    </motion.div>
  );
}
