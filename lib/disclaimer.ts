/**
 * Disclaimer acceptance tracking.
 *
 * Acceptance is scoped to a single sign-in session (the Better Auth session id),
 * so logging out and signing in again — or any fresh session — asks the user
 * to acknowledge the disclaimer once more.
 */

export const DISCLAIMER_KEY = "lawbite-disclaimer-accepted";

type StoredAcceptance = {
  accepted: true;
  sessionId: string;
};

function readStored(): Partial<StoredAcceptance> | true | null {
  try {
    const raw = window.localStorage.getItem(DISCLAIMER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredAcceptance> | boolean | null;
    if (parsed === true) return true; // legacy plain "true" value
    return (parsed as Partial<StoredAcceptance> | null) ?? null;
  } catch {
    return null;
  }
}

/** Whether the disclaimer was accepted during the given login session. */
export function isDisclaimerAccepted(sessionId?: string | null): boolean {
  if (typeof window === "undefined") return false;
  const stored = readStored();
  if (stored === null) return false;
  if (stored === true) return true; // accepted before this became session-scoped
  if (stored.accepted !== true) return false;
  // No session id on hand (older callers): trust any stored acceptance.
  if (!sessionId) return true;
  return stored.sessionId === sessionId;
}

/** Records acceptance for the given login session. */
export function rememberDisclaimerAcceptance(sessionId?: string | null): void {
  if (typeof window === "undefined") return;
  try {
    const value: StoredAcceptance | "true" = sessionId
      ? { accepted: true, sessionId }
      : "true";
    window.localStorage.setItem(
      DISCLAIMER_KEY,
      typeof value === "string" ? value : JSON.stringify(value),
    );
  } catch {
    /* ignore */
  }
}

/** Forgets acceptance, e.g. on sign-out, so the next sign-in shows it again. */
export function clearDisclaimerAcceptance(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(DISCLAIMER_KEY);
  } catch {
    /* ignore */
  }
}
