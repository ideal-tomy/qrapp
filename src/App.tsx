import { useEffect } from 'react';
import { AnimatePresence, LayoutGroup } from 'framer-motion';
import { useStore } from './store/useStore';
import { seedIfEmpty } from './db/seed';
import { GenerateScreen } from './screens/GenerateScreen';
import { LibraryScreen } from './screens/LibraryScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { TabBar } from './components/TabBar';
import { Toast } from './components/Toast';
import { InstallBanner } from './components/InstallBanner';

export default function App() {
  const { activeTab, loadAll } = useStore();

  useEffect(() => {
    void (async () => {
      await seedIfEmpty();
      await loadAll();
    })();
  }, [loadAll]);

  return (
    <LayoutGroup>
      <div className="qr-app-wrapper fixed inset-0 flex flex-col bg-[var(--color-bg)]">
        <InstallBanner />
        <div className="phone-shell flex flex-col flex-1 min-h-0 mx-auto w-full">
          <AnimatePresence mode="wait">
            {activeTab === 'generate' && <GenerateScreen key="generate" />}
            {activeTab === 'library' && <LibraryScreen key="library" />}
            {activeTab === 'settings' && <SettingsScreen key="settings" />}
          </AnimatePresence>
          <TabBar />
        </div>
        <Toast />
      </div>
    </LayoutGroup>
  );
}
