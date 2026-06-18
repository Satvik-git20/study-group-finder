import { useEffect, useState, useCallback } from "react";
import type {
  Group, User, Message, Level, Mode, TimeSlot, Notification, UserStats,
  Session, Quiz, Attachment,
} from "./types";

const USERS_KEY = "ssync_users";
const GROUPS_KEY = "ssync_groups";
const SESSION_KEY = "ssync_session";
const NOTIFS_KEY = "ssync_notifs";
const STATS_KEY = "ssync_stats";

const seedGroups: Group[] = [
  {
    id: "g1",
    subject: "Linear Algebra",
    level: "Intermediate",
    description: "Working through Strang's textbook — eigenvalues, SVD, and applications. Weekly problem sets.",
    timing: "Tue & Thu, 7–9 PM", timeSlot: "Evening", mode: "Online",
    ownerId: "u_demo", ownerName: "Aisha Patel",
    members: [
      { id: "u_demo", name: "Aisha Patel", role: "admin" },
      { id: "u2", name: "Marco Liu", role: "member" },
      { id: "u3", name: "Sara Kim", role: "member" },
    ],
    messages: [
      { id: "m1", userId: "u2", userName: "Marco Liu", text: "Anyone got notes on chapter 6?", timestamp: Date.now() - 3600_000, reactions: { "👍": ["u3"] }, readBy: ["u2", "u3"] },
      { id: "m2", userId: "u_demo", userName: "Aisha Patel", text: "I'll share mine tonight!", timestamp: Date.now() - 1800_000, readBy: ["u_demo", "u2", "u3"] },
    ],
    sessions: [
      { id: "s1", title: "SVD review session", startsAt: Date.now() + 86400_000 * 2, durationMin: 90, createdBy: "u_demo" },
    ],
    quizzes: [], quizAttempts: [], joinRequests: [],
    createdAt: Date.now() - 86400_000 * 4,
  },
  {
    id: "g2", subject: "Operating Systems", level: "Advanced",
    description: "Deep dive into xv6, scheduling, and concurrency. Pair programming on labs.",
    timing: "Sat, 10 AM–1 PM", timeSlot: "Weekend", mode: "Offline",
    ownerId: "u4", ownerName: "Daniel Okafor",
    members: [
      { id: "u4", name: "Daniel Okafor", role: "admin" },
      { id: "u5", name: "Priya Singh", role: "member" },
    ],
    messages: [], sessions: [], quizzes: [], quizAttempts: [], joinRequests: [],
    requireApproval: true,
    createdAt: Date.now() - 86400_000 * 2,
  },
  {
    id: "g3", subject: "React & TypeScript", level: "Beginner",
    description: "Build small projects together — todo apps, dashboards, and mini portfolios. Friendly to newcomers!",
    timing: "Mon & Wed, 6–7:30 PM", timeSlot: "Evening", mode: "Online",
    ownerId: "u6", ownerName: "Lena Hofer",
    members: [{ id: "u6", name: "Lena Hofer", role: "admin" }],
    messages: [], sessions: [], quizzes: [], quizAttempts: [], joinRequests: [],
    createdAt: Date.now() - 86400_000,
  },
  {
    id: "g4", subject: "Organic Chemistry", level: "Intermediate",
    description: "Reaction mechanisms, synthesis problems, exam prep. We meet at the campus library.",
    timing: "Fri, 4–6 PM", timeSlot: "Afternoon", mode: "Offline",
    ownerId: "u7", ownerName: "Jamal Rivera",
    members: [
      { id: "u7", name: "Jamal Rivera", role: "admin" },
      { id: "u8", name: "Mei Zhang", role: "member" },
      { id: "u9", name: "Tom Becker", role: "member" },
      { id: "u10", name: "Nora Ali", role: "member" },
    ],
    messages: [], sessions: [], quizzes: [], quizAttempts: [], joinRequests: [],
    createdAt: Date.now() - 86400_000 * 6,
  },
  {
    id: "g5", subject: "Machine Learning", level: "Advanced",
    description: "Reading group on transformers, diffusion, and recent ICML papers. Bring your own questions.",
    timing: "Sun, 3–5 PM", timeSlot: "Weekend", mode: "Online",
    ownerId: "u11", ownerName: "Ravi Kumar",
    members: [
      { id: "u11", name: "Ravi Kumar", role: "admin" },
      { id: "u12", name: "Elena Costa", role: "member" },
    ],
    messages: [], sessions: [], quizzes: [], quizAttempts: [], joinRequests: [],
    createdAt: Date.now() - 86400_000 * 3,
  },
  {
    id: "g6", subject: "Calculus II", level: "Beginner",
    description: "Integration techniques, series, and exam grinding. Snacks welcome.",
    timing: "Wed, 5–7 PM", timeSlot: "Evening", mode: "Offline",
    ownerId: "u13", ownerName: "Hana Sato",
    members: [{ id: "u13", name: "Hana Sato", role: "admin" }],
    messages: [], sessions: [], quizzes: [], quizAttempts: [], joinRequests: [],
    createdAt: Date.now() - 86400_000 * 5,
  },
];

function read<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; }
}
function write<T>(key: string, val: T) { localStorage.setItem(key, JSON.stringify(val)); }

let listeners: (() => void)[] = [];
function emit() { listeners.forEach((l) => l()); }

const BADGES = {
  FOUNDER: "Founder",
  ACTIVE_LEARNER: "Active Learner",
  SCHOLAR: "Scholar",
  MENTOR: "Mentor",
  QUIZ_MASTER: "Quiz Master",
  ORGANIZER: "Organizer",
};

function getStats(userId: string): UserStats {
  const all = read<Record<string, UserStats>>(STATS_KEY, {});
  return all[userId] || { points: 0, badges: [], studyMinutes: 0, searchHistory: [] };
}
function setStats(userId: string, patch: Partial<UserStats>) {
  const all = read<Record<string, UserStats>>(STATS_KEY, {});
  all[userId] = { ...getStats(userId), ...patch };
  write(STATS_KEY, all);
}
function addPoints(userId: string, delta: number) {
  const cur = getStats(userId);
  setStats(userId, { points: cur.points + delta });
}
function awardBadge(userId: string, badge: string) {
  const cur = getStats(userId);
  if (cur.badges.includes(badge)) return false;
  setStats(userId, { badges: [...cur.badges, badge] });
  pushNotification(userId, { type: "badge", text: `New badge unlocked: ${badge}` });
  return true;
}

function pushNotification(userId: string, data: Omit<Notification, "id" | "userId" | "timestamp" | "read">) {
  const all = read<Notification[]>(NOTIFS_KEY, []);
  const n: Notification = {
    id: "n_" + Math.random().toString(36).slice(2, 9),
    userId, timestamp: Date.now(), read: false, ...data,
  };
  all.unshift(n);
  write(NOTIFS_KEY, all.slice(0, 200));
}

function recomputeBadges(userId: string) {
  const groups = read<Group[]>(GROUPS_KEY, []);
  const joined = groups.filter((g) => g.members.find((m) => m.id === userId));
  const owned = groups.filter((g) => g.ownerId === userId);
  const messages = groups.flatMap((g) => g.messages.filter((m) => m.userId === userId));
  const correctAttempts = groups.flatMap((g) => (g.quizAttempts || []).filter((a) => a.userId === userId && a.correct));
  const scheduled = groups.flatMap((g) => (g.sessions || []).filter((s) => s.createdBy === userId));

  if (owned.length >= 1) awardBadge(userId, BADGES.FOUNDER);
  if (joined.length >= 3) awardBadge(userId, BADGES.SCHOLAR);
  if (messages.length >= 10) awardBadge(userId, BADGES.ACTIVE_LEARNER);
  if (owned.length >= 2) awardBadge(userId, BADGES.MENTOR);
  if (correctAttempts.length >= 3) awardBadge(userId, BADGES.QUIZ_MASTER);
  if (scheduled.length >= 1) awardBadge(userId, BADGES.ORGANIZER);
}

export function useStore() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const l = () => setTick((t) => t + 1);
    listeners.push(l);
    return () => { listeners = listeners.filter((x) => x !== l); };
  }, []);

  let groupsInit = read<Group[]>(GROUPS_KEY, []);
  if (groupsInit.length === 0) { write(GROUPS_KEY, seedGroups); groupsInit = seedGroups; }

  const users = read<User[]>(USERS_KEY, []);
  const sessionId = read<string | null>(SESSION_KEY, null);
  const currentUser = users.find((u) => u.id === sessionId) || null;
  const notifications = read<Notification[]>(NOTIFS_KEY, []).filter((n) => n.userId === sessionId);
  const stats = sessionId ? getStats(sessionId) : { points: 0, badges: [], studyMinutes: 0, searchHistory: [] };

  const signup = useCallback((name: string, email: string, password: string) => {
    const all = read<User[]>(USERS_KEY, []);
    if (all.find((u) => u.email === email)) throw new Error("Email already registered");
    const user: User = { id: "u_" + Math.random().toString(36).slice(2, 9), name, email, subjects: [], availability: "" };
    localStorage.setItem("pw_" + user.id, password);
    all.push(user);
    write(USERS_KEY, all);
    write(SESSION_KEY, user.id);
    pushNotification(user.id, { type: "approved", text: "Welcome to StudySync! Add subjects to your profile for smart recommendations." });
    emit();
    return user;
  }, []);

  const login = useCallback((email: string, password: string) => {
    const all = read<User[]>(USERS_KEY, []);
    const user = all.find((u) => u.email === email);
    if (!user) throw new Error("No account found with that email");
    const pw = localStorage.getItem("pw_" + user.id);
    if (pw !== password) throw new Error("Incorrect password");
    write(SESSION_KEY, user.id);
    emit();
    return user;
  }, []);

  const googleSignIn = useCallback(() => {
    const all = read<User[]>(USERS_KEY, []);
    let user = all.find((u) => u.email === "demo@studysync.app");
    if (!user) {
      user = { id: "u_demo", name: "Aisha Patel", email: "demo@studysync.app", subjects: ["Linear Algebra", "Machine Learning"], availability: "Evenings & weekends" };
      all.push(user);
      write(USERS_KEY, all);
    }
    write(SESSION_KEY, user.id);
    emit();
    return user;
  }, []);

  const logout = useCallback(() => { localStorage.removeItem(SESSION_KEY); emit(); }, []);

  const updateProfile = useCallback((patch: Partial<User>) => {
    const all = read<User[]>(USERS_KEY, []);
    const sid = read<string | null>(SESSION_KEY, null);
    const idx = all.findIndex((u) => u.id === sid);
    if (idx === -1) return;
    all[idx] = { ...all[idx], ...patch };
    write(USERS_KEY, all);
    const gs = read<Group[]>(GROUPS_KEY, []);
    gs.forEach((g) => {
      g.members = g.members.map((m) => m.id === all[idx].id ? { ...m, name: all[idx].name } : m);
      if (g.ownerId === all[idx].id) g.ownerName = all[idx].name;
    });
    write(GROUPS_KEY, gs);
    emit();
  }, []);

  const createGroup = useCallback((data: { subject: string; level: Level; description: string; timing: string; timeSlot: TimeSlot; mode: Mode; requireApproval: boolean }) => {
    const sid = read<string | null>(SESSION_KEY, null);
    const all = read<User[]>(USERS_KEY, []);
    const me = all.find((u) => u.id === sid);
    if (!me) throw new Error("Not signed in");
    const gs = read<Group[]>(GROUPS_KEY, []);
    const g: Group = {
      id: "g_" + Math.random().toString(36).slice(2, 9),
      ...data,
      ownerId: me.id, ownerName: me.name,
      members: [{ id: me.id, name: me.name, role: "admin" }],
      messages: [], sessions: [], quizzes: [], quizAttempts: [], joinRequests: [],
      createdAt: Date.now(),
    };
    gs.unshift(g);
    write(GROUPS_KEY, gs);
    addPoints(me.id, 10);
    recomputeBadges(me.id);
    emit();
    return g;
  }, []);

  const joinGroup = useCallback((groupId: string) => {
    const sid = read<string | null>(SESSION_KEY, null);
    const all = read<User[]>(USERS_KEY, []);
    const me = all.find((u) => u.id === sid);
    if (!me) throw new Error("Sign in first");
    const gs = read<Group[]>(GROUPS_KEY, []);
    const g = gs.find((x) => x.id === groupId);
    if (!g) return { status: "error" as const };
    if (g.members.find((m) => m.id === me.id)) return { status: "already" as const };
    if (g.requireApproval && g.ownerId !== me.id) {
      g.joinRequests = g.joinRequests || [];
      if (!g.joinRequests.find((r) => r.userId === me.id)) {
        g.joinRequests.push({ userId: me.id, userName: me.name, timestamp: Date.now() });
        pushNotification(g.ownerId, { type: "join_request", text: `${me.name} requested to join "${g.subject}"`, groupId: g.id });
      }
      write(GROUPS_KEY, gs);
      emit();
      return { status: "requested" as const };
    }
    g.members.push({ id: me.id, name: me.name, role: "member" });
    write(GROUPS_KEY, gs);
    addPoints(me.id, 5);
    recomputeBadges(me.id);
    emit();
    return { status: "joined" as const };
  }, []);

  const approveJoin = useCallback((groupId: string, userId: string) => {
    const sid = read<string | null>(SESSION_KEY, null);
    const gs = read<Group[]>(GROUPS_KEY, []);
    const g = gs.find((x) => x.id === groupId);
    if (!g || g.ownerId !== sid) return;
    const req = (g.joinRequests || []).find((r) => r.userId === userId);
    if (!req) return;
    g.joinRequests = (g.joinRequests || []).filter((r) => r.userId !== userId);
    if (!g.members.find((m) => m.id === userId)) g.members.push({ id: userId, name: req.userName, role: "member" });
    write(GROUPS_KEY, gs);
    pushNotification(userId, { type: "approved", text: `You were approved to join "${g.subject}"`, groupId: g.id });
    addPoints(userId, 5);
    recomputeBadges(userId);
    emit();
  }, []);

  const rejectJoin = useCallback((groupId: string, userId: string) => {
    const sid = read<string | null>(SESSION_KEY, null);
    const gs = read<Group[]>(GROUPS_KEY, []);
    const g = gs.find((x) => x.id === groupId);
    if (!g || g.ownerId !== sid) return;
    g.joinRequests = (g.joinRequests || []).filter((r) => r.userId !== userId);
    write(GROUPS_KEY, gs);
    emit();
  }, []);

  const removeMember = useCallback((groupId: string, userId: string) => {
    const sid = read<string | null>(SESSION_KEY, null);
    const gs = read<Group[]>(GROUPS_KEY, []);
    const g = gs.find((x) => x.id === groupId);
    if (!g || g.ownerId !== sid) throw new Error("Only the host can remove members");
    if (userId === g.ownerId) throw new Error("Host cannot be removed");
    g.members = g.members.filter((m) => m.id !== userId);
    write(GROUPS_KEY, gs);
    pushNotification(userId, { type: "removed", text: `You were removed from "${g.subject}"`, groupId: g.id });
    emit();
  }, []);

  const addMember = useCallback((groupId: string, member: { id?: string; name: string; email?: string }) => {
    const sid = read<string | null>(SESSION_KEY, null);
    const gs = read<Group[]>(GROUPS_KEY, []);
    const g = gs.find((x) => x.id === groupId);
    if (!g) throw new Error("Group not found");
    if (g.ownerId !== sid) throw new Error("Only the host can add members");
    let memberId = member.id;
    if (!memberId && member.email) {
      const usersAll = read<User[]>(USERS_KEY, []);
      memberId = usersAll.find((u) => u.email.toLowerCase() === member.email!.toLowerCase())?.id;
    }
    if (!memberId) memberId = "u_invited_" + Math.random().toString(36).slice(2, 8);
    if (g.members.find((m) => m.id === memberId)) throw new Error("Already a member");
    g.members.push({ id: memberId, name: member.name, role: "member" });
    write(GROUPS_KEY, gs);
    pushNotification(memberId, { type: "approved", text: `You were added to "${g.subject}"`, groupId: g.id });
    emit();
  }, []);

  const leaveGroup = useCallback((groupId: string) => {
    const sid = read<string | null>(SESSION_KEY, null);
    if (!sid) return;
    const gs = read<Group[]>(GROUPS_KEY, []);
    const g = gs.find((x) => x.id === groupId);
    if (!g) return;
    g.members = g.members.filter((m) => m.id !== sid);
    write(GROUPS_KEY, gs);
    emit();
  }, []);

  const sendMessage = useCallback((groupId: string, text: string, opts?: { isAnnouncement?: boolean; attachments?: Attachment[] }) => {
    const sid = read<string | null>(SESSION_KEY, null);
    const all = read<User[]>(USERS_KEY, []);
    const me = all.find((u) => u.id === sid);
    if (!me) return;
    const gs = read<Group[]>(GROUPS_KEY, []);
    const g = gs.find((x) => x.id === groupId);
    if (!g) return;
    if (opts?.isAnnouncement && g.ownerId !== me.id) throw new Error("Only the host can post announcements");
    const msg: Message = {
      id: "m_" + Math.random().toString(36).slice(2, 9),
      userId: me.id, userName: me.name, text, timestamp: Date.now(),
      isAnnouncement: !!opts?.isAnnouncement,
      attachments: opts?.attachments || [],
      reactions: {}, readBy: [me.id],
    };
    g.messages.push(msg);
    write(GROUPS_KEY, gs);
    addPoints(me.id, 1);
    if (opts?.isAnnouncement) {
      g.members.filter((m) => m.id !== me.id).forEach((m) => {
        pushNotification(m.id, { type: "announcement", text: `📣 ${g.subject}: ${text.slice(0, 60)}`, groupId: g.id });
      });
    } else {
      g.members.filter((m) => m.id !== me.id).slice(0, 1).forEach((m) => {
        pushNotification(m.id, { type: "message", text: `New message in "${g.subject}"`, groupId: g.id });
      });
    }
    recomputeBadges(me.id);
    emit();
  }, []);

  const reactToMessage = useCallback((groupId: string, messageId: string, emoji: string) => {
    const sid = read<string | null>(SESSION_KEY, null);
    if (!sid) return;
    const gs = read<Group[]>(GROUPS_KEY, []);
    const g = gs.find((x) => x.id === groupId);
    if (!g) return;
    const m = g.messages.find((x) => x.id === messageId);
    if (!m) return;
    m.reactions = m.reactions || {};
    const cur = m.reactions[emoji] || [];
    m.reactions[emoji] = cur.includes(sid) ? cur.filter((u) => u !== sid) : [...cur, sid];
    if (m.reactions[emoji].length === 0) delete m.reactions[emoji];
    write(GROUPS_KEY, gs);
    emit();
  }, []);

  const markRead = useCallback((groupId: string) => {
    const sid = read<string | null>(SESSION_KEY, null);
    if (!sid) return;
    const gs = read<Group[]>(GROUPS_KEY, []);
    const g = gs.find((x) => x.id === groupId);
    if (!g) return;
    let changed = false;
    g.messages.forEach((m) => {
      m.readBy = m.readBy || [];
      if (!m.readBy.includes(sid)) { m.readBy.push(sid); changed = true; }
    });
    if (changed) { write(GROUPS_KEY, gs); emit(); }
  }, []);

  const scheduleSession = useCallback((groupId: string, data: { title: string; startsAt: number; durationMin: number }) => {
    const sid = read<string | null>(SESSION_KEY, null);
    if (!sid) return;
    const gs = read<Group[]>(GROUPS_KEY, []);
    const g = gs.find((x) => x.id === groupId);
    if (!g) return;
    const s: Session = { id: "s_" + Math.random().toString(36).slice(2, 9), createdBy: sid, ...data };
    g.sessions = [...(g.sessions || []), s];
    write(GROUPS_KEY, gs);
    g.members.forEach((m) => {
      pushNotification(m.id, { type: "session", text: `📅 ${g.subject}: ${s.title} on ${new Date(s.startsAt).toLocaleString()}`, groupId: g.id });
    });
    addPoints(sid, 5);
    recomputeBadges(sid);
    emit();
  }, []);

  const deleteSession = useCallback((groupId: string, sessionId: string) => {
    const sid = read<string | null>(SESSION_KEY, null);
    const gs = read<Group[]>(GROUPS_KEY, []);
    const g = gs.find((x) => x.id === groupId);
    if (!g || g.ownerId !== sid) return;
    g.sessions = (g.sessions || []).filter((s) => s.id !== sessionId);
    write(GROUPS_KEY, gs);
    emit();
  }, []);

  const createQuiz = useCallback((groupId: string, data: { question: string; options: string[]; correctIndex: number }) => {
    const sid = read<string | null>(SESSION_KEY, null);
    if (!sid) return;
    const gs = read<Group[]>(GROUPS_KEY, []);
    const g = gs.find((x) => x.id === groupId);
    if (!g) return;
    const q: Quiz = { id: "q_" + Math.random().toString(36).slice(2, 9), createdBy: sid, createdAt: Date.now(), ...data };
    g.quizzes = [...(g.quizzes || []), q];
    write(GROUPS_KEY, gs);
    addPoints(sid, 5);
    recomputeBadges(sid);
    emit();
  }, []);

  const submitQuiz = useCallback((groupId: string, quizId: string, selectedIndex: number) => {
    const sid = read<string | null>(SESSION_KEY, null);
    if (!sid) return false;
    const gs = read<Group[]>(GROUPS_KEY, []);
    const g = gs.find((x) => x.id === groupId);
    if (!g) return false;
    const q = (g.quizzes || []).find((x) => x.id === quizId);
    if (!q) return false;
    g.quizAttempts = g.quizAttempts || [];
    const existing = g.quizAttempts.find((a) => a.quizId === quizId && a.userId === sid);
    const correct = selectedIndex === q.correctIndex;
    if (existing) { existing.selectedIndex = selectedIndex; existing.correct = correct; existing.timestamp = Date.now(); }
    else g.quizAttempts.push({ quizId, userId: sid, selectedIndex, correct, timestamp: Date.now() });
    write(GROUPS_KEY, gs);
    if (correct) addPoints(sid, 3);
    recomputeBadges(sid);
    emit();
    return correct;
  }, []);

  const markNotificationsRead = useCallback(() => {
    const sid = read<string | null>(SESSION_KEY, null);
    if (!sid) return;
    const all = read<Notification[]>(NOTIFS_KEY, []);
    all.forEach((n) => { if (n.userId === sid) n.read = true; });
    write(NOTIFS_KEY, all);
    emit();
  }, []);

  const recordSearch = useCallback((q: string) => {
    const sid = read<string | null>(SESSION_KEY, null);
    if (!sid || !q.trim() || q.trim().length < 2) return;
    const cur = getStats(sid);
    const next = [q.trim(), ...cur.searchHistory.filter((s) => s.toLowerCase() !== q.trim().toLowerCase())].slice(0, 10);
    setStats(sid, { searchHistory: next });
    emit();
  }, []);

  const logStudyMinutes = useCallback((minutes: number) => {
    const sid = read<string | null>(SESSION_KEY, null);
    if (!sid) return;
    const cur = getStats(sid);
    setStats(sid, { studyMinutes: cur.studyMinutes + minutes });
    emit();
  }, []);

  return {
    currentUser,
    groups: read<Group[]>(GROUPS_KEY, []),
    allUsers: users,
    notifications,
    stats,
    getStatsFor: (uid: string) => getStats(uid),
    signup, login, googleSignIn, logout, updateProfile,
    createGroup, joinGroup, leaveGroup, sendMessage, addMember,
    reactToMessage, markRead,
    scheduleSession, deleteSession,
    createQuiz, submitQuiz,
    approveJoin, rejectJoin, removeMember,
    markNotificationsRead, recordSearch, logStudyMinutes,
  };
}
