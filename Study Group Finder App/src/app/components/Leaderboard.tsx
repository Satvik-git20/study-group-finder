import { useMemo } from "react";
import { Trophy, Award, Crown, Medal } from "lucide-react";
import { useStore } from "./store";
import { Avatar } from "./Layout";

export function Leaderboard() {
  const { allUsers, currentUser, getStatsFor, groups } = useStore();

  const rows = useMemo(() => {
    const candidates = [...allUsers];
    const seenIds = new Set(candidates.map((u) => u.id));
    groups.forEach((g) => {
      g.members.forEach((m) => {
        if (!seenIds.has(m.id)) {
          candidates.push({ id: m.id, name: m.name, email: "", subjects: [], availability: "" });
          seenIds.add(m.id);
        }
      });
    });
    return candidates
      .map((u) => {
        const s = getStatsFor(u.id);
        const joined = groups.filter((g) => g.members.find((m) => m.id === u.id)).length;
        return { user: u, ...s, joined };
      })
      .filter((r) => r.points > 0 || r.joined > 0)
      .sort((a, b) => b.points - a.points)
      .slice(0, 25);
  }, [allUsers, groups, getStatsFor]);

  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);
  const myRank = rows.findIndex((r) => r.user.id === currentUser?.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 text-blue-300/90 text-xs uppercase tracking-wider mb-1"><Trophy className="w-4 h-4" /> Leaderboard</div>
        <h1 className="text-2xl text-white tracking-tight">Top learners this season</h1>
        <p className="text-neutral-400 text-sm mt-1">Earn points by joining groups, sending messages, scheduling sessions, and acing quizzes.</p>
      </div>

      {podium.length > 0 && (
        <div className="grid sm:grid-cols-3 gap-4">
          {[1, 0, 2].map((i) => podium[i] && (
            <PodiumCard key={podium[i].user.id} rank={i + 1} name={podium[i].user.name} points={podium[i].points} badges={podium[i].badges.length} />
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-white/5 bg-neutral-950/60 backdrop-blur-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/5 text-sm text-neutral-400">Full ranking</div>
        {rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-neutral-500">No activity yet — be the first!</div>
        ) : (
          <div className="divide-y divide-white/5">
            {rows.map((r, i) => {
              const isMe = r.user.id === currentUser?.id;
              return (
                <div key={r.user.id} className={`flex items-center gap-3 px-5 py-3 transition ${isMe ? "bg-blue-500/5" : "hover:bg-white/2"}`}>
                  <div className={`w-8 text-center text-sm ${i < 3 ? "text-amber-300" : "text-neutral-500"}`}>#{i + 1}</div>
                  <Avatar name={r.user.name} size={36} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">{r.user.name}{isMe ? " (you)" : ""}</div>
                    <div className="text-xs text-neutral-500">{r.joined} group{r.joined === 1 ? "" : "s"} · {r.badges.length} badge{r.badges.length === 1 ? "" : "s"}</div>
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-300 text-sm"><Trophy className="w-3.5 h-3.5" /> {r.points}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {myRank >= 0 && (
        <div className="text-sm text-neutral-400 text-center">You're ranked <span className="text-blue-300">#{myRank + 1}</span> · keep going! 💪</div>
      )}
    </div>
  );
}

function PodiumCard({ rank, name, points, badges }: { rank: number; name: string; points: number; badges: number }) {
  const Icon = rank === 1 ? Crown : rank === 2 ? Medal : Award;
  const colors = rank === 1
    ? "from-amber-500/30 to-amber-700/10 ring-amber-500/40 text-amber-300"
    : rank === 2 ? "from-slate-300/20 to-slate-500/10 ring-slate-400/30 text-slate-200"
    : "from-orange-700/20 to-orange-900/10 ring-orange-500/30 text-orange-300";
  const heightCls = rank === 1 ? "sm:py-10" : rank === 2 ? "sm:py-8" : "sm:py-6";
  return (
    <div className={`relative rounded-2xl bg-gradient-to-b ${colors} ring-1 backdrop-blur-xl p-6 ${heightCls} flex flex-col items-center text-center`}>
      <Icon className="w-7 h-7 mb-2" />
      <Avatar name={name} size={56} />
      <div className="text-white mt-3 truncate max-w-full">{name}</div>
      <div className="text-xs text-neutral-400 mt-0.5">#{rank} · {badges} badge{badges === 1 ? "" : "s"}</div>
      <div className="mt-3 inline-flex items-center gap-1.5 px-3 h-8 rounded-full bg-black/30 ring-1 ring-white/10 text-sm text-amber-300"><Trophy className="w-3.5 h-3.5" /> {points} pts</div>
    </div>
  );
}
