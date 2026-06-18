import { useState } from "react";
import { BookOpen, Clock, Globe2, MapPin, Sparkles, Lock } from "lucide-react";
import { useStore } from "./store";
import type { Level, Mode, TimeSlot } from "./types";
import { useToast } from "./Toast";
import type { Route } from "./Layout";

const SLOTS: TimeSlot[] = ["Morning", "Afternoon", "Evening", "Late Night", "Weekend"];

export function CreateGroup({ setRoute }: { setRoute: (r: Route) => void }) {
  const { createGroup } = useStore();
  const { push } = useToast();
  const [subject, setSubject] = useState("");
  const [level, setLevel] = useState<Level>("Beginner");
  const [description, setDescription] = useState("");
  const [timing, setTiming] = useState("");
  const [timeSlot, setTimeSlot] = useState<TimeSlot>("Evening");
  const [mode, setMode] = useState<Mode>("Online");
  const [requireApproval, setRequireApproval] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const g = createGroup({ subject: subject.trim(), level, description: description.trim(), timing: timing.trim(), timeSlot, mode, requireApproval });
    push("success", `Group "${g.subject}" created`);
    setRoute({ type: "group", id: g.id });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 ring-1 ring-blue-500/30 text-blue-300 text-xs mb-3">
          <Sparkles className="w-3.5 h-3.5" /> New study group
        </div>
        <h1 className="text-3xl text-white tracking-tight">Start your group</h1>
        <p className="text-neutral-400 mt-1">Give peers enough context to know if it's the right fit for them.</p>
      </div>

      <form onSubmit={submit} className="rounded-2xl border border-white/5 bg-neutral-950/60 backdrop-blur-xl p-6 sm:p-8 flex flex-col gap-5 shadow-2xl shadow-blue-950/20">
        <Field label="Subject" hint="e.g. Linear Algebra, React, Microeconomics">
          <div className="flex items-center gap-2 h-11 px-3 rounded-xl bg-neutral-900/70 ring-1 ring-white/5 focus-within:ring-blue-500/50 transition-all">
            <BookOpen className="w-4 h-4 text-neutral-500" />
            <input required value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject or topic"
              className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-neutral-500" />
          </div>
        </Field>

        <Field label="Level">
          <div className="grid grid-cols-3 gap-2">
            {(["Beginner", "Intermediate", "Advanced"] as Level[]).map((l) => (
              <button type="button" key={l} onClick={() => setLevel(l)}
                className={`h-11 rounded-xl text-sm transition-all ring-1 ${
                  level === l ? "bg-blue-600 text-white ring-blue-500 shadow shadow-blue-950/40"
                    : "bg-neutral-900/70 text-neutral-300 ring-white/5 hover:ring-blue-500/30"
                }`}>{l}</button>
            ))}
          </div>
        </Field>

        <Field label="Description" hint="What are you studying, how do you meet, what's expected?">
          <textarea required value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
            placeholder="Tell potential members what to expect…"
            className="w-full p-3 rounded-xl bg-neutral-900/70 ring-1 ring-white/5 focus:ring-blue-500/50 outline-none text-sm text-white placeholder:text-neutral-500 transition-all resize-none" />
        </Field>

        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Preferred timing">
            <div className="flex items-center gap-2 h-11 px-3 rounded-xl bg-neutral-900/70 ring-1 ring-white/5 focus-within:ring-blue-500/50 transition-all">
              <Clock className="w-4 h-4 text-neutral-500" />
              <input required value={timing} onChange={(e) => setTiming(e.target.value)} placeholder="e.g. Tue & Thu, 7–9 PM"
                className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-neutral-500" />
            </div>
          </Field>

          <Field label="Time slot">
            <select value={timeSlot} onChange={(e) => setTimeSlot(e.target.value as TimeSlot)}
              className="h-11 px-3 rounded-xl bg-neutral-900/70 ring-1 ring-white/5 focus:ring-blue-500/50 outline-none text-sm text-white transition-all">
              {SLOTS.map((s) => <option key={s} value={s} className="bg-neutral-900">{s}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Mode">
          <div className="grid grid-cols-2 gap-2">
            {(["Online", "Offline"] as Mode[]).map((m) => {
              const Icon = m === "Online" ? Globe2 : MapPin;
              return (
                <button type="button" key={m} onClick={() => setMode(m)}
                  className={`h-11 rounded-xl text-sm inline-flex items-center justify-center gap-2 transition-all ring-1 ${
                    mode === m ? "bg-blue-600 text-white ring-blue-500 shadow shadow-blue-950/40"
                      : "bg-neutral-900/70 text-neutral-300 ring-white/5 hover:ring-blue-500/30"
                  }`}><Icon className="w-4 h-4" /> {m}</button>
              );
            })}
          </div>
        </Field>

        <label className="flex items-center gap-3 p-3 rounded-xl bg-neutral-900/50 ring-1 ring-white/5 cursor-pointer hover:ring-blue-500/30 transition">
          <input type="checkbox" checked={requireApproval} onChange={(e) => setRequireApproval(e.target.checked)} className="accent-blue-500 w-4 h-4" />
          <Lock className="w-4 h-4 text-neutral-400" />
          <div className="flex-1">
            <div className="text-sm text-white">Require approval to join</div>
            <div className="text-xs text-neutral-500">New members must be approved by you before joining.</div>
          </div>
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={() => setRoute("dashboard")} className="h-11 px-5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 ring-1 ring-white/10 transition-all">Cancel</button>
          <button type="submit" className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-950/40 transition-all active:scale-[0.99]">Create group</button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <label className="text-sm text-neutral-300">{label}</label>
        {hint && <span className="text-xs text-neutral-500">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
