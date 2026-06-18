import { ReactNode } from "react";
import { GraduationCap, Home, Plus, Users, User as UserIcon, LogOut, Search, Sun, Moon, Trophy, BarChart3 } from "lucide-react";
import { useStore } from "./store";
import { useTheme } from "./Theme";
import { NotificationsBell } from "./NotificationsBell";

export type Route =
  | "dashboard" | "create" | "my-groups" | "profile" | "leaderboard" | "analytics"
  | { type: "group"; id: string };

export function Layout({
  route, setRoute, children, search, onSearch,
}: {
  route: Route;
  setRoute: (r: Route) => void;
  children: ReactNode;
  search?: string;
  onSearch?: (s: string) => void;
}) {
  const { currentUser, logout, stats } = useStore();
  const { theme, toggle } = useTheme();
  const isActive = (key: string) => typeof route === "string" && route === key;

  const items: { key: Exclude<Route, { type: string }>; label: string; icon: any }[] = [
    { key: "dashboard", label: "Discover", icon: Home },
    { key: "create", label: "Create", icon: Plus },
    { key: "my-groups", label: "My Groups", icon: Users },
    { key: "leaderboard", label: "Leaderboard", icon: Trophy },
    { key: "analytics", label: "Stats", icon: BarChart3 },
    { key: "profile", label: "Profile", icon: UserIcon },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 border-b border-white/5 bg-black/60 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto flex items-center gap-3 px-4 sm:px-6 h-16">
          <button onClick={() => setRoute("dashboard")} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-900/40 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="text-white tracking-tight hidden sm:block">StudySync</div>
          </button>

          {onSearch && (
            <div className="flex-1 max-w-md mx-auto hidden md:block">
              <label className="flex items-center gap-2 h-10 px-3 rounded-xl bg-neutral-900/70 border border-white/5 focus-within:border-blue-500/60 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                <Search className="w-4 h-4 text-neutral-500" />
                <input
                  value={search ?? ""}
                  onChange={(e) => onSearch(e.target.value)}
                  placeholder="Search subjects, topics, groups…"
                  className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-neutral-500"
                />
              </label>
            </div>
          )}

          <div className="flex-1 md:hidden" />

          <nav className="hidden lg:flex items-center gap-1">
            {items.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setRoute(key)}
                className={`px-3 h-10 rounded-lg text-sm flex items-center gap-2 transition-all ${
                  isActive(key) ? "bg-blue-600/20 text-blue-300 ring-1 ring-blue-500/30" : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </nav>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 h-9 rounded-full bg-amber-500/10 ring-1 ring-amber-500/30 text-amber-300 text-xs">
            <Trophy className="w-3.5 h-3.5" /> {stats.points} pts
          </div>

          <NotificationsBell setRoute={setRoute} />

          <button
            onClick={() => setRoute("profile")}
            className="flex items-center gap-2 pl-1 pr-3 h-10 rounded-full bg-neutral-900/70 border border-white/5 hover:border-blue-500/40 transition-all"
          >
            <Avatar name={currentUser?.name || "?"} size={28} />
            <span className="text-sm text-white hidden sm:block max-w-[120px] truncate">{currentUser?.name}</span>
          </button>

          <button
            onClick={toggle}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            aria-label="Toggle theme"
            className="w-10 h-10 rounded-full bg-neutral-900/70 border border-white/5 hover:border-blue-500/40 text-neutral-300 hover:text-white transition-all flex items-center justify-center relative overflow-hidden"
          >
            <Sun className={`w-4 h-4 absolute transition-all duration-300 ${theme === "dark" ? "opacity-0 -rotate-90 scale-75" : "opacity-100 rotate-0 scale-100"}`} />
            <Moon className={`w-4 h-4 absolute transition-all duration-300 ${theme === "dark" ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-75"}`} />
          </button>

          <button onClick={logout} title="Sign out" className="w-10 h-10 rounded-full bg-neutral-900/70 border border-white/5 hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-300 text-neutral-400 transition-all flex items-center justify-center">
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <nav className="lg:hidden flex items-center gap-1 px-3 pb-3 overflow-x-auto">
          {items.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setRoute(key)}
              className={`px-3 h-9 rounded-lg text-xs flex items-center gap-1.5 whitespace-nowrap transition-all ${
                isActive(key) ? "bg-blue-600/20 text-blue-300 ring-1 ring-blue-500/30" : "text-neutral-400 bg-neutral-900/60"
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 py-6 sm:py-10">{children}</main>

      <footer className="border-t border-white/5 py-6 text-center text-xs text-neutral-600">
        StudySync · Built for students, by students · {new Date().getFullYear()}
      </footer>
    </div>
  );
}

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name.split(" ").map((s) => s[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?";
  const hue = Array.from(name).reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div
      className="rounded-full flex items-center justify-center text-white shrink-0 ring-1 ring-white/10"
      style={{
        width: size, height: size, fontSize: size * 0.4,
        background: `linear-gradient(135deg, hsl(${hue} 70% 35%), hsl(${(hue + 40) % 360} 70% 25%))`,
      }}
    >
      {initials}
    </div>
  );
}
