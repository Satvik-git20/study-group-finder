import { useCallback, useSyncExternalStore } from "react";
import type { Group, Notification, User, UserStats } from "../types";
import { STORAGE_KEYS, read, write, remove } from "./storage";
import { SEED_GROUPS } from "./seed";

export type AppState = {
  users: User[];
  groups: Group[];
  sessionId: string | null;
  notifications: Notification[];
  statsByUser: Record<string, UserStats>;
};

export const EMPTY_STATS: UserStats = {
  points: 0,
  badges: [],
  studyMinutes: 0,
  searchHistory: [],
};

function hydrate(): AppState {
  const groups = read<Group[]>(STORAGE_KEYS.groups, []);
  return {
    users: read<User[]>(STORAGE_KEYS.users, []),
    groups: groups.length > 0 ? groups : SEED_GROUPS,
    sessionId: read<string | null>(STORAGE_KEYS.session, null),
    notifications: read<Notification[]>(STORAGE_KEYS.notifications, []),
    statsByUser: read<Record<string, UserStats>>(STORAGE_KEYS.stats, {}),
  };
}

let state: AppState = hydrate();
const listeners = new Set<() => void>();

/** Called when a *different* tab reports a mutation. */
let onRemoteChange: (() => void) | null = null;

function emit(): void {
  for (const listener of listeners) listener();
}

function persist(next: AppState): void {
  write(STORAGE_KEYS.users, next.users);
  write(STORAGE_KEYS.groups, next.groups);
  write(STORAGE_KEYS.notifications, next.notifications);
  write(STORAGE_KEYS.stats, next.statsByUser);
  if (next.sessionId) write(STORAGE_KEYS.session, next.sessionId);
  else remove(STORAGE_KEYS.session);
}

function commit(next: AppState, options: { persist?: boolean } = {}): AppState {
  state = next;
  if (options.persist !== false) persist(next);
  emit();
  onRemoteChange?.();
  return next;
}

export function getState(): AppState {
  return state;
}

/**
 * Re-reads everything from storage. Used when another tab writes, and by tests
 * to reset between cases.
 */
export function reload(): void {
  state = hydrate();
  emit();
}

export function resetAll(): void {
  for (const key of Object.values(STORAGE_KEYS)) {
    if (typeof key === "string") remove(key);
  }
  state = hydrate();
  persist(state);
  emit();
  onRemoteChange?.();
}

export function setOnRemoteChange(handler: (() => void) | null): void {
  onRemoteChange = handler;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The single subscription point for the whole app. */
export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getState, getState);
}

export function useCurrentUser(): User | null {
  const state = useAppState();
  return useCallback(
    () => state.users.find((u) => u.id === state.sessionId) ?? null,
    [state.users, state.sessionId],
  )();
}

export function useGroups(): Group[] {
  return useAppState().groups;
}

export function useGroup(groupId: string): Group | undefined {
  const groups = useGroups();
  return groups.find((g) => g.id === groupId);
}

export function useAllUsers(): User[] {
  return useAppState().users;
}

export function useNotifications(): Notification[] {
  const state = useAppState();
  if (!state.sessionId) return EMPTY_NOTIFICATIONS;
  return state.notifications.filter((n) => n.userId === state.sessionId);
}

const EMPTY_NOTIFICATIONS: Notification[] = [];

export function useStatsFor(userId: string | null | undefined): UserStats {
  const state = useAppState();
  if (!userId) return EMPTY_STATS;
  return state.statsByUser[userId] ?? EMPTY_STATS;
}

export function useIsGroupMember(group: Group | undefined): boolean {
  const user = useCurrentUser();
  if (!group || !user) return false;
  return group.members.some((m) => m.id === user.id);
}

export { commit, persist, hydrate };
