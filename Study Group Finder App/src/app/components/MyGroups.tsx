import { useStore } from "./store";
import { GroupCard } from "./GroupCard";
import type { Route } from "./Layout";
import { Users } from "lucide-react";

export function MyGroups({ setRoute }: { setRoute: (r: Route) => void }) {
  const { groups, currentUser, joinGroup } = useStore();
  const mine = groups.filter((g) => currentUser && g.members.find((m) => m.id === currentUser.id));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 text-blue-300/90 text-xs uppercase tracking-wider mb-1"><Users className="w-4 h-4" /> My groups</div>
        <h1 className="text-2xl text-white tracking-tight">Groups you've joined</h1>
        <p className="text-neutral-400 text-sm mt-1">{mine.length} active group{mine.length === 1 ? "" : "s"}</p>
      </div>

      {mine.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-neutral-950/40 p-10 text-center">
          <div className="text-white">You haven't joined any groups yet</div>
          <div className="text-sm text-neutral-500 mt-1 mb-4">Discover groups that match your interests.</div>
          <button onClick={() => setRoute("dashboard")} className="h-10 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm transition-all">Browse groups</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mine.map((g) => (
            <GroupCard key={g.id} group={g} joined={true}
              onOpen={() => setRoute({ type: "group", id: g.id })}
              onJoin={() => joinGroup(g.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
