import { useMemo, useState, useEffect } from "react";
import { Sparkles, Filter, X, TrendingUp, Clock, History } from "lucide-react";
import { useStore } from "./store";
import { GroupCard, GroupCardSkeleton } from "./GroupCard";
import type { Group, Level, Mode, TimeSlot } from "./types";
import type { Route } from "./Layout";
import { useToast } from "./Toast";

type SortKey = "newest" | "active" | "popular";

export function Dashboard({ search, setSearch, setRoute }: { search: string; setSearch: (s: string) => void; setRoute: (r: Route) => void }) {
  const { groups, currentUser, joinGroup, stats, recordSearch } = useStore();
  const { push } = useToast();
  const [level, setLevel] = useState<Level | "All">("All");
  const [mode, setMode] = useState<Mode | "All">("All");
  const [slot, setSlot] = useState<TimeSlot | "All">("All");
  const [sort, setSort] = useState<SortKey>("active");
  const [loading, setLoading] = useState(true);
  const PAGE = 9;
  const [visible, setVisible] = useState(PAGE);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => recordSearch(search), 600);
    return () => clearTimeout(t);
  }, [search, recordSearch]);

  const isJoined = (g: Group) => !!currentUser && !!g.members.find((m) => m.id === currentUser.id);

  const scored = useMemo(() => {
    return [...groups].sort((a, b) => {
      if (sort === "newest") return b.createdAt - a.createdAt;
      if (sort === "popular") return b.members.length - a.members.length;
      return (b.members.length * 2 + b.messages.length) - (a.members.length * 2 + a.messages.length);
    });
  }, [groups, sort]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return scored.filter((g) => {
      if (level !== "All" && g.level !== level) return false;
      if (mode !== "All" && g.mode !== mode) return false;
      if (slot !== "All" && g.timeSlot !== slot) return false;
      if (!q) return true;
      return g.subject.toLowerCase().includes(q) || g.description.toLowerCase().includes(q);
    });
  }, [scored, search, level, mode, slot]);

  useEffect(() => { setVisible(PAGE); }, [search, level, mode, slot, sort]);

  const recommended = useMemo<Group[]>(() => {
    if (!currentUser) return [];
    const joinedSubjects = groups
      .filter((g) => g.members.find((m) => m.id === currentUser.id))
      .map((g) => g.subject.toLowerCase());
    const interests = (currentUser.subjects || []).map((s) => s.toLowerCase());
    const history = (stats.searchHistory || []).map((s) => s.toLowerCase());
    const candidates = groups.filter((g) => !isJoined(g));
    const ranked = candidates.map((g) => {
      const text = (g.subject + " " + g.description).toLowerCase();
      let score = 0;
      interests.forEach((i) => { if (i && text.includes(i)) score += 5; });
      joinedSubjects.forEach((s) => { s.split(/\s+/).forEach((w) => { if (w.length > 3 && text.includes(w)) score += 2; }); });
      history.forEach((h) => { if (h && text.includes(h)) score += 3; });
      score += g.members.length * 0.2;
      return { g, score };
    }).filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((x) => x.g);
    return ranked;
  }, [groups, currentUser, stats.searchHistory]);

  const handleJoin = (g: Group) => {
    const r = joinGroup(g.id);
    if (r.status === "joined") push("success", `Joined "${g.subject}"`);
    else if (r.status === "requested") push("info", `Request sent — waiting for ${g.ownerName}'s approval`);
    else if (r.status === "already") push("info", "You're already a member");
  };

  const filtersActive = level !== "All" || mode !== "All" || slot !== "All" || !!search;

  return (
    <div className="flex flex-col gap-8">
      <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-blue-950/60 via-neutral-950 to-neutral-950 p-8 sm:p-10">
        <div className="absolute -right-24 -top-24 w-80 h-80 bg-blue-600/30 rounded-full blur-[100px]" />
        <div className="absolute -left-32 -bottom-32 w-80 h-80 bg-blue-500/20 rounded-full blur-[100px]" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur w-fit mb-4">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs text-neutral-300">Welcome back, {currentUser?.name?.split(" ")[0]} 👋</span>
          </div>
          <h1 className="text-3xl sm:text-4xl text-white tracking-tight max-w-2xl leading-tight">
            Discover study groups built around <span className="text-blue-400">what you're learning</span>.
          </h1>
          <p className="text-neutral-400 mt-3 max-w-xl">
            Personalized recommendations, advanced filters, and a community ready to learn with you.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={() => setRoute("create")} className="h-11 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-950/50 transition-all active:scale-[0.99]">+ Create a group</button>
            <button onClick={() => setRoute("my-groups")} className="h-11 px-5 rounded-xl bg-white/5 hover:bg-white/10 text-white ring-1 ring-white/10 transition-all">My groups</button>
          </div>
        </div>
      </section>

      <div className="md:hidden">
        <SearchBar value={search} onChange={setSearch} />
      </div>

      {recommended.length > 0 && (
        <section>
          <SectionHeader icon={<TrendingUp className="w-4 h-4" />} title="Recommended for you" subtitle="Based on your interests, joined groups, and search history" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {recommended.map((g) => (
              <GroupCard key={g.id} group={g} joined={isJoined(g)} onOpen={() => setRoute({ type: "group", id: g.id })} onJoin={() => handleJoin(g)} />
            ))}
          </div>
        </section>
      )}

      {stats.searchHistory && stats.searchHistory.length > 0 && (
        <section className="rounded-2xl border border-white/5 bg-neutral-950/40 p-4">
          <div className="flex items-center gap-2 text-xs text-neutral-400 mb-2"><History className="w-3.5 h-3.5" /> Recent searches</div>
          <div className="flex flex-wrap gap-2">
            {stats.searchHistory.slice(0, 8).map((s) => (
              <button key={s} onClick={() => setSearch(s)} className="text-xs px-2.5 py-1 rounded-full bg-white/5 hover:bg-blue-500/15 text-neutral-300 hover:text-blue-300 ring-1 ring-white/10 transition">{s}</button>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-4">
          <SectionHeader icon={<Filter className="w-4 h-4" />} title="All study groups" subtitle={`${filtered.length} group${filtered.length === 1 ? "" : "s"} found`} />
          <div className="flex flex-wrap gap-2">
            <Select value={level} onChange={(v) => setLevel(v as any)} options={["All", "Beginner", "Intermediate", "Advanced"]} label="Level" />
            <Select value={mode} onChange={(v) => setMode(v as any)} options={["All", "Online", "Offline"]} label="Mode" />
            <Select value={slot} onChange={(v) => setSlot(v as any)} options={["All", "Morning", "Afternoon", "Evening", "Late Night", "Weekend"]} label="Time" />
            <Select value={sort} onChange={(v) => setSort(v as SortKey)} options={["active", "newest", "popular"]} label="Sort" labelMap={{ active: "Most active", newest: "Newest", popular: "Popular" }} />
            {filtersActive && (
              <button onClick={() => { setLevel("All"); setMode("All"); setSlot("All"); setSearch(""); }} className="h-9 px-3 rounded-lg text-xs text-neutral-400 hover:text-white inline-flex items-center gap-1">
                <X className="w-3 h-3" /> Reset
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <GroupCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState onCreate={() => setRoute("create")} />
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.slice(0, visible).map((g) => (
                <GroupCard key={g.id} group={g} joined={isJoined(g)} onOpen={() => setRoute({ type: "group", id: g.id })} onJoin={() => handleJoin(g)} />
              ))}
            </div>
            {visible < filtered.length && (
              <div className="mt-6 flex justify-center">
                <button onClick={() => setVisible((v) => v + PAGE)} className="h-10 px-5 rounded-xl bg-white/5 hover:bg-blue-500/15 text-neutral-300 hover:text-blue-300 ring-1 ring-white/10 hover:ring-blue-500/30 transition">
                  Load more ({filtered.length - visible} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function SearchBar({ value, onChange }: { value: string; onChange: (s: string) => void }) {
  return (
    <label className="flex items-center gap-2 h-11 px-3 rounded-xl bg-neutral-900/70 border border-white/5 focus-within:border-blue-500/60 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
      <Clock className="w-4 h-4 text-neutral-500" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Search subjects, topics, groups…"
        className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-neutral-500" />
    </label>
  );
}

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-blue-300/90 text-xs uppercase tracking-wider mb-1">{icon}{title}</div>
      <div className="text-neutral-400 text-sm">{subtitle}</div>
    </div>
  );
}

function Select({ value, onChange, options, label, labelMap }: { value: string; onChange: (v: string) => void; options: string[]; label: string; labelMap?: Record<string, string> }) {
  return (
    <label className="relative inline-flex items-center h-9 rounded-lg bg-neutral-900/70 ring-1 ring-white/10 hover:ring-blue-500/40 transition-all px-3 text-sm text-neutral-300">
      <span className="text-neutral-500 mr-2 text-xs">{label}:</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="bg-transparent outline-none cursor-pointer pr-1">
        {options.map((o) => <option key={o} value={o} className="bg-neutral-900">{labelMap?.[o] ?? o}</option>)}
      </select>
    </label>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-neutral-950/40 p-10 text-center">
      <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-500/10 ring-1 ring-blue-500/30 flex items-center justify-center mb-3">
        <Sparkles className="w-5 h-5 text-blue-300" />
      </div>
      <div className="text-white">No groups match your filters</div>
      <div className="text-sm text-neutral-500 mt-1 mb-4">Try clearing filters, or be the first to start a group on this topic.</div>
      <button onClick={onCreate} className="h-10 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm transition-all">+ Create a group</button>
    </div>
  );
}
