import { useMemo } from "react";
import { BarChart3, Users, MessageSquare, Calendar, Award, Trophy, Brain, Clock } from "lucide-react";
import { useStore } from "./store";

export function Analytics() {
  const { currentUser, groups, stats } = useStore();
  if (!currentUser) return null;

  const data = useMemo(() => {
    const myGroups = groups.filter((g) => g.members.find((m) => m.id === currentUser.id));
    const ownedGroups = groups.filter((g) => g.ownerId === currentUser.id);
    const myMessages = groups.flatMap((g) => g.messages.filter((m) => m.userId === currentUser.id));
    const upcomingSessions = groups
      .flatMap((g) => (g.sessions || []).map((s) => ({ ...s, group: g.subject })))
      .filter((s) => s.startsAt > Date.now())
      .sort((a, b) => a.startsAt - b.startsAt)
      .slice(0, 5);

    // Activity over last 7 days
    const days: { label: string; count: number; sessions: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i);
      const next = d.getTime() + 86400_000;
      const count = myMessages.filter((m) => m.timestamp >= d.getTime() && m.timestamp < next).length;
      const sessions = groups.flatMap((g) => g.sessions || []).filter((s) => s.startsAt >= d.getTime() && s.startsAt < next).length;
      days.push({ label: d.toLocaleDateString(undefined, { weekday: "short" }), count, sessions });
    }
    const max = Math.max(1, ...days.map((d) => d.count + d.sessions));

    const correctAttempts = groups.flatMap((g) => (g.quizAttempts || []).filter((a) => a.userId === currentUser.id && a.correct)).length;
    const totalAttempts = groups.flatMap((g) => (g.quizAttempts || []).filter((a) => a.userId === currentUser.id)).length;

    return { myGroups, ownedGroups, myMessages, upcomingSessions, days, max, correctAttempts, totalAttempts };
  }, [groups, currentUser]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 text-blue-300/90 text-xs uppercase tracking-wider mb-1"><BarChart3 className="w-4 h-4" /> Your stats</div>
        <h1 className="text-2xl text-white tracking-tight">Analytics dashboard</h1>
        <p className="text-neutral-400 text-sm mt-1">Track your engagement, sessions, and learning streak.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={<Trophy className="w-4 h-4" />} label="Points" value={stats.points} accent="amber" />
        <Stat icon={<Users className="w-4 h-4" />} label="Groups joined" value={data.myGroups.length} accent="blue" />
        <Stat icon={<MessageSquare className="w-4 h-4" />} label="Messages sent" value={data.myMessages.length} accent="emerald" />
        <Stat icon={<Award className="w-4 h-4" />} label="Badges earned" value={stats.badges.length} accent="violet" />
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-4">
        <div className="rounded-2xl border border-white/5 bg-neutral-950/60 backdrop-blur-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-white">Activity · last 7 days</div>
            <div className="text-xs text-neutral-500">Messages + sessions</div>
          </div>
          <div className="flex items-end gap-3 h-44">
            {data.days.map((d, i) => {
              const total = d.count + d.sessions;
              const h = (total / data.max) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col-reverse h-full rounded-lg overflow-hidden bg-white/5 ring-1 ring-white/5">
                    <div className="bg-blue-500/80 transition-all duration-500" style={{ height: `${(d.count / data.max) * 100}%` }} />
                    <div className="bg-emerald-500/70 transition-all duration-500" style={{ height: `${(d.sessions / data.max) * 100}%` }} />
                  </div>
                  <div className="text-[11px] text-neutral-500">{d.label}</div>
                  <div className="text-xs text-white -mt-1.5">{total || ""}</div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-4 text-xs text-neutral-400">
            <div className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-blue-500/80" /> Messages</div>
            <div className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/70" /> Sessions</div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-neutral-950/60 backdrop-blur-xl p-5">
          <div className="flex items-center gap-2 mb-3"><Calendar className="w-4 h-4 text-emerald-300" /><div className="text-sm text-white">Upcoming sessions</div></div>
          {data.upcomingSessions.length === 0 ? (
            <div className="text-sm text-neutral-500">No upcoming sessions scheduled.</div>
          ) : (
            <div className="flex flex-col gap-2">
              {data.upcomingSessions.map((s) => (
                <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/5 ring-1 ring-white/5">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/30 flex flex-col items-center justify-center text-emerald-300">
                    <div className="text-[9px] uppercase">{new Date(s.startsAt).toLocaleString(undefined, { month: "short" })}</div>
                    <div className="text-sm leading-none">{new Date(s.startsAt).getDate()}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">{s.title}</div>
                    <div className="text-xs text-neutral-500 truncate">{s.group} · {new Date(s.startsAt).toLocaleString([], { hour: "2-digit", minute: "2-digit" })}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <SmallStat icon={<Brain className="w-4 h-4" />} label="Quiz accuracy" value={data.totalAttempts === 0 ? "—" : `${Math.round((data.correctAttempts / data.totalAttempts) * 100)}%`} sub={`${data.correctAttempts}/${data.totalAttempts} correct`} />
        <SmallStat icon={<Users className="w-4 h-4" />} label="Groups hosted" value={data.ownedGroups.length} sub={data.ownedGroups.map((g) => g.subject).slice(0, 2).join(", ") || "None yet"} />
        <SmallStat icon={<Clock className="w-4 h-4" />} label="Study minutes" value={stats.studyMinutes} sub="Logged via sessions attended" />
      </div>

      {stats.badges.length > 0 && (
        <div className="rounded-2xl border border-white/5 bg-neutral-950/60 backdrop-blur-xl p-5">
          <div className="flex items-center gap-2 mb-3"><Award className="w-4 h-4 text-violet-300" /><div className="text-sm text-white">Your badges</div></div>
          <div className="flex flex-wrap gap-2">
            {stats.badges.map((b) => (
              <span key={b} className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full bg-violet-500/10 text-violet-200 ring-1 ring-violet-500/30">
                <Award className="w-3.5 h-3.5" /> {b}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number; accent: "amber" | "blue" | "emerald" | "violet" }) {
  const colors = {
    amber: "from-amber-500/15 to-amber-700/5 ring-amber-500/30 text-amber-300",
    blue: "from-blue-500/15 to-blue-700/5 ring-blue-500/30 text-blue-300",
    emerald: "from-emerald-500/15 to-emerald-700/5 ring-emerald-500/30 text-emerald-300",
    violet: "from-violet-500/15 to-violet-700/5 ring-violet-500/30 text-violet-300",
  }[accent];
  return (
    <div className={`rounded-2xl ring-1 ${colors} bg-gradient-to-br p-5 backdrop-blur-xl transition hover:scale-[1.01]`}>
      <div className={`inline-flex items-center gap-1.5 text-xs uppercase tracking-wider mb-2`}>{icon} {label}</div>
      <div className="text-3xl text-white">{value}</div>
    </div>
  );
}

function SmallStat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-neutral-950/60 backdrop-blur-xl p-4">
      <div className="text-xs text-neutral-400 inline-flex items-center gap-1.5 mb-1">{icon} {label}</div>
      <div className="text-xl text-white">{value}</div>
      {sub && <div className="text-xs text-neutral-500 mt-0.5 truncate">{sub}</div>}
    </div>
  );
}
