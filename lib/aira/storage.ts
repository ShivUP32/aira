export const DEMO_USER_ID = "demo-user";
export const SAVED_KEY = `aira:saved:${DEMO_USER_ID}`;
export const CONVERSATIONS_KEY = `aira:conversations:${DEMO_USER_ID}`;
export const PROFILE_KEY = `aira:profile:${DEMO_USER_ID}`;

export type LocalSavedItem = {
  id: string;
  subject: string;
  title: string;
  time: string;
  synced: boolean;
  answer?: string;
  formula?: string;
  source?: string;
  citationId?: string;
  deleted?: boolean;
  ts?: number;
};

export type LocalProfile = {
  subjects: string[];
  preferred_language: "en" | "hi" | "both";
};

export function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}
