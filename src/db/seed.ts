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
