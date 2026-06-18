import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "dark" | "light";
const KEY = "ssync_theme";

const ThemeCtx = createContext<{ theme: Theme; toggle: () => void; set: (t: Theme) => void }>({
  theme: "dark", toggle: () => {}, set: () => {},
});

export function useTheme() { return useContext(ThemeCtx); }

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    try { return (localStorage.getItem(KEY) as Theme) || "dark"; } catch { return "dark"; }
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("theme-light", theme === "light");
    root.classList.toggle("theme-dark", theme === "dark");
    document.body.style.background = theme === "light" ? "#f6f7fb" : "#000";
    try { localStorage.setItem(KEY, theme); } catch {}
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <ThemeCtx.Provider value={{ theme, toggle, set: setTheme }}>
      <ThemeStyles />
      {children}
    </ThemeCtx.Provider>
  );
}

function ThemeStyles() {
  return (
    <style>{`
      .theme-light body, .theme-light .bg-black { background-color: #f6f7fb !important; }
      .theme-light .bg-neutral-950, .theme-light .bg-neutral-950\\/60, .theme-light .bg-neutral-950\\/40, .theme-light .bg-neutral-950\\/90 {
        background-color: rgba(255,255,255,0.85) !important;
      }
      .theme-light .bg-neutral-900, .theme-light .bg-neutral-900\\/60, .theme-light .bg-neutral-900\\/70, .theme-light .bg-neutral-900\\/80, .theme-light .bg-neutral-900\\/40 {
        background-color: rgba(241,243,249,0.9) !important;
      }
      .theme-light .text-white { color: #0b1220 !important; }
      .theme-light .text-neutral-100 { color: #111827 !important; }
      .theme-light .text-neutral-300 { color: #1f2937 !important; }
      .theme-light .text-neutral-400 { color: #4b5563 !important; }
      .theme-light .text-neutral-500 { color: #6b7280 !important; }
      .theme-light .text-neutral-600 { color: #9ca3af !important; }
      .theme-light .border-white\\/5 { border-color: rgba(15,23,42,0.06) !important; }
      .theme-light .border-white\\/10 { border-color: rgba(15,23,42,0.10) !important; }
      .theme-light .ring-white\\/5 { --tw-ring-color: rgba(15,23,42,0.06) !important; }
      .theme-light .ring-white\\/10 { --tw-ring-color: rgba(15,23,42,0.10) !important; }
      .theme-light .divide-white\\/5 > :not([hidden]) ~ :not([hidden]) { border-color: rgba(15,23,42,0.08) !important; }
      .theme-light .bg-white\\/5 { background-color: rgba(15,23,42,0.04) !important; }
      .theme-light .bg-white\\/10 { background-color: rgba(15,23,42,0.07) !important; }
      .theme-light .hover\\:bg-white\\/5:hover { background-color: rgba(15,23,42,0.05) !important; }
      .theme-light .hover\\:bg-white\\/10:hover { background-color: rgba(15,23,42,0.09) !important; }
      .theme-light .ring-white\\/10 { --tw-ring-color: rgba(15,23,42,0.10) !important; }
      .theme-light .from-neutral-900\\/80 { --tw-gradient-from: rgba(248,250,252,0.95) var(--tw-gradient-from-position) !important; --tw-gradient-to: rgba(248,250,252,0) var(--tw-gradient-to-position) !important; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important; }
      .theme-light .to-neutral-950\\/80 { --tw-gradient-to: rgba(241,243,249,0.9) var(--tw-gradient-to-position) !important; }
      .theme-light .from-blue-950\\/60, .theme-light .from-blue-950\\/50, .theme-light .from-blue-950\\/40 { --tw-gradient-from: rgba(219,234,254,0.7) var(--tw-gradient-from-position) !important; --tw-gradient-to: rgba(219,234,254,0) var(--tw-gradient-to-position) !important; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-via, rgba(255,255,255,0.85)), var(--tw-gradient-to) !important; }
      .theme-light .via-neutral-950 { --tw-gradient-via: rgba(255,255,255,0.85) !important; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-via), var(--tw-gradient-to) !important; }
      .theme-light .to-neutral-950 { --tw-gradient-to: rgba(255,255,255,0.85) !important; }
      .theme-light .text-blue-300 { color: #1d4ed8 !important; }
      .theme-light .text-blue-400 { color: #2563eb !important; }
      .theme-light .placeholder\\:text-neutral-500::placeholder { color: #94a3b8 !important; }
      .theme-light .shadow-2xl { --tw-shadow-color: rgba(15,23,42,0.10) !important; }
    `}</style>
  );
}
