export const STORAGE_KEYS = {
  users: "ssync_users",
  groups: "ssync_groups",
  session: "ssync_session",
  notifications: "ssync_notifs",
  stats: "ssync_stats",
  password: (userId: string) => `ssync_pw_${userId}`,
} as const;

export class StorageQuotaError extends Error {
  constructor() {
    super(
      "Browser storage is full. Try removing large attachments, or clear this site's data in Settings.",
    );
    this.name = "StorageQuotaError";
  }
}

export function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

/**
 * Unlike the previous implementation this never throws a raw
 * QuotaExceededError at the call site, and never throws at all: a failed write
 * leaves the in-memory state authoritative and surfaces a real error the UI can
 * show the user.
 */
export function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    if (err instanceof DOMException && (err.name === "QuotaExceededError" || err.name === "NS_ERROR_DOM_QUOTA_REACHED")) {
      throw new StorageQuotaError();
    }
    throw err;
  }
}

export function remove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* storage unavailable (private mode) — nothing to clean up */
  }
}
