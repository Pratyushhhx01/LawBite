/**
 * ChatGPT-style conversation titles.
 *
 * The first meaningful user message is sent to a small, low-effort model call
 * and turned into a 3–7 word title. The helpers here are shared by the client
 * (optimistic fallback title) and the server (AI title + normalisation), so a
 * title generated on one device is recognisable everywhere.
 */

const TITLE_MAX_WORDS = 7;
const TITLE_MAX_CHARS = 64;

/** Titles that mean "the conversation has not been named yet". */
const PLACEHOLDER_TITLES = new Set(
  [
    "new conversation",
    "new chat",
    "new analysis",
    "new case",
    "new draft",
    "new review",
    "untitled",
    "untitled conversation",
    "legal query",
    "legal question",
    "legal advice",
  ].map((title) => title.toLowerCase()),
);

/** Generic model outputs that are no better than the fallback. */
const GENERIC_TITLES = new Set([
  ...PLACEHOLDER_TITLES,
  "chat",
  "conversation",
  "discussion",
  "legal discussion",
  "law question",
  "question",
  "help",
]);

const SMALL_WORDS = new Set([
  "a",
  "an",
  "and",
  "as",
  "at",
  "but",
  "by",
  "for",
  "from",
  "in",
  "into",
  "of",
  "on",
  "or",
  "the",
  "to",
  "vs",
  "v",
  "with",
]);

const GREETING_ONLY =
  /^(hi+|hey+|hello+|yo|namaste|good\s+(morning|afternoon|evening)|thanks?|thank\s+you|ok(ay)?|k|hmm+|yes|no|please|help)$/i;

export type ConversationTitleInput = {
  message: string;
  conversationType?: string | null;
  attachmentName?: string | null;
};

/** True when the title is still an untouched placeholder. */
export function isPlaceholderConversationTitle(
  title: string | null | undefined,
): boolean {
  const normalized = (title ?? "")
    .trim()
    .replace(/[.,;:!?]+$/g, "")
    .toLowerCase();
  return !normalized || PLACEHOLDER_TITLES.has(normalized);
}

/**
 * True when a message carries enough meaning to name the conversation. A bare
 * "hi" is skipped so the title is generated from the first real question.
 */
export function isMeaningfulTitleMessage(
  message: string,
  attachmentName?: string | null,
): boolean {
  if (attachmentName?.trim()) return true;
  const cleaned = message
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\s'’-]/gu, "")
    .trim();
  if (cleaned.length < 3) return false;
  return !GREETING_ONLY.test(cleaned);
}

function cleanAttachmentName(name: string): string {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toTitleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word, index) => {
      // Leave acronyms, numbers and existing mixed-case words alone.
      if (word !== word.toLowerCase()) return word;
      if (index > 0 && SMALL_WORDS.has(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function limitTitle(title: string): string {
  let limited = title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, TITLE_MAX_WORDS)
    .join(" ");
  if (limited.length > TITLE_MAX_CHARS) {
    limited = limited.slice(0, TITLE_MAX_CHARS).replace(/\s+\S*$/, "").trim();
  }
  return limited.replace(/[.,;:!?]+$/g, "").trim();
}

/**
 * Deterministic fallback used while the AI title is in flight and whenever the
 * model call fails. It should already look like a real title, not an error.
 */
export function fallbackConversationTitle(
  message: string,
  input?: Omit<ConversationTitleInput, "message">,
): string {
  const attachment = cleanAttachmentName(input?.attachmentName ?? "");
  if (attachment) {
    const titled =
      input?.conversationType === "review" ? `${attachment} Review` : attachment;
    return toTitleCase(limitTitle(titled));
  }

  let cleaned = message
    .replace(/\s+/g, " ")
    .replace(/[?.,!;:]+$/g, "")
    .trim();

  if (!cleaned) return "New conversation";

  // A review instruction is more useful when it names the thing being reviewed.
  const reviewMatch = cleaned.match(
    /^(?:please\s+)?review\s+(?:this|the|my)\s+(.+)$/i,
  );
  if (reviewMatch?.[1]) {
    return toTitleCase(limitTitle(`${reviewMatch[1]} Review`));
  }

  // "Draft a legal notice for unpaid salary" -> "Legal Notice for Unpaid Salary"
  const draftMatch = cleaned.match(
    /^(?:please\s+)?(?:draft|write|prepare|create)\s+(?:a|an)\s+(.+)$/i,
  );
  if (draftMatch?.[1]) cleaned = draftMatch[1];

  cleaned = cleaned
    .replace(/^(hey|hi|hello)[,! ]+/i, "")
    .replace(
      /^(can you|could you|would you|please|kindly|i want to|i need to|i need|i want|help me|tell me about|tell me|explain(?: to me)?|what are|what is|what does|what do|how do|how does|how can|how to|why do|why does|is there|are there|do you|does the|define|describe|give me|info on|details about|regarding|concerning)\s*/i,
      "",
    )
    .trim();

  const words = cleaned.split(/\s+/).filter(Boolean);
  let title = words.slice(0, 6).join(" ");
  if (!title) title = message.trim().slice(0, 40);
  title = toTitleCase(limitTitle(title));
  return title || "New conversation";
}

/** Strip model chatter, quotes, markdown and trailing punctuation. */
export function cleanGeneratedTitle(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const firstLine =
    raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean) ?? "";
  if (!firstLine) return null;

  let title = firstLine
    .replace(/^#{1,6}\s*/, "")
    .replace(/^(?:here(?:'s| is)\s*(?:a|the)?\s*title\s*[:\-]\s*)/i, "")
    .replace(/^(?:conversation\s+)?title\s*[:\-]\s*/i, "")
    .replace(/^["'“”‘’`*_]+|["'“”‘’`*_]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  title = limitTitle(title);
  if (!title) return null;
  if (GENERIC_TITLES.has(title.toLowerCase())) return null;
  return toTitleCase(title);
}

/** AI title, or the fallback when the model returns nothing usable. */
export function normalizeGeneratedTitle(
  raw: string | null | undefined,
  fallback: string,
): string {
  return cleanGeneratedTitle(raw) ?? fallback;
}


