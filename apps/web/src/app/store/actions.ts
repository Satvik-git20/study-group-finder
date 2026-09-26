import type { Group, Level, Mode, Notification, TimeSlot, User, UserStats } from "../types";
import { STORAGE_KEYS, read, write, remove } from "./storage";
import { DEMO_EMAIL, DEMO_ID } from "./seed";
import { commit, getState, EMPTY_STATS } from "./core";

export const MAX_ATTACHMENT_BYTES = 256 * 1024;

const POINTS = {
  createGroup: 10,
  joinGroup: 5,
  sendMessage: 1,
  scheduleSession: 5,
  createQuiz: 5,
  correctAnswer: 3,
} as const;

const BADGES = {
  FOUNDER: "Founder",
  SCHOLAR: "Scholar",
  ACTIVE_LEARNER: "Active Learner",
  MENTOR: "Mentor",
  QUIZ_MASTER: "Quiz Master",
  ORGANIZER: "Organizer",
} as const;

const MAX_NOTIFICATIONS = 200;
const MAX_SEARCH_HISTORY = 10;
const MIN_PASSWORD_LENGTH = 8;

const uid = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 9)}`;

// ---------------------------------------------------------------------------
// internal helpers
// ---------------------------------------------------------------------------

function requireUser(): User {
  const { users, sessionId } = getState();
  const user = users.find((u) => u.id === sessionId);
  if (!user) throw new Error("You need to be signed in to do that");
  return user;
}

function updateGroup(groupId: string, fn: (group: Group) => Group): Group | null {
  let updated: Group | null = null;

  commit({
    ...getState(),
    groups: getState().groups.map((g) => {
      if (g.id !== groupId) return g;
      updated = fn(g);
      return updated;
    }),
  });

  return updated;
}

function pushNotification(
  userId: string,
  data: Omit<Notification, "id" | "userId" | "timestamp" | "read">,
): void {
  const state = getState();
  const notification: Notification = {
    id: uid("n"),
    userId,
    timestamp: Date.now(),
    read: false,
    ...data,
  };
  commit({
    ...state,
    notifications: [notification, ...state.notifications].slice(0, MAX_NOTIFICATIONS),
  });
}

function statsFor(userId: string): UserStats {
  return getState().statsByUser[userId] ?? EMPTY_STATS;
}

function addPoints(userId: string, delta: number): void {
  const state = getState();
  const current = statsFor(userId);
  commit({
    ...state,
    statsByUser: {
      ...state.statsByUser,
      [userId]: { ...current, points: current.points + delta },
    },
  });
}

function awardBadge(userId: string, badge: string): void {
  const current = statsFor(userId);
  if (current.badges.includes(badge)) return;

  const state = getState();
  commit({
    ...state,
    statsByUser: {
      ...state.statsByUser,
      [userId]: { ...current, badges: [...current.badges, badge] },
    },
  });
  pushNotification(userId, { type: "badge", text: `New badge unlocked: ${badge}` });
}

function recomputeBadges(userId: string): void {
  const { groups } = getState();
  const joined = groups.filter((g) => g.members.some((m) => m.id === userId));
  const owned = groups.filter((g) => g.ownerId === userId);
  const messages = groups.flatMap((g) =>
    g.messages.filter((m) => m.userId === userId),
  );
  const correctAttempts = groups.flatMap((g) =>
    (g.quizAttempts ?? []).filter((a) => a.userId === userId && a.correct),
  );
  const scheduled = groups.flatMap((g) =>
    (g.sessions ?? []).filter((s) => s.createdBy === userId),
  );

  if (owned.length >= 1) awardBadge(userId, BADGES.FOUNDER);
  if (joined.length >= 4) awardBadge(userId, BADGES.SCHOLAR);
  if (messages.length >= 10) awardBadge(userId, BADGES.ACTIVE_LEARNER);
  // MENTOR now requires actually leading other people, not just owning a 2nd
  // group (which previously made it a freebie alongside FOUNDER).
  if (owned.some((g) => g.members.some((m) => m.id !== userId))) {
    awardBadge(userId, BADGES.MENTOR);
  }
  if (correctAttempts.length >= 3) awardBadge(userId, BADGES.QUIZ_MASTER);
  if (scheduled.length >= 1) awardBadge(userId, BADGES.ORGANIZER);
}

// ---------------------------------------------------------------------------
// auth
// ---------------------------------------------------------------------------

export function signup(name: string, email: string, password: string): User {
  const normalizedEmail = email.trim().toLowerCase();

  if (name.trim().length < 2) throw new Error("Please enter your full name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error("Please enter a valid email address.");
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }
  if (normalizedEmail === DEMO_EMAIL) {
    throw new Error("That email is reserved for the demo account.");
  }

  const state = getState();
  if (state.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    throw new Error("An account with that email already exists.");
  }

  const user: User = {
    id: uid("u"),
    name: name.trim(),
    email: normalizedEmail,
    subjects: [],
    availability: "",
  };

  // NOTE: this is a plaintext local-only credential. There is no server, so
  // this provides no real security — it only keeps separate demo accounts apart.
  write(STORAGE_KEYS.password(user.id), password);

  const next = { ...state, users: [...state.users, user], sessionId: user.id };
  commit(next);
  pushNotification(user.id, {
    type: "approved",
    text: "Welcome to StudySync! Add subjects to your profile for better recommendations.",
  });
  return user;
}

export function login(email: string, password: string): User {
  const state = getState();
  const user = state.users.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase(),
  );
  if (!user) throw new Error("No account found with that email.");
  if (read<string | null>(STORAGE_KEYS.password(user.id), null) !== password) {
    throw new Error("Incorrect password.");
  }
  commit({ ...state, sessionId: user.id });
  return user;
}

/**
 * Signs in as the pre-seeded demo student. This is NOT a third-party identity
 * provider — it exists so a reviewer can land in a populated app immediately.
 */
export function signInAsDemo(): User {
  const state = getState();
  const existing = state.users.find((u) => u.id === DEMO_ID);
  if (existing) {
    commit({ ...state, sessionId: existing.id });
    return existing;
  }

  const user: User = {
    id: DEMO_ID,
    name: "Aisha Patel",
    email: DEMO_EMAIL,
    subjects: ["Linear Algebra", "Machine Learning"],
    availability: "Evenings & weekends",
  };
  commit({ ...state, users: [...state.users, user], sessionId: user.id });
  return user;
}

export function logout(): void {
  commit({ ...getState(), sessionId: null });
}

export function updateProfile(patch: Partial<User>): void {
  const state = getState();
  const me = state.users.find((u) => u.id === state.sessionId);
  if (!me) return;

  const updated: User = { ...me, ...patch };

  commit({
    ...state,
    users: state.users.map((u) => (u.id === updated.id ? updated : u)),
    groups: state.groups.map((g) => ({
      ...g,
      ownerName: g.ownerId === updated.id ? updated.name : g.ownerName,
      members: g.members.map((m) =>
        m.id === updated.id ? { ...m, name: updated.name } : m,
      ),
    })),
  });
}

// ---------------------------------------------------------------------------
// groups
// ---------------------------------------------------------------------------

export type CreateGroupInput = {
  subject: string;
  level: Level;
  description: string;
  timing: string;
  timeSlot: TimeSlot;
  mode: Mode;
  requireApproval: boolean;
};

export function createGroup(input: CreateGroupInput): Group {
  const me = requireUser();
  const state = getState();

  const group: Group = {
    id: uid("g"),
    ...input,
    ownerId: me.id,
    ownerName: me.name,
    members: [{ id: me.id, name: me.name, role: "admin" }],
    messages: [],
    sessions: [],
    quizzes: [],
    quizAttempts: [],
    joinRequests: [],
    createdAt: Date.now(),
  };

  commit({ ...state, groups: [group, ...state.groups] });
  addPoints(me.id, POINTS.createGroup);
  recomputeBadges(me.id);
  return group;
}

export type JoinResult = "joined" | "requested" | "already" | "error";

export function joinGroup(groupId: string): JoinResult {
  const state = getState();
  const me = state.users.find((u) => u.id === state.sessionId);
  if (!me) return "error";

  const group = state.groups.find((g) => g.id === groupId);
  if (!group) return "error";
  if (group.members.some((m) => m.id === me.id)) return "already";

  if (group.requireApproval && group.ownerId !== me.id) {
    const requests = group.joinRequests ?? [];
    if (!requests.some((r) => r.userId === me.id)) {
      updateGroup(groupId, (g) => ({
        ...g,
        joinRequests: [
          ...requests,
          { userId: me.id, userName: me.name, timestamp: Date.now() },
        ],
      }));
      pushNotification(group.ownerId, {
        type: "join_request",
        text: `${me.name} requested to join "${group.subject}"`,
        groupId: group.id,
      });
    }
    return "requested";
  }

  updateGroup(groupId, (g) => ({
    ...g,
    members: [...g.members, { id: me.id, name: me.name, role: "member" }],
  }));
  addPoints(me.id, POINTS.joinGroup);
  recomputeBadges(me.id);
  return "joined";
}

export function approveJoin(groupId: string, userId: string): void {
  const state = getState();
  const group = state.groups.find((g) => g.id === groupId);
  if (!group || group.ownerId !== state.sessionId) return;

  const request = (group.joinRequests ?? []).find((r) => r.userId === userId);
  if (!request) return;

  updateGroup(groupId, (g) => ({
    ...g,
    joinRequests: (g.joinRequests ?? []).filter((r) => r.userId !== userId),
    members: g.members.some((m) => m.id === userId)
      ? g.members
      : [...g.members, { id: userId, name: request.userName, role: "member" }],
  }));

  pushNotification(userId, {
    type: "approved",
    text: `You were approved to join "${group.subject}"`,
    groupId: group.id,
  });
  addPoints(userId, POINTS.joinGroup);
  recomputeBadges(userId);
}

export function rejectJoin(groupId: string, userId: string): void {
  const state = getState();
  const group = state.groups.find((g) => g.id === groupId);
  if (!group || group.ownerId !== state.sessionId) return;

  updateGroup(groupId, (g) => ({
    ...g,
    joinRequests: (g.joinRequests ?? []).filter((r) => r.userId !== userId),
  }));
}

export function removeMember(groupId: string, userId: string): void {
  const state = getState();
  const group = state.groups.find((g) => g.id === groupId);
  if (!group) throw new Error("Group not found");
  if (group.ownerId !== state.sessionId) {
    throw new Error("Only the host can remove members");
  }
  if (userId === group.ownerId) throw new Error("The host cannot be removed");

  updateGroup(groupId, (g) => ({
    ...g,
    members: g.members.filter((m) => m.id !== userId),
    joinRequests: (g.joinRequests ?? []).filter((r) => r.userId !== userId),
  }));
  pushNotification(userId, {
    type: "removed",
    text: `You were removed from "${group.subject}"`,
    groupId: group.id,
  });
}

export function addMember(
  groupId: string,
  member: { id?: string; name: string; email?: string },
): void {
  const state = getState();
  const group = state.groups.find((g) => g.id === groupId);
  if (!group) throw new Error("Group not found");
  if (group.ownerId !== state.sessionId) {
    throw new Error("Only the host can add members");
  }

  let memberId = member.id;
  if (!memberId && member.email) {
    memberId = state.users.find(
      (u) => u.email.toLowerCase() === member.email!.toLowerCase(),
    )?.id;
  }
  memberId = memberId ?? uid("u_invited");
  if (group.members.some((m) => m.id === memberId)) {
    throw new Error("Already a member");
  }

  updateGroup(groupId, (g) => ({
    ...g,
    members: [...g.members, { id: memberId!, name: member.name, role: "member" }],
  }));
  pushNotification(memberId!, {
    type: "approved",
    text: `You were added to "${group.subject}"`,
    groupId: group.id,
  });
  // The host gaining their first member is what unlocks Mentor, so badge
  // eligibility has to be re-evaluated here too.
  recomputeBadges(group.ownerId);
}

/**
 * Leaving a group you host used to orphan it: the owner was removed from
 * `members` while `ownerId` still pointed at them, and since every admin action
 * gates on `ownerId`, nobody could ever manage the group again. Ownership is now
 * transferred to the next-longest-standing member, or the group is dissolved if
 * nobody is left.
 */
export function leaveGroup(groupId: string): void {
  const state = getState();
  const me = state.users.find((u) => u.id === state.sessionId);
  if (!me) return;

  const group = state.groups.find((g) => g.id === groupId);
  if (!group) return;

  const remaining = group.members.filter((m) => m.id !== me.id);

  if (group.ownerId !== me.id) {
    updateGroup(groupId, (g) => ({ ...g, members: remaining }));
    return;
  }

  const successor = remaining.find((m) => m.role === "admin") ?? remaining[0];

  if (!successor) {
    commit({ ...getState(), groups: getState().groups.filter((g) => g.id !== groupId) });
    return;
  }

  updateGroup(groupId, (g) => ({
    ...g,
    ownerId: successor.id,
    ownerName: successor.name,
    members: remaining.map((m) =>
      m.id === successor.id ? { ...m, role: "admin" as const } : m,
    ),
  }));
  pushNotification(successor.id, {
    type: "approved",
    text: `You are now the host of "${group.subject}"`,
    groupId: group.id,
  });
}

// ---------------------------------------------------------------------------
// messages
// ---------------------------------------------------------------------------

export type SendMessageOptions = {
  isAnnouncement?: boolean;
  attachmentSizes?: { name: string; size: number }[];
};

export function sendMessage(
  groupId: string,
  text: string,
  attachments: import("../types").Attachment[] = [],
  options: SendMessageOptions = {},
): void {
  const state = getState();
  const me = state.users.find((u) => u.id === state.sessionId);
  if (!me) return;

  const group = state.groups.find((g) => g.id === groupId);
  if (!group) return;

  const isAnnouncement = !!options.isAnnouncement;
  if (isAnnouncement && group.ownerId !== me.id) {
    throw new Error("Only the host can post announcements");
  }

  const oversized = (attachments ?? []).filter(
    (a) => a.size > MAX_ATTACHMENT_BYTES,
  );
  if (oversized.length > 0) {
    throw new Error(
      `"${oversized[0]!.name}" is too large. The limit is ${Math.round(
        MAX_ATTACHMENT_BYTES / 1024,
      )} KB per file.`,
    );
  }

  const message = {
    id: uid("m"),
    userId: me.id,
    userName: me.name,
    text: text.trim(),
    timestamp: Date.now(),
    isAnnouncement,
    attachments: attachments ?? [],
    reactions: {},
    readBy: [me.id],
  };

  updateGroup(groupId, (g) => ({ ...g, messages: [...g.messages, message] }));
  addPoints(me.id, POINTS.sendMessage);

  const others = group.members.filter((m) => m.id !== me.id);
  if (isAnnouncement) {
    for (const member of others) {
      pushNotification(member.id, {
        type: "announcement",
        text: `📣 ${group.subject}: ${text.slice(0, 60)}`,
        groupId: group.id,
      });
    }
  } else {
    const [first] = others;
    if (first) {
      pushNotification(first.id, {
        type: "message",
        text: `New message in "${group.subject}"`,
        groupId: group.id,
      });
    }
  }

  recomputeBadges(me.id);
}

export function reactToMessage(groupId: string, messageId: string, emoji: string): void {
  const state = getState();
  const meId = state.sessionId;
  if (!meId) return;

  updateGroup(groupId, (g) => ({
    ...g,
    messages: g.messages.map((m) => {
      if (m.id !== messageId) return m;
      const reactions = { ...(m.reactions ?? {}) };
      const current = reactions[emoji] ?? [];
      const next = current.includes(meId)
        ? current.filter((u) => u !== meId)
        : [...current, meId];
      if (next.length === 0) delete reactions[emoji];
      else reactions[emoji] = next;
      return { ...m, reactions };
    }),
  }));
}

export function markGroupRead(groupId: string): void {
  const state = getState();
  const meId = state.sessionId;
  if (!meId) return;

  let changed = false;
  const groups = state.groups.map((g) => {
    if (g.id !== groupId) return g;
    const messages = g.messages.map((m) => {
      const readBy = m.readBy ?? [];
      if (readBy.includes(meId)) return m;
      changed = true;
      return { ...m, readBy: [...readBy, meId] };
    });
    return changed ? { ...g, messages } : g;
  });

  if (changed) commit({ ...state, groups });
}

// ---------------------------------------------------------------------------
// sessions
// ---------------------------------------------------------------------------

export function scheduleSession(
  groupId: string,
  data: { title: string; startsAt: number; durationMin: number },
): void {
  const state = getState();
  const meId = state.sessionId;
  if (!meId) return;

  const group = state.groups.find((g) => g.id === groupId);
  if (!group) return;

  const session = { id: uid("s"), createdBy: meId, ...data };
  updateGroup(groupId, (g) => ({
    ...g,
    sessions: [...(g.sessions ?? []), session],
  }));

  for (const member of group.members) {
    pushNotification(member.id, {
      type: "session",
      text: `📅 ${group.subject}: ${session.title} on ${new Date(
        session.startsAt,
      ).toLocaleString()}`,
      groupId: group.id,
    });
  }

  addPoints(meId, POINTS.scheduleSession);
  recomputeBadges(meId);
}

export function deleteSession(groupId: string, sessionId: string): void {
  const state = getState();
  const group = state.groups.find((g) => g.id === groupId);
  if (!group || group.ownerId !== state.sessionId) return;

  updateGroup(groupId, (g) => ({
    ...g,
    sessions: (g.sessions ?? []).filter((s) => s.id !== sessionId),
  }));
}

// ---------------------------------------------------------------------------
// quizzes
// ---------------------------------------------------------------------------

export function createQuiz(
  groupId: string,
  data: { question: string; options: string[]; correctIndex: number },
): void {
  const state = getState();
  const meId = state.sessionId;
  if (!meId) return;

  const group = state.groups.find((g) => g.id === groupId);
  if (!group) return;

  const quiz = {
    id: uid("q"),
    createdBy: meId,
    createdAt: Date.now(),
    ...data,
  };
  updateGroup(groupId, (g) => ({ ...g, quizzes: [...(g.quizzes ?? []), quiz] }));
  addPoints(meId, POINTS.createQuiz);
  recomputeBadges(meId);
}

/**
 * Points are awarded at most once per (user, quiz). Previously a member could
 * answer wrong, then answer right, then answer wrong again, and still keep
 * re-collecting the +3 because the award was never clawed back.
 */
export function submitQuiz(
  groupId: string,
  quizId: string,
  selectedIndex: number,
): boolean {
  const state = getState();
  const meId = state.sessionId;
  if (!meId) return false;

  const group = state.groups.find((g) => g.id === groupId);
  const quiz = group?.quizzes?.find((q) => q.id === quizId);
  if (!group || !quiz) return false;

  const attempts = group.quizAttempts ?? [];
  const existing = attempts.find(
    (a) => a.quizId === quizId && a.userId === meId,
  );
  const correct = selectedIndex === quiz.correctIndex;
  // `awarded` is sticky: once this user has been paid for this quiz, later
  // attempts cannot pay out again even though `correct` may flip back to false.
  const alreadyRewarded = existing?.awarded === true;

  updateGroup(groupId, (g) => ({
    ...g,
    quizAttempts: existing
      ? (g.quizAttempts ?? []).map((a) =>
          a.quizId === quizId && a.userId === meId
            ? {
                ...a,
                selectedIndex,
                correct,
                awarded: a.awarded === true || correct,
                timestamp: Date.now(),
              }
            : a,
        )
      : [
          ...attempts,
          {
            quizId,
            userId: meId,
            selectedIndex,
            correct,
            awarded: correct,
            timestamp: Date.now(),
          },
        ],
  }));

  if (correct && !alreadyRewarded) addPoints(meId, POINTS.correctAnswer);
  recomputeBadges(meId);
  return correct;
}

// ---------------------------------------------------------------------------
// notifications, search, stats
// ---------------------------------------------------------------------------

export function markNotificationsRead(): void {
  const state = getState();
  const meId = state.sessionId;
  if (!meId) return;

  commit({
    ...state,
    notifications: state.notifications.map((n) =>
      n.userId === meId ? { ...n, read: true } : n,
    ),
  });
}

export function recordSearch(query: string): void {
  const state = getState();
  const meId = state.sessionId;
  const trimmed = query.trim();
  if (!meId || trimmed.length < 2) return;

  const current = statsFor(meId);
  const searchHistory = [
    trimmed,
    ...current.searchHistory.filter(
      (s) => s.toLowerCase() !== trimmed.toLowerCase(),
    ),
  ].slice(0, MAX_SEARCH_HISTORY);

  commit({
    ...state,
    statsByUser: {
      ...state.statsByUser,
      [meId]: { ...current, searchHistory },
    },
  });
}

export function logStudyMinutes(minutes: number): void {
  const state = getState();
  const meId = state.sessionId;
  if (!meId || minutes <= 0) return;

  const current = statsFor(meId);
  commit({
    ...state,
    statsByUser: {
      ...state.statsByUser,
      [meId]: {
        ...current,
        studyMinutes: current.studyMinutes + minutes,
      },
    },
  });
}

export function getStatsFor(userId: string): UserStats {
  return statsFor(userId);
}

export { remove as removeCredential };
