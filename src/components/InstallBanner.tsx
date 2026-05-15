import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const DISMISS_KEY = 'qr-pocket-install-dismissed';

export function InstallBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in window.navigator &&
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true);
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (!isStandalone && !dismissed) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  return (
    <motion.div
      className="mx-4 mt-2 mb-0 px-3 py-2.5 rounded-xl bg-[#14b8a6]/15 border border-[#14b8a6]/30 flex items-start gap-2 text-xs text-white/80"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <p className="flex-1 m-0 leading-relaxed">
        データを守るため、Safari の共有メニューから「ホーム画面に追加」してください。
      </p>
      <button
        type="button"
        onClick={() => {
          localStorage.setItem(DISMISS_KEY, '1');
          setVisible(false);
        }}
        className="bg-transparent border-0 text-white/50 cursor-pointer p-0 shrink-0"
        aria-label="閉じる"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
}
