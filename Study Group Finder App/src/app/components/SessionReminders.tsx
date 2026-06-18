import { useEffect, useRef } from "react";
import { useStore } from "./store";
import { useToast } from "./Toast";

const FIRED_KEY = "ssync_session_reminders";

export function SessionReminders() {
  const { groups, currentUser } = useStore();
  const { push } = useToast();
  const ref = useRef({ groups, currentUser });
  ref.current = { groups, currentUser };

  useEffect(() => {
    if (!currentUser) return;
    const check = () => {
      const { groups: gs, currentUser: cu } = ref.current;
      if (!cu) return;
      const fired: string[] = (() => {
        try { return JSON.parse(localStorage.getItem(FIRED_KEY) || "[]"); } catch { return []; }
      })();
      const now = Date.now();
      const upcoming = gs
        .filter((g) => g.members.find((m) => m.id === cu.id))
        .flatMap((g) => (g.sessions || []).map((s) => ({ s, g })));

      let changed = false;
      upcoming.forEach(({ s, g }) => {
        const minsAway = (s.startsAt - now) / 60000;
        if (minsAway > 0 && minsAway <= 30 && !fired.includes(s.id)) {
          push("info", `📅 "${s.title}" in ${g.subject} starts in ${Math.max(1, Math.round(minsAway))} min`);
          fired.push(s.id);
          changed = true;
        }
      });
      if (changed) localStorage.setItem(FIRED_KEY, JSON.stringify(fired.slice(-100)));
    };
    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, [currentUser, push]);

  return null;
}
