import { Star } from 'lucide-react';
import { motion } from 'framer-motion';
import type { QRCode, Category } from '../types';
import { QRImage } from './QRImage';
import { haptic, HAPTIC } from '../lib/haptic';

interface QRCardProps {
  qr: QRCode;
  category: Category | undefined;
  onPress: () => void;
}

function formatCreatedAt(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const now = new Date();
  if (y === now.getFullYear()) return `${m}/${day}`;
  return `${y}/${m}/${day}`;
}

export function QRCard({ qr, category, onPress }: QRCardProps) {
  return (
    <motion.div
      layout
      layoutId={`card-${qr.id}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className="qr-card"
      onClick={() => {
        onPress();
        haptic(HAPTIC.light);
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
          <span className="text-white/30"> · {formatCreatedAt(qr.createdAt)}</span>
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
    </motion.div>
  );
}
