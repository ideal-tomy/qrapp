import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../store/useStore';

export function Toast() {
  const toast = useStore((s) => s.toast);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          className="toast"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
          {toast}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
