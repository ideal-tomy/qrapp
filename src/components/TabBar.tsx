import { QrCode, Bookmark, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { haptic, HAPTIC } from '../lib/haptic';

export function TabBar() {
  const { activeTab, setActiveTab } = useStore();
  const tabs = [
    { id: 'generate' as const, label: '生成', icon: QrCode },
    { id: 'library' as const, label: '保存済み', icon: Bookmark },
    { id: 'settings' as const, label: 'その他', icon: Settings },
  ];

  return (
    <div className="h-[70px] bg-black/85 backdrop-blur-xl border-t border-white/[0.06] grid grid-cols-3 pb-[env(safe-area-inset-bottom)] shrink-0">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id);
              haptic(HAPTIC.light);
            }}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              active ? 'text-[var(--color-accent)]' : 'text-white/35'
            }`}
          >
            <motion.div
              animate={{ scale: active ? 1.1 : 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              <Icon size={22} fill={active && tab.id === 'library' ? 'currentColor' : 'none'} />
            </motion.div>
            <span className="text-[10px] font-semibold">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

