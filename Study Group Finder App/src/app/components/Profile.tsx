import { useState } from "react";
import { Pencil, Save, X, Mail, Clock, BookOpen } from "lucide-react";
import { useStore } from "./store";
import { Avatar } from "./Layout";
import type { Route } from "./Layout";
import { useToast } from "./Toast";

export function Profile({ setRoute }: { setRoute: (r: Route) => void }) {
  const { currentUser, groups, updateProfile } = useStore();
  const { push } = useToast();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(currentUser?.name || "");
  const [availability, setAvailability] = useState(currentUser?.availability || "");
  const [subjectsText, setSubjectsText] = useState((currentUser?.subjects || []).join(", "));

  if (!currentUser) return null;
  const joined = groups.filter((g) => g.members.find((m) => m.id === currentUser.id));

  const save = () => {
    const subjects = subjectsText.split(",").map((s) => s.trim()).filter(Boolean);
    updateProfile({ name: name.trim() || currentUser.name, availability: availability.trim(), subjects });
    setEditing(false);
    push("success", "Profile updated");
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <div className="relative rounded-2xl border border-white/5 bg-gradient-to-br from-blue-950/50 via-neutral-950 to-neutral-950 p-6 sm:p-8 overflow-hidden">
        <div className="absolute -right-20 -top-20 w-72 h-72 bg-blue-600/20 rounded-full blur-[100px]" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
          <Avatar name={currentUser.name} size={84} />
          <div className="flex-1 min-w-0">
            {editing ? (
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full h-10 px-3 rounded-lg bg-neutral-900/80 ring-1 ring-white/10 focus:ring-blue-500/50 outline-none text-white text-lg" />
            ) : (
              <div className="text-2xl text-white tracking-tight">{currentUser.name}</div>
            )}
            <div className="text-sm text-neutral-400 inline-flex items-center gap-1.5 mt-1"><Mail className="w-3.5 h-3.5" /> {currentUser.email}</div>
          </div>
          <div>
            {editing ? (
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)} className="h-10 px-3 rounded-lg bg-white/5 ring-1 ring-white/10 text-neutral-300 hover:bg-white/10 transition inline-flex items-center gap-1.5"><X className="w-4 h-4" /> Cancel</button>
                <button onClick={save} className="h-10 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow shadow-blue-950/40 transition inline-flex items-center gap-1.5"><Save className="w-4 h-4" /> Save</button>
              </div>
            ) : (
              <button onClick={() => setEditing(true)} className="h-10 px-4 rounded-lg bg-white/5 hover:bg-white/10 ring-1 ring-white/10 text-white transition inline-flex items-center gap-1.5"><Pencil className="w-4 h-4" /> Edit</button>
            )}
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card title="Subjects of interest" icon={<BookOpen className="w-4 h-4" />}>
          {editing ? (
            <input value={subjectsText} onChange={(e) => setSubjectsText(e.target.value)} placeholder="e.g. Calculus, Python, Biology"
              className="w-full h-10 px-3 rounded-lg bg-neutral-900/80 ring-1 ring-white/10 focus:ring-blue-500/50 outline-none text-sm text-white placeholder:text-neutral-500" />
          ) : currentUser.subjects.length === 0 ? (
            <div className="text-sm text-neutral-500">No subjects yet — add some to get smarter group suggestions.</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {currentUser.subjects.map((s) => (
                <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-300 ring-1 ring-blue-500/30">{s}</span>
              ))}
            </div>
          )}
        </Card>

        <Card title="Availability" icon={<Clock className="w-4 h-4" />}>
          {editing ? (
            <input value={availability} onChange={(e) => setAvailability(e.target.value)} placeholder="e.g. Weekday evenings"
              className="w-full h-10 px-3 rounded-lg bg-neutral-900/80 ring-1 ring-white/10 focus:ring-blue-500/50 outline-none text-sm text-white placeholder:text-neutral-500" />
          ) : (
            <div className="text-sm text-neutral-300">{currentUser.availability || <span className="text-neutral-500">Not set</span>}</div>
          )}
        </Card>
      </div>

      <Card title={`Joined groups (${joined.length})`}>
        {joined.length === 0 ? (
          <div className="text-sm text-neutral-500">You haven't joined any groups yet.</div>
        ) : (
          <div className="flex flex-col divide-y divide-white/5">
            {joined.map((g) => (
              <button key={g.id} onClick={() => setRoute({ type: "group", id: g.id })}
                className="flex items-center justify-between gap-3 py-3 hover:bg-white/5 -mx-2 px-2 rounded-lg transition text-left">
                <div className="min-w-0">
                  <div className="text-white truncate">{g.subject}</div>
                  <div className="text-xs text-neutral-500">{g.level} · {g.timing}</div>
                </div>
                <div className="text-xs text-blue-300">Open →</div>
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function Card({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-neutral-950/60 backdrop-blur-xl p-5">
      <div className="flex items-center gap-2 text-sm text-neutral-400 mb-3">{icon}{title}</div>
      {children}
    </div>
  );
}
