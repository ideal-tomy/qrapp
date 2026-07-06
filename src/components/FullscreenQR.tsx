import { X, Copy, Share2, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import type { QRCode, Category } from '../types';
import { QRImage } from './QRImage';

interface FullscreenQRProps {
  qr: QRCode | null;
  category: Category | undefined;
  onClose: () => void;
  onCopy: () => void;
  onShare: () => void;
}

export function FullscreenQR({ qr, category, onClose, onCopy, onShare }: FullscreenQRProps) {
  if (!qr) return null;

  return (
    <motion.div
      className="absolute inset-0 z-[80] bg-black flex flex-col items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.button
        type="button"
        onClick={onClose}
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 0.15 } }}
        className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/12 border-0 text-white flex items-center justify-center cursor-pointer"
      >
        <X size={18} />
      </motion.button>

      <motion.div
        layoutId={`qr-${qr.id}-card`}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      >
        <QRImage value={qr.url} size={260} />
      </motion.div>

      <motion.div
        className="mt-6 text-center max-w-[90%]"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
      >
        <p className="text-lg font-semibold mb-1 m-0">{qr.title}</p>
        <p className="text-xs text-white/50 break-all mb-2 m-0">{qr.url}</p>
        {qr.prefecture && (
          <p className="text-xs text-[#14b8a6]/90 mb-2 m-0">{qr.prefecture}</p>
        )}
        {qr.memo && (
          <p className="text-xs text-white/60 mb-2 m-0 leading-relaxed whitespace-pre-wrap text-left bg-white/[0.04] rounded-xl px-3 py-2">
            {qr.memo}
          </p>
        )}
        {category && (
          <span
            className="inline-block text-[11px] px-3 py-1 rounded-full font-medium"
            style={{ background: `${category.color}26`, color: category.color }}
          >
            {category.name}
            {qr.subcategory ? ` / ${qr.subcategory}` : ''}
          </span>
        )}
      </motion.div>

      <motion.div
        className="absolute bottom-[90px] left-6 right-6 flex gap-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.25 } }}
      >
        <motion.button type="button" whileTap={{ scale: 0.95 }} onClick={onCopy} className="btn-ghost">
          <Copy size={14} /> コピー
        </motion.button>
        <motion.button type="button" whileTap={{ scale: 0.95 }} onClick={onShare} className="btn-ghost">
          <Share2 size={14} /> シェア
        </motion.button>
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={() => window.open(qr.url, '_blank')}
          className="btn-ghost"
          style={{ background: '#14b8a6', borderColor: '#14b8a6', color: 'white' }}
        >
          <ExternalLink size={14} /> 開く
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
