import { useState } from "react";
import { GraduationCap, Mail, Lock, User as UserIcon, Sparkles } from "lucide-react";
import { useStore } from "./store";
import { useToast } from "./Toast";

export function AuthPage() {
  const { login, signup, googleSignIn } = useStore();
  const { push } = useToast();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        login(email, password);
        push("success", "Welcome back!");
      } else {
        signup(name, email, password);
        push("success", "Account created — welcome to StudySync!");
      }
    } catch (err: any) {
      push("error", err.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-blue-600/30 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-30%] right-[-10%] w-[50vw] h-[50vw] bg-blue-500/20 rounded-full blur-[140px]" />
      </div>

      <div className="grid md:grid-cols-2 gap-10 w-full max-w-5xl items-center">
        <div className="hidden md:flex flex-col gap-6 text-white">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur w-fit">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-xs tracking-wide uppercase text-neutral-300">Built for students</span>
          </div>
          <h1 className="text-5xl tracking-tight leading-[1.05]">
            Find your <span className="text-blue-400">study tribe</span>.<br />
            Crush every subject, together.
          </h1>
          <p className="text-neutral-400 max-w-md">
            StudySync connects you with peers tackling the same topics. Discover groups,
            share notes, and chat in real time — all in one minimal, focused space.
          </p>
          <div className="flex gap-6 mt-2">
            {[
              { k: "1.2k+", v: "Active groups" },
              { k: "30+", v: "Subjects" },
              { k: "24/7", v: "Live chat" },
            ].map((s) => (
              <div key={s.v}>
                <div className="text-2xl text-white">{s.k}</div>
                <div className="text-xs text-neutral-500 uppercase tracking-wider">{s.v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full max-w-md mx-auto md:ml-auto">
          <div className="rounded-2xl border border-white/10 bg-neutral-950/60 backdrop-blur-xl p-8 shadow-2xl shadow-blue-950/30">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-900/40">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-white text-lg">StudySync</div>
                <div className="text-xs text-neutral-500">Study Group Finder</div>
              </div>
            </div>

            <div className="flex bg-neutral-900/70 border border-white/5 rounded-xl p-1 mb-6">
              {(["login", "signup"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 py-2 rounded-lg text-sm transition-all ${
                    mode === m ? "bg-blue-600 text-white shadow shadow-blue-900/40" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {m === "login" ? "Sign in" : "Create account"}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="flex flex-col gap-3">
              {mode === "signup" && (
                <Field icon={<UserIcon className="w-4 h-4" />} placeholder="Full name" value={name} onChange={setName} />
              )}
              <Field icon={<Mail className="w-4 h-4" />} type="email" placeholder="Email" value={email} onChange={setEmail} />
              <Field icon={<Lock className="w-4 h-4" />} type="password" placeholder="Password" value={password} onChange={setPassword} />

              <button
                type="submit"
                disabled={busy}
                className="mt-2 h-11 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] transition-all text-white shadow-lg shadow-blue-900/40 disabled:opacity-60"
              >
                {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3 text-xs text-neutral-600">
              <div className="h-px flex-1 bg-white/10" /> or <div className="h-px flex-1 bg-white/10" />
            </div>

            <button
              onClick={() => { googleSignIn(); push("success", "Signed in as demo user"); }}
              className="w-full h-11 rounded-xl bg-white text-neutral-900 hover:bg-neutral-100 active:scale-[0.99] transition-all flex items-center justify-center gap-3"
            >
              <GoogleIcon /> Continue with Google
            </button>

            <p className="text-xs text-neutral-500 text-center mt-5">
              By continuing you agree to StudySync's terms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ icon, type = "text", placeholder, value, onChange }: { icon: React.ReactNode; type?: string; placeholder: string; value: string; onChange: (v: string) => void; }) {
  return (
    <label className="flex items-center gap-2 h-11 px-3 rounded-xl bg-neutral-900/70 border border-white/5 focus-within:border-blue-500/60 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
      <span className="text-neutral-500">{icon}</span>
      <input
        required
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-neutral-500"
      />
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35 26.7 36 24 36c-5.2 0-9.6-3.1-11.3-7.5l-6.5 5C9.6 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.6l6.2 5.2C41.6 35.5 44 30.2 44 24c0-1.2-.1-2.3-.4-3.5z"/>
    </svg>
  );
}
