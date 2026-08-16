import { useEffect, useRef, useCallback } from "react";

const LS_KEY = "poker_game_state";
const API    = import.meta.env.VITE_API_URL as string;

export type GameState = {
  mode:        "TOURNAMENT" | "CASH";
  lang:        "TH" | "EN";
  theme:       string;
  players:     { name:string; buyInTotal:number; bounty:number; cashout:number; count:number }[];
  tournament:  {
    name:string; buyIn:number; payouts:number[];
    rounds:{sb:number;bb:number;ante:number;duration:number;isBreak?:boolean}[];
  };
  roundIndex:  number;
  timeLeft:    number;
  running:     boolean;
  breakTime:   boolean;
  modeBounty:  boolean;
  bountyPct:   number;
  prizeWinners:{name:string;amount:number;count:number;profit:number}[];
};

/* ── localStorage helpers ── */
export function loadLocal(): GameState | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveLocal(state: GameState) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch {}
}

/* ── cloud helpers ── */
async function saveCloud(state: GameState) {
  const token = localStorage.getItem("poker_token");
  if (!token) return;
  await fetch(`${API}/sessions/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ game_state: state }),
  });
}

export async function loadCloud(): Promise<GameState | null> {
  const token = localStorage.getItem("poker_token");
  if (!token) return null;
  try {
    const res = await fetch(`${API}/sessions/load`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const { game_state } = await res.json();
    return game_state ?? null;
  } catch { return null; }
}

/* ── hook ── */
export function useGamePersistence(
  isLoggedIn: boolean,
  state: GameState,
  onSaveStatus: (status: "saving" | "saved" | "idle") => void,
) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevStateRef = useRef<string>("");

  const persist = useCallback((s: GameState) => {
    const serialized = JSON.stringify(s);
    if (serialized === prevStateRef.current) return; // no change
    prevStateRef.current = serialized;

    /* always save local instantly */
    saveLocal(s);

    if (!isLoggedIn) return;

    /* debounced cloud save */
    if (debounceRef.current) clearTimeout(debounceRef.current);
    onSaveStatus("saving");
    debounceRef.current = setTimeout(async () => {
      await saveCloud(s);
      onSaveStatus("saved");
      setTimeout(() => onSaveStatus("idle"), 2000);
    }, 1500);
  }, [isLoggedIn, onSaveStatus]);

  useEffect(() => {
    persist(state);
  }, [state, persist]);

  /* cleanup on unmount */
  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);
}
