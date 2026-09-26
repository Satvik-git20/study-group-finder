import { Suspense } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router";
import {
  GraduationCap,
  Home,
  Plus,
  Users,
  User as UserIcon,
  LogOut,
  Search,
  Trophy,
  BarChart3,
} from "lucide-react";
import * as actions from "../store";
import { useCurrentUser, useStatsFor } from "../store";
import { NotificationsBell } from "./NotificationsBell";
import { useSearchQuery } from "../useSearchQuery";

const NAV_ITEMS = [
  { to: "/", label: "Discover", icon: Home, end: true },
  { to: "/create", label: "Create", icon: Plus, end: false },
  { to: "/my-groups", label: "My Groups", icon: Users, end: false },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy, end: false },
  { to: "/analytics", label: "Stats", icon: BarChart3, end: false },
  { to: "/profile", label: "Profile", icon: UserIcon, end: false },
] as const;

export function Layout() {
  const currentUser = useCurrentUser();
  const stats = useStatsFor(currentUser?.id);
  const { logout } = actions;
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useSearchQuery();

  const showSearch = location.pathname === "/";
  const linkClass = (isActive: boolean) =>
    `flex items-center gap-2 rounded-lg text-sm transition-all ${
      isActive
        ? "bg-blue-600/20 text-blue-300 ring-1 ring-blue-500/30"
        : "text-neutral-400 hover:bg-white/5 hover:text-white"
    }`;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-white/5 bg-black/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 sm:px-6">
          <NavLink to="/" className="group flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-900/40 transition-transform group-hover:scale-105">
              <GraduationCap className="h-4.5 w-4.5 text-white" />
            </div>
            <div className="hidden tracking-tight text-white sm:block">
              StudySync
            </div>
          </NavLink>

          {showSearch && (
            <div className="mx-auto hidden max-w-md flex-1 md:block">
              <label className="flex h-10 items-center gap-2 rounded-xl border border-white/5 bg-neutral-900/70 px-3 transition-all focus-within:border-blue-500/60 focus-within:ring-2 focus-within:ring-blue-500/20">
                <Search className="h-4 w-4 text-neutral-500" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search subjects, topics, groups…"
                  aria-label="Search study groups"
                  className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-neutral-500"
                />
              </label>
            </div>
          )}

          <div className="flex-1 md:hidden" />

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => `${linkClass(isActive)} px-3 h-10`}>
                <Icon className="h-4 w-4" /> {label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-1.5 rounded-full px-2.5 text-xs text-amber-300 ring-1 h-9 ring-amber-500/30 bg-amber-500/10 sm:flex">
            <Trophy className="h-3.5 w-3.5" /> {stats.points} pts
          </div>

          <NotificationsBell />

          <NavLink
            to="/profile"
            className="flex h-10 items-center gap-2 rounded-full border border-white/5 bg-neutral-900/70 pl-1 pr-3 transition-all hover:border-blue-500/40"
          >
            <Avatar name={currentUser?.name || "?"} size={28} />
            <span className="hidden max-w-[120px] truncate text-sm text-white sm:block">
              {currentUser?.name}
            </span>
          </NavLink>

          <button
            onClick={() => {
              logout();
              navigate("/login", { replace: true });
            }}
            title="Sign out"
            aria-label="Sign out"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/5 bg-neutral-900/70 text-neutral-400 transition-all hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex items-center gap-1 overflow-x-auto px-3 pb-3 lg:hidden">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `${linkClass(isActive)} h-9 whitespace-nowrap px-3 text-xs ${
                  isActive ? "" : "bg-neutral-900/60"
                }`
              }
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <div key={location.pathname} className="animate-[fadeIn_.25s_ease-out]">
          <Suspense fallback={<RouteFallback />}>
            <Outlet />
          </Suspense>
        </div>
      </main>

      <footer className="border-t border-white/5 py-6 text-center text-xs text-neutral-600">
        StudySync · Built for students, by students · {new Date().getFullYear()}
      </footer>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
        @keyframes typingDot { 0%, 60%, 100% { transform: translateY(0); opacity: .4; } 30% { transform: translateY(-3px); opacity: 1; } }
      `}</style>
    </div>
  );
}

function RouteFallback() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          className="h-44 animate-pulse rounded-2xl border border-white/5 bg-neutral-900/60 p-5"
        />
      ))}
    </div>
  );
}

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials =
    name
      .split(" ")
      .map((s) => s[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";
  const hue = Array.from(name).reduce((a, c) => a + c.charCodeAt(0), 0) % 360;

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full text-white ring-1 ring-white/10"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        background: `linear-gradient(135deg, hsl(${hue} 70% 35%), hsl(${(hue + 40) % 360} 70% 25%))`,
      }}
    >
      {initials}
    </div>
  );
}
