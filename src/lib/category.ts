import type { QRCode, Category } from '../types';

export interface SubFilterChip {
  id: string;
  label: string;
}

export interface FilterQROptions {
  categoryFilter: string;
  subFilter?: string | null;
  searchQuery?: string;
}

export function getParentCategories(categories: Category[]): Category[] {
  return categories.filter((c) => !c.parentId).sort((a, b) => a.order - b.order);
}

export function getSubcategories(categories: Category[], parentId: string): Category[] {
  return categories.filter((c) => c.parentId === parentId).sort((a, b) => a.order - b.order);
}

export function isParentCategoryFilter(categoryFilter: string, categories: Category[]): boolean {
  return categoryFilter !== 'all' && categoryFilter !== 'pinned' &&
    categories.some((c) => c.id === categoryFilter && !c.parentId);
}

export function getSubFilterChips(
  categories: Category[],
  parentId: string,
  qrcodes: QRCode[],
): SubFilterChip[] {
  const registered = getSubcategories(categories, parentId).map((s) => s.name);
  const registeredSet = new Set(registered);

  const orphanNames = new Set<string>();
  for (const q of qrcodes) {
    if (q.categoryId === parentId && q.subcategory && !registeredSet.has(q.subcategory)) {
      orphanNames.add(q.subcategory);
    }
  }

  const chips: SubFilterChip[] = [{ id: 'all', label: 'すべて' }];
  for (const name of registered) {
    chips.push({ id: name, label: name });
  }
  for (const name of [...orphanNames].sort()) {
    chips.push({ id: name, label: name });
  }
  return chips;
}

export function matchesSearch(qr: QRCode, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const fields = [qr.title, qr.url, qr.subcategory, qr.memo].filter(Boolean) as string[];
  return fields.some((f) => f.toLowerCase().includes(q));
}

export function filterQRCodes(qrcodes: QRCode[], opts: FilterQROptions): QRCode[] {
  const { categoryFilter, subFilter, searchQuery } = opts;

  return qrcodes
    .filter((q) => {
      if (categoryFilter === 'pinned') {
        if (!q.isPinned) return false;
      } else if (categoryFilter !== 'all') {
        if (q.categoryId !== categoryFilter) return false;
        if (subFilter != null && q.subcategory !== subFilter) return false;
      }

      if (searchQuery && !matchesSearch(q, searchQuery)) return false;
      return true;
    })
    .sort((a, b) => b.createdAt - a.createdAt);
}
