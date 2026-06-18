import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, Users, Clock, Globe2, MapPin, Send, LogOut, UserPlus, X, Mail,
  MessageSquare, Calendar, Brain, Megaphone, Paperclip, Smile, Trash2, Check, CheckCheck,
  Plus, ShieldCheck, FileText, Download, FolderOpen, Sparkles, Bot, Image as ImageIcon,
} from "lucide-react";
import { useStore } from "./store";
import type { Route } from "./Layout";
import { Avatar } from "./Layout";
import { useToast } from "./Toast";
import type { Attachment, Group } from "./types";

const REACTIONS = ["👍", "❤️", "🎉", "🤔", "🔥", "👀"];

type Tab = "chat" | "sessions" | "quizzes" | "notes" | "ai" | "members";

export function GroupPage({ groupId, setRoute }: { groupId: string; setRoute: (r: Route) => void }) {
  const {
    groups, currentUser, leaveGroup, joinGroup, sendMessage, addMember,
    reactToMessage, markRead, scheduleSession, deleteSession, createQuiz, submitQuiz,
    approveJoin, rejectJoin, removeMember,
  } = useStore();
  const { push } = useToast();
  const group = groups.find((g) => g.id === groupId);
  const [tab, setTab] = useState<Tab>("chat");
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => { if (group) markRead(group.id); }, [group?.id, group?.messages.length, markRead]);

  if (!group) {
    return (
      <div className="text-center py-20">
        <div className="text-white">Group not found</div>
        <button onClick={() => setRoute("dashboard")} className="mt-4 text-blue-400 hover:text-blue-300 text-sm">← Back to dashboard</button>
      </div>
    );
  }

  const joined = !!currentUser && !!group.members.find((m) => m.id === currentUser.id);
  const isOwner = !!currentUser && group.ownerId === currentUser.id;
  const ModeIcon = group.mode === "Online" ? Globe2 : MapPin;
  const pendingRequests = group.joinRequests || [];

  const handleJoin = () => {
    const r = joinGroup(group.id);
    if (r.status === "joined") push("success", `Joined "${group.subject}"`);
    else if (r.status === "requested") push("info", "Request sent — waiting for approval");
  };

  return (
    <div className="flex flex-col gap-6">
      <button onClick={() => setRoute("dashboard")} className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white w-fit transition">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-blue-950/40 via-neutral-950 to-neutral-950 p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-72 h-72 bg-blue-600/20 rounded-full blur-[100px]" />
        <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-blue-500/10 text-blue-300 ring-1 ring-blue-500/30">{group.level}</span>
              <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-white/5 text-neutral-300 ring-1 ring-white/10 inline-flex items-center gap-1">
                <ModeIcon className="w-3 h-3" /> {group.mode}
              </span>
              {group.requireApproval && (
                <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/30 inline-flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Approval required
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl text-white tracking-tight">{group.subject}</h1>
            <div className="text-sm text-neutral-500 mt-1">Hosted by {group.ownerName}</div>
            <p className="text-neutral-300 mt-4 max-w-2xl">{group.description}</p>
            <div className="flex flex-wrap gap-2 mt-4 text-xs text-neutral-300">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 ring-1 ring-white/10"><Clock className="w-3 h-3" /> {group.timing}</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 ring-1 ring-white/10"><Users className="w-3 h-3" /> {group.members.length} members</span>
            </div>
          </div>
          <div className="flex gap-2">
            {joined ? (
              <button
                onClick={() => { leaveGroup(group.id); push("info", "Left the group"); setRoute("dashboard"); }}
                className="h-10 px-4 rounded-xl bg-red-500/10 text-red-300 ring-1 ring-red-500/30 hover:bg-red-500/20 transition-all inline-flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Leave
              </button>
            ) : (
              <button onClick={handleJoin} className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-950/40 transition-all">
                {group.requireApproval ? "Request to join" : "Join group"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 p-1 rounded-xl bg-neutral-900/70 ring-1 ring-white/5 w-fit">
        <TabBtn active={tab === "chat"} onClick={() => setTab("chat")} icon={<MessageSquare className="w-4 h-4" />} label="Chat" />
        <TabBtn active={tab === "sessions"} onClick={() => setTab("sessions")} icon={<Calendar className="w-4 h-4" />} label="Sessions" badge={(group.sessions || []).length} />
        <TabBtn active={tab === "quizzes"} onClick={() => setTab("quizzes")} icon={<Brain className="w-4 h-4" />} label="Quizzes" badge={(group.quizzes || []).length} />
        <TabBtn active={tab === "notes"} onClick={() => setTab("notes")} icon={<FolderOpen className="w-4 h-4" />} label="Notes" />
        <TabBtn active={tab === "ai"} onClick={() => setTab("ai")} icon={<Bot className="w-4 h-4" />} label="AI Tutor" />
        <TabBtn active={tab === "members"} onClick={() => setTab("members")} icon={<Users className="w-4 h-4" />} label="Members" badge={isOwner && pendingRequests.length > 0 ? pendingRequests.length : undefined} badgeAccent="amber" />
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        <div className="animate-[fadeIn_.2s_ease-out]">
          {tab === "chat" && <ChatPanel group={group} joined={joined} isOwner={isOwner} />}
          {tab === "sessions" && <SessionsPanel group={group} isOwner={isOwner} joined={joined} onSchedule={(d) => scheduleSession(group.id, d)} onDelete={(id) => deleteSession(group.id, id)} />}
          {tab === "quizzes" && <QuizPanel group={group} joined={joined} onCreate={(d) => createQuiz(group.id, d)} onSubmit={(qid, idx) => { const ok = submitQuiz(group.id, qid, idx); push(ok ? "success" : "error", ok ? "Correct! +3 pts" : "Not quite — try again"); }} />}
          {tab === "notes" && <NotesPanel group={group} />}
          {tab === "ai" && <AITutorPanel subject={group.subject} />}
          {tab === "members" && (
            <MembersPanel
              group={group} isOwner={isOwner}
              onAdd={() => setShowAdd(true)}
              onRemove={(uid) => { try { removeMember(group.id, uid); push("info", "Member removed"); } catch (e: any) { push("error", e.message); } }}
              onApprove={(uid) => { approveJoin(group.id, uid); push("success", "Member approved"); }}
              onReject={(uid) => { rejectJoin(group.id, uid); push("info", "Request rejected"); }}
            />
          )}
        </div>

        <aside className="rounded-2xl border border-white/5 bg-neutral-950/60 backdrop-blur-xl p-5 h-fit">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-neutral-400 inline-flex items-center gap-2"><Users className="w-4 h-4" /> Members ({group.members.length})</div>
            {isOwner && (
              <button onClick={() => setShowAdd(true)} className="h-8 px-2.5 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 ring-1 ring-blue-500/30 text-blue-300 text-xs inline-flex items-center gap-1.5 transition">
                <UserPlus className="w-3.5 h-3.5" /> Add
              </button>
            )}
          </div>
          <div className="flex flex-col gap-1">
            {group.members.map((m) => (
              <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition">
                <Avatar name={m.name} size={32} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">{m.name}{m.id === currentUser?.id ? " (you)" : ""}</div>
                  <div className="text-xs text-neutral-500">{m.id === group.ownerId ? "Host · Admin" : "Member"}</div>
                </div>
                {isOwner && m.id !== group.ownerId && (
                  <button
                    onClick={() => { try { removeMember(group.id, m.id); push("info", "Removed"); } catch (e: any) { push("error", e.message); } }}
                    title="Remove member"
                    className="w-7 h-7 rounded-lg text-neutral-500 hover:text-red-300 hover:bg-red-500/10 transition flex items-center justify-center"
                  ><X className="w-3.5 h-3.5" /></button>
                )}
              </div>
            ))}
          </div>
        </aside>
      </div>

      {showAdd && (
        <AddMemberModal
          onClose={() => setShowAdd(false)}
          existingIds={group.members.map((m) => m.id)}
          onAdd={(payload) => {
            try { addMember(group.id, payload); push("success", `Added ${payload.name}`); setShowAdd(false); }
            catch (e: any) { push("error", e.message || "Could not add member"); }
          }}
        />
      )}
    </div>
  );
}

function TabBtn({ active, onClick, icon, label, badge, badgeAccent }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; badge?: number; badgeAccent?: "amber" }) {
  return (
    <button onClick={onClick} className={`px-3 h-9 rounded-lg text-sm flex items-center gap-2 transition ${active ? "bg-blue-600/20 text-blue-300 ring-1 ring-blue-500/30" : "text-neutral-400 hover:text-white"}`}>
      {icon} {label}
      {badge !== undefined && badge > 0 && (
        <span className={`text-[10px] px-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full ${badgeAccent === "amber" ? "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40" : "bg-blue-500/20 text-blue-300"}`}>{badge}</span>
      )}
    </button>
  );
}

function ChatPanel({ group, joined, isOwner }: { group: Group; joined: boolean; isOwner: boolean }) {
  const { currentUser, sendMessage, reactToMessage } = useStore();
  const { push } = useToast();
  const [text, setText] = useState("");
  const [announce, setAnnounce] = useState(false);
  const [pending, setPending] = useState<Attachment[]>([]);
  const [reactingFor, setReactingFor] = useState<string | null>(null);
  const [typingPeer, setTypingPeer] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [group.messages.length, typingPeer]);

  useEffect(() => {
    const others = group.members.filter((m) => m.id !== currentUser?.id);
    if (others.length === 0) return;
    let active = true;
    const tick = () => {
      if (!active) return;
      if (Math.random() < 0.35) {
        const peer = others[Math.floor(Math.random() * others.length)];
        setTypingPeer(peer.name);
        setTimeout(() => setTypingPeer(null), 2200 + Math.random() * 1500);
      }
      setTimeout(tick, 9000 + Math.random() * 11000);
    };
    const t = setTimeout(tick, 4000 + Math.random() * 4000);
    return () => { active = false; clearTimeout(t); };
  }, [group.id, group.members.length, currentUser?.id]);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const f of files) {
      if (f.size > 2_500_000) { push("error", `${f.name} is too large (max 2.5 MB)`); continue; }
      const dataUrl = await new Promise<string>((res, rej) => {
        const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(f);
      });
      setPending((p) => [...p, { name: f.name, dataUrl, size: f.size, type: f.type }]);
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && pending.length === 0) return;
    try {
      sendMessage(group.id, text.trim(), { isAnnouncement: announce, attachments: pending });
      setText(""); setPending([]); setAnnounce(false);
    } catch (err: any) { push("error", err.message); }
  };

  const otherMembersCount = Math.max(0, group.members.length - 1);

  return (
    <div className="rounded-2xl border border-white/5 bg-neutral-950/60 backdrop-blur-xl flex flex-col h-[60vh] min-h-[480px] overflow-hidden">
      <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
        <div className="text-sm text-neutral-400">Group chat · live</div>
        {isOwner && joined && (
          <label className="inline-flex items-center gap-1.5 text-xs text-amber-300 cursor-pointer">
            <input type="checkbox" checked={announce} onChange={(e) => setAnnounce(e.target.checked)} className="accent-amber-500 w-3.5 h-3.5" />
            <Megaphone className="w-3.5 h-3.5" /> Post as announcement
          </label>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
        {group.messages.length === 0 ? (
          <div className="m-auto text-center text-sm text-neutral-500">No messages yet — say hi 👋</div>
        ) : (
          group.messages.map((m) => {
            const mine = m.userId === currentUser?.id;
            const readByOthers = (m.readBy || []).filter((u) => u !== m.userId).length;
            const allRead = otherMembersCount > 0 && readByOthers >= otherMembersCount;

            if (m.isAnnouncement) {
              return (
                <div key={m.id} className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
                  <div className="flex items-center gap-2 text-amber-300 text-xs uppercase tracking-wider mb-1">
                    <Megaphone className="w-3.5 h-3.5" /> Announcement · {m.userName} · {fmtTime(m.timestamp)}
                  </div>
                  <div className="text-sm text-amber-100">{m.text}</div>
                  <Attachments attachments={m.attachments} />
                </div>
              );
            }

            return (
              <div key={m.id} className={`flex gap-2 ${mine ? "flex-row-reverse" : ""} group/msg`}>
                <Avatar name={m.userName} size={28} />
                <div className={`max-w-[75%] flex flex-col ${mine ? "items-end" : "items-start"}`}>
                  <div className="text-[11px] text-neutral-500 mb-0.5">
                    {mine ? "You" : m.userName} · {fmtTime(m.timestamp)}
                  </div>
                  <div className="relative">
                    <div className={`px-3 py-2 rounded-2xl text-sm ${mine ? "bg-blue-600 text-white rounded-br-sm" : "bg-white/5 text-neutral-100 ring-1 ring-white/10 rounded-bl-sm"}`}>
                      {m.text}
                      <Attachments attachments={m.attachments} />
                    </div>
                    <button
                      onClick={() => setReactingFor(reactingFor === m.id ? null : m.id)}
                      className={`absolute -top-2 ${mine ? "-left-2" : "-right-2"} w-6 h-6 rounded-full bg-neutral-900 ring-1 ring-white/10 hover:ring-blue-500/40 text-neutral-400 hover:text-white opacity-0 group-hover/msg:opacity-100 transition flex items-center justify-center`}
                      title="React"
                    ><Smile className="w-3 h-3" /></button>
                    {reactingFor === m.id && (
                      <div className={`absolute z-10 ${mine ? "right-0" : "left-0"} -top-10 flex gap-1 p-1 rounded-full bg-neutral-900 ring-1 ring-white/10 shadow-lg`}>
                        {REACTIONS.map((e) => (
                          <button key={e} onClick={() => { reactToMessage(group.id, m.id, e); setReactingFor(null); }}
                            className="w-7 h-7 rounded-full hover:bg-white/10 transition text-base">{e}</button>
                        ))}
                      </div>
                    )}
                  </div>

                  {m.reactions && Object.keys(m.reactions).length > 0 && (
                    <div className={`flex gap-1 mt-1 flex-wrap ${mine ? "justify-end" : ""}`}>
                      {Object.entries(m.reactions).map(([e, ids]) => {
                        const mineR = currentUser && ids.includes(currentUser.id);
                        return (
                          <button key={e} onClick={() => reactToMessage(group.id, m.id, e)}
                            className={`text-[11px] px-1.5 py-0.5 rounded-full ring-1 transition ${mineR ? "bg-blue-500/20 ring-blue-500/40 text-blue-200" : "bg-white/5 ring-white/10 text-neutral-300 hover:bg-white/10"}`}>
                            {e} {ids.length}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {mine && otherMembersCount > 0 && (
                    <div className="text-[10px] text-neutral-500 mt-0.5 inline-flex items-center gap-1">
                      {allRead ? <><CheckCheck className="w-3 h-3 text-blue-400" /> Read</> : <><Check className="w-3 h-3" /> Sent</>}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        {typingPeer && (
          <div className="flex items-center gap-2 text-xs text-neutral-500 pl-1 animate-[fadeIn_.2s_ease-out]">
            <Avatar name={typingPeer} size={20} />
            <span>{typingPeer} is typing</span>
            <span className="inline-flex gap-0.5">
              <span className="w-1 h-1 rounded-full bg-blue-400 animate-[typingDot_1s_ease-in-out_infinite]" />
              <span className="w-1 h-1 rounded-full bg-blue-400 animate-[typingDot_1s_ease-in-out_.15s_infinite]" />
              <span className="w-1 h-1 rounded-full bg-blue-400 animate-[typingDot_1s_ease-in-out_.3s_infinite]" />
            </span>
          </div>
        )}
      </div>

      {joined ? (
        <div className="border-t border-white/5">
          {pending.length > 0 && (
            <div className="px-3 pt-3 flex flex-wrap gap-2">
              {pending.map((a, i) => (
                <div key={i} className="inline-flex items-center gap-2 pl-2 pr-1 h-8 rounded-lg bg-white/5 ring-1 ring-white/10 text-xs text-neutral-200">
                  <FileText className="w-3.5 h-3.5 text-blue-300" /> <span className="max-w-[140px] truncate">{a.name}</span>
                  <button onClick={() => setPending((p) => p.filter((_, j) => j !== i))} className="w-6 h-6 rounded text-neutral-400 hover:text-red-300 transition flex items-center justify-center"><X className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          )}
          <form onSubmit={send} className="p-3 flex items-center gap-2">
            <input ref={fileRef} type="file" multiple onChange={onFile} className="hidden" accept=".pdf,.png,.jpg,.jpeg,.gif,.txt,.md,.doc,.docx" />
            <button type="button" onClick={() => fileRef.current?.click()} title="Attach files"
              className="w-10 h-10 rounded-xl bg-neutral-900/70 ring-1 ring-white/5 hover:ring-blue-500/40 text-neutral-400 hover:text-white transition flex items-center justify-center">
              <Paperclip className="w-4 h-4" />
            </button>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder={announce ? "Write announcement…" : "Write a message…"}
              className={`flex-1 h-10 px-3 rounded-xl bg-neutral-900/70 ring-1 outline-none text-sm text-white placeholder:text-neutral-500 transition-all ${announce ? "ring-amber-500/40 focus:ring-amber-500/60" : "ring-white/5 focus:ring-blue-500/50"}`} />
            <button className={`h-10 w-10 rounded-xl text-white inline-flex items-center justify-center transition-all ${announce ? "bg-amber-500 hover:bg-amber-400" : "bg-blue-600 hover:bg-blue-500"}`}>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        <div className="border-t border-white/5 p-4 text-center text-sm text-neutral-500">Join this group to participate in the chat</div>
      )}
    </div>
  );
}

function Attachments({ attachments }: { attachments?: Attachment[] }) {
  if (!attachments || attachments.length === 0) return null;
  return (
    <div className="mt-2 flex flex-col gap-1.5">
      {attachments.map((a, i) => {
        const isImage = a.type.startsWith("image/");
        if (isImage) {
          return <img key={i} src={a.dataUrl} alt={a.name} className="max-w-[240px] max-h-48 rounded-lg ring-1 ring-white/10" />;
        }
        return (
          <a key={i} href={a.dataUrl} download={a.name}
            className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-black/20 ring-1 ring-white/10 hover:ring-blue-400/40 transition text-xs text-neutral-100 w-fit">
            <FileText className="w-3.5 h-3.5 text-blue-300" />
            <span className="max-w-[180px] truncate">{a.name}</span>
            <Download className="w-3 h-3 text-neutral-400" />
          </a>
        );
      })}
    </div>
  );
}

function SessionsPanel({ group, isOwner, joined, onSchedule, onDelete }: { group: Group; isOwner: boolean; joined: boolean; onSchedule: (d: { title: string; startsAt: number; durationMin: number }) => void; onDelete: (id: string) => void }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(60);
  const upcoming = useMemo(() => [...(group.sessions || [])].sort((a, b) => a.startsAt - b.startsAt), [group.sessions]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const ts = new Date(`${date}T${time}`).getTime();
    if (!title.trim() || !ts || isNaN(ts)) return;
    onSchedule({ title: title.trim(), startsAt: ts, durationMin: duration });
    setTitle(""); setDate(""); setTime("");
  };

  return (
    <div className="rounded-2xl border border-white/5 bg-neutral-950/60 backdrop-blur-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-4 h-4 text-blue-300" />
        <div className="text-sm text-white">Study sessions</div>
      </div>

      {joined && (
        <form onSubmit={submit} className="grid sm:grid-cols-[1fr_140px_120px_100px_auto] gap-2 mb-5 p-3 rounded-xl bg-neutral-900/60 ring-1 ring-white/5">
          <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Session title (e.g. Midterm prep)"
            className="h-10 px-3 rounded-lg bg-neutral-900/70 ring-1 ring-white/5 focus:ring-blue-500/50 outline-none text-sm text-white placeholder:text-neutral-500" />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="h-10 px-3 rounded-lg bg-neutral-900/70 ring-1 ring-white/5 focus:ring-blue-500/50 outline-none text-sm text-white" />
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required className="h-10 px-3 rounded-lg bg-neutral-900/70 ring-1 ring-white/5 focus:ring-blue-500/50 outline-none text-sm text-white" />
          <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="h-10 px-3 rounded-lg bg-neutral-900/70 ring-1 ring-white/5 outline-none text-sm text-white">
            {[30, 45, 60, 90, 120, 180].map((m) => <option key={m} value={m} className="bg-neutral-900">{m} min</option>)}
          </select>
          <button className="h-10 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm transition inline-flex items-center justify-center gap-1"><Plus className="w-4 h-4" /> Schedule</button>
        </form>
      )}

      {upcoming.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-neutral-500">No sessions scheduled yet.</div>
      ) : (
        <div className="flex flex-col gap-2">
          {upcoming.map((s) => {
            const past = s.startsAt < Date.now();
            return (
              <div key={s.id} className={`flex items-center gap-3 p-3 rounded-xl bg-neutral-900/60 ring-1 ring-white/5 ${past ? "opacity-60" : ""}`}>
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 ring-1 ring-blue-500/30 flex flex-col items-center justify-center text-blue-300">
                  <div className="text-[10px] uppercase">{new Date(s.startsAt).toLocaleString(undefined, { month: "short" })}</div>
                  <div className="text-base leading-none">{new Date(s.startsAt).getDate()}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white truncate">{s.title}</div>
                  <div className="text-xs text-neutral-500">{new Date(s.startsAt).toLocaleString()} · {s.durationMin} min{past ? " · ended" : ""}</div>
                </div>
                {isOwner && (
                  <button onClick={() => onDelete(s.id)} className="w-8 h-8 rounded-lg text-neutral-500 hover:text-red-300 hover:bg-red-500/10 transition flex items-center justify-center" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function QuizPanel({ group, joined, onCreate, onSubmit }: { group: Group; joined: boolean; onCreate: (d: { question: string; options: string[]; correctIndex: number }) => void; onSubmit: (qid: string, idx: number) => void }) {
  const { currentUser } = useStore();
  const [show, setShow] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correct, setCorrect] = useState(0);
  const quizzes = group.quizzes || [];
  const attempts = group.quizAttempts || [];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = options.map((o) => o.trim()).filter(Boolean);
    if (!question.trim() || cleaned.length < 2) return;
    onCreate({ question: question.trim(), options: cleaned, correctIndex: Math.min(correct, cleaned.length - 1) });
    setQuestion(""); setOptions(["", "", "", ""]); setCorrect(0); setShow(false);
  };

  return (
    <div className="rounded-2xl border border-white/5 bg-neutral-950/60 backdrop-blur-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2"><Brain className="w-4 h-4 text-blue-300" /><div className="text-sm text-white">Quizzes</div></div>
        {joined && (
          <button onClick={() => setShow((s) => !s)} className="h-9 px-3 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 ring-1 ring-blue-500/30 text-blue-300 text-xs inline-flex items-center gap-1.5 transition">
            {show ? <><X className="w-3.5 h-3.5" /> Cancel</> : <><Plus className="w-3.5 h-3.5" /> Create quiz</>}
          </button>
        )}
      </div>

      {show && (
        <form onSubmit={submit} className="mb-5 p-4 rounded-xl bg-neutral-900/60 ring-1 ring-white/5 flex flex-col gap-3">
          <input required value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Question"
            className="h-10 px-3 rounded-lg bg-neutral-900/70 ring-1 ring-white/5 focus:ring-blue-500/50 outline-none text-sm text-white placeholder:text-neutral-500" />
          {options.map((o, i) => (
            <label key={i} className="flex items-center gap-2">
              <input type="radio" checked={correct === i} onChange={() => setCorrect(i)} className="accent-blue-500" />
              <input value={o} onChange={(e) => setOptions((opts) => opts.map((x, j) => j === i ? e.target.value : x))} placeholder={`Option ${i + 1}`}
                className="flex-1 h-10 px-3 rounded-lg bg-neutral-900/70 ring-1 ring-white/5 focus:ring-blue-500/50 outline-none text-sm text-white placeholder:text-neutral-500" />
            </label>
          ))}
          <div className="text-xs text-neutral-500">Select the radio next to the correct answer.</div>
          <button className="h-10 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm transition">Publish quiz</button>
        </form>
      )}

      {quizzes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-neutral-500">No quizzes yet — create one to test the group!</div>
      ) : (
        <div className="flex flex-col gap-3">
          {quizzes.map((q) => {
            const myAttempt = attempts.find((a) => a.quizId === q.id && a.userId === currentUser?.id);
            const totalAttempts = attempts.filter((a) => a.quizId === q.id).length;
            const correctCount = attempts.filter((a) => a.quizId === q.id && a.correct).length;
            return (
              <div key={q.id} className="p-4 rounded-xl bg-neutral-900/60 ring-1 ring-white/5">
                <div className="text-white">{q.question}</div>
                <div className="text-xs text-neutral-500 mt-1 mb-3">{totalAttempts} attempt{totalAttempts === 1 ? "" : "s"} · {totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0}% correct</div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {q.options.map((opt, i) => {
                    const picked = myAttempt?.selectedIndex === i;
                    const isCorrect = q.correctIndex === i;
                    const showResult = !!myAttempt;
                    let cls = "bg-neutral-900/70 ring-white/5 hover:ring-blue-500/30 text-neutral-200";
                    if (showResult && isCorrect) cls = "bg-emerald-500/15 ring-emerald-500/40 text-emerald-200";
                    else if (showResult && picked && !isCorrect) cls = "bg-red-500/15 ring-red-500/40 text-red-200";
                    return (
                      <button key={i} disabled={!joined} onClick={() => onSubmit(q.id, i)}
                        className={`text-left p-2.5 rounded-lg ring-1 transition text-sm ${cls} ${!joined ? "opacity-60 cursor-not-allowed" : ""}`}>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MembersPanel({
  group, isOwner, onAdd, onRemove, onApprove, onReject,
}: {
  group: Group; isOwner: boolean;
  onAdd: () => void; onRemove: (uid: string) => void;
  onApprove: (uid: string) => void; onReject: (uid: string) => void;
}) {
  const { currentUser } = useStore();
  const requests = group.joinRequests || [];

  return (
    <div className="rounded-2xl border border-white/5 bg-neutral-950/60 backdrop-blur-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2"><Users className="w-4 h-4 text-blue-300" /><div className="text-sm text-white">Members & roles</div></div>
        {isOwner && <button onClick={onAdd} className="h-9 px-3 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 ring-1 ring-blue-500/30 text-blue-300 text-xs inline-flex items-center gap-1.5 transition"><UserPlus className="w-3.5 h-3.5" /> Add member</button>}
      </div>

      {isOwner && requests.length > 0 && (
        <div className="mb-5">
          <div className="text-xs uppercase tracking-wider text-amber-300 mb-2 inline-flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Pending requests ({requests.length})</div>
          <div className="flex flex-col gap-2">
            {requests.map((r) => (
              <div key={r.userId} className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 ring-1 ring-amber-500/20">
                <Avatar name={r.userName} size={32} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">{r.userName}</div>
                  <div className="text-xs text-neutral-500">requested {timeAgo(r.timestamp)}</div>
                </div>
                <button onClick={() => onApprove(r.userId)} className="h-8 px-3 rounded-lg bg-emerald-500/15 ring-1 ring-emerald-500/40 text-emerald-300 text-xs hover:bg-emerald-500/25 transition">Approve</button>
                <button onClick={() => onReject(r.userId)} className="h-8 px-3 rounded-lg bg-white/5 ring-1 ring-white/10 text-neutral-300 text-xs hover:bg-white/10 transition">Reject</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col divide-y divide-white/5">
        {group.members.map((m) => (
          <div key={m.id} className="flex items-center gap-3 py-3">
            <Avatar name={m.name} size={36} />
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white truncate">{m.name}{m.id === currentUser?.id ? " (you)" : ""}</div>
              <div className="text-xs text-neutral-500">{m.id === group.ownerId ? "Host · Admin" : "Member"}</div>
            </div>
            {m.id === group.ownerId ? (
              <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-blue-500/10 text-blue-300 ring-1 ring-blue-500/30">Admin</span>
            ) : isOwner ? (
              <button onClick={() => onRemove(m.id)} className="h-8 px-3 rounded-lg bg-red-500/10 ring-1 ring-red-500/30 text-red-300 text-xs hover:bg-red-500/20 transition inline-flex items-center gap-1">
                <Trash2 className="w-3 h-3" /> Remove
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function NotesPanel({ group }: { group: Group }) {
  const items = useMemo(() => {
    return group.messages.flatMap((m) =>
      (m.attachments || []).map((a) => ({ ...a, by: m.userName, ts: m.timestamp, mid: m.id }))
    ).sort((a, b) => b.ts - a.ts);
  }, [group.messages]);

  const fmtSize = (n: number) => n > 1024 * 1024 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;

  return (
    <div className="rounded-2xl border border-white/5 bg-neutral-950/60 backdrop-blur-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2"><FolderOpen className="w-4 h-4 text-blue-300" /><div className="text-sm text-white">Shared notes & files</div></div>
        <div className="text-xs text-neutral-500">{items.length} item{items.length === 1 ? "" : "s"}</div>
      </div>
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 p-10 text-center text-sm text-neutral-500">
          No notes shared yet — drop PDFs or images in chat using the paperclip 📎
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((a, i) => {
            const isImage = a.type.startsWith("image/");
            return (
              <a key={a.mid + "_" + i} href={a.dataUrl} download={a.name}
                 className="group rounded-xl bg-neutral-900/60 ring-1 ring-white/5 hover:ring-blue-500/40 hover:-translate-y-0.5 transition-all overflow-hidden flex flex-col">
                <div className="aspect-[16/10] bg-black/40 flex items-center justify-center overflow-hidden">
                  {isImage ? (
                    <img src={a.dataUrl} alt={a.name} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition" />
                  ) : (
                    <FileText className="w-10 h-10 text-blue-300/70" />
                  )}
                </div>
                <div className="p-3">
                  <div className="text-sm text-white truncate inline-flex items-center gap-1.5">
                    {isImage ? <ImageIcon className="w-3.5 h-3.5 text-blue-300 shrink-0" /> : <FileText className="w-3.5 h-3.5 text-blue-300 shrink-0" />}
                    <span className="truncate">{a.name}</span>
                  </div>
                  <div className="text-xs text-neutral-500 mt-0.5 flex items-center justify-between">
                    <span className="truncate">by {a.by}</span>
                    <span className="shrink-0 ml-2">{fmtSize(a.size)}</span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AITutorPanel({ subject }: { subject: string }) {
  type Turn = { role: "user" | "ai"; text: string };
  const [turns, setTurns] = useState<Turn[]>([
    { role: "ai", text: `Hi! I'm your StudySync AI tutor for ${subject}. Ask me anything — definitions, worked examples, study tips, or quick summaries.` },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [turns, thinking]);

  const fakeAnswer = (q: string) => {
    const lower = q.toLowerCase();
    if (lower.includes("explain") || lower.includes("what is") || lower.includes("define")) {
      return `Here's a clear take on that ${subject} concept:\n\n• Start with the core definition and why it matters.\n• Tie it to a concrete example from class.\n• Note one common pitfall students hit.\n\nWant me to expand any bullet, or generate a 3-question mini-quiz on it?`;
    }
    if (lower.includes("example") || lower.includes("show")) {
      return `Sure — here's a worked example for ${subject}:\n\n1. Identify what's given and what's asked.\n2. Apply the key rule/formula step by step.\n3. Check the answer with a quick sanity test.\n\nWant a harder variation?`;
    }
    if (lower.includes("summary") || lower.includes("summarize") || lower.includes("notes")) {
      return `📌 ${subject} — quick summary:\n• Core idea in one sentence.\n• Two formulas / rules you must memorize.\n• Three classic problem patterns.\n• One trap to avoid.\n\nSay "expand" and I'll dive deeper into any bullet.`;
    }
    if (lower.includes("quiz") || lower.includes("test")) {
      return `Try this: \n\n**Q.** In the context of ${subject}, which option best describes the principle most students confuse?\n\nA) The textbook definition\nB) The intuitive analogy\nC) Both, depending on the problem ✅\nD) Neither\n\nReply with your answer and I'll explain.`;
    }
    return `Great question on ${subject}. The intuition is: break it down to the smallest moving part, verify it on a tiny example, then generalize. Want a worked example or a 1-minute summary?`;
  };

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const q = input.trim();
    setTurns((t) => [...t, { role: "user", text: q }]);
    setInput("");
    setThinking(true);
    setTimeout(() => {
      setTurns((t) => [...t, { role: "ai", text: fakeAnswer(q) }]);
      setThinking(false);
    }, 700 + Math.random() * 700);
  };

  const suggestions = [`Explain a core ${subject} concept`, `Give me a worked example`, `Summarize ${subject} in 1 minute`, `Make a quick quiz`];

  return (
    <div className="rounded-2xl border border-white/5 bg-neutral-950/60 backdrop-blur-xl flex flex-col h-[60vh] min-h-[480px] overflow-hidden">
      <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center"><Sparkles className="w-3.5 h-3.5 text-white" /></div>
          <div>
            <div className="text-sm text-white">AI Doubt Solver</div>
            <div className="text-[11px] text-neutral-500">Demo mode · plug in ChatGPT API for live answers</div>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
        {turns.map((t, i) => (
          <div key={i} className={`flex gap-2 ${t.role === "user" ? "flex-row-reverse" : ""}`}>
            {t.role === "ai" ? (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shrink-0"><Bot className="w-3.5 h-3.5 text-white" /></div>
            ) : (
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-[11px] text-white shrink-0">You</div>
            )}
            <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${t.role === "user" ? "bg-blue-600 text-white rounded-br-sm" : "bg-white/5 text-neutral-100 ring-1 ring-white/10 rounded-bl-sm"}`}>{t.text}</div>
          </div>
        ))}
        {thinking && (
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shrink-0"><Bot className="w-3.5 h-3.5 text-white" /></div>
            <div className="px-3 py-2 rounded-2xl bg-white/5 ring-1 ring-white/10 inline-flex gap-1 items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-[typingDot_1s_ease-in-out_infinite]" />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-[typingDot_1s_ease-in-out_.15s_infinite]" />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-[typingDot_1s_ease-in-out_.3s_infinite]" />
            </div>
          </div>
        )}
      </div>

      {turns.length <= 2 && (
        <div className="px-3 pb-2 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button key={s} onClick={() => setInput(s)} className="text-xs px-2.5 py-1 rounded-full bg-white/5 hover:bg-blue-500/15 text-neutral-300 hover:text-blue-300 ring-1 ring-white/10 transition">{s}</button>
          ))}
        </div>
      )}

      <form onSubmit={send} className="border-t border-white/5 p-3 flex items-center gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask the AI tutor a question…"
          className="flex-1 h-10 px-3 rounded-xl bg-neutral-900/70 ring-1 ring-white/5 focus:ring-blue-500/50 outline-none text-sm text-white placeholder:text-neutral-500 transition-all" />
        <button disabled={thinking} className="h-10 w-10 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white flex items-center justify-center transition">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

function AddMemberModal({ onClose, onAdd, existingIds }: { onClose: () => void; onAdd: (m: { id?: string; name: string; email?: string }) => void; existingIds: string[]; }) {
  const allUsers: { id: string; name: string; email: string }[] = (() => {
    try { return JSON.parse(localStorage.getItem("ssync_users") || "[]"); } catch { return []; }
  })();
  const candidates = allUsers.filter((u) => !existingIds.includes(u.id));
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const filtered = candidates.filter((u) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (!name.trim()) return; onAdd({ name: name.trim(), email: email.trim() || undefined }); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-[fadeIn_.2s_ease-out]">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-neutral-950/90 backdrop-blur-xl shadow-2xl shadow-blue-950/40 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div>
            <div className="text-white inline-flex items-center gap-2"><UserPlus className="w-4 h-4 text-blue-300" /> Add member</div>
            <div className="text-xs text-neutral-500 mt-0.5">Only the host can add members</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <div>
            <div className="text-xs text-neutral-400 mb-2 uppercase tracking-wider">From StudySync users</div>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or email…"
              className="w-full h-10 px-3 rounded-lg bg-neutral-900/70 ring-1 ring-white/5 focus:ring-blue-500/50 outline-none text-sm text-white placeholder:text-neutral-500" />
            <div className="mt-2 max-h-44 overflow-y-auto rounded-lg ring-1 ring-white/5 bg-neutral-900/40 divide-y divide-white/5">
              {filtered.length === 0 ? (
                <div className="p-3 text-xs text-neutral-500 text-center">No matching users</div>
              ) : filtered.map((u) => (
                <button key={u.id} onClick={() => onAdd({ id: u.id, name: u.name, email: u.email })} className="w-full flex items-center gap-3 p-2.5 hover:bg-white/5 transition text-left">
                  <Avatar name={u.name} size={28} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">{u.name}</div>
                    <div className="text-xs text-neutral-500 truncate">{u.email}</div>
                  </div>
                  <span className="text-xs text-blue-300">Add</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-neutral-600"><div className="h-px flex-1 bg-white/10" /> or invite manually <div className="h-px flex-1 bg-white/10" /></div>
          <form onSubmit={submit} className="flex flex-col gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Member name"
              className="w-full h-10 px-3 rounded-lg bg-neutral-900/70 ring-1 ring-white/5 focus:ring-blue-500/50 outline-none text-sm text-white placeholder:text-neutral-500" />
            <label className="flex items-center gap-2 h-10 px-3 rounded-lg bg-neutral-900/70 ring-1 ring-white/5 focus-within:ring-blue-500/50 transition">
              <Mail className="w-4 h-4 text-neutral-500" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional)"
                className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-neutral-500" />
            </label>
            <button type="submit" disabled={!name.trim()} className="mt-1 h-10 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm shadow shadow-blue-950/40 transition active:scale-[0.99]">Add to group</button>
          </form>
        </div>
      </div>
    </div>
  );
}

function fmtTime(ts: number) { return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
function timeAgo(ts: number) {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
