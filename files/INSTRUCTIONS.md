# QRポケット — 実装作業指示書

このドキュメントは Cursor の AI(Composer / Chat)に渡して、QR管理PWAを実装するための完全な作業指示書です。各セクションを順番に依頼すれば、ローカルで動く状態 → Vercelデプロイまで到達できます。

---

## 0. プロジェクト概要

**作るもの**: 自分専用のQRコード管理PWA。URLを入力するとQRコードを生成し、カテゴリ付きで保存できる。スマホのホーム画面に追加してネイティブアプリ風に使う。

**コア要件**
- 完全に端末内で動作（IndexedDB）
- 1人専用、ログイン不要
- スマホ片手・親指1本で操作完結
- 速度・軽さ最優先
- ダーク基調、アクセントカラーはティール `#14b8a6`

**主な機能**
- URL → QRコード生成
- 保存（タイトル、メモ、カテゴリ、サブカテゴリ）
- 一覧（お気に入り横スクロール + 最近セクション）
- カテゴリフィルタ、フリーワード検索
- お気に入り、編集、削除
- QR全画面表示（明度MAX想定）
- JSONエクスポート / インポート
- カテゴリ管理（追加・編集・サブカテゴリ）

---

## 1. 技術スタック（固定）

これらは確定済み。変更しないでください。

| 用途 | ライブラリ |
|------|-----------|
| ビルド | Vite |
| 言語 | React + TypeScript |
| スタイリング | Tailwind CSS |
| アニメーション | framer-motion (motion/react) |
| アイコン | lucide-react |
| 状態管理 | Zustand |
| データ永続化 | Dexie.js (IndexedDB) |
| QR生成 | qrcode |
| PWA化 | vite-plugin-pwa |
| デプロイ | Vercel |

---

## 2. 初期セットアップ

ターミナルで以下を実行してください。

```bash
npm create vite@latest qr-app -- --template react-ts
cd qr-app
npm install
npm install framer-motion lucide-react dexie zustand qrcode
npm install -D tailwindcss @tailwindcss/vite vite-plugin-pwa @types/qrcode
```

### Tailwind 設定

`vite.config.ts` を以下のように書き換えてください:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'QRポケット',
        short_name: 'QR',
        description: 'QRコードをすばやく生成・保存',
        theme_color: '#14b8a6',
        background_color: '#0a0a0c',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
    }),
  ],
});
```

`src/index.css` を以下に置き換え:

```css
@import "tailwindcss";

@theme {
  --color-bg: #0a0a0c;
  --color-surface-1: rgb(255 255 255 / 0.04);
  --color-surface-2: rgb(255 255 255 / 0.07);
  --color-border: rgb(255 255 255 / 0.08);
  --color-text: #f5f5f7;
  --color-text-dim: rgb(255 255 255 / 0.55);
  --color-text-faint: rgb(255 255 255 / 0.35);
  --color-accent: #14b8a6;
}

html, body, #root {
  margin: 0; padding: 0;
  height: 100%;
  background: var(--color-bg);
  color: var(--color-text);
  font-family: -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Yu Gothic UI", sans-serif;
  font-feature-settings: "palt";
  -webkit-font-smoothing: antialiased;
  overscroll-behavior: none;
}

* { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }

/* スクロールバー非表示 */
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { scrollbar-width: none; }
```

動作確認: `npm run dev` で開発サーバーが起動し、http://localhost:5173 で空のページが見えればOK。

---

## 3. ディレクトリ構成

以下の構造で作成してください。

```
src/
├── main.tsx
├── App.tsx
├── index.css
├── db/
│   ├── schema.ts        # Dexie のスキーマ定義
│   └── seed.ts          # 初回起動時のデフォルトカテゴリ
├── store/
│   └── useStore.ts      # Zustand のストア
├── lib/
│   ├── qr.ts            # QR生成ヘルパー
│   ├── haptic.ts        # バイブレーション
│   └── backup.ts        # JSON エクスポート/インポート
├── screens/
│   ├── GenerateScreen.tsx
│   ├── LibraryScreen.tsx
│   └── SettingsScreen.tsx
├── components/
│   ├── TabBar.tsx
│   ├── QRImage.tsx           # qrcode を React コンポーネント化
│   ├── QRCard.tsx            # リスト1件のカード
│   ├── PinnedScroll.tsx      # お気に入り横スクロール
│   ├── CategoryChips.tsx
│   ├── SaveSheet.tsx         # 保存ボトムシート
│   ├── ActionSheet.tsx       # アクションボトムシート
│   ├── FullscreenQR.tsx      # QR全画面
│   ├── Toast.tsx
│   └── SuccessFlash.tsx      # 保存成功アニメ
└── types.ts
```

---

## 4. データモデル

### `src/types.ts`

```typescript
export interface QRCode {
  id: string;
  title: string;
  url: string;
  memo?: string;
  categoryId?: string;
  subcategory?: string;
  isPinned: boolean;
  useCount: number;
  lastUsedAt: number;
  createdAt: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;     // lucide-react のアイコン名
  color: string;    // hex
  order: number;
  parentId?: string; // 親カテゴリID（サブカテゴリの場合）
}

export type IconName =
  | 'briefcase' | 'food' | 'gamepad' | 'shopping'
  | 'plane' | 'book' | 'user' | 'folder';
```

### `src/db/schema.ts`

```typescript
import Dexie, { Table } from 'dexie';
import type { QRCode, Category } from '../types';

class QRDatabase extends Dexie {
  qrcodes!: Table<QRCode>;
  categories!: Table<Category>;

  constructor() {
    super('qr-pocket');
    this.version(1).stores({
      qrcodes: 'id, categoryId, isPinned, createdAt, lastUsedAt, useCount',
      categories: 'id, parentId, order',
    });
  }
}

export const db = new QRDatabase();
```

### `src/db/seed.ts`

```typescript
import { db } from './schema';
import type { Category } from '../types';

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'work', name: '仕事', icon: 'briefcase', color: '#f59e0b', order: 0 },
  { id: 'food', name: '飲食店', icon: 'food', color: '#ec4899', order: 1 },
  { id: 'hobby', name: '趣味', icon: 'gamepad', color: '#8b5cf6', order: 2 },
  { id: 'shopping', name: '買物', icon: 'shopping', color: '#06b6d4', order: 3 },
  { id: 'travel', name: '旅行', icon: 'plane', color: '#14b8a6', order: 4 },
  { id: 'study', name: '学習', icon: 'book', color: '#f43f5e', order: 5 },
  { id: 'personal', name: '個人', icon: 'user', color: '#a3e635', order: 6 },
];

const DEFAULT_SUBCATEGORIES: Category[] = [
  { id: 'food-japanese', parentId: 'food', name: '和食', icon: 'food', color: '#ec4899', order: 0 },
  { id: 'food-western', parentId: 'food', name: '洋食', icon: 'food', color: '#ec4899', order: 1 },
  { id: 'food-italian', parentId: 'food', name: 'イタリアン', icon: 'food', color: '#ec4899', order: 2 },
  { id: 'food-chinese', parentId: 'food', name: '中華', icon: 'food', color: '#ec4899', order: 3 },
  { id: 'food-yakiniku', parentId: 'food', name: '焼肉', icon: 'food', color: '#ec4899', order: 4 },
  { id: 'food-cafe', parentId: 'food', name: 'カフェ', icon: 'food', color: '#ec4899', order: 5 },
  { id: 'work-client', parentId: 'work', name: 'クライアント', icon: 'briefcase', color: '#f59e0b', order: 0 },
  { id: 'work-internal', parentId: 'work', name: '社内', icon: 'briefcase', color: '#f59e0b', order: 1 },
  { id: 'work-doc', parentId: 'work', name: '資料', icon: 'briefcase', color: '#f59e0b', order: 2 },
];

export async function seedIfEmpty() {
  const count = await db.categories.count();
  if (count === 0) {
    await db.categories.bulkAdd([...DEFAULT_CATEGORIES, ...DEFAULT_SUBCATEGORIES]);
  }
}
```

`main.tsx` で `seedIfEmpty()` を起動時に1回呼んでください。

---

## 5. Zustand ストア

### `src/store/useStore.ts`

DBのデータをメモリに展開し、各画面で参照する。書き込み時は **DB → state** の順で更新。

```typescript
import { create } from 'zustand';
import { db } from '../db/schema';
import type { QRCode, Category } from '../types';

interface AppState {
  qrcodes: QRCode[];
  categories: Category[];

  // UI state
  activeTab: 'generate' | 'library' | 'settings';
  setActiveTab: (tab: AppState['activeTab']) => void;

  // CRUD
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

export const useStore = create<AppState>((set, get) => ({
  qrcodes: [],
  categories: [],
  activeTab: 'generate',

  setActiveTab: (tab) => set({ activeTab: tab }),

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
    const order = get().categories.filter((c) => !c.parentId).length;
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
    // 配下のサブカテゴリも削除、QRはカテゴリ未設定に
    const subs = get().categories.filter((c) => c.parentId === id).map((c) => c.id);
    await db.transaction('rw', db.categories, db.qrcodes, async () => {
      await db.categories.bulkDelete([id, ...subs]);
      await db.qrcodes
        .where('categoryId')
        .equals(id)
        .modify({ categoryId: undefined, subcategory: undefined });
    });
    set((s) => ({
      categories: s.categories.filter((c) => c.id !== id && c.parentId !== id),
      qrcodes: s.qrcodes.map((q) =>
        q.categoryId === id ? { ...q, categoryId: undefined, subcategory: undefined } : q
      ),
    }));
  },
}));
```

---

## 6. ヘルパー関数

### `src/lib/qr.ts`

```typescript
import QRCode from 'qrcode';

export async function generateQRDataURL(text: string, size = 400): Promise<string> {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: size,
    color: { dark: '#000000', light: '#ffffff' },
  });
}

export function normalizeURL(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return 'https://' + trimmed;
}

export function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
```

### `src/lib/haptic.ts`

```typescript
export function haptic(pattern: number | number[] = 8) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate(pattern); } catch {}
  }
}

export const HAPTIC = {
  light: 6,
  medium: 12,
  heavy: 20,
  success: [20, 50, 20] as number[],
  error: [50, 50, 50] as number[],
};
```

### `src/lib/backup.ts`

```typescript
import { db } from '../db/schema';
import type { QRCode, Category } from '../types';

interface BackupData {
  version: 1;
  exportedAt: number;
  qrcodes: QRCode[];
  categories: Category[];
}

export async function exportBackup(): Promise<string> {
  const data: BackupData = {
    version: 1,
    exportedAt: Date.now(),
    qrcodes: await db.qrcodes.toArray(),
    categories: await db.categories.toArray(),
  };
  return JSON.stringify(data, null, 2);
}

export async function downloadBackup() {
  const json = await exportBackup();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `qr-pocket-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importBackup(file: File): Promise<{ qrCount: number; catCount: number }> {
  const text = await file.text();
  const data = JSON.parse(text) as BackupData;
  if (data.version !== 1) throw new Error('Unsupported backup version');

  await db.transaction('rw', db.qrcodes, db.categories, async () => {
    await db.qrcodes.clear();
    await db.categories.clear();
    await db.qrcodes.bulkAdd(data.qrcodes);
    await db.categories.bulkAdd(data.categories);
  });

  return { qrCount: data.qrcodes.length, catCount: data.categories.length };
}
```

---

## 7. UIコンポーネント実装ガイド

参考のプロトタイプ(`qr-app-prototype.jsx`)に全画面のJSXがあるので、それをベースに以下を反映させてください。

### 必ず守る原則

1. **TypeScript で書く** — `any` 禁止、Props は interface で定義
2. **アニメーションは framer-motion** — `motion.button` `whileTap={{ scale: 0.96 }}` を全タップ要素に
3. **ハプティック** — タップ系には `haptic(HAPTIC.light)` 等を必ず付ける
4. **Tailwind** — クラス名で書く。プロトタイプの style 属性は Tailwind に変換
5. **`LayoutGroup` + `layoutId`** — QRリストから全画面への遷移は共有要素アニメ

### モーション数値（厳守）

```typescript
// ボトムシート
transition={{ type: 'spring', stiffness: 380, damping: 32 }}

// タブ切替
transition={{ duration: 0.18 }}

// カード追加・削除
transition={{ duration: 0.2 }}

// 保存成功フラッシュ
transition={{ type: 'spring', stiffness: 400, damping: 22 }}

// タブアイコンのbounce
transition={{ type: 'spring', stiffness: 400, damping: 20 }}
```

### TabBar

下タブは3つ: 生成 / 保存済み / その他。`fixed bottom-0` ではなく flexbox の最下段に配置（モバイルキーボードと干渉を避けるため）。

```tsx
import { QrCode, Bookmark, Settings } from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../store/useStore';
import { haptic, HAPTIC } from '../lib/haptic';

export function TabBar() {
  const { activeTab, setActiveTab } = useStore();
  const tabs = [
    { id: 'generate', label: '生成', icon: QrCode },
    { id: 'library', label: '保存済み', icon: Bookmark },
    { id: 'settings', label: 'その他', icon: Settings },
  ] as const;
  return (
    <div className="h-[70px] bg-black/85 backdrop-blur-xl border-t border-white/[0.06] grid grid-cols-3 pb-[env(safe-area-inset-bottom)]">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); haptic(HAPTIC.light); }}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              active ? 'text-[var(--color-accent)]' : 'text-white/35'
            }`}
          >
            <motion.div animate={{ scale: active ? 1.1 : 1 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
              <Icon size={22} fill={active && tab.id === 'library' ? 'currentColor' : 'none'} />
            </motion.div>
            <span className="text-[10px] font-semibold">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
```

### QRImage コンポーネント

`qrcode` パッケージで生成したDataURLを表示。生成は非同期だが速いので `useEffect` で十分。

```tsx
import { useEffect, useState } from 'react';
import { generateQRDataURL } from '../lib/qr';

export function QRImage({ value, size = 140 }: { value: string; size?: number }) {
  const [src, setSrc] = useState<string>('');
  useEffect(() => {
    let cancelled = false;
    generateQRDataURL(value, size * 2).then((url) => {
      if (!cancelled) setSrc(url);
    });
    return () => { cancelled = true; };
  }, [value, size]);
  return (
    <div className="bg-white rounded-lg p-1.5" style={{ width: size, height: size }}>
      {src && <img src={src} width={size - 12} height={size - 12} alt="QR" />}
    </div>
  );
}
```

### SaveSheet（保存ボトムシート）

- drag="y" で下スワイプで閉じる
- dragConstraints は `{ top: 0, bottom: 0 }`、dragElastic は `{ top: 0, bottom: 0.6 }`
- onDragEnd で offset.y > 120 なら閉じる
- カテゴリは 4列グリッド、選択中はカテゴリのカラーで枠線を変える
- サブカテゴリは選択カテゴリの子のみ表示、横スクロールチップ

### FullscreenQR

- `layoutId="qr-{id}"` でリストのサムネと一致させ、共有要素アニメ
- 背景は `bg-black`(QRが映えるよう純黒)
- 開いた瞬間に画面明度を上げたいが、PWAで明度制御は不可。代わりに **画面の表示は最大限白く・大きく**（260px）
- 閉じるボタンは右上、`whileTap={{ scale: 0.9 }}`

---

## 8. App.tsx（全体構造）

```tsx
import { useEffect } from 'react';
import { LayoutGroup, AnimatePresence } from 'motion/react';
import { useStore } from './store/useStore';
import { seedIfEmpty } from './db/seed';
import { GenerateScreen } from './screens/GenerateScreen';
import { LibraryScreen } from './screens/LibraryScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { TabBar } from './components/TabBar';

export default function App() {
  const { activeTab, loadAll } = useStore();

  useEffect(() => {
    (async () => {
      await seedIfEmpty();
      await loadAll();
    })();
  }, [loadAll]);

  return (
    <LayoutGroup>
      <div className="fixed inset-0 flex flex-col bg-[var(--color-bg)]">
        <AnimatePresence mode="wait">
          {activeTab === 'generate' && <GenerateScreen key="generate" />}
          {activeTab === 'library' && <LibraryScreen key="library" />}
          {activeTab === 'settings' && <SettingsScreen key="settings" />}
        </AnimatePresence>
        <TabBar />
      </div>
    </LayoutGroup>
  );
}
```

---

## 9. 重要な実装注意点

### iOS Safari の IndexedDB 7日問題

ユーザーがホーム画面に追加していない場合、7日間アクセスがないと IndexedDB が消える可能性がある。対策:
- 初回起動時、または1週間以上経過した場合に「ホーム画面に追加してください」を促すバナーを上部に表示
- `display: 'standalone'` で起動中（`window.matchMedia('(display-mode: standalone)').matches`）かを判定して非表示にする

### クリップボードからの自動ペースト

- iOS は permission の問題で `navigator.clipboard.readText()` が直接呼べないケースあり
- 「ペーストボタンを押したら読み取り」の明示的UI（プロトタイプの📋ボタン）で対応
- 強制的に読み取らない

### 環境変数

不要。すべてクライアント完結のため。

### TypeScript の strict 設定

`tsconfig.app.json` の `strict: true` のまま実装。`any` を使わない。

---

## 10. デプロイ手順

### Step 1: GitHub にリポジトリを作成

ブラウザで github.com にアクセスし、新規リポジトリ作成（Public でも Private でもOK）。リポジトリ名は `qr-app` など。**README や .gitignore は作らずに空のままで**。

### Step 2: ローカルから push

```bash
git init
git add .
git commit -m "feat: initial implementation"
git remote add origin https://github.com/<USERNAME>/qr-app.git
git branch -M main
git push -u origin main
```

### Step 3: Vercel にデプロイ

1. https://vercel.com にアクセスし、GitHubアカウントでログイン
2. 「Add New Project」→ さっき作ったリポジトリを Import
3. Framework Preset が **Vite** になっていることを確認
4. その他はデフォルトのまま「Deploy」
5. 1〜2分で完了。`https://qr-app-xxx.vercel.app` のURLが発行される

### Step 4: スマホで使う

1. iPhoneのSafari（Androidなら Chrome）でVercelのURLを開く
2. 共有ボタン → 「ホーム画面に追加」
3. ホーム画面のアイコンから起動 → アドレスバーが消えて全画面起動

### Step 5: アイコン画像を準備

`public/` に以下のPNG画像を配置:
- `icon-192.png` (192x192px)
- `icon-512.png` (512x512px)
- `icon-maskable.png` (512x512px、四隅に十分な余白)
- `apple-touch-icon.png` (180x180px)
- `favicon.svg`

ティール(#14b8a6)背景に白いQRアイコンのような単純なデザインで。Figma / Canva / AI生成ツールどれでもOK。

---

## 11. 動作確認チェックリスト

実装完了後に以下を確認:

- [ ] `npm run dev` でローカル起動、エラーなし
- [ ] 生成タブで URL を入力 → QR が生成される
- [ ] 「保存」でボトムシートが出る、カテゴリ選択ができる
- [ ] 保存後、保存済みタブに自動遷移、追加されている
- [ ] ブラウザリロードしてもデータが残っている
- [ ] 保存済みタブでフィルタチップが動く
- [ ] お気に入りトグルが動く
- [ ] カードタップで全画面化、共有要素アニメが滑らか
- [ ] 全画面で「コピー」「シェア」「開く」が動く
- [ ] 編集 → 内容変更 → 反映される
- [ ] 削除確認後、消える
- [ ] 検索でタイトル・URL のフィルタが効く
- [ ] その他タブで JSON エクスポート → ファイルがダウンロードされる
- [ ] JSON インポートで復元できる
- [ ] `npm run build` がエラーなく完了
- [ ] Vercel にデプロイ後、スマホでアクセスできる
- [ ] ホーム画面に追加できる、standaloneで起動する

---

## 12. Cursor への依頼の仕方

このドキュメントを `INSTRUCTIONS.md` として保存し、Cursor の Composer で `@INSTRUCTIONS.md` で参照しつつ、以下のように **小さく分割して** 依頼するのが効率的です。

```
@INSTRUCTIONS.md のセクション 2-4 をやって。
プロジェクトを Vite で立ち上げ、Tailwind と PWA プラグインを設定し、
src/types.ts と src/db/ を実装して。
```

```
@INSTRUCTIONS.md のセクション 5-6 をやって。
Zustand のストアとヘルパー関数を実装して。
```

```
@INSTRUCTIONS.md のセクション 7 を元に、
src/screens/GenerateScreen.tsx を実装して。
プロトタイプのコードを参考にしつつ、TypeScript・Tailwindで書き直して。
```

一気に全部やらせると壊れやすいので、画面1つ・シート1つ単位で進めるのがおすすめです。途中で動かなくなったら `npm run dev` のエラーをCursorに貼り付けて修正させてください。

---

## 13. 後から追加する候補機能

最低限の機能が動いたら検討:

- QR中央にカテゴリアイコンを埋め込む（`qrcode` の代わりに `qr-code-styling` ライブラリで可能）
- スワイプ操作（左で削除、右でピン留め）
- お気に入り並び替え（drag-and-drop）
- ホーム画面追加プロンプト（`beforeinstallprompt` イベント）
- ダーク/ライトテーマ切替
- カテゴリのアイコン・カラーをユーザーが選べるピッカー
- 検索履歴
- 使用回数順ソート
- QR読み取り機能を後から追加（`html5-qrcode` 等）

---

これで Cursor に投げれば、ローカル動作 → デプロイまで到達できます。詰まったら個別に質問してください。
