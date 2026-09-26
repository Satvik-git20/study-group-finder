import { lazy } from "react";
import { Link, Route, Routes } from "react-router";
import { ToastProvider } from "./components/Toast";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { CreateGroup } from "./components/CreateGroup";
import { GroupPage } from "./components/GroupPage";
import { MyGroups } from "./components/MyGroups";
import { Profile } from "./components/Profile";
import { RequireAuth } from "./components/RequireAuth";
import { AuthPage } from "./components/AuthPage";

const Leaderboard = lazy(() =>
  import("./components/Leaderboard").then((m) => ({ default: m.Leaderboard })),
);
const Analytics = lazy(() =>
  import("./components/Analytics").then((m) => ({ default: m.Analytics })),
);

function NotFound() {
  return (
    <div className="py-20 text-center">
      <div className="text-lg text-white">Page not found</div>
      <p className="mt-1 text-sm text-neutral-500">
        That link doesn&apos;t point anywhere in StudySync.
      </p>
      <Link
        to="/"
        className="mt-4 inline-block text-sm text-blue-400 hover:text-blue-300"
      >
        ← Back to discover
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen w-full bg-black text-white antialiased">
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<AuthPage />} />

          <Route element={<RequireAuth />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/create" element={<CreateGroup />} />
              <Route path="/my-groups" element={<MyGroups />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/groups/:groupId" element={<GroupPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>
        </Routes>
      </ToastProvider>
    </div>
  );
}
