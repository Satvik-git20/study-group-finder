import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastKind = "success" | "error" | "info";
type Toast = { id: string; kind: ToastKind; message: string };

const ToastCtx = createContext<{ push: (kind: ToastKind, message: string) => void }>({ push: () => {} });

export function useToast() { return useContext(ToastCtx); }

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((kind: ToastKind, message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => <ToastItem key={t.id} toast={t} onClose={() => setToasts((cur) => cur.filter((x) => x.id !== t.id))} />)}
      </div>
    </ToastCtx.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const id = requestAnimationFrame(() => setShow(true)); return () => cancelAnimationFrame(id); }, []);
  const Icon = toast.kind === "success" ? CheckCircle2 : toast.kind === "error" ? AlertCircle : Info;
  const ring = toast.kind === "success" ? "ring-emerald-500/30 text-emerald-400" : toast.kind === "error" ? "ring-red-500/30 text-red-400" : "ring-blue-500/30 text-blue-400";
  return (
    <div
      className={`pointer-events-auto min-w-[280px] max-w-sm flex items-start gap-3 rounded-xl bg-neutral-900/90 backdrop-blur-md border border-white/10 ring-1 ${ring} shadow-2xl px-4 py-3 transition-all duration-300 ${show ? "translate-x-0 opacity-100" : "translate-x-6 opacity-0"}`}
    >
      <Icon className="w-5 h-5 mt-0.5 shrink-0" />
      <div className="flex-1 text-sm text-white">{toast.message}</div>
      <button onClick={onClose} className="text-neutral-400 hover:text-white transition"><X className="w-4 h-4" /></button>
    </div>
  );
}
