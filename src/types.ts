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
  icon: string;
  color: string;
  order: number;
  parentId?: string;
}

export type IconName =
  | 'briefcase'
  | 'food'
  | 'gamepad'
  | 'shopping'
  | 'plane'
  | 'book'
  | 'user'
  | 'folder';
