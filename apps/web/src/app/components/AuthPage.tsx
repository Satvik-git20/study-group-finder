import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { GraduationCap, Mail, Lock, User as UserIcon, Sparkles, Info } from "lucide-react";
import * as actions from "../store";
import { useCurrentUser } from "../store";
import { useToast } from "./Toast";

type LocationState = { from?: string };

export function AuthPage() {
  const currentUser = useCurrentUser();
  const { login, signup, signInAsDemo } = actions;
  const { push } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const redirectTo = (location.state as LocationState | null)?.from ?? "/";

  if (currentUser) {
    return <Navigate to={redirectTo} replace />;
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === "signup") {
      if (name.trim().length < 2) return setError("Please enter your full name.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return setError("Please enter a valid email address.");
    }
    if (password.length < 8) {
      return setError("Password must be at least 8 characters.");
    }

    try {
      if (mode === "login") {
        login(email.trim(), password);
        push("success", "Welcome back!");
      } else {
        signup(name.trim(), email.trim(), password);
        push("success", "Account created — welcome to StudySync!");
      }
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-4 py-10">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-[-10%] top-[-20%] h-[60vw] w-[60vw] rounded-full bg-blue-600/30 blur-[140px]" />
        <div className="absolute bottom-[-30%] right-[-10%] h-[50vw] w-[50vw] rounded-full bg-blue-500/20 blur-[140px]" />
      </div>

      <div className="grid w-full max-w-5xl items-center gap-10 md:grid-cols-2">
        <div className="hidden flex-col gap-6 text-white md:flex">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur">
            <Sparkles className="h-4 w-4 text-blue-400" />
            <span className="text-xs uppercase tracking-wide text-neutral-300">
              Built for students
            </span>
          </div>
          <h1 className="text-5xl leading-[1.05] tracking-tight">
            Find your <span className="text-blue-400">study tribe</span>.
            <br />
            Crush every subject, together.
          </h1>
          <p className="max-w-md text-neutral-400">
            StudySync connects you with peers tackling the same topics. Discover
            groups, share notes, and chat in real time — all in one minimal,
            focused space.
          </p>
          <div className="mt-2 flex gap-6">
            {[
              { k: "6", v: "Starter groups" },
              { k: "3", v: "Skill levels" },
              { k: "24/7", v: "Local chat" },
            ].map((s) => (
              <div key={s.v}>
                <div className="text-2xl text-white">{s.k}</div>
                <div className="text-xs uppercase tracking-wider text-neutral-500">
                  {s.v}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto w-full max-w-md md:ml-auto">
          <div className="rounded-2xl border border-white/10 bg-neutral-950/60 p-8 shadow-2xl shadow-blue-950/30 backdrop-blur-xl">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-900/40">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-lg text-white">StudySync</div>
                <div className="text-xs text-neutral-500">Study Group Finder</div>
              </div>
            </div>

            <DemoNotice />

            <div className="mb-6 flex rounded-xl border border-white/5 bg-neutral-900/70 p-1">
              {(["login", "signup"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMode(m);
                    setError(null);
                  }}
                  className={`flex-1 rounded-lg py-2 text-sm transition-all ${
                    mode === m
                      ? "bg-blue-600 text-white shadow shadow-blue-900/40"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {m === "login" ? "Sign in" : "Create account"}
                </button>
              ))}
            </div>

            <form onSubmit={submit} noValidate className="flex flex-col gap-3">
              {mode === "signup" && (
                <Field
                  icon={<UserIcon className="h-4 w-4" />}
                  placeholder="Full name"
                  value={name}
                  onChange={setName}
                  autoComplete="name"
                />
              )}
              <Field
                icon={<Mail className="h-4 w-4" />}
                type="email"
                placeholder="Email"
                value={email}
                onChange={setEmail}
                autoComplete="email"
              />
              <Field
                icon={<Lock className="h-4 w-4" />}
                type="password"
                placeholder="Password"
                value={password}
                onChange={setPassword}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />

              {error && (
                <p role="alert" className="text-sm text-red-300">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="mt-2 h-11 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-900/40 transition-all hover:bg-blue-500 active:scale-[0.99]"
              >
                {mode === "login" ? "Sign in" : "Create account"}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3 text-xs text-neutral-600">
              <div className="h-px flex-1 bg-white/10" /> or{" "}
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <button
              type="button"
              onClick={() => {
                signInAsDemo();
                push("success", "Signed in as the demo account");
                navigate(redirectTo, { replace: true });
              }}
              className="flex h-11 w-full items-center justify-center gap-3 rounded-xl bg-white text-neutral-900 transition-all hover:bg-neutral-100 active:scale-[0.99]"
            >
              <Sparkles className="h-4 w-4" /> Explore with the demo account
            </button>

            <p className="mt-5 text-center text-xs text-neutral-500">
              StudySync is a demo build. Do not reuse a real password.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DemoNotice() {
  return (
    <div className="mb-5 flex gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs leading-relaxed text-amber-200/90">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
      <p>
        This build has <strong>no server</strong>. Accounts, groups and messages
        are stored only in this browser, and passwords are saved in plain text.
        Open a second tab and sign up as another student to see live chat,
        join requests and approvals working.
      </p>
    </div>
  );
}

function Field({
  icon,
  type = "text",
  placeholder,
  value,
  onChange,
  autoComplete,
}: {
  icon: React.ReactNode;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
}) {
  return (
    <label className="flex h-11 items-center gap-2 rounded-xl border border-white/5 bg-neutral-900/70 px-3 transition-all focus-within:border-blue-500/60 focus-within:ring-2 focus-within:ring-blue-500/20">
      <span className="text-neutral-500">{icon}</span>
      <input
        required
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-neutral-500"
      />
    </label>
  );
}
