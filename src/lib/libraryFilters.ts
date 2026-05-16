import type { Category } from '../types';
import { isParentCategoryFilter } from './category';

const STORAGE_KEY = 'qr-library-filters';

export interface SavedLibraryFilters {
  categoryFilter: string;
  subFilter: string | null;
}

export function loadLibraryFilters(categories: Category[]): SavedLibraryFilters {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { categoryFilter: 'all', subFilter: null };
    const parsed = JSON.parse(raw) as SavedLibraryFilters;
    const { categoryFilter, subFilter } = parsed;

    if (categoryFilter === 'all' || categoryFilter === 'pinned') {
      return { categoryFilter, subFilter: null };
    }
    if (isParentCategoryFilter(categoryFilter, categories)) {
      return { categoryFilter, subFilter: subFilter ?? null };
    }
  } catch {
    /* ignore */
  }
  return { categoryFilter: 'all', subFilter: null };
}

export function saveLibraryFilters(filters: SavedLibraryFilters): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  } catch {
    /* ignore */
  }
}
