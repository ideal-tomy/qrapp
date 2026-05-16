import { motion, type PanInfo } from 'framer-motion';

interface ConfirmSheetProps {
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmSheet({
  message,
  confirmLabel = '削除する',
  cancelLabel = 'キャンセル',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmSheetProps) {
  return (
    <motion.div
      className="sheet-overlay"
      style={{ zIndex: 110 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
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
          if (info.offset.y > 100) onCancel();
        }}
      >
        <motion.div className="sheet-handle" />
        <p className="text-[15px] font-semibold leading-relaxed m-0 mb-5 text-center px-1">
          {message}
        </p>
        <div className="flex flex-col gap-2">
          <motion.button
            type="button"
            className="btn-primary"
            style={danger ? { background: '#dc2626' } : undefined}
            whileTap={{ scale: 0.97 }}
            onClick={onConfirm}
          >
            {confirmLabel}
          </motion.button>
          <motion.button
            type="button"
            className="btn-ghost w-full"
            whileTap={{ scale: 0.97 }}
            onClick={onCancel}
          >
            {cancelLabel}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
