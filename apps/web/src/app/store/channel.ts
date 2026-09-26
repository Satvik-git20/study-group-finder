import { useEffect, useState } from "react";
import { getState, reload, setOnRemoteChange } from "./core";

const CHANNEL_NAME = "ssync";
const HEARTBEAT_MS = 2_000;
const PEER_TIMEOUT_MS = 6_000;

export type Peer = {
  tabId: string;
  userId: string | null;
  name: string;
  lastSeen: number;
};

type ChannelMessage =
  | { kind: "mutate" }
  | { kind: "presence"; tabId: string; userId: string | null; name: string };

const TAB_ID = Math.random().toString(36).slice(2, 10);

let channel: BroadcastChannel | null = null;
const peers = new Map<string, Peer>();
let notifyPresence: (() => void) | null = null;

function ensureChannel(): BroadcastChannel | null {
  if (channel) return channel;
  if (typeof BroadcastChannel === "undefined") return null;

  channel = new BroadcastChannel(CHANNEL_NAME);

  channel.onmessage = (event: MessageEvent<ChannelMessage>) => {
    const data = event.data;
    if (!data || typeof data !== "object") return;

    if (data.kind === "mutate") {
      // Another tab wrote to localStorage — re-read it.
      reload();
      return;
    }

    if (data.kind === "presence" && data.tabId !== TAB_ID) {
      peers.set(data.tabId, {
        tabId: data.tabId,
        userId: data.userId,
        name: data.name,
        lastSeen: Date.now(),
      });
      notifyPresence?.();
    }
  };

  return channel;
}

function currentIdentity(): { userId: string | null; name: string } {
  const state = getState();
  const user = state.users.find((u) => u.id === state.sessionId) ?? null;
  return { userId: user?.id ?? null, name: user?.name ?? "" };
}

function announce(): void {
  const ch = ensureChannel();
  if (!ch) return;
  const { userId, name } = currentIdentity();
  ch.postMessage({ kind: "presence", tabId: TAB_ID, userId, name } satisfies ChannelMessage);
}

function prunePeers(): void {
  const cutoff = Date.now() - PEER_TIMEOUT_MS;
  let changed = false;
  for (const [id, peer] of peers) {
    if (peer.lastSeen < cutoff) {
      peers.delete(id);
      changed = true;
    }
  }
  if (changed) notifyPresence?.();
}

// Tell other tabs whenever this one mutates shared state.
setOnRemoteChange(() => {
  ensureChannel()?.postMessage({ kind: "mutate" } satisfies ChannelMessage);
});

if (typeof window !== "undefined") {
  // Fallback for environments without BroadcastChannel: the native storage
  // event also fires in other tabs when localStorage changes.
  window.addEventListener("storage", (event) => {
    if (event.key?.startsWith("ssync_")) reload();
  });
}

/**
 * Other open tabs of this app, and which user each is signed in as. This is what
 * makes the localStorage-only architecture behave like a real multi-user app.
 */
export function usePresence(): Peer[] {
  const [list, setList] = useState<Peer[]>(() => [...peers.values()]);

  useEffect(() => {
    notifyPresence = () => setList([...peers.values()]);
    const ch = ensureChannel();

    // Announce immediately, then heartbeat. The heartbeat doubles as the
    // re-announce that picks up a sign-in or sign-out in this tab.
    announce();
    const heartbeat = window.setInterval(() => {
      announce();
      prunePeers();
    }, HEARTBEAT_MS);

    return () => {
      window.clearInterval(heartbeat);
      notifyPresence = null;
      peers.delete(TAB_ID);
      ch?.postMessage({
        kind: "presence",
        tabId: TAB_ID,
        userId: null,
        name: "",
      } satisfies ChannelMessage);
    };
  }, []);

  return list;
}

export { TAB_ID };
