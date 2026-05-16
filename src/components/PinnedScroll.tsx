import { Star } from 'lucide-react';
import { motion } from 'framer-motion';
import type { QRCode } from '../types';
import { QRImage } from './QRImage';
import { haptic, HAPTIC } from '../lib/haptic';

interface PinnedScrollProps {
  items: QRCode[];
  onSelect: (id: string) => void;
  onPress?: (id: string) => void;
}

export function PinnedScroll({ items, onSelect, onPress }: PinnedScrollProps) {
  if (items.length === 0) return null;

  return (
    <div className="mb-[18px]">
      <div className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2.5 flex items-center gap-1">
        <Star size={11} fill="currentColor" /> お気に入り
      </div>
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
        {items.map((q) => (
          <motion.button
            key={q.id}
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={() => {
              if (onPress) {
                onPress(q.id);
              } else {
                onSelect(q.id);
              }
              haptic(HAPTIC.light);
            }}
            className="shrink-0 w-20 bg-white/[0.04] border border-white/[0.07] rounded-xl p-1.5 cursor-pointer font-inherit"
          >
            <QRImage value={q.url} size={68} layoutId={`qr-${q.id}-pinned`} />
            <p className="text-[10px] text-white/70 mt-1 truncate m-0">{q.title}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
