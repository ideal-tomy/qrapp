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
