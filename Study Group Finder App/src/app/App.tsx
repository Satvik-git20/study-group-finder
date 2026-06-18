import { Suspense, lazy, useEffect, useState } from "react";
import { ToastProvider } from "./components/Toast";
import { ThemeProvider } from "./components/Theme";
import { Layout, type Route } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { CreateGroup } from "./components/CreateGroup";
import { GroupPage } from "./components/GroupPage";
import { MyGroups } from "./components/MyGroups";
import { Profile } from "./components/Profile";
import { SessionReminders } from "./components/SessionReminders";
import { ProtectedRoute } from "./components/ProtectedRoute";

const Leaderboard = lazy(() => import("./components/Leaderboard").then((m) => ({ default: m.Leaderboard })));
const Analytics = lazy(() => import("./components/Analytics").then((m) => ({ default: m.Analytics })));

const ROUTE_KEY = "ssync_route";

function loadRoute(): Route {
  try {
    const raw = localStorage.getItem(ROUTE_KEY);
    if (!raw) return "dashboard";
    const parsed = JSON.parse(raw);
    if (typeof parsed === "string" || (parsed && parsed.type === "group" && parsed.id)) return parsed;
  } catch {}
  return "dashboard";
}

function RouteFallback() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-white/5 bg-neutral-900/60 p-5 animate-pulse h-44" />
      ))}
    </div>
  );
}

function Shell() {
  const [route, setRouteState] = useState<Route>(() => loadRoute());
  const [search, setSearch] = useState("");

  const setRoute = (r: Route) => {
    setRouteState(r);
    try { localStorage.setItem(ROUTE_KEY, JSON.stringify(r)); } catch {}
  };

  useEffect(() => { document.documentElement.classList.add("dark"); }, []);

  const showSearch = route === "dashboard";

  return (
    <Layout route={route} setRoute={setRoute} search={showSearch ? search : undefined} onSearch={showSearch ? setSearch : undefined}>
      <SessionReminders />
      <div key={typeof route === "string" ? route : "group-" + route.id} className="animate-[fadeIn_.25s_ease-out]">
        <Suspense fallback={<RouteFallback />}>
          {route === "dashboard" && <Dashboard search={search} setSearch={setSearch} setRoute={setRoute} />}
          {route === "create" && <CreateGroup setRoute={setRoute} />}
          {route === "my-groups" && <MyGroups setRoute={setRoute} />}
          {route === "profile" && <Profile setRoute={setRoute} />}
          {route === "leaderboard" && <Leaderboard />}
          {route === "analytics" && <Analytics />}
          {typeof route === "object" && route.type === "group" && <GroupPage groupId={route.id} setRoute={setRoute} />}
        </Suspense>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
        @keyframes typingDot { 0%, 60%, 100% { transform: translateY(0); opacity: .4; } 30% { transform: translateY(-3px); opacity: 1; } }
      `}</style>
    </Layout>
  );
}

export default function App() {
  return (
    <div className="min-h-screen w-full bg-black text-white antialiased transition-colors duration-300">
      <ThemeProvider>
        <ToastProvider>
          <ProtectedRoute>
            <Shell />
          </ProtectedRoute>
        </ToastProvider>
      </ThemeProvider>
    </div>
  );
}
