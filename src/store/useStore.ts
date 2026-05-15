import { create } from 'zustand';
import { db } from '../db/schema';
import type { QRCode, Category } from '../types';

interface AppState {
  qrcodes: QRCode[];
  categories: Category[];

  activeTab: 'generate' | 'library' | 'settings';
  setActiveTab: (tab: AppState['activeTab']) => void;

  toast: string | null;
  showToast: (msg: string) => void;

  loadAll: () => Promise<void>;
  addQR: (qr: Omit<QRCode, 'id' | 'createdAt' | 'useCount' | 'lastUsedAt' | 'isPinned'>) => Promise<QRCode>;
  updateQR: (id: string, patch: Partial<QRCode>) => Promise<void>;
  deleteQR: (id: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  incrementUse: (id: string) => Promise<void>;

  addCategory: (cat: Omit<Category, 'id' | 'order'>) => Promise<Category>;
  updateCategory: (id: string, patch: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useStore = create<AppState>((set, get) => ({
  qrcodes: [],
  categories: [],
  activeTab: 'generate',
  toast: null,

  setActiveTab: (tab) => set({ activeTab: tab }),

  showToast: (msg) => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ toast: msg });
    toastTimer = setTimeout(() => set({ toast: null }), 1800);
  },

  loadAll: async () => {
    const [qrcodes, categories] = await Promise.all([
      db.qrcodes.toArray(),
      db.categories.orderBy('order').toArray(),
    ]);
    set({ qrcodes, categories });
  },

  addQR: async (data) => {
    const qr: QRCode = {
      ...data,
      id: crypto.randomUUID(),
      isPinned: false,
      useCount: 0,
      lastUsedAt: Date.now(),
      createdAt: Date.now(),
    };
    await db.qrcodes.add(qr);
    set((s) => ({ qrcodes: [qr, ...s.qrcodes] }));
    return qr;
  },

  updateQR: async (id, patch) => {
    await db.qrcodes.update(id, patch);
    set((s) => ({
      qrcodes: s.qrcodes.map((q) => (q.id === id ? { ...q, ...patch } : q)),
    }));
  },

  deleteQR: async (id) => {
    await db.qrcodes.delete(id);
    set((s) => ({ qrcodes: s.qrcodes.filter((q) => q.id !== id) }));
  },

  togglePin: async (id) => {
    const qr = get().qrcodes.find((q) => q.id === id);
    if (!qr) return;
    await get().updateQR(id, { isPinned: !qr.isPinned });
  },

  incrementUse: async (id) => {
    const qr = get().qrcodes.find((q) => q.id === id);
    if (!qr) return;
    await get().updateQR(id, {
      useCount: qr.useCount + 1,
      lastUsedAt: Date.now(),
    });
  },

  addCategory: async (data) => {
    const parents = get().categories.filter((c) => !c.parentId);
    const subs = data.parentId
      ? get().categories.filter((c) => c.parentId === data.parentId)
      : [];
    const order = data.parentId ? subs.length : parents.length;
    const cat: Category = { ...data, id: crypto.randomUUID(), order };
    await db.categories.add(cat);
    set((s) => ({ categories: [...s.categories, cat] }));
    return cat;
  },

  updateCategory: async (id, patch) => {
    await db.categories.update(id, patch);
    set((s) => ({
      categories: s.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  },

  deleteCategory: async (id) => {
    const subs = get().categories.filter((c) => c.parentId === id).map((c) => c.id);
    await db.transaction('rw', db.categories, db.qrcodes, async () => {
      await db.categories.bulkDelete([id, ...subs]);
      const allIds = [id, ...subs];
      for (const catId of allIds) {
        await db.qrcodes.where('categoryId').equals(catId).modify({
          categoryId: undefined,
          subcategory: undefined,
        });
      }
    });
    set((s) => ({
      categories: s.categories.filter((c) => c.id !== id && c.parentId !== id),
      qrcodes: s.qrcodes.map((q) =>
        q.categoryId === id || subs.includes(q.categoryId ?? '')
          ? { ...q, categoryId: undefined, subcategory: undefined }
          : q
      ),
    }));
  },
}));
