import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import {
  QrCode, Bookmark, Settings, Plus, Search, Copy, Share2, Star,
  Trash2, Edit3, X, Check, ChevronRight, Clipboard, ExternalLink,
  Briefcase, UtensilsCrossed, Gamepad2, ShoppingBag, Plane,
  BookOpen, User, FolderOpen, ArrowUpDown, Download, Upload,
  Image as ImageIcon
} from 'lucide-react';

// ============ ダミーデータ ============
const INITIAL_CATEGORIES = [
  { id: 'work', name: '仕事', icon: 'briefcase', color: '#f59e0b' },
  { id: 'food', name: '飲食店', icon: 'food', color: '#ec4899' },
  { id: 'hobby', name: '趣味', icon: 'gamepad', color: '#8b5cf6' },
  { id: 'shopping', name: '買物', icon: 'shopping', color: '#06b6d4' },
  { id: 'travel', name: '旅行', icon: 'plane', color: '#14b8a6' },
  { id: 'study', name: '学習', icon: 'book', color: '#f43f5e' },
  { id: 'personal', name: '個人', icon: 'user', color: '#a3e635' },
];

const SUBCATEGORIES = {
  food: ['和食', '洋食', 'イタリアン', '中華', '焼肉', 'カフェ'],
  work: ['クライアント', '社内', '資料'],
  hobby: ['映画', '音楽', 'ゲーム'],
};

const ICON_MAP = {
  briefcase: Briefcase,
  food: UtensilsCrossed,
  gamepad: Gamepad2,
  shopping: ShoppingBag,
  plane: Plane,
  book: BookOpen,
  user: User,
};

const INITIAL_QR = [
  { id: '1', title: '士業向けSFAデモ', url: 'https://sfa-legal.vercel.app/', categoryId: 'work', subcategory: 'クライアント', isPinned: true, createdAt: Date.now() - 86400000 * 1 },
  { id: '2', title: '焼肉トラジ 銀座', url: 'https://tabelog.com/tokyo/A1301/A130101/13003158/', categoryId: 'food', subcategory: '焼肉', isPinned: true, createdAt: Date.now() - 86400000 * 2 },
  { id: '3', title: '採用システム効率化デモ', url: 'https://saiyou-demo0420.vercel.app/', categoryId: 'work', subcategory: '社内', isPinned: false, createdAt: Date.now() - 86400000 * 3 },
  { id: '4', title: 'シフト自動化デモ', url: 'https://thunderous-crepe-b5a.vercel.app/', categoryId: 'work', subcategory: 'クライアント', isPinned: false, createdAt: Date.now() - 86400000 * 4 },
  { id: '5', title: '不動産マッチングデモ', url: 'https://candid-salmiakki-22e9.vercel.app/', categoryId: 'work', subcategory: 'クライアント', isPinned: false, createdAt: Date.now() - 86400000 * 5 },
  { id: '6', title: 'スターバックス 銀座', url: 'https://www.starbucks.co.jp/store/search/detail.php?id=1182', categoryId: 'food', subcategory: 'カフェ', isPinned: true, createdAt: Date.now() - 86400000 * 6 },
  { id: '7', title: '会社HP', url: 'https://axeon.jp/', categoryId: 'work', subcategory: null, isPinned: true, createdAt: Date.now() - 86400000 * 7 },
];

// ============ シンプルなフェイクQR(視覚的なプレースホルダ) ============
function FakeQR({ value, size = 140, className = '' }) {
  // valueから簡易ハッシュで擬似パターン生成
  const gridSize = 21;
  const cells = [];
  let seed = 0;
  for (let i = 0; i < value.length; i++) seed = (seed * 31 + value.charCodeAt(i)) & 0xffffffff;
  const random = (n) => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) % n;
  };
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      // ポジショニング検出パターン(3角)
      const isFinder =
        (x < 7 && y < 7) ||
        (x >= gridSize - 7 && y < 7) ||
        (x < 7 && y >= gridSize - 7);
      const isFinderInner =
        (x >= 2 && x < 5 && y >= 2 && y < 5) ||
        (x >= gridSize - 5 && x < gridSize - 2 && y >= 2 && y < 5) ||
        (x >= 2 && x < 5 && y >= gridSize - 5 && y < gridSize - 2);
      const isFinderRing =
        (isFinder && !((x >= 1 && x < 6 && y >= 1 && y < 6 && !(x >= 2 && x < 5 && y >= 2 && y < 5)) ||
                       (x >= gridSize - 6 && x < gridSize - 1 && y >= 1 && y < 6 && !(x >= gridSize - 5 && x < gridSize - 2 && y >= 2 && y < 5)) ||
                       (x >= 1 && x < 6 && y >= gridSize - 6 && y < gridSize - 1 && !(x >= 2 && x < 5 && y >= gridSize - 5 && y < gridSize - 2))));
      let on = false;
      if (isFinder) {
        on = isFinderRing || isFinderInner;
      } else {
        on = random(2) === 1;
      }
      cells.push({ x, y, on });
    }
  }
  const cellSize = size / gridSize;
  return (
    <div className={className} style={{ width: size, height: size, background: 'white', borderRadius: 8, padding: 6, boxSizing: 'border-box' }}>
      <svg width={size - 12} height={size - 12} viewBox={`0 0 ${gridSize} ${gridSize}`}>
        {cells.map((c, i) => c.on && (
          <rect key={i} x={c.x} y={c.y} width="1" height="1" fill="black" />
        ))}
      </svg>
    </div>
  );
}

// ============ ハプティック ============
const haptic = (pattern = 8) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate(pattern); } catch (e) {}
  }
};

// ============ アイコンレンダ ============
function CatIcon({ name, size = 18, color }) {
  const Comp = ICON_MAP[name] || User;
  return <Comp size={size} color={color} strokeWidth={2} />;
}

// ============ メインアプリ ============
export default function QRApp() {
  const [activeTab, setActiveTab] = useState('generate');
  const [qrcodes, setQrcodes] = useState(INITIAL_QR);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [subcategories, setSubcategories] = useState(SUBCATEGORIES);

  // 生成タブ用
  const [urlInput, setUrlInput] = useState('');
  const [generatedUrl, setGeneratedUrl] = useState('');

  // モーダル類
  const [saveSheetOpen, setSaveSheetOpen] = useState(false);
  const [savingUrl, setSavingUrl] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [actionSheetId, setActionSheetId] = useState(null);
  const [fullscreenId, setFullscreenId] = useState(null);
  const [successFlash, setSuccessFlash] = useState(false);
  const [toast, setToast] = useState(null);

  // 検索・フィルタ
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  };

  // 生成
  const handleGenerate = () => {
    if (!urlInput.trim()) return;
    let url = urlInput.trim();
    if (!url.match(/^https?:\/\//)) url = 'https://' + url;
    setGeneratedUrl(url);
    haptic(10);
  };

  // 保存開始
  const handleStartSave = () => {
    if (!generatedUrl) return;
    haptic(12);
    setSavingUrl(generatedUrl);
    setEditingId(null);
    setSaveSheetOpen(true);
  };

  // 保存実行
  const handleSave = (data) => {
    if (editingId) {
      setQrcodes(prev => prev.map(q => q.id === editingId ? { ...q, ...data } : q));
    } else {
      const newQr = {
        id: Date.now().toString(),
        url: savingUrl,
        ...data,
        isPinned: false,
        createdAt: Date.now(),
      };
      setQrcodes(prev => [newQr, ...prev]);
    }
    setSaveSheetOpen(false);
    setSuccessFlash(true);
    haptic([20, 50, 20]);
    setTimeout(() => {
      setSuccessFlash(false);
      if (!editingId) {
        setActiveTab('library');
        setGeneratedUrl('');
        setUrlInput('');
      }
      setEditingId(null);
    }, 1000);
  };

  // 削除
  const handleDelete = (id) => {
    setQrcodes(prev => prev.filter(q => q.id !== id));
    setActionSheetId(null);
    haptic(15);
    showToast('削除しました');
  };

  // ピン留め
  const togglePin = (id) => {
    setQrcodes(prev => prev.map(q => q.id === id ? { ...q, isPinned: !q.isPinned } : q));
    haptic(8);
  };

  // クリップボードからペースト
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrlInput(text);
        haptic(8);
      }
    } catch (e) {
      // 権限なし時のフォールバック - 何もしない
    }
  };

  // 検索/フィルタ済みQR
  const filteredQR = qrcodes.filter(q => {
    if (categoryFilter !== 'all' && categoryFilter !== 'pinned' && q.categoryId !== categoryFilter) return false;
    if (categoryFilter === 'pinned' && !q.isPinned) return false;
    if (searchQuery) {
      const q1 = searchQuery.toLowerCase();
      return q.title.toLowerCase().includes(q1) || q.url.toLowerCase().includes(q1);
    }
    return true;
  });

  const pinnedQR = qrcodes.filter(q => q.isPinned);
  const recentQR = filteredQR.sort((a, b) => b.createdAt - a.createdAt);

  const getCategory = (id) => categories.find(c => c.id === id);
  const editingQR = editingId ? qrcodes.find(q => q.id === editingId) : null;

  return (
    <LayoutGroup>
      <div className="qr-app">
        <style>{`
          .qr-app {
            position: fixed; inset: 0;
            background: #050507;
            color: #f5f5f7;
            font-family: -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Yu Gothic UI", sans-serif;
            font-feature-settings: "palt";
            -webkit-font-smoothing: antialiased;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }
          .phone-shell {
            width: 100%;
            max-width: 430px;
            height: 100%;
            max-height: 932px;
            background: #0a0a0c;
            border-radius: 0;
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            box-shadow: 0 0 40px rgba(0,0,0,0.5);
          }
          @media (min-width: 500px) {
            .phone-shell {
              border-radius: 40px;
              border: 10px solid #1c1c1e;
              max-height: calc(100vh - 40px);
              margin: 20px;
            }
          }
          .screen {
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
            -webkit-overflow-scrolling: touch;
            padding: 20px 18px 12px;
            scrollbar-width: none;
          }
          .screen::-webkit-scrollbar { display: none; }
          .screen-title {
            font-size: 28px;
            font-weight: 700;
            letter-spacing: -0.02em;
            margin: 8px 0 18px;
          }
          .tab-bar {
            height: 70px;
            background: rgba(10,10,12,0.92);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border-top: 1px solid rgba(255,255,255,0.06);
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            padding-bottom: env(safe-area-inset-bottom);
          }
          .tab {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 4px;
            color: rgba(255,255,255,0.35);
            cursor: pointer;
            border: none;
            background: transparent;
            transition: color 0.18s;
            font-family: inherit;
          }
          .tab.active { color: #14b8a6; }
          .tab-label {
            font-size: 10px;
            font-weight: 600;
          }
          .card {
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.07);
            border-radius: 16px;
            padding: 16px;
          }
          .btn-primary {
            background: #14b8a6;
            border: none;
            border-radius: 12px;
            color: white;
            font-weight: 600;
            font-size: 14px;
            padding: 14px;
            cursor: pointer;
            font-family: inherit;
            display: flex; align-items: center; justify-content: center; gap: 8px;
            width: 100%;
          }
          .btn-primary:disabled {
            background: rgba(20,184,166,0.3);
            color: rgba(255,255,255,0.5);
          }
          .btn-ghost {
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 10px;
            color: #f5f5f7;
            font-size: 12px;
            padding: 10px;
            cursor: pointer;
            font-family: inherit;
            display: flex; align-items: center; justify-content: center; gap: 6px;
            flex: 1;
          }
          .input {
            background: rgba(0,0,0,0.3);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 10px;
            color: #f5f5f7;
            padding: 12px 14px;
            font-size: 14px;
            font-family: inherit;
            width: 100%;
            outline: none;
            transition: border-color 0.15s;
          }
          .input:focus { border-color: #14b8a6; }
          .chip {
            flex-shrink: 0;
            padding: 7px 14px;
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 100px;
            font-size: 12px;
            color: rgba(255,255,255,0.6);
            background: rgba(255,255,255,0.04);
            cursor: pointer;
            font-family: inherit;
            transition: all 0.15s;
          }
          .chip.active {
            background: #14b8a6;
            border-color: #14b8a6;
            color: white;
          }
          .qr-card {
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.07);
            border-radius: 14px;
            padding: 12px;
            display: flex;
            gap: 12px;
            align-items: center;
            position: relative;
            overflow: hidden;
            cursor: pointer;
          }
          .qr-card-stripe {
            position: absolute;
            left: 0; top: 0; bottom: 0;
            width: 3px;
          }
          .sheet-overlay {
            position: absolute; inset: 0;
            background: rgba(0,0,0,0.55);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            z-index: 50;
          }
          .sheet {
            background: #18181b;
            border-radius: 24px 24px 0 0;
            border: 1px solid rgba(255,255,255,0.08);
            border-bottom: none;
            padding: 12px 18px 24px;
            max-height: 88%;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
          }
          .sheet-handle {
            width: 40px;
            height: 4px;
            background: rgba(255,255,255,0.2);
            border-radius: 2px;
            margin: 0 auto 16px;
          }
          .input-label {
            font-size: 11px;
            color: rgba(255,255,255,0.55);
            display: block;
            margin-bottom: 6px;
            font-weight: 500;
          }
          .cat-tile {
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.07);
            border-radius: 12px;
            padding: 12px 4px;
            text-align: center;
            cursor: pointer;
            font-family: inherit;
            transition: all 0.15s;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
          }
          .cat-tile.selected {
            background: rgba(20,184,166,0.15);
            border-color: #14b8a6;
          }
          .toast {
            position: absolute;
            bottom: 90px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(20,20,22,0.95);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255,255,255,0.1);
            color: white;
            padding: 12px 20px;
            border-radius: 14px;
            font-size: 13px;
            z-index: 100;
            box-shadow: 0 10px 30px rgba(0,0,0,0.4);
          }
        `}</style>

        <div className="phone-shell">

          {/* === SCREEN CONTENT === */}
          <AnimatePresence mode="wait">
            {activeTab === 'generate' && (
              <motion.div
                key="generate"
                className="screen"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <h1 className="screen-title">QR生成</h1>

                <div className="card" style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <input
                      className="input"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="URLを入力またはペースト"
                      style={{ flex: 1 }}
                    />
                    <motion.button
                      whileTap={{ scale: 0.92 }}
                      onClick={handlePaste}
                      style={{
                        width: 46, background: 'rgba(20,184,166,0.15)',
                        border: '1px solid rgba(20,184,166,0.3)',
                        borderRadius: 10, color: '#14b8a6', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      <Clipboard size={18} />
                    </motion.button>
                  </div>
                  <motion.button
                    className="btn-primary"
                    whileTap={{ scale: 0.97 }}
                    onClick={handleGenerate}
                    disabled={!urlInput.trim()}
                  >
                    <QrCode size={18} />
                    生成
                  </motion.button>
                </div>

                <AnimatePresence>
                  {generatedUrl && (
                    <motion.div
                      className="card"
                      initial={{ opacity: 0, scale: 0.92, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.92 }}
                      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                      style={{ textAlign: 'center' }}
                    >
                      <motion.div
                        layoutId={`preview-qr`}
                        style={{ display: 'inline-block', marginBottom: 14 }}
                      >
                        <FakeQR value={generatedUrl} size={180} />
                      </motion.div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 14, wordBreak: 'break-all', padding: '0 12px' }}>
                        {generatedUrl}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => { navigator.clipboard?.writeText(generatedUrl); haptic(10); showToast('URLをコピーしました'); }}
                          className="btn-ghost"
                        >
                          <Copy size={14} />
                          コピー
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => { haptic(10); showToast('シェアを開きます'); }}
                          className="btn-ghost"
                        >
                          <Share2 size={14} />
                          シェア
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={handleStartSave}
                          className="btn-ghost"
                          style={{ background: '#14b8a6', borderColor: '#14b8a6', color: 'white' }}
                        >
                          <Bookmark size={14} />
                          保存
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {activeTab === 'library' && (
              <motion.div
                key="library"
                className="screen"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <h1 className="screen-title">保存済み</h1>

                {/* 検索 */}
                <div style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 12,
                  padding: '10px 14px',
                  marginBottom: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10
                }}>
                  <Search size={16} color="rgba(255,255,255,0.4)" />
                  <input
                    style={{
                      flex: 1, background: 'transparent', border: 'none', outline: 'none',
                      color: '#f5f5f7', fontSize: 14, fontFamily: 'inherit'
                    }}
                    placeholder="名前またはURLで検索"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* カテゴリチップ */}
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 14, scrollbarWidth: 'none' }}>
                  {['all', 'pinned', ...categories.map(c => c.id)].map(id => {
                    const isActive = categoryFilter === id;
                    const label = id === 'all' ? 'すべて' : id === 'pinned' ? '⭐ お気に入り' : categories.find(c => c.id === id)?.name;
                    return (
                      <motion.button
                        key={id}
                        className={`chip ${isActive ? 'active' : ''}`}
                        whileTap={{ scale: 0.94 }}
                        onClick={() => { setCategoryFilter(id); haptic(6); }}
                      >
                        {label}
                      </motion.button>
                    );
                  })}
                </div>

                {/* お気に入り横スクロール (allのときのみ) */}
                {categoryFilter === 'all' && pinnedQR.length > 0 && !searchQuery && (
                  <div style={{ marginBottom: 18 }}>
                    <div style={{
                      fontSize: 10, fontWeight: 600,
                      color: 'rgba(255,255,255,0.4)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em', marginBottom: 10,
                      display: 'flex', alignItems: 'center', gap: 5
                    }}>
                      <Star size={11} fill="currentColor" /> お気に入り
                    </div>
                    <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
                      {pinnedQR.map(q => {
                        const cat = getCategory(q.categoryId);
                        return (
                          <motion.button
                            key={q.id}
                            whileTap={{ scale: 0.94 }}
                            onClick={() => { setFullscreenId(q.id); haptic(8); }}
                            style={{
                              flexShrink: 0, width: 80, background: 'rgba(255,255,255,0.04)',
                              border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12,
                              padding: 6, cursor: 'pointer', fontFamily: 'inherit'
                            }}
                          >
                            <motion.div layoutId={`qr-${q.id}-pinned`}>
                              <FakeQR value={q.url} size={68} />
                            </motion.div>
                            <div style={{
                              fontSize: 10, color: 'rgba(255,255,255,0.7)',
                              marginTop: 4, whiteSpace: 'nowrap',
                              overflow: 'hidden', textOverflow: 'ellipsis'
                            }}>
                              {q.title}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* リスト */}
                <div style={{
                  fontSize: 10, fontWeight: 600,
                  color: 'rgba(255,255,255,0.4)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em', marginBottom: 10
                }}>
                  {categoryFilter === 'pinned' ? 'お気に入り' :
                   categoryFilter === 'all' ? 'すべて' :
                   categories.find(c => c.id === categoryFilter)?.name} ({recentQR.length})
                </div>

                <motion.div layout style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <AnimatePresence>
                    {recentQR.map(q => {
                      const cat = getCategory(q.categoryId);
                      return (
                        <motion.div
                          key={q.id}
                          layout
                          layoutId={`card-${q.id}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.2 }}
                          className="qr-card"
                          onClick={() => { setFullscreenId(q.id); haptic(8); }}
                          onContextMenu={(e) => { e.preventDefault(); setActionSheetId(q.id); haptic(12); }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {cat && <div className="qr-card-stripe" style={{ background: cat.color }} />}
                          <motion.div layoutId={`qr-${q.id}-card`}>
                            <FakeQR value={q.url} size={56} />
                          </motion.div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                              <div style={{
                                fontSize: 14, fontWeight: 600,
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1
                              }}>
                                {q.title}
                              </div>
                              {q.isPinned && <Star size={11} fill="#fbbf24" color="#fbbf24" />}
                            </div>
                            <div style={{
                              fontSize: 11, color: 'rgba(255,255,255,0.5)',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              marginBottom: 5
                            }}>
                              {q.url.replace(/^https?:\/\//, '')}
                            </div>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              {cat && (
                                <span style={{
                                  fontSize: 10, padding: '2px 8px',
                                  borderRadius: 6, background: 'rgba(255,255,255,0.06)',
                                  color: cat.color, fontWeight: 500
                                }}>
                                  {cat.name}{q.subcategory ? ` / ${q.subcategory}` : ''}
                                </span>
                              )}
                            </div>
                          </div>
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => { e.stopPropagation(); setActionSheetId(q.id); haptic(10); }}
                            style={{
                              background: 'transparent', border: 'none',
                              color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
                              padding: 4
                            }}
                          >
                            <ChevronRight size={18} />
                          </motion.button>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </motion.div>

                {recentQR.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                    該当するQRコードがありません
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                className="screen"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <h1 className="screen-title">その他</h1>

                <div style={{
                  fontSize: 10, fontWeight: 600,
                  color: 'rgba(255,255,255,0.4)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em', marginBottom: 10
                }}>
                  カテゴリ
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 22 }}>
                  {categories.map(cat => {
                    const count = qrcodes.filter(q => q.categoryId === cat.id).length;
                    const subCount = subcategories[cat.id]?.length || 0;
                    return (
                      <motion.div
                        key={cat.id}
                        whileTap={{ scale: 0.98 }}
                        className="qr-card"
                        style={{ padding: '12px 14px' }}
                      >
                        <div style={{
                          width: 36, height: 36, borderRadius: 10,
                          background: `${cat.color}26`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <CatIcon name={cat.icon} size={18} color={cat.color} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>{cat.name}</div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                            {count}件{subCount > 0 ? ` · ${subCount}サブ` : ''}
                          </div>
                        </div>
                        <ChevronRight size={18} color="rgba(255,255,255,0.3)" />
                      </motion.div>
                    );
                  })}
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { haptic(10); showToast('カテゴリ追加 (実装予定)'); }}
                    className="qr-card"
                    style={{ borderStyle: 'dashed', opacity: 0.7, cursor: 'pointer', justifyContent: 'center', background: 'transparent', fontFamily: 'inherit' }}
                  >
                    <Plus size={16} color="rgba(255,255,255,0.5)" />
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>カテゴリを追加</span>
                  </motion.button>
                </div>

                <div style={{
                  fontSize: 10, fontWeight: 600,
                  color: 'rgba(255,255,255,0.4)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em', marginBottom: 10
                }}>
                  データ
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 22 }}>
                  <motion.div whileTap={{ scale: 0.98 }} className="qr-card" style={{ padding: '12px 14px' }} onClick={() => { haptic(10); showToast('JSONエクスポート (実装予定)'); }}>
                    <Download size={18} color="#14b8a6" />
                    <div style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>バックアップ (JSON)</div>
                    <ChevronRight size={18} color="rgba(255,255,255,0.3)" />
                  </motion.div>
                  <motion.div whileTap={{ scale: 0.98 }} className="qr-card" style={{ padding: '12px 14px' }} onClick={() => { haptic(10); showToast('JSONインポート (実装予定)'); }}>
                    <Upload size={18} color="#14b8a6" />
                    <div style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>復元</div>
                    <ChevronRight size={18} color="rgba(255,255,255,0.3)" />
                  </motion.div>
                </div>

                <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 30 }}>
                  QRコード管理アプリ · プロトタイプ
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* === 保存シート === */}
          <AnimatePresence>
            {saveSheetOpen && (
              <SaveSheet
                editingQR={editingQR}
                url={savingUrl}
                categories={categories}
                subcategories={subcategories}
                onSave={handleSave}
                onClose={() => { setSaveSheetOpen(false); setEditingId(null); }}
              />
            )}
          </AnimatePresence>

          {/* === アクションシート === */}
          <AnimatePresence>
            {actionSheetId && (
              <ActionSheet
                qr={qrcodes.find(q => q.id === actionSheetId)}
                categories={categories}
                onClose={() => setActionSheetId(null)}
                onTogglePin={() => { togglePin(actionSheetId); setActionSheetId(null); }}
                onEdit={() => { setEditingId(actionSheetId); setSavingUrl(qrcodes.find(q => q.id === actionSheetId).url); setActionSheetId(null); setSaveSheetOpen(true); }}
                onDelete={() => handleDelete(actionSheetId)}
                onCopy={() => { navigator.clipboard?.writeText(qrcodes.find(q => q.id === actionSheetId).url); setActionSheetId(null); haptic(10); showToast('URLをコピーしました'); }}
                onShare={() => { setActionSheetId(null); haptic(10); showToast('シェアを開きます'); }}
              />
            )}
          </AnimatePresence>

          {/* === QR全画面 === */}
          <AnimatePresence>
            {fullscreenId && (
              <FullscreenQR
                qr={qrcodes.find(q => q.id === fullscreenId)}
                category={getCategory(qrcodes.find(q => q.id === fullscreenId)?.categoryId)}
                onClose={() => setFullscreenId(null)}
                onCopy={() => { navigator.clipboard?.writeText(qrcodes.find(q => q.id === fullscreenId).url); haptic(10); showToast('URLをコピーしました'); }}
                onShare={() => { haptic(10); showToast('シェアを開きます'); }}
              />
            )}
          </AnimatePresence>

          {/* === 保存成功フラッシュ === */}
          <AnimatePresence>
            {successFlash && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200
                }}
              >
                <motion.div
                  initial={{ scale: 0.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                  style={{
                    width: 100, height: 100, borderRadius: '50%',
                    background: '#14b8a6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 20px 60px rgba(20,184,166,0.5)'
                  }}
                >
                  <motion.div
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                  >
                    <Check size={50} color="white" strokeWidth={3} />
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* === トースト === */}
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

          {/* === タブバー === */}
          <div className="tab-bar">
            <button
              className={`tab ${activeTab === 'generate' ? 'active' : ''}`}
              onClick={() => { setActiveTab('generate'); haptic(6); }}
            >
              <motion.div animate={{ scale: activeTab === 'generate' ? 1.1 : 1 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
                <QrCode size={22} />
              </motion.div>
              <span className="tab-label">生成</span>
            </button>
            <button
              className={`tab ${activeTab === 'library' ? 'active' : ''}`}
              onClick={() => { setActiveTab('library'); haptic(6); }}
            >
              <motion.div animate={{ scale: activeTab === 'library' ? 1.1 : 1 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
                <Bookmark size={22} fill={activeTab === 'library' ? 'currentColor' : 'none'} />
              </motion.div>
              <span className="tab-label">保存済み</span>
            </button>
            <button
              className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => { setActiveTab('settings'); haptic(6); }}
            >
              <motion.div animate={{ scale: activeTab === 'settings' ? 1.1 : 1 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
                <Settings size={22} />
              </motion.div>
              <span className="tab-label">その他</span>
            </button>
          </div>
        </div>
      </div>
    </LayoutGroup>
  );
}

// ============ 保存シート ============
function SaveSheet({ editingQR, url, categories, subcategories, onSave, onClose }) {
  const [title, setTitle] = useState(editingQR?.title || '');
  const [memo, setMemo] = useState(editingQR?.memo || '');
  const [categoryId, setCategoryId] = useState(editingQR?.categoryId || null);
  const [subcategory, setSubcategory] = useState(editingQR?.subcategory || null);

  // タイトル自動推定 (新規作成時)
  useEffect(() => {
    if (!editingQR && url && !title) {
      try {
        const u = new URL(url);
        setTitle(u.hostname.replace(/^www\./, ''));
      } catch (e) {}
    }
  }, [url, editingQR, title]);

  const subs = categoryId ? (subcategories[categoryId] || []) : [];

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSave({ title: title.trim(), memo: memo.trim() || null, categoryId, subcategory });
  };

  return (
    <motion.div
      className="sheet-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="sheet"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={(_, info) => { if (info.offset.y > 120) onClose(); }}
      >
        <div className="sheet-handle" />
        <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>
          {editingQR ? 'QRを編集' : 'QRを保存'}
        </h3>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', margin: '0 0 18px' }}>
          {editingQR ? '内容を変更します' : 'タイトルとカテゴリを設定してください'}
        </p>

        <div style={{ marginBottom: 12 }}>
          <label className="input-label">タイトル *</label>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例: 焼肉トラジ 銀座"
          />
        </div>

        <div style={{ marginBottom: 18 }}>
          <label className="input-label">メモ (任意)</label>
          <input
            className="input"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder=""
          />
        </div>

        <label className="input-label">カテゴリ</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
          {categories.map(cat => (
            <motion.button
              key={cat.id}
              whileTap={{ scale: 0.92 }}
              className={`cat-tile ${categoryId === cat.id ? 'selected' : ''}`}
              onClick={() => { setCategoryId(cat.id); setSubcategory(null); haptic(8); }}
              style={categoryId === cat.id ? { borderColor: cat.color, background: `${cat.color}26` } : {}}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: `${cat.color}33`,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <CatIcon name={cat.icon} size={16} color={cat.color} />
              </div>
              <div style={{ fontSize: 10, color: categoryId === cat.id ? '#fff' : 'rgba(255,255,255,0.6)' }}>
                {cat.name}
              </div>
            </motion.button>
          ))}
          <motion.button
            whileTap={{ scale: 0.92 }}
            className="cat-tile"
            style={{ borderStyle: 'dashed', opacity: 0.6 }}
            onClick={() => { haptic(8); }}
          >
            <Plus size={16} color="rgba(255,255,255,0.5)" />
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>追加</div>
          </motion.button>
        </div>

        {subs.length > 0 && (
          <>
            <label className="input-label">サブカテゴリ ({categories.find(c => c.id === categoryId)?.name})</label>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 20, paddingBottom: 4, scrollbarWidth: 'none' }}>
              {subs.map(sub => (
                <motion.button
                  key={sub}
                  whileTap={{ scale: 0.92 }}
                  className={`chip ${subcategory === sub ? 'active' : ''}`}
                  onClick={() => { setSubcategory(subcategory === sub ? null : sub); haptic(6); }}
                >
                  {sub}
                </motion.button>
              ))}
              <motion.button whileTap={{ scale: 0.92 }} className="chip">+ 追加</motion.button>
            </div>
          </>
        )}

        <motion.button
          className="btn-primary"
          whileTap={{ scale: 0.97 }}
          onClick={handleSubmit}
          disabled={!title.trim()}
        >
          {editingQR ? '更新する' : '保存する'}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ============ アクションシート ============
function ActionSheet({ qr, categories, onClose, onTogglePin, onEdit, onDelete, onCopy, onShare }) {
  if (!qr) return null;
  const cat = categories.find(c => c.id === qr.categoryId);

  const items = [
    { icon: Copy, label: 'URLをコピー', onClick: onCopy },
    { icon: Share2, label: 'シェア', onClick: onShare },
    { icon: Star, label: qr.isPinned ? 'お気に入り解除' : 'お気に入りに追加', onClick: onTogglePin, color: '#fbbf24' },
    { icon: Edit3, label: '編集', onClick: onEdit },
    { icon: Trash2, label: '削除', onClick: onDelete, danger: true },
  ];

  return (
    <motion.div
      className="sheet-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="sheet"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={(_, info) => { if (info.offset.y > 100) onClose(); }}
      >
        <div className="sheet-handle" />

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 18 }}>
          <FakeQR value={qr.url} size={50} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>{qr.title}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {qr.url.replace(/^https?:\/\//, '')}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={i}
                whileTap={{ scale: 0.97, background: 'rgba(255,255,255,0.08)' }}
                onClick={item.onClick}
                style={{
                  padding: 14, background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: i === 0 ? '12px 12px 4px 4px' :
                              i === items.length - 1 ? '4px 4px 12px 12px' : '4px',
                  display: 'flex', alignItems: 'center', gap: 12,
                  cursor: 'pointer', fontFamily: 'inherit',
                  color: item.danger ? '#f87171' : (item.color || '#f5f5f7'),
                  fontSize: 14, fontWeight: 500
                }}
              >
                <Icon size={18} />
                {item.label}
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============ QR全画面 ============
function FullscreenQR({ qr, category, onClose, onCopy, onShare }) {
  if (!qr) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        position: 'absolute', inset: 0,
        background: '#000',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 24, zIndex: 80
      }}
    >
      <motion.button
        onClick={onClose}
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 0.15 } }}
        style={{
          position: 'absolute', top: 20, right: 20,
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(255,255,255,0.12)', border: 'none',
          color: 'white', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
      >
        <X size={18} />
      </motion.button>

      <motion.div
        layoutId={`qr-${qr.id}-card`}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      >
        <FakeQR value={qr.url} size={260} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
        style={{ marginTop: 24, textAlign: 'center', maxWidth: '90%' }}
      >
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{qr.title}</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', wordBreak: 'break-all', marginBottom: 8 }}>
          {qr.url}
        </div>
        {category && (
          <div style={{
            display: 'inline-block', fontSize: 11, padding: '4px 12px',
            borderRadius: 100, background: `${category.color}26`,
            color: category.color, fontWeight: 500
          }}>
            {category.name}{qr.subcategory ? ` / ${qr.subcategory}` : ''}
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.25 } }}
        style={{
          position: 'absolute', bottom: 90,
          left: 24, right: 24,
          display: 'flex', gap: 8
        }}
      >
        <motion.button whileTap={{ scale: 0.95 }} onClick={onCopy} className="btn-ghost">
          <Copy size={14} /> コピー
        </motion.button>
        <motion.button whileTap={{ scale: 0.95 }} onClick={onShare} className="btn-ghost">
          <Share2 size={14} /> シェア
        </motion.button>
        <motion.button
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
