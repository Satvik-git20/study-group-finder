import { beforeEach, describe, expect, it } from "vitest";
import {
  addMember,
  approveJoin,
  createGroup,
  createQuiz,
  getState,
  getStatsFor,
  joinGroup,
  leaveGroup,
  login,
  logout,
  markGroupRead,
  reactToMessage,
  recordSearch,
  removeMember,
  resetAll,
  sendMessage,
  signInAsDemo,
  signup,
  submitQuiz,
  updateProfile,
} from "./index";

const PASSWORD = "correct horse battery";

function newUser(name: string, email: string) {
  return signup(name, email, PASSWORD);
}

/** signup() signs the new account in, so switch back before host-only actions. */
function signInAs(email: string) {
  login(email, PASSWORD);
}

function groupById(id: string) {
  const group = getState().groups.find((g) => g.id === id);
  if (!group) throw new Error(`group ${id} not found`);
  return group;
}

function statsFor(userId: string) {
  return getStatsFor(userId);
}

beforeEach(() => {
  resetAll();
});

// ---------------------------------------------------------------------------
// auth
// ---------------------------------------------------------------------------

describe("auth", () => {
  it("rejects short passwords", () => {
    expect(() => signup("Ada Lovelace", "ada@example.com", "short")).toThrow(
      /at least 8/,
    );
  });

  it("rejects malformed emails", () => {
    expect(() => signup("Ada Lovelace", "not-an-email", PASSWORD)).toThrow(
      /valid email/,
    );
  });

  it("normalises email casing and blocks duplicates", () => {
    newUser("Ada Lovelace", "Ada@Example.com");
    expect(() => signup("Someone Else", "ada@example.com", PASSWORD)).toThrow(
      /already exists/,
    );
  });

  it("reserves the demo email so the demo account cannot be hijacked", () => {
    expect(() => signup("Impostor", "demo@studysync.app", PASSWORD)).toThrow(
      /reserved/,
    );
  });

  it("signs a user in and back out", () => {
    const user = newUser("Ada Lovelace", "ada@example.com");
    expect(getState().sessionId).toBe(user.id);

    logout();
    expect(getState().sessionId).toBeNull();

    login("ada@example.com", PASSWORD);
    expect(getState().sessionId).toBe(user.id);
  });

  it("rejects a wrong password", () => {
    newUser("Ada Lovelace", "ada@example.com");
    logout();
    expect(() => login("ada@example.com", "wrong password")).toThrow(
      /Incorrect password/,
    );
  });

  it("reuses the same demo account across sign-ins", () => {
    const first = signInAsDemo();
    logout();
    const second = signInAsDemo();
    expect(second.id).toBe(first.id);
  });

  it("propagates a profile rename into group rosters", () => {
    const user = newUser("Ada Lovelace", "ada@example.com");
    const group = createGroup({
      subject: "Algebra",
      level: "Beginner",
      description: "",
      timing: "Mon",
      timeSlot: "Evening",
      mode: "Online",
      requireApproval: false,
    });

    updateProfile({ name: "Ada L." });
    expect(groupById(group.id).members[0]?.name).toBe("Ada L.");
    expect(groupById(group.id).ownerName).toBe("Ada L.");
    expect(getState().users.find((u) => u.id === user.id)?.name).toBe("Ada L.");
  });
});

// ---------------------------------------------------------------------------
// joining and leaving — the owner-orphan bug
// ---------------------------------------------------------------------------

describe("leaveGroup", () => {
  function hostWithMember() {
    const host = newUser("Host Person", "host@example.com");
    const group = createGroup({
      subject: "Algebra",
      level: "Beginner",
      description: "",
      timing: "Mon",
      timeSlot: "Evening",
      mode: "Online",
      requireApproval: false,
    });
    login("host@example.com", PASSWORD);

    const guest = newUser("Guest Person", "guest@example.com");
    signInAs("host@example.com");
    addMember(group.id, { id: guest.id, name: guest.name, email: guest.email });

    return { host, guest, group };
  }

  it("transfers ownership instead of orphaning the group", () => {
    const { host, guest, group } = hostWithMember();
    expect(groupById(group.id).members).toHaveLength(2);

    leaveGroup(group.id);

    const after = groupById(group.id);
    expect(after.ownerId).toBe(guest.id);
    expect(after.ownerName).toBe(guest.name);
    expect(after.members.map((m) => m.id)).not.toContain(host.id);
    expect(after.members.find((m) => m.id === guest.id)?.role).toBe("admin");
  });

  it("leaves ownership alone for non-owners", () => {
    const { host, guest, group } = hostWithMember();
    login("guest@example.com", PASSWORD);

    leaveGroup(group.id);

    const after = groupById(group.id);
    expect(after.ownerId).toBe(host.id);
    expect(after.members.map((m) => m.id)).toEqual([host.id]);
    expect(after.ownerId).not.toBe(guest.id);
  });

  it("dissolves the group when the host is the last member", () => {
    const solo = newUser("Solo Person", "solo@example.com");
    const group = createGroup({
      subject: "Solo Subject",
      level: "Advanced",
      description: "",
      timing: "Fri",
      timeSlot: "Morning",
      mode: "Offline",
      requireApproval: false,
    });

    leaveGroup(group.id);

    expect(getState().groups.find((g) => g.id === group.id)).toBeUndefined();
    expect(solo.id).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// joining with approval
// ---------------------------------------------------------------------------

describe("joinGroup", () => {
  it("joins immediately when approval is not required", () => {
    const owner = newUser("Owner", "owner@example.com");
    const group = createGroup({
      subject: "Open Subject",
      level: "Beginner",
      description: "",
      timing: "Mon",
      timeSlot: "Morning",
      mode: "Online",
      requireApproval: false,
    });

    const joiner = newUser("Joiner", "joiner@example.com");
    expect(joinGroup(group.id)).toBe("joined");
    expect(groupById(group.id).members.map((m) => m.id)).toContain(joiner.id);
    expect(owner.id).toBeTruthy();
  });

  it("queues a request when approval is required", () => {
    const owner = newUser("Owner", "owner@example.com");
    const group = createGroup({
      subject: "Gated Subject",
      level: "Advanced",
      description: "",
      timing: "Mon",
      timeSlot: "Morning",
      mode: "Online",
      requireApproval: true,
    });

    const joiner = newUser("Joiner", "joiner@example.com");
    expect(joinGroup(group.id)).toBe("requested");
    expect(groupById(group.id).joinRequests?.map((r) => r.userId)).toEqual([
      joiner.id,
    ]);
    expect(groupById(group.id).members.map((m) => m.id)).not.toContain(joiner.id);
    expect(owner.id).toBeTruthy();
  });

  it("does not duplicate a repeated request", () => {
    newUser("Owner", "owner@example.com");
    const group = createGroup({
      subject: "Gated",
      level: "Beginner",
      description: "",
      timing: "Mon",
      timeSlot: "Morning",
      mode: "Online",
      requireApproval: true,
    });

    newUser("Joiner", "joiner@example.com");
    joinGroup(group.id);
    joinGroup(group.id);
    expect(groupById(group.id).joinRequests).toHaveLength(1);
  });

  it("approves a pending request and adds the member", () => {
    newUser("Owner", "owner@example.com");
    const group = createGroup({
      subject: "Gated",
      level: "Beginner",
      description: "",
      timing: "Mon",
      timeSlot: "Morning",
      mode: "Online",
      requireApproval: true,
    });

    const joiner = newUser("Joiner", "joiner@example.com");
    joinGroup(group.id);

    login("owner@example.com", PASSWORD);
    approveJoin(group.id, joiner.id);

    expect(groupById(group.id).members.map((m) => m.id)).toContain(joiner.id);
    expect(groupById(group.id).joinRequests).toHaveLength(0);
  });

  it("ignores approvals from anyone but the host", () => {
    newUser("Owner", "owner@example.com");
    const group = createGroup({
      subject: "Gated",
      level: "Beginner",
      description: "",
      timing: "Mon",
      timeSlot: "Morning",
      mode: "Online",
      requireApproval: true,
    });

    const joiner = newUser("Joiner", "joiner@example.com");
    joinGroup(group.id);
    approveJoin(group.id, joiner.id); // still signed in as joiner, not host

    expect(groupById(group.id).members.map((m) => m.id)).not.toContain(joiner.id);
  });

  it("reports 'already' for an existing member", () => {
    const user = newUser("Owner", "owner@example.com");
    const group = createGroup({
      subject: "Mine",
      level: "Beginner",
      description: "",
      timing: "Mon",
      timeSlot: "Morning",
      mode: "Online",
      requireApproval: false,
    });
    expect(joinGroup(group.id)).toBe("already");
    expect(user.id).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// moderation
// ---------------------------------------------------------------------------

describe("removeMember", () => {
  it("refuses non-hosts", () => {
    const host = newUser("Host", "host@example.com");
    const group = createGroup({
      subject: "Subject",
      level: "Beginner",
      description: "",
      timing: "Mon",
      timeSlot: "Morning",
      mode: "Online",
      requireApproval: false,
    });
    const guest = newUser("Guest", "guest@example.com");
    signInAs("host@example.com");
    addMember(group.id, { id: guest.id, name: guest.name });

    // Sign back in as the guest: they are a member but not the host.
    signInAs("guest@example.com");
    expect(() => removeMember(group.id, host.id)).toThrow(/Only the host/);
  });

  it("refuses to remove the host", () => {
    const host = newUser("Host", "host@example.com");
    const group = createGroup({
      subject: "Subject",
      level: "Beginner",
      description: "",
      timing: "Mon",
      timeSlot: "Morning",
      mode: "Online",
      requireApproval: false,
    });
    expect(() => removeMember(group.id, host.id)).toThrow(/host cannot be removed/);
  });

  it("also clears a pending request from the removed user", () => {
    newUser("Owner", "owner@example.com");
    const group = createGroup({
      subject: "Gated",
      level: "Beginner",
      description: "",
      timing: "Mon",
      timeSlot: "Morning",
      mode: "Online",
      requireApproval: true,
    });

    const joiner = newUser("Joiner", "joiner@example.com");
    joinGroup(group.id);
    login("owner@example.com", PASSWORD);
    addMember(group.id, { id: joiner.id, name: joiner.name });

    removeMember(group.id, joiner.id);

    expect(groupById(group.id).members.map((m) => m.id)).not.toContain(joiner.id);
    expect(groupById(group.id).joinRequests).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// messages
// ---------------------------------------------------------------------------

describe("sendMessage", () => {
  it("only lets the host post announcements", () => {
    const host = newUser("Host", "host@example.com");
    const group = createGroup({
      subject: "Subject",
      level: "Beginner",
      description: "",
      timing: "Mon",
      timeSlot: "Morning",
      mode: "Online",
      requireApproval: false,
    });
    const guest = newUser("Guest", "guest@example.com");
    signInAs("host@example.com");
    addMember(group.id, { id: guest.id, name: guest.name });

    signInAs("guest@example.com");
    expect(() =>
      sendMessage(group.id, "listen up", [], { isAnnouncement: true }),
    ).toThrow(/Only the host/);

    login("host@example.com", PASSWORD);
    expect(() =>
      sendMessage(group.id, "listen up", [], { isAnnouncement: true }),
    ).not.toThrow();
    expect(host.id).toBeTruthy();
  });

  it("rejects attachments over the inline size limit", () => {
    newUser("User", "user@example.com");
    const group = createGroup({
      subject: "Subject",
      level: "Beginner",
      description: "",
      timing: "Mon",
      timeSlot: "Morning",
      mode: "Online",
      requireApproval: false,
    });

    expect(() =>
      sendMessage(group.id, "big file", [
        { name: "huge.pdf", dataUrl: "data:application/pdf;base64,AAAA", size: 5_000_000, type: "application/pdf" },
      ]),
    ).toThrow(/too large/);

    expect(groupById(group.id).messages).toHaveLength(0);
  });

  it("toggles a reaction on and back off", () => {
    const user = newUser("User", "user@example.com");
    const group = createGroup({
      subject: "Subject",
      level: "Beginner",
      description: "",
      timing: "Mon",
      timeSlot: "Morning",
      mode: "Online",
      requireApproval: false,
    });
    sendMessage(group.id, "hello");

    const messageId = groupById(group.id).messages[0]!.id;
    reactToMessage(group.id, messageId, "\u{1F44D}");
    expect(groupById(group.id).messages[0]?.reactions?.["\u{1F44D}"]).toEqual([
      user.id,
    ]);

    reactToMessage(group.id, messageId, "\u{1F44D}");
    expect(
      groupById(group.id).messages[0]?.reactions?.["\u{1F44D}"],
    ).toBeUndefined();
  });

  it("marks every message read exactly once", () => {
    newUser("User", "user@example.com");
    const group = createGroup({
      subject: "Subject",
      level: "Beginner",
      description: "",
      timing: "Mon",
      timeSlot: "Morning",
      mode: "Online",
      requireApproval: false,
    });
    sendMessage(group.id, "one");
    sendMessage(group.id, "two");

    markGroupRead(group.id);
    markGroupRead(group.id);

    for (const message of groupById(group.id).messages) {
      expect(message.readBy).toHaveLength(1);
    }
  });
});

// ---------------------------------------------------------------------------
// quizzes — the point-farming bug
// ---------------------------------------------------------------------------

describe("submitQuiz", () => {
  function quizFixture() {
    const author = newUser("Author", "author@example.com");
    const group = createGroup({
      subject: "Subject",
      level: "Beginner",
      description: "",
      timing: "Mon",
      timeSlot: "Morning",
      mode: "Online",
      requireApproval: false,
    });
    const taker = newUser("Taker", "taker@example.com");
    createQuiz(group.id, {
      question: "2 + 2?",
      options: ["3", "4", "5"],
      correctIndex: 1,
    });
    const quizId = groupById(group.id).quizzes![0]!.id;
    return { author, taker, groupId: group.id, quizId };
  }

  it("awards points for a correct answer", () => {
    const { taker, groupId, quizId } = quizFixture();
    const before = statsFor(taker.id)?.points ?? 0;

    expect(submitQuiz(groupId, quizId, 1)).toBe(true);
    expect(statsFor(taker.id)?.points).toBe(before + 3);
  });

  it("does not re-award points when re-answering the same quiz", () => {
    const { taker, groupId, quizId } = quizFixture();

    expect(submitQuiz(groupId, quizId, 0)).toBe(false); // wrong first
    expect(submitQuiz(groupId, quizId, 1)).toBe(true); // then right
    const afterFirstWin = statsFor(taker.id)?.points ?? 0;

    // Answer wrong again, then right again — the earlier award must stand.
    expect(submitQuiz(groupId, quizId, 0)).toBe(false);
    expect(submitQuiz(groupId, quizId, 1)).toBe(true);

    expect(statsFor(taker.id)?.points).toBe(afterFirstWin);
  });

  it("keeps a single attempt per user and quiz", () => {
    const { taker, groupId, quizId } = quizFixture();
    submitQuiz(groupId, quizId, 0);
    submitQuiz(groupId, quizId, 2);
    submitQuiz(groupId, quizId, 1);

    const attempts = groupById(groupId).quizAttempts ?? [];
    expect(attempts.filter((a) => a.userId === taker.id)).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// gamification
// ---------------------------------------------------------------------------

describe("badges", () => {
  it("does not hand out MENTOR for merely owning a second group", () => {
    const user = newUser("Solo", "solo@example.com");
    const base = {
      level: "Beginner" as const,
      description: "",
      timing: "Mon",
      timeSlot: "Morning" as const,
      mode: "Online" as const,
      requireApproval: false,
    };
    createGroup({ ...base, subject: "First" });
    createGroup({ ...base, subject: "Second" });

    const badges = statsFor(user.id)?.badges ?? [];
    expect(badges).toContain("Founder");
    expect(badges).not.toContain("Mentor");
  });

  it("awards MENTOR once the host actually has company", () => {
    const host = newUser("Host", "host@example.com");
    const group = createGroup({
      subject: "Subject",
      level: "Beginner",
      description: "",
      timing: "Mon",
      timeSlot: "Morning",
      mode: "Online",
      requireApproval: false,
    });
    const guest = newUser("Guest", "guest@example.com");
    login("host@example.com", PASSWORD);
    addMember(group.id, { id: guest.id, name: guest.name });

    expect(statsFor(host.id).badges).toContain("Mentor");
    expect(joinGroup(group.id)).toBe("already");
  });
});

// ---------------------------------------------------------------------------
// search history
// ---------------------------------------------------------------------------

describe("recordSearch", () => {
  it("ignores very short queries and de-duplicates", () => {
    const user = newUser("User", "user@example.com");

    recordSearch("a");
    expect(statsFor(user.id)?.searchHistory).toEqual([]);

    recordSearch("algebra");
    recordSearch("Algebra");
    expect(statsFor(user.id)?.searchHistory).toEqual(["Algebra"]);
  });

  it("caps history at ten entries, most recent first", () => {
    const user = newUser("User", "user@example.com");
    for (let i = 0; i < 15; i += 1) recordSearch(`query ${i}`);

    const history = statsFor(user.id)?.searchHistory ?? [];
    expect(history).toHaveLength(10);
    expect(history[0]).toBe("query 14");
  });
});
