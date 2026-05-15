import Dexie, { type Table } from 'dexie';
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
