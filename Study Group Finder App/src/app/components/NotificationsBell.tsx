import { useEffect, useRef, useState } from "react";
import { Bell, MessageSquare, UserPlus, Calendar, Award, Megaphone, CheckCircle2, X } from "lucide-react";
import { useStore } from "./store";
import type { Route } from "./Layout";

export function NotificationsBell({ setRoute }: { setRoute: (r: Route) => void }) {
  const { notifications, markNotificationsRead } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const iconFor = (type: string) => {
    switch (type) {
      case "message": return <MessageSquare className="w-4 h-4 text-blue-300" />;
      case "join_request": return <UserPlus className="w-4 h-4 text-amber-300" />;
      case "session": return <Calendar className="w-4 h-4 text-emerald-300" />;
      case "badge": return <Award className="w-4 h-4 text-violet-300" />;
      case "announcement": return <Megaphone className="w-4 h-4 text-rose-300" />;
      case "approved": return <CheckCircle2 className="w-4 h-4 text-emerald-300" />;
      case "removed": return <X className="w-4 h-4 text-red-300" />;
      default: return <Bell className="w-4 h-4 text-neutral-400" />;
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen((o) => !o); if (!open && unread > 0) setTimeout(markNotificationsRead, 800); }}
        className="relative w-10 h-10 rounded-full bg-neutral-900/70 border border-white/5 hover:border-blue-500/40 text-neutral-300 hover:text-white transition-all flex items-center justify-center"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center ring-2 ring-black animate-[pulse_2s_ease-in-out_infinite]">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[340px] max-w-[90vw] rounded-2xl border border-white/10 bg-neutral-950/95 backdrop-blur-xl shadow-2xl shadow-blue-950/40 overflow-hidden z-50 animate-[fadeIn_.15s_ease-out]">
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <div className="text-white text-sm">Notifications</div>
            <div className="text-xs text-neutral-500">{notifications.length} total</div>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-neutral-500">You're all caught up 🎉</div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => { if (n.groupId) setRoute({ type: "group", id: n.groupId }); setOpen(false); }}
                  className={`w-full text-left px-4 py-3 flex gap-3 items-start hover:bg-white/5 transition border-b border-white/5 last:border-0 ${!n.read ? "bg-blue-500/5" : ""}`}
                >
                  <div className="mt-0.5 shrink-0">{iconFor(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white line-clamp-2">{n.text}</div>
                    <div className="text-[11px] text-neutral-500 mt-0.5">{timeAgo(n.timestamp)}</div>
                  </div>
                  {!n.read && <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
