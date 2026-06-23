import type { Signal } from '../types/api';

export interface FeedSnapshot {
  key: string;
  items: Signal[];
  nextCursor: string | null;
  hasMore: boolean;
  totalEstimate: number | null;
  scrollY: number;
  savedAt: number;
}

const STORAGE_PREFIX = 'tropelcare_feed_snapshot:';
const memory = new Map<string, FeedSnapshot>();

function storageKey(key: string): string {
  return `${STORAGE_PREFIX}${key}`;
}

export function getFeedSnapshot(key: string): FeedSnapshot | null {
  const inMemory = memory.get(key);
  if (inMemory) return inMemory;
  const raw = window.sessionStorage.getItem(storageKey(key));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as FeedSnapshot;
    memory.set(key, parsed);
    return parsed;
  } catch {
    window.sessionStorage.removeItem(storageKey(key));
    return null;
  }
}

export function saveFeedSnapshot(snapshot: FeedSnapshot): void {
  const withTime = { ...snapshot, savedAt: Date.now() };
  memory.set(snapshot.key, withTime);
  window.sessionStorage.setItem(storageKey(snapshot.key), JSON.stringify(withTime));
}

export function updateSignalInFeedSnapshots(updated: Signal): void {
  for (const snapshot of memory.values()) {
    const nextItems = snapshot.items.map((item) => (item.id === updated.id ? updated : item));
    if (nextItems.some((item, index) => item !== snapshot.items[index])) {
      saveFeedSnapshot({ ...snapshot, items: nextItems });
    }
  }

  for (let index = 0; index < window.sessionStorage.length; index += 1) {
    const key = window.sessionStorage.key(index);
    if (!key?.startsWith(STORAGE_PREFIX)) continue;
    const raw = window.sessionStorage.getItem(key);
    if (!raw) continue;
    try {
      const snapshot = JSON.parse(raw) as FeedSnapshot;
      const nextItems = snapshot.items.map((item) => (item.id === updated.id ? updated : item));
      saveFeedSnapshot({ ...snapshot, items: nextItems });
    } catch {
      window.sessionStorage.removeItem(key);
    }
  }
}

export function makeFeedKey(filters: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  Object.entries(filters)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
  return params.toString() || 'all';
}
