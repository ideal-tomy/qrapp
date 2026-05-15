import { Check } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface SuccessFlashProps {
  show: boolean;
}

export function SuccessFlash({ show }: SuccessFlashProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="absolute inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-[100px] h-[100px] rounded-full bg-[#14b8a6] flex items-center justify-center shadow-[0_20px_60px_rgba(20,184,166,0.5)]"
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          >
            <Check size={50} color="white" strokeWidth={3} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
