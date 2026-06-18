import { Clock, Users, Globe2, MapPin, ArrowRight } from "lucide-react";
import type { Group } from "./types";

const levelStyles: Record<Group["level"], string> = {
  Beginner: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30",
  Intermediate: "bg-blue-500/10 text-blue-300 ring-blue-500/30",
  Advanced: "bg-violet-500/10 text-violet-300 ring-violet-500/30",
};

export function GroupCard({
  group, joined, onOpen, onJoin,
}: {
  group: Group;
  joined: boolean;
  onOpen: () => void;
  onJoin: () => void;
}) {
  const ModeIcon = group.mode === "Online" ? Globe2 : MapPin;
  return (
    <div className="group relative rounded-2xl border border-white/5 bg-gradient-to-b from-neutral-900/80 to-neutral-950/80 backdrop-blur-xl p-5 hover:border-blue-500/40 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-blue-950/40 transition-all duration-300">
      <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="text-white truncate">{group.subject}</div>
          <div className="text-xs text-neutral-500 mt-0.5">by {group.ownerName}</div>
        </div>
        <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full ring-1 ${levelStyles[group.level]}`}>
          {group.level}
        </span>
      </div>

      <p className="text-sm text-neutral-400 line-clamp-2 mb-4 min-h-[2.5rem]">{group.description}</p>

      <div className="flex flex-wrap gap-2 text-xs text-neutral-400 mb-5">
        <Chip icon={<Clock className="w-3 h-3" />}>{group.timing}</Chip>
        <Chip icon={<ModeIcon className="w-3 h-3" />}>{group.mode}</Chip>
        <Chip icon={<Users className="w-3 h-3" />}>{group.members.length} member{group.members.length === 1 ? "" : "s"}</Chip>
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          onClick={onOpen}
          className="text-sm text-blue-300 hover:text-blue-200 inline-flex items-center gap-1 group/btn"
        >
          View group
          <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
        </button>
        <button
          onClick={joined ? onOpen : onJoin}
          className={`h-9 px-4 rounded-lg text-sm transition-all active:scale-[0.98] ${
            joined
              ? "bg-white/5 text-neutral-300 hover:bg-white/10 ring-1 ring-white/10"
              : "bg-blue-600 text-white hover:bg-blue-500 shadow shadow-blue-900/40"
          }`}
        >
          {joined ? "Open chat" : "Join group"}
        </button>
      </div>
    </div>
  );
}

function Chip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 ring-1 ring-white/10">
      {icon}{children}
    </span>
  );
}

export function GroupCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/5 bg-neutral-900/60 p-5 animate-pulse">
      <div className="flex justify-between mb-3">
        <div className="space-y-2 flex-1">
          <div className="h-4 w-2/3 bg-white/10 rounded" />
          <div className="h-3 w-1/3 bg-white/5 rounded" />
        </div>
        <div className="h-5 w-20 bg-white/10 rounded-full" />
      </div>
      <div className="space-y-2 mb-5">
        <div className="h-3 w-full bg-white/5 rounded" />
        <div className="h-3 w-4/5 bg-white/5 rounded" />
      </div>
      <div className="flex gap-2 mb-5">
        <div className="h-6 w-20 bg-white/5 rounded-full" />
        <div className="h-6 w-16 bg-white/5 rounded-full" />
      </div>
      <div className="flex justify-between">
        <div className="h-4 w-20 bg-white/10 rounded" />
        <div className="h-9 w-24 bg-white/10 rounded-lg" />
      </div>
    </div>
  );
}
