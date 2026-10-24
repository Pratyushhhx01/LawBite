"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type {
  FormEvent,
  KeyboardEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
  RefObject,
} from "react";
import { signOut } from "@/lib/auth-client";
import {
  clearDisclaimerAcceptance,
  isDisclaimerAccepted,
  rememberDisclaimerAcceptance,
} from "@/lib/disclaimer";
import LogoIcon from "../../components/LogoIcon";
import { stripThinkingTokens } from "@/lib/utils";
import {
  CalculatorLimitsModal,
  CalculatorInterestModal,
} from "./CalculatorModals";
import { RemindersModal } from "./RemindersModal";
import { TemplatesModal, FilingModal } from "./ToolsModals";
import { formatCitation, copyToClipboard } from "@/lib/citations";
import { isTrustedLegalSource } from "@/lib/legal-sources";
import {
  parseContent,
  sectionVariant,
  splitTextSegments,
  type ContentBlockType,
  type SegmentVariant,
} from "./messageParser";
import { isRetryableChatFailure, takeSseLines } from "./chatTransport";
import {
  fallbackConversationTitle,
  isMeaningfulTitleMessage,
  isPlaceholderConversationTitle,
} from "@/lib/conversation-title";

type Role = "user" | "assistant";

type Citation = {
  type: "act" | "web";
  label: string;
  snippet: string;
  url?: string;
};

/**
 * Older saved replies may still contain social-media citations from before the
 * web-search source gate existed. Hide those at render time as well, so the
 * "Sources" strip never shows Instagram/Facebook/YouTube links.
 */
function visibleCitations(citations: Citation[] | undefined): Citation[] {
  if (!citations) return [];
  return citations.filter(
    (citation) =>
      citation.type === "act" || isTrustedLegalSource(citation.url),
  );
}

type Message = {
  id: string;
  role: Role;
  content: string;
  type?: ConversationType;
  documentName?: string;
  citations?: Citation[];
};

type ChatUser = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
};

type ChatAppProps = {
  user: ChatUser;
  /** Id of the current sign-in session; a new one is issued on every login. */
  sessionId?: string | null;
  /** Conversation to open after a shared chat has been imported server-side. */
  initialConversationId?: string | null;
  initialTool?: "templates" | "filing" | null;
  initialItem?: string | null;
};

type ConversationType =
  "chat" | "analysis" | "talk-to-ai" | "grill" | "draft" | "review";

type Conversation = {
  id: string;
  title: string;
  preview: string;
  messages: Message[];
  type: ConversationType;
  pinned?: boolean;
  folderId?: string | null;
  createdAt?: number;
};

type SavedCase = {
  id: string;
  title: string;
  summary: string;
  problem: string;
  state: string;
  date: number;
  conversationId: string;
};

const STORAGE_KEY = "lawbite-saved-cases";
const CONVERSATIONS_KEY = "lawbite-conversations";

function loadSavedCases(): SavedCase[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSavedCases(cases: SavedCase[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
  } catch {}
}

function loadConversations(): Conversation[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONVERSATIONS_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const started = parsed.filter(
      (c: Conversation) => Array.isArray(c?.messages) && c.messages.length > 0,
    );
    return started.length > 0 ? started : null;
  } catch {
    return null;
  }
}

function saveConversations(convos: Conversation[]) {
  if (typeof window === "undefined") return;
  try {
    const started = convos.filter(
      (c) => Array.isArray(c?.messages) && c.messages.length > 0,
    );
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(started));
  } catch {}
}

/** Text the user can actually read once thinking/control tokens are removed. */
function visibleAssistantText(content: string): string {
  return stripThinkingTokens(content)
    .replace(/\[ADVICE_COMPLETE\]/g, "")
    .trim();
}

type ModeAccent = "neutral" | "amber" | "blue" | "emerald";

type ModeOption = {
  mode: ConversationType;
  label: string;
  description: string;
  accent: ModeAccent;
};

const MODE_OPTIONS: ModeOption[] = [
  {
    mode: "talk-to-ai",
    label: "Talk to AI",
    description: "General legal chat",
    accent: "neutral",
  },
  {
    mode: "analysis",
    label: "Deep Analysis",
    description: "Deep dive into legal cases",
    accent: "amber",
  },
  {
    mode: "draft",
    label: "Document Drafter",
    description: "Generate legal documents",
    accent: "blue",
  },
  {
    mode: "review",
    label: "Document Reviewer",
    description: "Review contracts & clauses",
    accent: "emerald",
  },
];

// Full class strings (not interpolated fragments) so Tailwind can see them.
const MODE_ACCENT_CLASSES: Record<
  ModeAccent,
  { button: string; iconWrap: string; icon: string; label: string }
> = {
  neutral: {
    button: "border-white/10 hover:border-white/30 hover:bg-white/[0.06]",
    iconWrap: "bg-white/[0.08] group-hover:bg-white/[0.15]",
    icon: "text-white/70",
    label: "group-hover:text-white",
  },
  amber: {
    button:
      "border-amber-400/10 hover:border-amber-400/30 hover:bg-amber-400/[0.06] hover:shadow-[0_0_16px_rgba(251,191,36,0.08)]",
    iconWrap: "bg-amber-400/[0.08] group-hover:bg-amber-400/[0.15]",
    icon: "text-amber-400/80",
    label: "group-hover:text-amber-400/90",
  },
  blue: {
    button:
      "border-blue-400/10 hover:border-blue-400/30 hover:bg-blue-400/[0.06] hover:shadow-[0_0_16px_rgba(96,165,250,0.08)]",
    iconWrap: "bg-blue-400/[0.08] group-hover:bg-blue-400/[0.15]",
    icon: "text-blue-400/80",
    label: "group-hover:text-blue-400/90",
  },
  emerald: {
    button:
      "border-emerald-400/10 hover:border-emerald-400/30 hover:bg-emerald-400/[0.06] hover:shadow-[0_0_16px_rgba(52,211,153,0.08)]",
    iconWrap: "bg-emerald-400/[0.08] group-hover:bg-emerald-400/[0.15]",
    icon: "text-emerald-400/80",
    label: "group-hover:text-emerald-400/90",
  },
};

// Full class strings (not interpolated fragments) so Tailwind can see them.
const ATTACHMENT_ACCENT_CLASSES = {
  pdf: {
    button:
      "border-red-400/10 hover:border-red-400/30 hover:bg-red-400/[0.06] hover:shadow-[0_0_16px_rgba(248,113,113,0.08)]",
    iconWrap: "bg-red-400/[0.08] group-hover:bg-red-400/[0.15]",
    label: "group-hover:text-red-400/90",
  },
  image: {
    button:
      "border-blue-400/10 hover:border-blue-400/30 hover:bg-blue-400/[0.06] hover:shadow-[0_0_16px_rgba(96,165,250,0.08)]",
    iconWrap: "bg-blue-400/[0.08] group-hover:bg-blue-400/[0.15]",
    label: "group-hover:text-blue-400/90",
  },
} as const;

function ModeOptionIcon({
  accent,
  className,
}: {
  accent: ModeAccent;
  className: string;
}) {
  if (accent === "amber") {
    return (
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    );
  }
  if (accent === "blue") {
    return (
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    );
  }
  if (accent === "emerald") {
    return (
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <path d="M9 15l2 2 4-4" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function ModeOptionButton({
  option,
  onSelect,
}: {
  option: ModeOption;
  onSelect: () => void;
}) {
  const accent = MODE_ACCENT_CLASSES[option.accent];
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group flex w-full items-center gap-3 rounded-xl border bg-black/60 px-3 py-3 text-left backdrop-blur-xl transition-all duration-300 sm:py-2.5 ${accent.button}`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all duration-300 sm:h-8 sm:w-8 ${accent.iconWrap}`}
      >
        <ModeOptionIcon
          accent={option.accent}
          className={`h-3.5 w-3.5 ${accent.icon}`}
        />
      </div>
      <div className="min-w-0">
        <div
          className={`text-sm font-medium text-white/80 transition-colors sm:text-xs ${accent.label}`}
        >
          {option.label}
        </div>
        <div className="text-[11px] text-white/30 transition-colors group-hover:text-white/45 sm:text-[10px]">
          {option.description}
        </div>
      </div>
    </button>
  );
}

function AttachmentOptionButton({
  kind,
  label,
  onClick,
}: {
  kind: "pdf" | "image";
  label: string;
  onClick: () => void;
}) {
  const isPdf = kind === "pdf";
  const accent = ATTACHMENT_ACCENT_CLASSES[kind];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex w-[152px] items-center gap-2.5 rounded-lg border bg-[#0a0a0a] px-3 py-2 text-left transition-all duration-300 ${accent.button}`}
    >
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-all duration-300 ${accent.iconWrap}`}
      >
        {isPdf ? (
          <svg
            viewBox="0 0 24 24"
            className="h-3.5 w-3.5 text-red-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            className="h-3.5 w-3.5 text-blue-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        )}
      </div>
      <span
        className={`whitespace-nowrap text-xs font-medium text-white/80 transition-colors ${accent.label}`}
      >
        {label}
      </span>
    </button>
  );
}

/**
 * Phone-only attachment picker. The anchored popover is kept for tablet and
 * desktop; on a phone it opens over the empty-state heading, so we use the same
 * thumb-friendly bottom-sheet pattern as the mode switcher instead.
 */
function AttachmentSheet({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (kind: "pdf" | "image") => void;
}) {
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStartYRef = useRef<number | null>(null);
  const dragPointerIdRef = useRef<number | null>(null);

  const closeSheet = () => {
    setDragY(0);
    setDragging(false);
    onClose();
  };

  const onDragStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    setDragY(0);
    dragStartYRef.current = event.clientY;
    dragPointerIdRef.current = event.pointerId;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onDragMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging || dragPointerIdRef.current !== event.pointerId) return;
    const startY = dragStartYRef.current;
    if (startY === null) return;
    setDragY(Math.max(0, event.clientY - startY));
  };

  const onDragEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragPointerIdRef.current !== event.pointerId) return;
    const startY = dragStartYRef.current;
    const distance = startY === null ? 0 : Math.max(0, event.clientY - startY);
    dragStartYRef.current = null;
    dragPointerIdRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragging(false);
    setDragY(0);
    if (distance > 72) closeSheet();
  };

  return (
    <div
      className={`fixed inset-0 z-[70] sm:hidden ${
        open ? "" : "pointer-events-none"
      }`}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={closeSheet}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Attach a file"
        className="absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-white/10 bg-[#0a0a0a] shadow-2xl"
        onPointerDown={(event) => event.stopPropagation()}
        style={{
          visibility: open ? "visible" : "hidden",
          transform: open ? `translateY(${dragY}px)` : "translateY(100%)",
          transition: dragging
            ? "none"
            : open
              ? "transform 300ms cubic-bezier(0.16, 1, 0.3, 1)"
              : "transform 300ms cubic-bezier(0.16, 1, 0.3, 1), visibility 0s linear 300ms",
        }}
      >
        <div
          className="touch-none cursor-grab select-none px-4 pt-3 active:cursor-grabbing"
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
        >
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/15" />
          <div className="flex items-center justify-between pb-2">
            <p className="text-[11px] font-medium uppercase tracking-wider text-white/35">
              Attach a file
            </p>
            <button
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={closeSheet}
              aria-label="Close attachment menu"
              className="rounded-md p-1 text-white/35 transition-colors hover:bg-white/5 hover:text-white"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <AttachmentOptionButton
            kind="pdf"
            label="PDF Document"
            onClick={() => {
              onPick("pdf");
              closeSheet();
            }}
          />
          <AttachmentOptionButton
            kind="image"
            label="Image"
            onClick={() => {
              onPick("image");
              closeSheet();
            }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Phone-only mode picker. The desktop popovers are anchored to the left of the
 * plus button (`right-full`), which is off-screen when the composer sits at the
 * left edge of a narrow viewport. On phones we use a thumb-friendly bottom
 * sheet instead, so every option is always fully visible.
 */
function MobileModeSheet({
  open,
  mode,
  onSelect,
  onClose,
  sheetRef,
}: {
  open: boolean;
  mode: ConversationType;
  onSelect: (mode: ConversationType) => void;
  onClose: () => void;
  sheetRef: RefObject<HTMLDivElement | null>;
}) {
  const normalized = mode === "chat" ? "talk-to-ai" : mode;
  const options = MODE_OPTIONS.filter((option) => option.mode !== normalized);

  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStartYRef = useRef<number | null>(null);
  const dragPointerIdRef = useRef<number | null>(null);

  const closeSheet = () => {
    setDragY(0);
    setDragging(false);
    onClose();
  };

  const onDragStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    setDragY(0);
    dragStartYRef.current = event.clientY;
    dragPointerIdRef.current = event.pointerId;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onDragMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging || dragPointerIdRef.current !== event.pointerId) return;
    const startY = dragStartYRef.current;
    if (startY === null) return;
    setDragY(Math.max(0, event.clientY - startY));
  };

  const onDragEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragPointerIdRef.current !== event.pointerId) return;
    const startY = dragStartYRef.current;
    const distance = startY === null ? 0 : Math.max(0, event.clientY - startY);
    dragStartYRef.current = null;
    dragPointerIdRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragging(false);
    setDragY(0);
    // Pull down far enough to count as a dismiss; otherwise snap back up.
    if (distance > 72) closeSheet();
  };

  return (
    <div
      className={`fixed inset-0 z-[60] sm:hidden ${
        open ? "" : "pointer-events-none"
      }`}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={closeSheet}
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="Switch AI mode"
        className="absolute inset-x-0 bottom-0 max-h-[75vh] overflow-y-auto rounded-t-2xl border-t border-white/10 bg-[#0a0a0a] shadow-2xl"
        style={{
          visibility: open ? "visible" : "hidden",
          transform: open ? `translateY(${dragY}px)` : "translateY(100%)",
          transition: dragging
            ? "none"
            : open
              ? "transform 300ms cubic-bezier(0.16, 1, 0.3, 1)"
              : "transform 300ms cubic-bezier(0.16, 1, 0.3, 1), visibility 0s linear 300ms",
        }}
      >
        <div
          className="touch-none cursor-grab select-none px-4 pt-3 active:cursor-grabbing"
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
        >
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/15" />
          <div className="flex items-center justify-between pb-2">
            <p className="text-[11px] font-medium uppercase tracking-wider text-white/35">
              Switch mode
            </p>
            <button
              type="button"
              // Keep the drag capture off this button so its click still fires.
              onPointerDown={(event) => event.stopPropagation()}
              onClick={closeSheet}
              aria-label="Close mode menu"
              className="rounded-md p-1 text-white/35 transition-colors hover:bg-white/5 hover:text-white"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {options.map((option) => (
            <ModeOptionButton
              key={option.mode}
              option={option}
              onSelect={() => {
                setDragY(0);
                onSelect(option.mode);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

const emptySubscribe = () => () => {};

/**
 * False during SSR and the hydration render, true afterwards. Lets us defer
 * client-only storage reads without a setState-in-effect cascade.
 */
function useHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

const THINKING_STEPS = [
  "Thinking",
  "Searching legal resources",
  "Generating your response",
  "Finalizing your response",
] as const;

/** When each step becomes active, measured from the moment the reply starts. */
const THINKING_STEP_DELAYS_MS = [1_600, 3_600, 9_000];

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const freshConversation: Conversation = {
  id: newId("c"),
  title: "New conversation",
  preview: "Just started",
  type: "chat",
  createdAt: Date.now(),
  messages: [],
};

export default function ChatApp({
  user: initialUser,
  sessionId = null,
  initialConversationId = null,
  initialTool = null,
  initialItem = null,
}: ChatAppProps) {
  const router = useRouter();
  const [user, setUser] = useState<ChatUser>(initialUser);
  const [conversations, setConversations] = useState<Conversation[]>(() => [
    freshConversation,
  ]);
  const [activeId, setActiveId] = useState<string>(
    initialConversationId ?? freshConversation.id,
  );
  const [syncStatus, setSyncStatus] = useState<"idle" | "synced">("idle");
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeIdRef = useRef(activeId);
  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/conversations", {
          method: "GET",
          credentials: "include",
        });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        const server: Conversation[] = data.conversations ?? [];
        if (server.length > 0) {
          setConversations((prev) => {
            const currentActiveId = activeIdRef.current;
            const activeInServer = server.some((c) => c.id === currentActiveId);
            if (activeInServer) return server;
            const currentActive = prev.find((c) => c.id === currentActiveId);
            if (currentActive && currentActive.messages.length === 0) {
              return [currentActive, ...server];
            }
            return server;
          });
        } else {
          const local = loadConversations();
          if (local && local.length > 0) {
            setConversations(local);
          }
        }
      } catch {
        if (cancelled) return;
        const local = loadConversations();
        if (local && local.length > 0) {
          setConversations(local);
        }
      } finally {
        if (!cancelled) setSyncStatus("synced");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const [draft, setDraft] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingStage, setThinkingStage] = useState(0);
  const [showThinking, setShowThinking] = useState(false);
  // True from the moment a reply is requested until its typewriter reveal has
  // finished. `isThinking` is only the "waiting for the first word" indicator.
  const [isResponding, setIsResponding] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTab, setHistoryTab] = useState<"all" | ConversationType>("all");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [showClearNotifications, setShowClearNotifications] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [activeCalculator, setActiveCalculator] = useState<
    "limits" | "interest" | null
  >(null);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<"templates" | "filing" | null>(
    initialTool,
  );
  const [remindersOpen, setRemindersOpen] = useState(false);
  const [dismissedNotifications, setDismissedNotifications] = useState<
    { id: string; threshold: number }[]
  >(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("lawbite-dismissed-notifications");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [upcomingReminders, setUpcomingReminders] = useState<
    {
      id: string;
      title: string;
      deadlineAt: string;
      type: string;
      daysLeft: number;
    }[]
  >([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bellShake, setBellShake] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [contextMenuId, setContextMenuId] = useState<string | null>(null);
  const [myCasesOpen, setMyCasesOpen] = useState(false);
  const [savedCases, setSavedCases] = useState<SavedCase[]>(() =>
    loadSavedCases(),
  );
  const [caseFolders, setCaseFolders] = useState<
    { id: string; name: string }[]
  >([]);
  const [caseFoldersOpen, setCaseFoldersOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const lastTalkIdRef = useRef<string | null>(null);
  const lastAnalysisIdRef = useRef<string | null>(null);
  const [mode, setMode] = useState<ConversationType>("chat");
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const plusMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileModeSheetRef = useRef<HTMLDivElement | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const contextMenuRef = useRef<HTMLDivElement | null>(null);
  const notificationRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Distinguishes a user-pressed Stop from an unmount/navigation abort, so a
  // stopped reply keeps its partial text instead of showing an error.
  const stopRequestedRef = useRef(false);
  const conversationsRef = useRef<Conversation[]>([]);
  // Conversations that have already asked the server for a title. Prevents a
  // second message (or a re-render) from firing a duplicate generation call.
  const titleRequestedRef = useRef<Set<string>>(new Set());
  const escCountRef = useRef(0);
  const escTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Reveals assistant text word by word, whether the server streams it in many
  // chunks or delivers the whole reply at once (analysis/table modes do).
  const typewriterRef = useRef<{
    timer: ReturnType<typeof setInterval> | null;
    fullText: string;
    shownText: string;
    conversationId: string;
    messageId: string;
    done: boolean;
    started: boolean;
    ticks: number;
    resolveDone: (() => void) | null;
  }>({
    timer: null,
    fullText: "",
    shownText: "",
    conversationId: "",
    messageId: "",
    done: false,
    started: false,
    ticks: 0,
    resolveDone: null,
  });
  const [confirmAction, setConfirmAction] = useState<
    | { type: "clearHistory"; section?: ConversationType }
    | { type: "deleteConversation"; id: string }
    | null
  >(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const hydrated = useHydrated();
  // Starts closed on both the server and the hydration render; once mounted it
  // opens only if this login session hasn't accepted the disclaimer yet.
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [acceptedThisVisit, setAcceptedThisVisit] = useState(false);
  const disclaimerAccepted = useMemo(
    () => (hydrated ? isDisclaimerAccepted(sessionId) : false),
    [hydrated, sessionId],
  );
  const disclaimerOpen =
    showDisclaimer || (hydrated && !disclaimerAccepted && !acceptedThisVisit);
  const [citationOpen, setCitationOpen] = useState<Citation | null>(null);
  const [copiedCitation, setCopiedCitation] = useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<
    Record<string, "up" | "down">
  >({});
  const [feedbackComment, setFeedbackComment] = useState<
    Record<string, string>
  >({});
  const [feedbackCommentOpen, setFeedbackCommentOpen] = useState<string | null>(
    null,
  );
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [bugOpen, setBugOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [lastDraftIdRef, setLastDraftIdRef] = useState<string | null>(null);
  const [lastReviewIdRef, setLastReviewIdRef] = useState<string | null>(null);
  const [reviewFileUploading, setReviewFileUploading] = useState(false);
  const [reviewAttachOpen, setReviewAttachOpen] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<{
    type: "pdf" | "image";
    fileName: string;
    text?: string;
    imageBase64?: string;
    truncated?: boolean;
  } | null>(null);
  const reviewFileInputRef = useRef<HTMLInputElement | null>(null);
  const reviewAttachMenuRef = useRef<HTMLDivElement | null>(null);
  const chatFileInputRef = useRef<HTMLInputElement | null>(null);
  const chatAttachMenuRef = useRef<HTMLDivElement | null>(null);
  const [chatAttachOpen, setChatAttachOpen] = useState(false);
  const analysisFileInputRef = useRef<HTMLInputElement | null>(null);
  const analysisAttachMenuRef = useRef<HTMLDivElement | null>(null);
  const [analysisAttachOpen, setAnalysisAttachOpen] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);
  const [draftDocTypeOpen, setDraftDocTypeOpen] = useState(false);
  const draftDocTypeMenuRef = useRef<HTMLDivElement | null>(null);

  const active =
    conversations.find((c) => c.id === activeId) ?? conversations[0];

  const showSuggestion = useMemo(() => {
    if (isThinking || isResponding) return false;
    if (
      mode === "analysis" ||
      mode === "grill" ||
      mode === "draft" ||
      mode === "review"
    )
      return false;
    if (
      active?.type === "grill" ||
      active?.type === "draft" ||
      active?.type === "review"
    )
      return false;
    if (!active || active.messages.length === 0) return false;
    const lastMsg = active.messages[active.messages.length - 1];
    const userMsgs = active.messages.filter((m) => m.role === "user");
    const lastUserMsg = userMsgs[userMsgs.length - 1];
    const content = lastUserMsg?.content?.toLowerCase().trim() ?? "";
    const isGreeting =
      /^(hi|hello|hey|namaste|good\s*(morning|afternoon|evening|night)|yo|sup|hola|howdy|greetings)/.test(
        content,
      );
    const isCompliment =
      /(thank|thanks|thx|good\s*(job|work|bot|ai)|great|awesome|nice|amazing|perfect|excellent|well\s*done|bravo|superb|fantastic|love\s*you)/.test(
        content,
      );
    const isOffTopic = /only\s+provide\s+information.*indian\s+law/i.test(
      lastMsg?.content?.trim() ?? "",
    );
    const isAiGreeting =
      lastMsg?.content?.trim().toLowerCase().startsWith("hello") &&
      lastMsg?.content?.toLowerCase().includes("how can i assist you");
    if (
      lastMsg &&
      lastMsg.role === "assistant" &&
      lastMsg.content &&
      !isOffTopic &&
      !isGreeting &&
      !isCompliment &&
      !isAiGreeting
    ) {
      return true;
    }
    return false;
  }, [active, mode, isThinking, isResponding]);

  useEffect(() => {
    const scroller = chatScrollRef.current;
    if (!scroller) return;
    if (isThinking) {
      // Jump straight to the bottom so the user message and the wait status
      // are visible without scrolling. The status card mounts a moment later,
      // which is why `showThinking` is also a dependency. Wait one frame so
      // the new card has been laid out before measuring the scroll height.
      const frame = requestAnimationFrame(() => {
        scroller.scrollTop = scroller.scrollHeight;
      });
      return () => cancelAnimationFrame(frame);
    }
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [
    active?.messages.length,
    isThinking,
    isResponding,
    showThinking,
    showSuggestion,
  ]);

  // Reveal the wait as a short pipeline. The card is held back briefly so a
  // fast reply appears directly without a status flash, and it is removed the
  // instant the first real content arrives.
  useEffect(() => {
    if (!isThinking) return;
    const showTimer = setTimeout(() => setShowThinking(true), 240);
    const stageTimers = THINKING_STEP_DELAYS_MS.map((delay, index) =>
      setTimeout(() => setThinkingStage(index + 1), delay),
    );
    return () => {
      clearTimeout(showTimer);
      stageTimers.forEach((timer) => clearTimeout(timer));
    };
  }, [isThinking]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    // Don't overwrite the local cache before the server/local load completes,
    // and don't write on every typewriter tick.
    if (syncStatus !== "synced" || isResponding) return;
    saveConversations(conversations);
  }, [conversations, syncStatus, isResponding]);

  useEffect(() => {
    if (syncStatus !== "synced" || isResponding) return;
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ conversations }),
      }).catch(() => {});
    }, 1200);
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [conversations, syncStatus, isResponding]);

  useEffect(() => {
    const ref = typewriterRef;
    return () => {
      if (ref.current.timer) clearInterval(ref.current.timer);
      ref.current.resolveDone?.();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/cases", { credentials: "include" });
        if (res.ok && !cancelled) {
          const data = await res.json();
          setCaseFolders(Array.isArray(data.folders) ? data.folders : []);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!plusMenuOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const insidePlus = plusMenuRef.current?.contains(target) ?? false;
      const insideSheet = mobileModeSheetRef.current?.contains(target) ?? false;
      if (!insidePlus && !insideSheet) {
        setPlusMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [plusMenuOpen]);

  useEffect(() => {
    if (!draftDocTypeOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        draftDocTypeMenuRef.current &&
        !draftDocTypeMenuRef.current.contains(e.target as Node)
      ) {
        setDraftDocTypeOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [draftDocTypeOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(e.target as Node)
      ) {
        setContextMenuId(null);
      }
    }
    if (contextMenuId) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [contextMenuId]);

  useEffect(() => {
    function handleKeyDown(e: globalThis.KeyboardEvent) {
      if (e.key !== "Escape" || !isResponding) return;
      escCountRef.current += 1;
      if (escTimerRef.current) clearTimeout(escTimerRef.current);
      escTimerRef.current = setTimeout(() => {
        escCountRef.current = 0;
      }, 1500);
      if (escCountRef.current >= 3) {
        escCountRef.current = 0;
        if (escTimerRef.current) clearTimeout(escTimerRef.current);
        stopRequestedRef.current = true;
        abortRef.current?.abort();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isResponding]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        reviewAttachMenuRef.current &&
        !reviewAttachMenuRef.current.contains(e.target as Node)
      ) {
        setReviewAttachOpen(false);
      }
    }
    if (reviewAttachOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [reviewAttachOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        chatAttachMenuRef.current &&
        !chatAttachMenuRef.current.contains(e.target as Node)
      ) {
        setChatAttachOpen(false);
      }
    }
    if (chatAttachOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [chatAttachOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        analysisAttachMenuRef.current &&
        !analysisAttachMenuRef.current.contains(e.target as Node)
      ) {
        setAnalysisAttachOpen(false);
      }
    }
    if (analysisAttachOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [analysisAttachOpen]);

  function renderBold(text: string): ReactNode {
    // An unclosed bold marker should still render as bold, not leak "**".
    if (text.startsWith("**") && !text.slice(2).includes("**")) {
      return (
        <strong className="font-semibold text-white">{text.slice(2)}</strong>
      );
    }
    // Support **bold** and *italic*. Models occasionally use single asterisks
    // for emphasis even when told not to; render them as italics so raw
    // asterisks never reach the user.
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*\n]+\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
        return (
          <strong key={i} className="font-semibold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
        return (
          <em key={i} className="italic text-white/90">
            {part.slice(1, -1)}
          </em>
        );
      }
      // Never leave stray emphasis markers on screen.
      return part.replace(/\*{1,2}/g, "");
    });
  }

  function renderCallout(
    title: string,
    content: ReactNode,
    variant: Exclude<SegmentVariant, "plain">,
  ): ReactNode {
    const theme = {
      lead: {
        box: "border-amber-400/20 bg-gradient-to-br from-amber-400/[0.10] via-amber-400/[0.03] to-transparent",
        icon: "bg-amber-400/15 text-amber-300",
        label: "text-amber-300/90",
        glyph: (
          <svg
            viewBox="0 0 24 24"
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3.5" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </svg>
        ),
      },
      takeaway: {
        box: "border-emerald-400/20 bg-gradient-to-br from-emerald-400/[0.10] via-emerald-400/[0.03] to-transparent",
        icon: "bg-emerald-400/15 text-emerald-300",
        label: "text-emerald-300/90",
        glyph: (
          <svg
            viewBox="0 0 24 24"
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
          </svg>
        ),
      },
      warning: {
        box: "border-amber-400/25 bg-amber-400/[0.06]",
        icon: "bg-amber-400/15 text-amber-400",
        label: "text-amber-400/80",
        glyph: (
          <svg
            viewBox="0 0 24 24"
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        ),
      },
    }[variant];

    return (
      <div className={`rounded-xl border px-4 py-3.5 ${theme.box}`}>
        <div className="flex items-center gap-2">
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-md ${theme.icon}`}
          >
            {theme.glyph}
          </span>
          <span
            className={`text-xs font-semibold uppercase tracking-wider ${theme.label}`}
          >
            {title}
          </span>
        </div>
        <div className="mt-2.5">{content}</div>
      </div>
    );
  }

  function renderInlineLines(
    lines: string[],
    keyPrefix: string,
    bulletClass = "bg-white/50",
  ): ReactNode[] {
    const elements: ReactNode[] = [];
    let currentPara: string[] = [];
    const flushPara = () => {
      if (currentPara.length > 0) {
        elements.push(
          <p
            key={keyPrefix + "p" + elements.length}
            className={elements.length > 0 ? "mt-2.5" : ""}
          >
            {renderBold(currentPara.join("\n"))}
          </p>,
        );
        currentPara = [];
      }
    };

    for (const l of lines) {
      const bulletMatch = l.match(/^\s*[-*+]\s+(.*)/);
      const bottomLine = l.match(
        /^\s*\*\*(Bottom line|The bottom line|In short)[:\u2013\u2014-]\s*(.+)$/i,
      );
      if (!l.trim()) {
        flushPara();
      } else if (bottomLine) {
        flushPara();
        elements.push(
          <div
            key={keyPrefix + "bl" + elements.length}
            className="mt-2 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.06] px-3.5 py-2.5"
          >
            <p className="text-sm leading-relaxed text-white/85">
              {renderBold(l.trim())}
            </p>
          </div>,
        );
      } else if (bulletMatch) {
        flushPara();
        elements.push(
          <div
            key={keyPrefix + "b" + elements.length}
            className="flex items-start gap-2 py-0.5"
          >
            <span
              className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${bulletClass}`}
            />
            <span className="min-w-0 text-sm leading-relaxed text-white/80">
              {renderBold(bulletMatch[1])}
            </span>
          </div>,
        );
      } else {
        currentPara.push(l);
      }
    }
    flushPara();
    return elements;
  }

  function renderTextSegments(textContent: string, keyPrefix: string): ReactNode {
    const segments = splitTextSegments(textContent.split("\n"));

    return (
      <div className="whitespace-pre-wrap leading-relaxed">
        {segments.map((seg, si) => {
          const variant = seg.heading ? sectionVariant(seg.heading) : "plain";
          if (variant === "plain") {
            return (
              <div key={si} className={si > 0 ? "mt-4" : ""}>
                {seg.heading && (
                  <p className="flex items-center gap-2 text-sm font-semibold text-white/90">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400/70" />
                    <span>{renderBold(seg.heading)}</span>
                  </p>
                )}
                <div className={seg.heading ? "mt-1.5" : ""}>
                  {renderInlineLines(seg.lines, `${keyPrefix}-${si}`)}
                </div>
              </div>
            );
          }
          const bulletClass =
            variant === "takeaway" ? "bg-emerald-400/60" : "bg-amber-400/60";
          return (
            <div key={si} className={si > 0 ? "mt-4" : ""}>
              {renderCallout(
                seg.heading ?? "",
                renderInlineLines(
                  seg.lines,
                  `${keyPrefix}-${si}`,
                  bulletClass,
                ),
                variant,
              )}
            </div>
          );
        })}
      </div>
    );
  }

  function renderContentBlocks(blocks: ContentBlockType[]): ReactNode {
    return blocks.map((block, bi) => {
      switch (block.type) {
        case "table":
          return (
            <div
              key={bi}
              className="my-3 overflow-x-auto rounded-xl border border-white/[0.08] bg-white/[0.02] shadow-sm"
            >
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-white/[0.04]">
                    {block.headers.map((h, hi) => (
                      <th
                        key={hi}
                        className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-white/70 first:pl-5 last:pr-5"
                      >
                        {renderBold(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, ri) => (
                    <tr
                      key={ri}
                      className={`border-b border-white/[0.04] last:border-0 transition-colors hover:bg-white/[0.04] ${ri % 2 === 1 ? "bg-white/[0.03]" : ""}`}
                    >
                      {block.headers.map((_, ci) => {
                        const cell = row[ci] ?? "";
                        return (
                          <td
                            key={ci}
                            className={`px-4 py-3 leading-snug align-top first:pl-5 last:pr-5 ${ci === 0 ? "font-semibold text-white/90" : "text-white/75"}`}
                          >
                            {cell ? renderBold(cell) : ""}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );

        case "steps":
          return (
            <div key={bi} className="my-3 space-y-3">
              {block.steps.map((step, si) => (
                <div key={si} className="flex gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-400/15 text-xs font-bold text-amber-400">
                    {step.title}
                  </div>
                  <div className="min-w-0 pt-0.5 text-sm leading-relaxed text-white/85">
                    {renderBold(step.content)}
                  </div>
                </div>
              ))}
            </div>
          );

        case "warning": {
          const colors = {
            warning: {
              bg: "bg-red-400/[0.06]",
              border: "border-red-400/20",
              icon: "text-red-400",
              header: "text-red-400/70",
              text: "text-white/85",
              dot: "bg-red-400/60",
            },
            important: {
              bg: "bg-amber-400/[0.06]",
              border: "border-amber-400/20",
              icon: "text-amber-400",
              header: "text-amber-400/70",
              text: "text-white/85",
              dot: "bg-amber-400/60",
            },
            note: {
              bg: "bg-blue-400/[0.06]",
              border: "border-blue-400/20",
              icon: "text-blue-400",
              header: "text-blue-400/70",
              text: "text-white/85",
              dot: "bg-blue-400/60",
            },
          };
          const c = colors[block.variant] ?? colors.warning;
          const label =
            block.variant === "warning"
              ? "Warning"
              : block.variant === "important"
                ? "Important"
                : "Note";
          return (
            <div
              key={bi}
              className={`my-3 rounded-lg border ${c.border} ${c.bg} px-4 py-3`}
            >
              <div
                className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${c.header}`}
              >
                {block.variant === "warning" ? (
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                ) : block.variant === "important" ? (
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                )}
                {label}
              </div>
              <div className={`mt-2 text-sm leading-relaxed ${c.text}`}>
                {renderBold(block.content)}
              </div>
            </div>
          );
        }

        case "definition":
          return (
            <div
              key={bi}
              className="my-3 rounded-xl border border-amber-400/20 bg-gradient-to-br from-amber-400/[0.08] via-amber-400/[0.02] to-transparent px-4 py-3.5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-400/15 text-amber-300">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-300/90">
                  Definition
                </span>
                <span className="text-sm font-semibold text-white/90">
                  {renderBold(block.term)}
                </span>
              </div>
              <div className="mt-2 text-sm leading-relaxed text-white/80">
                {renderBold(block.content)}
              </div>
            </div>
          );

        case "summary":
          return (
            <div
              key={bi}
              className="my-3 rounded-lg border border-emerald-400/15 bg-emerald-400/[0.04] px-4 py-3"
            >
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400/70">
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                Key Takeaways
              </div>
              <div className="mt-2 space-y-1.5">
                {block.content
                  .filter((point) =>
                    /[a-zA-Z0-9]/.test(
                      point.trim().replace(/^\s*[-*+>]\s*/, ""),
                    ),
                  )
                  .map((point, pi) => {
                    const trimmed = point.trim();
                    const text = trimmed.replace(/^\s*[-*+>]{1,2}\s*/, "");
                    return (
                      <div
                        key={pi}
                        className="flex items-start gap-2 text-sm leading-relaxed text-white/80"
                      >
                        <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400/60" />
                        <span className="min-w-0">{renderBold(text)}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          );

        default:
          const textContent = (block as { type: "text"; content: string })
            .content;
          const numMatch = textContent.trim().match(/^(\d+)\.?\s*/);
          if (numMatch) {
            const num = numMatch[1];
            const text = textContent.trim().replace(/^\d+\.?\s*/, "");
            return (
              <div
                key={bi}
                className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-4 py-3"
              >
                <div className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-xs font-bold text-white/80">
                    {num}
                  </span>
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {text.split(/\n+/).map((para, j) => (
                      <p key={j} className={j > 0 ? "mt-3" : ""}>
                        {renderBold(para)}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            );
          }
          return (
            <div key={bi} className="whitespace-pre-wrap leading-relaxed">
              {renderTextSegments(textContent, `t${bi}`)}
            </div>
          );
      }
    });
  }

  /**
   * Ask the server for an AI title once per conversation. The deterministic
   * fallback is already on screen, so this is fire-and-forget: a failure just
   * leaves the fallback in place.
   */
  function requestConversationTitle(params: {
    conversationId: string;
    message: string;
    conversationType: ConversationType;
    attachmentName?: string | null;
    fallbackTitle: string;
  }) {
    const { conversationId, fallbackTitle } = params;
    if (titleRequestedRef.current.has(conversationId)) return;
    titleRequestedRef.current.add(conversationId);

    void fetch("/api/conversations/title", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        conversationId,
        message: params.message,
        conversationType: params.conversationType,
        attachmentName: params.attachmentName ?? null,
        allowTitleReplacement: true,
      }),
    })
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        const title =
          typeof data?.title === "string" ? data.title.trim() : "";
        if (!title) return;
        setConversations((prev) =>
          prev.map((c) =>
            // Only replace the optimistic fallback. A manual rename made while
            // the request was in flight must always win.
            c.id === conversationId && c.title === fallbackTitle
              ? { ...c, title }
              : c,
          ),
        );
      })
      .catch(() => {
        /* keep the fallback title */
      });
  }

  function selectConversation(id: string) {
    const target = conversations.find((c) => c.id === id);
    if (target) setMode(target.type);
    setActiveId(id);
    setSidebarOpen(false);
  }

  function startNewChat() {
    const prefix =
      mode === "analysis"
        ? "a"
        : mode === "grill"
          ? "g"
          : mode === "draft"
            ? "d"
            : mode === "review"
              ? "r"
              : "t";
    const convType: ConversationType =
      mode === "analysis"
        ? "analysis"
        : mode === "grill"
          ? "grill"
          : mode === "draft"
            ? "draft"
            : mode === "review"
              ? "review"
              : "talk-to-ai";
    const conv: Conversation = {
      id: newId(prefix),
      title:
        mode === "analysis"
          ? "New analysis"
          : mode === "grill"
            ? "New case"
            : mode === "draft"
              ? "New draft"
              : mode === "review"
                ? "New review"
                : "New conversation",
      preview:
        mode === "analysis"
          ? "Deep analysis"
          : mode === "grill"
            ? "Case intake"
            : mode === "draft"
              ? "Document drafting"
              : mode === "review"
                ? "Document review"
                : "Just started",
      type: convType,
      createdAt: Date.now(),
      messages: [],
    };
    setConversations((prev) => [conv, ...prev]);
    setActiveId(conv.id);
    setMode(convType);
    setDraft("");
    setSidebarOpen(false);
    lastTalkIdRef.current = null;
    lastAnalysisIdRef.current = null;
    if (convType === "draft") {
      setSelectedDocType(null);
      setFormData({});
    }
  }

  function startGrill() {
    const conv: Conversation = {
      id: newId("g"),
      title: "New case",
      preview: "Case intake",
      type: "grill",
      createdAt: Date.now(),
      messages: [],
    };
    setConversations((prev) => [conv, ...prev]);
    setActiveId(conv.id);
    setMode("grill");
    setDraft("");
    setSidebarOpen(false);
    setMyCasesOpen(false);
    setSelectedDocType(null);
    setFormData({});
  }

  async function handleReviewFileUpload(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    setReviewFileUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/review", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Failed to process file");
      }
      const data = await res.json();

      if (data.type === "image") {
        setPendingAttachment({
          type: "image",
          fileName: data.fileName,
          imageBase64: data.imageBase64,
        });
      } else {
        setPendingAttachment({
          type: "pdf",
          fileName: data.fileName,
          text: data.text,
          truncated: data.truncated,
        });
      }
    } catch (err) {
      console.error("File upload error:", err);
      const errorMsg =
        err instanceof Error ? err.message : "Failed to process file";
      const assistantId = newId("a");
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? {
                ...c,
                messages: [
                  ...c.messages,
                  {
                    id: assistantId,
                    role: "assistant",
                    content: `Error: ${errorMsg}. Please try uploading the file again.`,
                  },
                ],
              }
            : c,
        ),
      );
    } finally {
      setReviewFileUploading(false);
      e.target.value = "";
      setReviewAttachOpen(false);
    }
  }

  async function handleFileUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    closeMenu?: () => void,
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/review", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Failed to process file");
      }
      const data = await res.json();
      if (data.type === "image") {
        setPendingAttachment({
          type: "image",
          fileName: data.fileName,
          imageBase64: data.imageBase64,
        });
      } else {
        setPendingAttachment({
          type: "pdf",
          fileName: data.fileName,
          text: data.text,
          truncated: data.truncated,
        });
      }
    } catch (err) {
      console.error("File upload error:", err);
      const errorMsg =
        err instanceof Error ? err.message : "Failed to process file";
      const assistantId = newId("a");
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? {
                ...c,
                messages: [
                  ...c.messages,
                  {
                    id: assistantId,
                    role: "assistant",
                    content: `Error: ${errorMsg}. Please try uploading the file again.`,
                  },
                ],
              }
            : c,
        ),
      );
    } finally {
      setFileUploading(false);
      e.target.value = "";
      closeMenu?.();
    }
  }

  function chooseAttachment(
    kind: "pdf" | "image",
    target: "chat" | "analysis" | "review",
  ) {
    const input =
      target === "review"
        ? reviewFileInputRef.current
        : target === "analysis"
          ? analysisFileInputRef.current
          : chatFileInputRef.current;
    if (input) {
      input.accept = kind === "pdf" ? ".pdf" : ".png,.jpg,.jpeg,.webp,.gif";
      input.click();
    }
    if (target === "review") setReviewAttachOpen(false);
    else if (target === "analysis") setAnalysisAttachOpen(false);
    else setChatAttachOpen(false);
  }

  function switchMode(newMode: ConversationType) {
    const target = newMode === "chat" ? "talk-to-ai" : newMode;
    if (target === "grill") return;

    // Save current conversation ID for the mode we're leaving
    if (mode === "talk-to-ai" || mode === "chat") {
      lastTalkIdRef.current = activeId;
    } else if (mode === "analysis") {
      lastAnalysisIdRef.current = activeId;
    } else if (mode === "draft") {
      setLastDraftIdRef(activeId);
    } else if (mode === "review") {
      setLastReviewIdRef(activeId);
    }

    setMode(target);

    // Restore the last conversation for the target mode
    let savedId: string | null = null;
    if (target === "analysis") savedId = lastAnalysisIdRef.current;
    else if (target === "draft") savedId = lastDraftIdRef;
    else if (target === "review") savedId = lastReviewIdRef;
    else savedId = lastTalkIdRef.current;

    const existing = savedId
      ? conversations.find((c) => c.id === savedId)
      : null;

    if (existing) {
      setActiveId(existing.id);
    } else {
      const prefix =
        target === "analysis"
          ? "a"
          : target === "draft"
            ? "d"
            : target === "review"
              ? "r"
              : "t";
      const conv: Conversation = {
        id: newId(prefix),
        title: "New conversation",
        preview: "Just started",
        type: target,
        createdAt: Date.now(),
        messages: [],
      };
      setConversations((prev) => [conv, ...prev]);
      setActiveId(conv.id);
    }
    setDraft("");
    if (target === "draft") {
      setSelectedDocType(null);
      setFormData({});
    }
  }

  async function submitFeedback(messageId: string, rating: "up" | "down") {
    setFeedbackGiven((prev) => ({ ...prev, [messageId]: rating }));
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          messageId,
          rating,
          comment: feedbackComment[messageId] || null,
        }),
      });
    } catch {
      /* ignore */
    }
  }

  function setMessageContent(
    conversationId: string,
    messageId: string,
    content: string,
  ) {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              messages: c.messages.map((m) =>
                m.id === messageId ? { ...m, content } : m,
              ),
            }
          : c,
      ),
    );
  }

  function removeMessage(conversationId: string, messageId: string) {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? { ...c, messages: c.messages.filter((m) => m.id !== messageId) }
          : c,
      ),
    );
  }

  function stopTypewriter() {
    const tw = typewriterRef.current;
    if (tw.timer) {
      clearInterval(tw.timer);
      tw.timer = null;
    }
    const resolve = tw.resolveDone;
    tw.resolveDone = null;
    resolve?.();
  }

  function finishTypewriter() {
    typewriterRef.current.done = true;
  }

  function flushTypewriter() {
    const tw = typewriterRef.current;
    if (!tw.messageId) {
      stopTypewriter();
      return;
    }
    tw.shownText = tw.fullText;
    setMessageContent(tw.conversationId, tw.messageId, tw.fullText);
    setIsThinking(false);
    stopTypewriter();
  }

  function startTypewriter(conversationId: string, messageId: string) {
    stopTypewriter();
    const tw = typewriterRef.current;
    tw.fullText = "";
    tw.shownText = "";
    tw.conversationId = conversationId;
    tw.messageId = messageId;
    tw.done = false;
    tw.started = false;
    tw.ticks = 0;
    tw.timer = setInterval(() => {
      const state = typewriterRef.current;
      if (!state.messageId) return;

      const full = state.fullText;
      let available = full.length;
      // While the stream is live, hold back an unfinished trailing word so a
      // token split across chunks doesn't flash as a broken word.
      if (!state.done) {
        const lastBreak = Math.max(
          full.lastIndexOf(" "),
          full.lastIndexOf("\n"),
          full.lastIndexOf("\t"),
        );
        if (lastBreak >= 0 && lastBreak < full.length - 1) {
          available = lastBreak + 1;
        }
      }

      if (available <= state.shownText.length) {
        if (state.done && state.shownText.length < full.length) {
          // Reveal the final fragment (text that has no trailing whitespace).
          state.shownText = full;
          setMessageContent(state.conversationId, state.messageId, full);
        }
        if (state.done && state.shownText.length >= full.length) {
          stopTypewriter();
        }
        return;
      }

      const remaining = full.slice(state.shownText.length, available);
      const words = remaining.match(/\s*\S+\s*/g) ?? [remaining];
      // Reveal at least one word per tick; accelerate when a buffered reply
      // (analysis / table mode) arrives as one large block so the reveal takes
      // about a second rather than trailing the answer by several seconds.
      // A short backlog still moves in two-word steps so it never feels slow.
      const wordsPerTick =
        words.length > 6 ? Math.max(2, Math.ceil(words.length / 70)) : 1;
      const take = words.slice(0, wordsPerTick).join("");
      state.shownText += take;
      if (!state.started) {
        state.started = true;
        setIsThinking(false);
      }
      setMessageContent(state.conversationId, state.messageId, state.shownText);
      // Follow the growing reply unless the reader has scrolled up.
      state.ticks += 1;
      if (state.ticks % 8 === 0) {
        const scroller = chatScrollRef.current;
        if (scroller) {
          const distance =
            scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
          if (distance < 140) scroller.scrollTop = scroller.scrollHeight;
        }
      }
    }, 16);
  }

  async function waitForTypewriter() {
    const tw = typewriterRef.current;
    if (!tw.timer) return;
    await new Promise<void>((resolve) => {
      tw.resolveDone = resolve;
    });
  }

  async function sendMessage(
    text: string,
    documentName?: string,
    imageDataUrl?: string,
    attachment?: {
      type: "pdf" | "image";
      fileName: string;
      text?: string;
      imageBase64?: string;
      truncated?: boolean;
    },
  ) {
    const trimmed = text.trim();
    if (!trimmed || isResponding) return;

    stopRequestedRef.current = false;
    const controller = new AbortController();
    abortRef.current = controller;

    const userMsg: Message = {
      id: newId("u"),
      role: "user",
      content: trimmed,
      type: mode,
      documentName: documentName ?? attachment?.fileName,
    };
    const assistantId = newId("a");

    const attachmentLabel = attachment?.fileName ?? documentName ?? null;
    const titleConversation = conversationsRef.current.find(
      (c) => c.id === activeId,
    );
    // Name the thread from the first meaningful message, but never overwrite a
    // real title (drafter template, AI title, or a manual rename).
    const shouldGenerateTitle =
      (!titleConversation ||
        isPlaceholderConversationTitle(titleConversation.title)) &&
      isMeaningfulTitleMessage(trimmed, attachmentLabel);
    const fallbackTitle = shouldGenerateTitle
      ? fallbackConversationTitle(trimmed, {
          conversationType: mode,
          attachmentName: attachmentLabel,
        })
      : "";

    setConversations((prev) => {
      const updated = prev.map((c) =>
        c.id === activeId
          ? {
              ...c,
              title: shouldGenerateTitle ? fallbackTitle : c.title,
              preview: attachment?.fileName
                ? draft.trim() || `Review: ${attachment.fileName}`
                : trimmed,
              messages: [
                ...c.messages,
                userMsg,
                // Insert the reply bubble up front so network/API errors can
                // still fill it; it stays hidden while `isThinking` is true.
                {
                  id: assistantId,
                  role: "assistant" as const,
                  content: "",
                  type: mode,
                },
              ],
            }
          : c,
      );
      return updated;
    });
    setDraft("");
    setIsThinking(true);
    setIsResponding(true);
    setThinkingStage(0);
    setShowThinking(false);
    startTypewriter(activeId, assistantId);

    if (shouldGenerateTitle) {
      requestConversationTitle({
        conversationId: activeId,
        message: trimmed,
        conversationType: mode,
        attachmentName: attachmentLabel,
        fallbackTitle,
      });
    }

    const currentConversations = conversationsRef.current;
    const activeConversation = currentConversations.find(
      (c) => c.id === activeId,
    );

    let userApiContent:
      | string
      | Array<{ type: string; text?: string; image_url?: { url: string } }>;
    if (attachment?.type === "image" && attachment.imageBase64) {
      userApiContent = [
        { type: "text", text: trimmed },
        { type: "image_url", image_url: { url: attachment.imageBase64 } },
      ];
    } else if (attachment?.type === "pdf" && attachment.text) {
      const docContext = `[Document: ${attachment.fileName}]\n\n${attachment.text}\n\n${attachment.truncated ? "(Note: Document was truncated due to length. Analysis covers the extracted portion.)\n\n" : ""}`;
      userApiContent = `${docContext}${trimmed}`;
    } else if (imageDataUrl) {
      userApiContent = [
        { type: "text", text: trimmed },
        { type: "image_url", image_url: { url: imageDataUrl } },
      ];
    } else {
      userApiContent = trimmed;
    }

    const conversationMessages = [
      ...(activeConversation?.messages ?? [])
        // The ref can briefly contain the optimistic user message or the empty
        // assistant placeholder we just added; neither belongs in the request.
        .filter(
          (m) =>
            m.id !== userMsg.id &&
            m.id !== assistantId &&
            m.content.trim().length > 0,
        )
        .map((m) => ({
          role: m.role,
          content: m.content,
        })),
      { role: "user" as const, content: userApiContent },
    ];

    let assistantContent = "";
    // One silent retry absorbs dropped streams, a transient 5xx, and a
    // serverless invocation that dies before flushing its final frame. The
    // user should never see a dead-end error for a one-off failure.
    const MAX_CHAT_ATTEMPTS = 2;
    const waitBeforeRetry = () =>
      new Promise((resolve) => setTimeout(resolve, 400));

    for (let attempt = 1; attempt <= MAX_CHAT_ATTEMPTS; attempt++) {
      try {
        if (attempt > 1) {
          // Nothing readable arrived, so reset the bubble and its reveal
          // before asking again instead of appending a second reply.
          assistantContent = "";
          startTypewriter(activeId, assistantId);
          setMessageContent(activeId, assistantId, "");
        }

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          signal: controller.signal,
          body: JSON.stringify({
            conversationType: mode,
            messages: conversationMessages,
          }),
        });

        if (!res.ok) {
          const errBody = await res.text().catch(() => "");
          let msg = "The assistant could not respond just now.";
          try {
            const parsed = JSON.parse(errBody);
            if (parsed.error) msg = parsed.error;
          } catch {
            // Never surface a raw HTML error page as the reply text.
            if (errBody && !/^\s*</.test(errBody)) msg = errBody;
          }
          // Attach the status so the retry loop can tell a transient outage
          // (5xx/429) from a request that will never succeed (4xx).
          const failure = new Error(msg) as Error & { status?: number };
          failure.status = res.status;
          throw failure;
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let sseBuffer = "";
        // The server marks a provider-wide failure as retryable instead of
        // pretending it is an answer. Retry silently rather than showing the
        // user a dead-end "technical difficulties" bubble.
        let softRetryable = false;

        const consumeLine = (line: string) => {
          if (!line.startsWith("data: ")) return;
          const data = line.slice(6).trim();
          if (data === "[DONE]" || !data) return;
          try {
            const parsed = JSON.parse(data);
            if (parsed.retryable === true) {
              softRetryable = true;
              // Don't flash a placeholder the user should never read. The
              // retry below replaces this bubble with the real answer.
              if (attempt < MAX_CHAT_ATTEMPTS) return;
            }
            // A repaired talk-to-ai table replaces the streamed one; keep
            // any still-valid prefix so only the corrected tail re-types.
            if (parsed.replace === true && typeof parsed.content === "string") {
              const replaced = parsed.content;
              const tw = typewriterRef.current;
              if (tw.messageId === assistantId) {
                const max = Math.min(tw.shownText.length, replaced.length);
                let common = 0;
                while (
                  common < max &&
                  tw.shownText[common] === replaced[common]
                ) {
                  common += 1;
                }
                tw.fullText = replaced;
                tw.shownText = replaced.slice(0, common);
                setMessageContent(activeId, assistantId, tw.shownText);
              }
              assistantContent = replaced;
              return;
            }
            const chunk: unknown =
              parsed.content ?? parsed.choices?.[0]?.delta?.content;
            if (typeof chunk === "string" && chunk) {
              assistantContent += chunk;
              // The typewriter reveals this progressively; when the server
              // streams, it naturally keeps up with the incoming chunks.
              typewriterRef.current.fullText += chunk;
            }
            if (Array.isArray(parsed.citations)) {
              const citations = parsed.citations as Citation[];
              setConversations((prev) =>
                prev.map((c) =>
                  c.id === activeId
                    ? {
                        ...c,
                        messages: c.messages.map((m) =>
                          m.id === assistantId ? { ...m, citations } : m,
                        ),
                      }
                    : c,
                ),
              );
            }
          } catch {
            // skip malformed JSON
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const split = takeSseLines(
            sseBuffer + decoder.decode(value, { stream: true }),
          );
          sseBuffer = split.rest;
          for (const line of split.lines) consumeLine(line);
        }

        // Streams can end without a trailing newline, and the decoder can
        // still hold a multi-byte character. Flush both so the final content
        // frame is never silently dropped (which used to look like an error).
        sseBuffer += decoder.decode();
        if (sseBuffer.trim()) {
          for (const line of sseBuffer.split("\n")) consumeLine(line);
        }

        // Let the reveal finish so the next send can't race this response.
        finishTypewriter();
        await waitForTypewriter();

        // A retryable server frame is a provider failure dressed as content.
        // Give the request one silent second chance before accepting it.
        if (softRetryable) {
          if (attempt < MAX_CHAT_ATTEMPTS) {
            console.warn(
              "[Chat] server reported a retryable provider failure, retrying once",
            );
            stopTypewriter();
            await waitBeforeRetry();
            continue;
          }
          stopTypewriter();
          break;
        }

        if (visibleAssistantText(assistantContent)) break;

        // The stream completed but carried no readable text. Retry once
        // before surfacing anything.
        stopTypewriter();
        if (attempt < MAX_CHAT_ATTEMPTS) {
          console.warn("[Chat] empty reply, retrying once");
          await waitBeforeRetry();
          continue;
        }
        console.error("[Chat] empty reply after retry");
        setMessageContent(
          activeId,
          assistantId,
          "I couldn't get a reply that time. Your question is saved — please send it once more.",
        );
        break;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          if (stopRequestedRef.current) {
            // User pressed Stop: keep whatever already arrived. If nothing had
            // arrived, remove the empty reply bubble so the thread stays clean
            // and the user can immediately ask the next question.
            if (visibleAssistantText(assistantContent)) {
              flushTypewriter();
            } else {
              stopTypewriter();
              removeMessage(activeId, assistantId);
            }
          } else if (visibleAssistantText(assistantContent)) {
            // Keep whatever had already arrived visible.
            flushTypewriter();
          } else {
            stopTypewriter();
            setMessageContent(
              activeId,
              assistantId,
              "The connection dropped before the reply arrived. Your question is saved — please send it once more.",
            );
          }
          break;
        }

        console.error("Chat error:", error);
        if (visibleAssistantText(assistantContent)) {
          // Keep the part of the answer that did arrive.
          flushTypewriter();
          break;
        }

        stopTypewriter();
        if (isRetryableChatFailure(error) && attempt < MAX_CHAT_ATTEMPTS) {
          console.warn("[Chat] transient failure, retrying once");
          await waitBeforeRetry();
          continue;
        }
        setMessageContent(
          activeId,
          assistantId,
          "I couldn't reach the assistant just now. Your question is saved — please send it once more.",
        );
        break;
      }
    }

    // The per-attempt try/catch owns recovery; this finally guarantees the
    // composer is re-enabled whichever branch finished the attempt.
    try {
      // no-op
    } finally {
      abortRef.current = null;
      stopRequestedRef.current = false;
      setIsThinking(false);
      setIsResponding(false);

      // Auto-save completed grill sessions
      if (mode === "grill") {
        setConversations((prev) => {
          const conv = prev.find((c) => c.id === activeId);
          if (!conv) return prev;
          const lastMsg = conv.messages[conv.messages.length - 1];
          if (!lastMsg || lastMsg.role !== "assistant") return prev;
          if (!lastMsg.content.includes("[ADVICE_COMPLETE]")) return prev;

          const summary = lastMsg.content
            .replace("[ADVICE_COMPLETE]", "")
            .trim();
          const firstUserMsg = conv.messages.find((m) => m.role === "user");
          const problem = firstUserMsg?.content ?? "Legal problem";

          // Extract state from conversation context
          const stateMatch = conv.messages
            .filter((m) => m.role === "user")
            .slice(1)
            .find((m) =>
              /bihar|gujarat|up|delhi|mumbai|karnataka|tamil|kerala|rajasthan|maharashtra|west bengal|assam|odisha|telangana|andhra|punjab|haryana|madhya|jharkhand|chhattisgarh|goa|himachal|uttarakhand|sikkim|manipur|meghalaya|nagaland|mizoram|tripura|arunachal|lucknow|patna|ahmedabad|surat|vadodara|gandhinagar/i.test(
                m.content,
              ),
            );
          const state = stateMatch
            ? stateMatch.content
                .replace(
                  /.*?(bihar|gujarat|up|delhi|mumbai|karnataka|tamil|kerala|rajasthan|maharashtra|west bengal|assam|odisha|telangana|andhra|punjab|haryana|madhya|jharkhand|chhattisgarh|goa|himachal|uttarakhand|sikkim|manipur|meghalaya|nagaland|mizoram|tripura|arunachal|lucknow|patna|ahmedabad|surat|vadodara|gandhinagar).*/i,
                  "$1",
                )
                .trim()
            : "India";

          const newCase: SavedCase = {
            id: newId("sc"),
            title:
              conv.title === "New case"
                ? fallbackConversationTitle(problem, {
                    conversationType: "grill",
                  })
                : conv.title,
            summary,
            problem,
            state,
            date: Date.now(),
            conversationId: conv.id,
          };

          // Clean the marker from the stored message
          const cleanedConv = {
            ...conv,
            messages: conv.messages.map((m) =>
              m.id === lastMsg.id ? { ...m, content: summary } : m,
            ),
          };
          setConversations((prev) =>
            prev.map((c) => (c.id === activeId ? cleanedConv : c)),
          );

          setSavedCases((prev) => {
            const updated = [
              newCase,
              ...prev.filter((sc) => sc.conversationId !== conv.id),
            ];
            saveSavedCases(updated);
            return updated;
          });

          return prev;
        });
      }
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isResponding) return;
    if (pendingAttachment && !draft.trim()) {
      const defaultPrompt =
        pendingAttachment.type === "image"
          ? "Please review this image for any text, legal clauses, or important information. Analyze the content and provide a clause-by-clause breakdown with risk ratings where applicable."
          : "Please review this document for risky clauses, unfair terms, and legal consequences. Provide a clause-by-clause analysis with risk ratings.";
      sendMessage(defaultPrompt, undefined, undefined, pendingAttachment);
    } else {
      sendMessage(draft, undefined, undefined, pendingAttachment ?? undefined);
    }
    setPendingAttachment(null);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (isResponding) return;
      if (pendingAttachment && !draft.trim()) {
        const defaultPrompt =
          pendingAttachment.type === "image"
            ? "Please review this image for any text, legal clauses, or important information. Analyze the content and provide a clause-by-clause breakdown with risk ratings where applicable."
            : "Please review this document for risky clauses, unfair terms, and legal consequences. Provide a clause-by-clause analysis with risk ratings.";
        sendMessage(defaultPrompt, undefined, undefined, pendingAttachment);
      } else {
        sendMessage(
          draft,
          undefined,
          undefined,
          pendingAttachment ?? undefined,
        );
      }
      setPendingAttachment(null);
    }
  }

  function stopResponse() {
    if (!abortRef.current) return;
    stopRequestedRef.current = true;
    abortRef.current.abort();
    // Keep the text that has already arrived and freeze it where it is.
    flushTypewriter();
    setIsThinking(false);
  }

  async function handleSignOut() {
    clearDisclaimerAcceptance();
    await signOut();
    router.replace("/signin");
    router.refresh();
  }

  function syncDeleteServer(ids: string[]) {
    if (ids.length === 0) return;
    fetch("/api/conversations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ids }),
    }).catch(() => {});
  }

  // Clear All History must wipe the whole account's chat history even if the
  // local list is stale. The server deletes every non-shared, unpinned
  // conversation for this user instead of trusting the ids this tab has loaded.
  function syncClearAllServer() {
    // Wipe the server-side history too: case folders first (so pinned
    // conversations are detached from them), then the unpinned conversations.
    void (async () => {
      await fetch("/api/cases", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ all: true }),
      }).catch(() => {});
      await fetch("/api/conversations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ all: true }),
      }).catch(() => {});
    })();
  }

  // AI Lawyer cases are kept in localStorage and point at a grill
  // conversation. Whenever those conversations disappear, drop the matching
  // cases too so they cannot be restored from the AI Lawyer section.
  function pruneSavedCases(conversationIds: string[]) {
    if (conversationIds.length === 0) return;
    const removed = new Set(conversationIds);
    setSavedCases((prev) => {
      const updated = prev.filter((c) => !removed.has(c.conversationId));
      if (updated.length === prev.length) return prev;
      saveSavedCases(updated);
      return updated;
    });
  }

  function deleteConversation(id: string) {
    setConversations((prev) => {
      const deleted = prev.find((c) => c.id === id);
      const next = prev.filter((c) => c.id !== id);
      if (activeId === id) {
        const sameType = next.filter((c) => c.type === deleted?.type);
        const fallback = sameType[0] ?? next[0];
        setActiveId(fallback?.id ?? "");
      }
      return next;
    });
    syncDeleteServer([id]);
    pruneSavedCases([id]);
  }

  function togglePin(id: string) {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c)),
    );
  }

  function startRename(id: string, currentTitle: string) {
    setEditingId(id);
    setEditingTitle(currentTitle);
  }

  function commitRename(id: string) {
    const trimmed = editingTitle.trim();
    if (trimmed) {
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: trimmed } : c)),
      );
    }
    setEditingId(null);
    setEditingTitle("");
  }

  function cancelRename() {
    setEditingId(null);
    setEditingTitle("");
  }

  function clearHistory(section?: ConversationType) {
    if (section === undefined) {
      const types: ConversationType[] = [
        "talk-to-ai",
        "analysis",
        "grill",
        "draft",
        "review",
      ];
      const freshConversations: Conversation[] = types.map((type) => ({
        id: newId(
          type === "analysis"
            ? "a"
            : type === "talk-to-ai"
              ? "t"
              : type === "grill"
                ? "g"
                : type === "review"
                  ? "r"
                  : "d",
        ),
        title: "New conversation",
        preview: "Just started",
        type,
        createdAt: Date.now(),
        messages: [],
      }));
      // Pinned conversations survive "Clear All History". Detach them from
      // folders because every folder is deleted below.
      const pinnedConversations = conversations
        .filter((c) => c.pinned)
        .map((c) => ({ ...c, folderId: null }));

      setConversations([...pinnedConversations, ...freshConversations]);
      setActiveId(freshConversations[0].id);
      setMode("talk-to-ai");
      setContextMenuId(null);
      titleRequestedRef.current.clear();

      // Case folders live outside the conversation list, so "Clear All
      // History" has to wipe them explicitly.
      setCaseFolders([]);
      setCaseFoldersOpen(false);
      setNewFolderName("");

      // AI Lawyer saved cases live in localStorage, not in the conversation
      // list, so "Clear All History" has to wipe them explicitly. Notification
      // dismissals are local history too.
      setSavedCases([]);
      saveSavedCases([]);
      setDismissedNotifications([]);
      setUpcomingReminders([]);
      try {
        window.localStorage.removeItem(STORAGE_KEY);
        window.localStorage.removeItem(CONVERSATIONS_KEY);
        window.localStorage.removeItem("lawbite-dismissed-notifications");
      } catch {}

      syncClearAllServer();
      return;
    }
    const clearType = section ?? active?.type ?? "talk-to-ai";
    // Pinned conversations are protected from bulk clears. They only go away
    // when the user unpins them first or deletes them individually.
    const removedIds = conversations
      .filter(
        (c) =>
          !c.pinned &&
          (c.type === clearType ||
            (clearType === "talk-to-ai" && c.type === "chat")),
      )
      .map((c) => c.id);
    const prefix =
      clearType === "analysis"
        ? "a"
        : clearType === "talk-to-ai"
          ? "t"
          : clearType === "grill"
            ? "g"
            : clearType === "review"
              ? "r"
              : clearType === "draft"
                ? "d"
                : "c";
    const fresh: Conversation = {
      id: newId(prefix),
      title: "New conversation",
      preview: "Just started",
      type: clearType === "chat" ? "talk-to-ai" : clearType,
      createdAt: Date.now(),
      messages: [],
    };
    setConversations((prev) => [
      fresh,
      ...prev.filter(
        (c) =>
          c.pinned ||
          (c.type !== clearType &&
            !(clearType === "talk-to-ai" && c.type === "chat")),
      ),
    ]);
    setActiveId(fresh.id);
    setContextMenuId(null);
    syncDeleteServer(removedIds);
    pruneSavedCases(removedIds);
  }

  async function createShareLink(
    conv: Conversation,
    messageId?: string,
  ): Promise<string | null> {
    try {
      // The normal history sync is debounced. Save this conversation first so
      // sharing a brand-new chat cannot race the sync and 404.
      const saved = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ conversations: [conv] }),
      });
      if (!saved.ok) return null;

      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          conversationId: conv.id,
          ...(messageId ? { messageId } : {}),
        }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (typeof data?.url === "string" && data.url) {
        return data.url.startsWith("http")
          ? data.url
          : `${window.location.origin}${data.url}`;
      }
      if (typeof data?.shareId === "string" && data.shareId) {
        return `${window.location.origin}/shared/${data.shareId}`;
      }
      return null;
    } catch {
      return null;
    }
  }

  async function shareConversation(
    conv: Conversation,
    platform?: string,
    messageId?: string,
  ) {
    if (isResponding) {
      alert("Please wait for the response to finish before sharing.");
      return;
    }

    const shareUrl = await createShareLink(conv, messageId);
    if (!shareUrl) {
      alert(
        messageId
          ? "Failed to generate a share link for this message."
          : "Failed to generate share link.",
      );
      return;
    }

    const shareText = messageId
      ? `Check out this message on Lawbite: ${conv.title}`
      : `Check out this conversation on Lawbite: ${conv.title}`;

    if (platform === "more") {
      if (typeof navigator !== "undefined" && navigator.share) {
        try {
          await navigator.share({
            title: conv.title,
            text: shareText,
            url: shareUrl,
          });
          return;
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") return;
        }
      }
      const copied = await copyToClipboard(shareUrl);
      alert(
        copied ? "Share link copied to clipboard!" : `Share link: ${shareUrl}`,
      );
      return;
    }

    if (platform === "copy") {
      const copied = await copyToClipboard(shareUrl);
      alert(
        copied ? "Share link copied to clipboard!" : `Share link: ${shareUrl}`,
      );
      return;
    }

    const shareUrls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`,
      email: `mailto:?subject=${encodeURIComponent(conv.title)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`,
    };

    if (shareUrls[platform ?? ""]) {
      window.open(shareUrls[platform ?? ""], "_blank", "noopener,noreferrer");
    }
  }

  async function createCaseFolder() {
    const name = newFolderName.trim();
    if (!name) return;
    try {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const folder = await res.json();
        setCaseFolders((prev) => [folder, ...prev]);
        setNewFolderName("");
        setCaseFoldersOpen(true);
      }
    } catch {
      /* ignore */
    }
  }

  async function deleteCaseFolder(id: string) {
    try {
      await fetch("/api/cases", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id }),
      });
      setCaseFolders((prev) => prev.filter((f) => f.id !== id));
      setConversations((prev) =>
        prev.map((c) => (c.folderId === id ? { ...c, folderId: null } : c)),
      );
    } catch {
      /* ignore */
    }
  }

  function assignToFolder(convId: string, folderId: string | null) {
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, folderId } : c)),
    );
    setContextMenuId(null);
    fetch("/api/cases", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        id: folderId ?? "",
        assignConversationId: convId,
        clear: folderId === null,
      }),
    }).catch(() => {});
  }

  function groupConversations(type: ConversationType, now: number) {
    const DAY = 1000 * 60 * 60 * 24;

    const started = conversations.filter(
      (c) => Array.isArray(c.messages) && c.messages.length > 0,
    );
    const filtered =
      type === "talk-to-ai"
        ? started.filter((c) => c.type === "talk-to-ai" || c.type === "chat")
        : started.filter((c) => c.type === type);
    const pinned = filtered.filter((c) => c.pinned);
    const unpinned = filtered.filter((c) => !c.pinned);

    const groups: { label: string; items: Conversation[] }[] = [];

    const today: Conversation[] = [];
    const previous7: Conversation[] = [];
    const previous30: Conversation[] = [];
    const older: Conversation[] = [];

    for (const c of unpinned) {
      const age = now - (c.createdAt ?? 0);
      if (age < DAY) today.push(c);
      else if (age < DAY * 7) previous7.push(c);
      else if (age < DAY * 30) previous30.push(c);
      else older.push(c);
    }

    if (pinned.length > 0) groups.push({ label: "Pinned", items: pinned });
    if (today.length > 0) groups.push({ label: "Today", items: today });
    if (previous7.length > 0)
      groups.push({ label: "Previous 7 Days", items: previous7 });
    if (previous30.length > 0)
      groups.push({ label: "Previous 30 Days", items: previous30 });
    if (older.length > 0) groups.push({ label: "Older", items: older });

    return groups;
  }

  function renderConvItem(conv: Conversation) {
    const isActive = conv.id === activeId;
    const isEditing = editingId === conv.id;
    const menuOpen = contextMenuId === conv.id;
    const isAnalysis = conv.type === "analysis";
    const isTalkToAI = conv.type === "talk-to-ai";
    const isGrill = conv.type === "grill";
    const isDraft = conv.type === "draft";
    const isReview = conv.type === "review";

    if (isEditing) {
      return (
        <div className="flex items-center gap-1 rounded-lg bg-white/[0.06] px-2 py-1.5">
          <input
            autoFocus
            value={editingTitle}
            onChange={(e) => setEditingTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename(conv.id);
              if (e.key === "Escape") cancelRename();
            }}
            onBlur={() => commitRename(conv.id)}
            className="min-w-0 flex-1 bg-transparent text-[13px] text-white outline-none"
          />
        </div>
      );
    }

    return (
      <div
        className={`flex items-center gap-1 rounded-lg px-3 py-2 text-left transition-colors duration-150 ${
          isActive
            ? "bg-white/[0.08] text-white"
            : "text-white/60 hover:bg-white/[0.04] hover:text-white"
        }`}
      >
        <button
          type="button"
          onClick={() => selectConversation(conv.id)}
          aria-current={isActive ? "true" : undefined}
          className="flex min-w-0 flex-1 items-center gap-2"
        >
          {isAnalysis ? (
            <svg
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5 shrink-0 text-white/30"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
              <path d="M11 8v6M8 11h6" />
            </svg>
          ) : isTalkToAI ? (
            <svg
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5 shrink-0 text-white/30"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
              <path d="M16 14h.01M8 14h.01M12 17v4M8 21h8" />
            </svg>
          ) : isGrill ? (
            <svg
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5 shrink-0 text-amber-400/70"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
              <path d="M11 8v6M8 11h6" />
              <path d="M9 2L7 5l2 3M15 2l2 3-2 3" />
            </svg>
          ) : isDraft ? (
            <svg
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5 shrink-0 text-blue-400/70"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          ) : isReview ? (
            <svg
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5 shrink-0 text-emerald-400/70"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <path d="M12 18v-6" />
              <path d="M9 15h6" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5 shrink-0 text-white/30"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          )}
          <div className="min-w-0 flex-1">
            <span className="line-clamp-1 block text-[13px]">{conv.title}</span>
            <span className="block text-[10px] text-white/25">
              {conv.type === "analysis"
                ? "Deep Analysis"
                : conv.type === "talk-to-ai"
                  ? "Talk to AI"
                  : conv.type === "grill"
                    ? "Case Intake"
                    : conv.type === "draft"
                      ? "Document Drafter"
                      : conv.type === "review"
                        ? "Document Reviewer"
                        : "Chat"}
            </span>
          </div>
        </button>

        {(hoveredId === conv.id || isActive || menuOpen) && (
          <div
            ref={menuOpen ? contextMenuRef : undefined}
            className="relative shrink-0"
          >
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                setContextMenuId(menuOpen ? null : conv.id);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter")
                  setContextMenuId(menuOpen ? null : conv.id);
              }}
              className="rounded p-1 text-white/40 transition-colors hover:text-white cursor-pointer"
              aria-label="More options"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="5" cy="12" r="1" />
                <circle cx="12" cy="12" r="1" />
                <circle cx="19" cy="12" r="1" />
              </svg>
            </span>

            {menuOpen && (
              <div className="animate-dropdown-in absolute right-0 top-full z-50 mt-1 w-56 overflow-hidden rounded-xl border border-white/10 bg-[#141414] shadow-2xl">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    startRename(conv.id, conv.title);
                    setContextMenuId(null);
                  }}
                  className="flex w-full items-center gap-3 px-3.5 py-2.5 text-[13px] text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Rename
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePin(conv.id);
                    setContextMenuId(null);
                  }}
                  className="flex w-full items-center gap-3 px-3.5 py-2.5 text-[13px] text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5 shrink-0"
                    fill={conv.pinned ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2L8.5 8.5 2 9.3l4.7 4.5L5.5 21 12 17.5 18.5 21l-1.2-7.2L22 9.3l-6.5-.8z" />
                  </svg>
                  {conv.pinned ? "Unpin" : "Pin"}
                </button>
                <div className="my-1 border-t border-white/[0.06]" />
                <div className="px-3.5 py-2">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-white/30">
                    Case Folder
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    assignToFolder(conv.id, null);
                  }}
                  className={`flex w-full items-center gap-3 px-3.5 py-2 text-[13px] transition-colors hover:bg-white/[0.06] ${!conv.folderId ? "text-white" : "text-white/70 hover:text-white"}`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <path d="M3 9h18" />
                  </svg>
                  No folder
                  {!conv.folderId && (
                    <span className="ml-auto text-white/60">✓</span>
                  )}
                </button>
                {caseFolders.length > 0 && (
                  <div className="max-h-40 overflow-y-auto py-1">
                    {caseFolders.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          assignToFolder(conv.id, f.id);
                        }}
                        className={`flex w-full items-center gap-3 px-3.5 py-2 text-[13px] transition-colors hover:bg-white/[0.06] ${conv.folderId === f.id ? "text-white" : "text-white/70 hover:text-white"}`}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="h-3.5 w-3.5 shrink-0 text-amber-400/70"
                          fill="currentColor"
                        >
                          <path d="M3 6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v2H3z" />
                          <path d="M3 10h18l-1.5 9a2 2 0 0 1-2 1.7H6.5a2 2 0 0 1-2-1.7z" />
                        </svg>
                        <span className="truncate">{f.name}</span>
                        {conv.folderId === f.id && (
                          <span className="ml-auto text-white/60">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                <div className="my-1 border-t border-white/[0.06]" />
                <div className="px-3.5 py-2">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-white/30">
                    Share
                  </p>
                </div>
                <div className="flex items-center gap-1 px-3 pb-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      shareConversation(conv, "twitter");
                      setContextMenuId(null);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/[0.08] hover:text-[#E7E7E7]"
                    aria-label="Share on X"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-3.5 w-3.5"
                      fill="currentColor"
                    >
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      shareConversation(conv, "facebook");
                      setContextMenuId(null);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/[0.08] hover:text-[#1877F2]"
                    aria-label="Share on Facebook"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-3.5 w-3.5"
                      fill="currentColor"
                    >
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      shareConversation(conv, "linkedin");
                      setContextMenuId(null);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/[0.08] hover:text-[#0A66C2]"
                    aria-label="Share on LinkedIn"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-3.5 w-3.5"
                      fill="currentColor"
                    >
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      shareConversation(conv, "whatsapp");
                      setContextMenuId(null);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/[0.08] hover:text-[#25D366]"
                    aria-label="Share on WhatsApp"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-3.5 w-3.5"
                      fill="currentColor"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      shareConversation(conv, "email");
                      setContextMenuId(null);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/[0.08] hover:text-[#EA4335]"
                    aria-label="Share via Email"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      setContextMenuId(null);
                      await shareConversation(conv, "copy");
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/[0.08] hover:text-white"
                    aria-label="Copy link"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    shareConversation(conv, "more");
                    setContextMenuId(null);
                  }}
                  className="flex w-full items-center gap-3 border-t border-white/[0.06] px-3.5 py-2.5 text-[13px] text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  More…
                </button>
                <div className="my-1 border-t border-white/[0.06]" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmAction({
                      type: "deleteConversation",
                      id: conv.id,
                    });
                    setContextMenuId(null);
                  }}
                  className="flex w-full items-center gap-3 px-3.5 py-2.5 text-[13px] text-red-400 transition-colors hover:bg-red-500/10"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  function getNotificationThreshold(days: number): number {
    if (days <= 1) return 1;
    if (days <= 3) return 3;
    return 7;
  }

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/reminders", { credentials: "include" });
        if (res.ok) {
          const reminders = await res.json();
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          const upcoming = reminders
            .filter((r: { completed: boolean; deadlineAt: string }) => {
              if (r.completed) return false;
              const deadline = new Date(r.deadlineAt);
              deadline.setHours(0, 0, 0, 0);
              const days = Math.round(
                (deadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
              );
              return days >= 0 && days <= 7;
            })
            .map(
              (r: {
                id: string;
                title: string;
                deadlineAt: string;
                type: string;
              }) => {
                const deadline = new Date(r.deadlineAt);
                deadline.setHours(0, 0, 0, 0);
                const days = Math.round(
                  (deadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
                );
                return { ...r, daysLeft: days };
              },
            )
            .filter((r: { id: string; daysLeft: number }) => {
              const threshold = getNotificationThreshold(r.daysLeft);
              return !dismissedNotifications.some(
                (d) => d.id === r.id && d.threshold === threshold,
              );
            })
            .sort(
              (a: { daysLeft: number }, b: { daysLeft: number }) =>
                a.daysLeft - b.daysLeft,
            );
          setUpcomingReminders(upcoming);
          if (upcoming.length > 0) {
            setBellShake(true);
            setTimeout(() => setBellShake(false), 3000);
          }
        }
      } catch {
        /* ignore */
      }
    })();
  }, [dismissedNotifications]);

  useEffect(() => {
    if (!notificationsOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notificationsOpen]);

  function clearAllNotifications() {
    const newDismissed = upcomingReminders.map((r) => ({
      id: r.id,
      threshold: getNotificationThreshold(r.daysLeft),
    }));
    const updated = [...dismissedNotifications, ...newDismissed];
    setDismissedNotifications(updated);
    localStorage.setItem(
      "lawbite-dismissed-notifications",
      JSON.stringify(updated),
    );
    setUpcomingReminders([]);
    setShowClearNotifications(false);
    setNotificationsOpen(false);
  }

  const [now, setNow] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setNow(Date.now()), 0);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    return () => {
      if (sidebarCloseTimer.current) clearTimeout(sidebarCloseTimer.current);
    };
  }, []);

  /**
   * The sidebar is a hover drawer. Moving the pointer off it closes it after a
   * short grace period, so crossing a child element or the edge strip does not
   * make it flicker. Touch devices keep the drawer open until the backdrop or
   * the close button is used.
   */
  function cancelSidebarClose() {
    if (sidebarCloseTimer.current) {
      clearTimeout(sidebarCloseTimer.current);
      sidebarCloseTimer.current = null;
    }
  }

  function scheduleSidebarClose(delay = 160) {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      return;
    }
    cancelSidebarClose();
    sidebarCloseTimer.current = setTimeout(() => {
      setSidebarOpen(false);
      sidebarCloseTimer.current = null;
    }, delay);
  }

  // While a reply is streaming, the send button becomes a stop button so the
  // user can interrupt it (like ChatGPT). Clicking it aborts the request and
  // keeps any text that has already arrived.
  function renderSendOrStop() {
    if (isResponding) {
      return (
        <button
          type="button"
          onClick={stopResponse}
          aria-label="Stop generating"
          title="Stop generating"
          className="group relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-black transition-transform duration-200 hover:scale-[1.05]"
        >
          <span className="block h-3 w-3 rounded-[2px] bg-black" />
        </button>
      );
    }
    return (
      <button
        type="submit"
        disabled={(!draft.trim() && !pendingAttachment) || isResponding}
        aria-label="Send message"
        className="btn-shine group relative inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-black transition-transform duration-300 hover:scale-[1.05] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
      >
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14M13 5l7 7-7 7" />
        </svg>
      </button>
    );
  }

  return (
    <div
      className="relative flex h-screen w-full overflow-hidden bg-black text-white"
      onMouseMove={(event) => {
        // Hovering the left edge reveals the drawer. A short grace close keeps
        // it from staying open if the pointer never reaches the panel (for
        // example when a modal is covering it). The top strip is left to the
        // hamburger button so the two entry points do not fight each other.
        if (sidebarOpen || event.clientX > 16 || event.clientY < 72) return;
        if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
          return;
        }
        cancelSidebarClose();
        setSidebarOpen(true);
        scheduleSidebarClose(1200);
      }}
    >
      <div
        aria-hidden
        className={`fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        id="chat-sidebar"
        aria-hidden={!sidebarOpen}
        inert={!sidebarOpen}
        onMouseEnter={cancelSidebarClose}
        onMouseLeave={() => scheduleSidebarClose()}
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/10 bg-black shadow-2xl transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <Link
            href="/"
            aria-label="Lawbite home"
            className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight"
          >
            <LogoIcon className="h-6 w-6" />
            <span>Lawbite</span>
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-full p-1.5 text-white/60 transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Close sidebar"
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-4 pt-4 space-y-2">
          <button
            type="button"
            onClick={() => {
              setSidebarOpen(false);
              startNewChat();
            }}
            className="group flex w-full items-center gap-2 rounded-full border border-white/15 bg-white px-4 py-2 text-sm font-medium text-black transition-transform duration-300 hover:scale-[1.01]"
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>New chat</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSidebarOpen(false);
              setMyCasesOpen(true);
            }}
            className="flex w-full items-center gap-2 rounded-full border border-white/15 bg-white px-4 py-2 text-sm font-medium text-black transition-transform duration-300 hover:scale-[1.01]"
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            <span>AI Lawyer</span>
          </button>
        </div>

        <div className="mx-4 my-3 border-t border-white/10" />

        <div className="px-4 space-y-1">
          <button
            type="button"
            onClick={() => {
              setSidebarOpen(false);
              setHistoryOpen(true);
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium tracking-wide text-white/50 transition-all duration-200 hover:bg-white/[0.06] hover:text-white/80"
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="h-4 w-4 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>History</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSidebarOpen(false);
              setCalculatorOpen(true);
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium tracking-wide text-white/50 transition-all duration-200 hover:bg-white/[0.06] hover:text-white/80"
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="h-4 w-4 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="4" y="2" width="16" height="20" rx="2" />
              <line x1="8" y1="6" x2="16" y2="6" />
              <line x1="8" y1="10" x2="10" y2="10" />
              <line x1="14" y1="10" x2="16" y2="10" />
              <line x1="8" y1="14" x2="10" y2="14" />
              <line x1="14" y1="14" x2="16" y2="14" />
              <line x1="8" y1="18" x2="16" y2="18" />
            </svg>
            <span>Calculators</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSidebarOpen(false);
              setRemindersOpen(true);
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium tracking-wide text-white/50 transition-all duration-200 hover:bg-white/[0.06] hover:text-white/80"
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="h-4 w-4 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>Reminders</span>
          </button>
        </div>

        <div className="mt-auto border-t border-white/10 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              {user.image ? (
                <Image
                  src={user.image}
                  alt=""
                  width={28}
                  height={28}
                  unoptimized
                  className="h-7 w-7 shrink-0 rounded-full border border-white/15 object-cover"
                />
              ) : (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-xs text-white/60">
                  {(user.name || user.email || "U").charAt(0).toUpperCase()}
                </div>
              )}
              <span className="truncate text-xs text-white/50">
                {user.name || user.email}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setSidebarOpen(false);
                  setSettingsOpen(true);
                }}
                className="shrink-0 rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
                aria-label="Settings"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSidebarOpen(false);
                  handleSignOut();
                }}
                className="shrink-0 rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
                aria-label="Sign out"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main
        className={`flex min-w-0 flex-1 flex-col ${mode === "analysis" || mode === "talk-to-ai" || mode === "grill" ? "bg-black/80" : ""}`}
      >
        <header
          className={`flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-8 ${mode === "analysis" || mode === "talk-to-ai" || mode === "grill" ? "bg-black/50" : ""}`}
        >
          <div className="flex min-w-0 items-center gap-3">
            {mode === "grill" && (
              <button
                type="button"
                onClick={() => switchMode("talk-to-ai")}
                className="rounded-full p-2 text-white/70 transition-colors hover:bg-white/5 hover:text-white"
                aria-label="Back to chat"
              >
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                cancelSidebarClose();
                setSidebarOpen(true);
              }}
              className="rounded-full p-2 text-white/70 transition-colors hover:bg-white/5 hover:text-white"
              aria-label="Open sidebar"
              aria-expanded={sidebarOpen}
              aria-controls="chat-sidebar"
            >
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold tracking-tight sm:text-base">
                {active?.title ?? "New conversation"}
              </h1>
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">
                {mode === "analysis"
                  ? "Deep Analysis"
                  : mode === "talk-to-ai" || mode === "chat"
                    ? "Talk to AI"
                    : mode === "grill"
                      ? "AI Lawyer"
                      : mode === "draft"
                        ? "Document Drafter"
                        : mode === "review"
                          ? "Document Reviewer"
                          : "Talk to AI"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative" ref={notificationRef}>
              {(() => {
                const minDays =
                  upcomingReminders.length > 0
                    ? Math.min(...upcomingReminders.map((r) => r.daysLeft))
                    : -1;
                const bellGlow =
                  minDays <= 1
                    ? "animate-bell-glow-red"
                    : minDays <= 3
                      ? "animate-bell-glow-amber"
                      : minDays <= 7
                        ? "animate-bell-glow-green"
                        : "";
                const bellColor =
                  minDays <= 1
                    ? "text-red-400"
                    : minDays <= 3
                      ? "text-amber-400"
                      : minDays <= 7
                        ? "text-emerald-400"
                        : "text-white/60";
                const badgeBg =
                  minDays <= 1
                    ? "bg-red-500"
                    : minDays <= 3
                      ? "bg-amber-500"
                      : "bg-emerald-500";
                return (
                  <button
                    type="button"
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    className={`relative rounded-full p-2 transition-colors hover:bg-white/5 hover:text-white ${bellGlow} ${bellShake ? "animate-bell-shake" : ""} ${upcomingReminders.length > 0 ? bellColor : "text-white/60"}`}
                    aria-label="Notifications"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    {upcomingReminders.length > 0 && (
                      <span
                        className={`absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full ${badgeBg} text-[9px] font-bold text-white`}
                      >
                        {upcomingReminders.length}
                      </span>
                    )}
                  </button>
                );
              })()}
              {notificationsOpen && (
                <div className="animate-dropdown-in absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-white/10 bg-[#141414] shadow-2xl">
                  <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
                    <p className="text-xs font-medium text-white/70">
                      Upcoming Deadlines
                    </p>
                    <button
                      type="button"
                      onClick={() => setNotificationsOpen(false)}
                      className="flex h-6 w-6 items-center justify-center rounded-md border border-transparent text-white/40 transition-all duration-200 hover:border-white/10 hover:bg-white/5 hover:text-white/70"
                      aria-label="Close"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-3 w-3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  {upcomingReminders.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                      <p className="text-xs text-white/35">
                        No upcoming deadlines
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-72 overflow-y-auto">
                      {upcomingReminders.map((r) => (
                        <div
                          key={r.id}
                          className={`flex items-center gap-3 border-b border-white/[0.04] px-4 py-3 transition-colors hover:bg-white/[0.03] ${
                            r.daysLeft <= 1
                              ? "bg-red-500/[0.06]"
                              : r.daysLeft <= 3
                                ? "bg-amber-500/[0.04]"
                                : ""
                          }`}
                        >
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                              r.daysLeft <= 1
                                ? "bg-red-500/20 text-red-400"
                                : r.daysLeft <= 3
                                  ? "bg-amber-500/20 text-amber-400"
                                  : "bg-emerald-500/20 text-emerald-400"
                            }`}
                          >
                            {r.daysLeft}d
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium text-white/80">
                              {r.title}
                            </p>
                            <p className="mt-0.5 text-[10px] text-white/35">
                              {r.daysLeft === 0
                                ? "Due today"
                                : r.daysLeft === 1
                                  ? "Tomorrow"
                                  : `${r.daysLeft} days left`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center border-t border-white/[0.06]">
                    <button
                      type="button"
                      onClick={() => {
                        setNotificationsOpen(false);
                        setRemindersOpen(true);
                      }}
                      className="flex-1 px-4 py-2.5 text-center text-[11px] text-white/40 transition-colors hover:bg-white/[0.04] hover:text-white/60"
                    >
                      View all reminders
                    </button>
                    {upcomingReminders.length > 0 && (
                      <>
                        <div className="h-5 w-px bg-white/[0.06]" />
                        <button
                          type="button"
                          onClick={() => setShowClearNotifications(true)}
                          className="px-4 py-2.5 text-[11px] text-white/40 transition-colors hover:bg-red-500/10 hover:text-red-400"
                          title="Clear all notifications"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className="h-3.5 w-3.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div
          ref={chatScrollRef}
          className="min-h-0 flex-1 overflow-y-auto px-5 py-8 sm:px-8"
        >
          {active && active.messages.length > 0 ? (
            <ul className="mx-auto flex max-w-3xl flex-col gap-6">
              {active.messages.map((message) => {
                const isGrillAssistant =
                  message.role === "assistant" &&
                  (message.type ?? active?.type) === "grill";
                const hasAdviceComplete =
                  message.content.includes("[ADVICE_COMPLETE]");
                const hasDelimiter = message.content.includes("---");

                if (
                  isThinking &&
                  message.role === "assistant" &&
                  !visibleAssistantText(message.content)
                ) {
                  // The reply is still streaming (the model may spend a long
                  // time reasoning before the first visible token arrives).
                  // Show the "Thinking…" indicator instead of an empty bubble.
                  return null;
                }

                if (isGrillAssistant && !hasAdviceComplete) {
                  const cleaned = stripThinkingTokens(
                    message.content.replace(/\[ADVICE_COMPLETE\]/g, "").trim(),
                  );
                  let response = "";
                  let question = "";

                  if (hasDelimiter) {
                    const parts = cleaned.split(/\n---\n/);
                    response = parts[0]?.trim() ?? "";
                    question = parts.slice(1).join("\n---\n").trim();
                  } else {
                    const paragraphs = cleaned.split(/\n\n+/);
                    const lastIdx = paragraphs.length - 1;
                    const lastPara = paragraphs[lastIdx]?.trim() ?? "";
                    if (paragraphs.length > 1 && /\?\s*$/.test(lastPara)) {
                      response = paragraphs
                        .slice(0, lastIdx)
                        .join("\n\n")
                        .trim();
                      question = lastPara;
                    }
                  }

                  if (response || question) {
                    return (
                      <Fragment key={message.id}>
                        {response && (
                          <li className="animate-message-in flex justify-start">
                            <div className="max-w-[85%] rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-relaxed text-white/70 sm:text-[15px]">
                              <div className="whitespace-pre-wrap leading-relaxed">
                                {response.split(/\n\n+/).map((para, i) => (
                                  <p key={i} className={i > 0 ? "mt-2" : ""}>
                                    {renderBold(para)}
                                  </p>
                                ))}
                              </div>
                            </div>
                          </li>
                        )}
                        {question && (
                          <li className="animate-message-in flex justify-start">
                            <div className="max-w-[85%] rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3 text-sm leading-relaxed sm:text-[15px]">
                              <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-400/70">
                                <svg
                                  viewBox="0 0 24 24"
                                  className="h-3 w-3"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z" />
                                  <path d="M10 21h4M9 17h6" />
                                </svg>
                                Next Question
                              </div>
                              <div className="whitespace-pre-wrap leading-relaxed text-white/90">
                                {question.split(/\n\n+/).map((para, i) => (
                                  <p key={i} className={i > 0 ? "mt-2" : ""}>
                                    {renderBold(para)}
                                  </p>
                                ))}
                              </div>
                            </div>
                          </li>
                        )}
                      </Fragment>
                    );
                  }
                }
                return (
                  <li
                    key={message.id}
                    className={`animate-message-in group flex flex-col ${
                      message.role === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:text-[15px] ${
                        message.role === "user"
                          ? "bg-white text-black"
                          : "border border-white/10 bg-white/[0.03] text-white/85"
                      }`}
                    >
                      {message.role === "user" && message.documentName ? (
                        <div className="flex items-center gap-2">
                          <svg
                            viewBox="0 0 24 24"
                            className="h-5 w-5 shrink-0 text-black/60"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                          <span className="text-sm font-medium">
                            {message.documentName}
                          </span>
                        </div>
                      ) : message.role === "user" ? (
                        <div className="whitespace-pre-wrap leading-relaxed">
                          {typeof message.content === "string"
                            ? message.content.split(/\n\n+/).map((para, i) => (
                                <p key={i} className={i > 0 ? "mt-3" : ""}>
                                  {renderBold(para)}
                                </p>
                              ))
                            : JSON.stringify(message.content)}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {(() => {
                            const msgType = message.type ?? active?.type;
                            const cleaned = stripThinkingTokens(
                              message.content,
                            ).replace(/\[ADVICE_COMPLETE\]/g, "");
                            if (msgType === "draft" && cleaned.trim()) {
                              return (
                                <div className="w-full overflow-x-auto">
                                  <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-white/90">
                                    {cleaned.split(/\n{2,}/).map((para, i) => {
                                      const trimmed = para.trim();
                                      const isHeading =
                                        /^(LEGAL NOTICE|NOTICE|FIRST INFORMATION REPORT|FIR DRAFT|CONSUMER COMPLAINT|RTI APPLICATION|WILL|AFFIDAVIT|PETITION|CONTRACT|AGREEMENT)\b/i.test(
                                          trimmed,
                                        );
                                      const isSignature =
                                        /^(Yours faithfully|Yours sincerely|Thanking you)/i.test(
                                          trimmed,
                                        );
                                      const isLabel =
                                        /^(Date|From|To|Subject|Sir\/Madam):/i.test(
                                          trimmed,
                                        );
                                      return (
                                        <p
                                          key={i}
                                          className={`${i > 0 ? "mt-4" : ""} ${isHeading ? "text-center text-base font-bold tracking-wide text-white" : ""} ${isSignature ? "mt-8" : ""} ${isLabel ? "font-semibold text-white/80" : ""}`}
                                        >
                                          {trimmed}
                                        </p>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            }
                            const blocks = parseContent(cleaned);
                            if (!cleaned.trim() || blocks.length === 0) {
                              return (
                                <p className="text-sm italic text-white/50">
                                  No content was generated. This may happen if
                                  the AI service is temporarily unavailable.
                                  Please try again.
                                </p>
                              );
                            }
                            return renderContentBlocks(blocks);
                          })()}
                          {visibleCitations(message.citations).length > 0 && (
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-white/35">
                                  Sources
                                </span>
                                {visibleCitations(message.citations)
                                  .slice(0, 2)
                                  .map((cit, i) => (
                                  <div
                                    key={i}
                                    className="inline-flex max-w-full items-center gap-1 rounded-full border border-white/15 bg-white/[0.05] py-1 pl-2.5 pr-1 text-[11px] font-medium text-white/75 transition-colors hover:border-white/30 hover:text-white"
                                  >
                                    <button
                                      type="button"
                                      onClick={() => setCitationOpen(cit)}
                                      className="inline-flex max-w-full items-center gap-1"
                                    >
                                      <svg
                                        viewBox="0 0 24 24"
                                        className="h-3 w-3 shrink-0 text-blue-400/70"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        {cit.type === "web" ? (
                                          <>
                                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                          </>
                                        ) : (
                                          <>
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                            <polyline points="14 2 14 8 20 8" />
                                          </>
                                        )}
                                      </svg>
                                      <span className="truncate">
                                        {cit.label}
                                      </span>
                                    </button>
                                    <button
                                      type="button"
                                      aria-label="Copy citation"
                                      title="Copy citation"
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        const ok = await copyToClipboard(
                                          formatCitation(cit),
                                        );
                                        if (ok) setCopiedCitation(`chip-${i}`);
                                        setTimeout(
                                          () => setCopiedCitation(null),
                                          1800,
                                        );
                                      }}
                                      className="shrink-0 rounded-full p-1 text-white/35 transition-colors hover:bg-white/10 hover:text-white"
                                    >
                                      {copiedCitation === `chip-${i}` ? (
                                        <svg
                                          viewBox="0 0 24 24"
                                          className="h-3 w-3 text-emerald-400"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2.5"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        >
                                          <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                      ) : (
                                        <svg
                                          viewBox="0 0 24 24"
                                          className="h-3 w-3"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        >
                                          <rect
                                            x="9"
                                            y="9"
                                            width="13"
                                            height="13"
                                            rx="2"
                                            ry="2"
                                          />
                                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                        </svg>
                                      )}
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          {((message.type ?? active?.type) === "review" ||
                            (message.type ?? active?.type) === "draft" ||
                            message.content.includes("[ADVICE_COMPLETE]")) && (
                            <p className="mt-2 text-xs italic text-white/40 border-t border-white/10 pt-3">
                              This is an AI-generated analysis for reference
                              purposes. Please consult a practicing lawyer
                              before making any legal decisions.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    {message.role === "user" &&
                      message.id &&
                      !message.id.startsWith("assistant-") && (
                        <div className="mt-1 flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={async () => {
                              const ok = await copyToClipboard(
                                message.content.trim(),
                              );
                              if (ok) {
                                setCopiedMessageId(message.id);
                                setTimeout(
                                  () => setCopiedMessageId(null),
                                  2000,
                                );
                              }
                            }}
                            className="rounded-md p-1 text-white/30 transition-colors hover:text-white/60"
                            title="Copy"
                          >
                            {copiedMessageId === message.id ? (
                              <svg
                                viewBox="0 0 24 24"
                                className="h-3.5 w-3.5 text-emerald-400"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            ) : (
                              <svg
                                viewBox="0 0 24 24"
                                className="h-3.5 w-3.5"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <rect
                                  x="9"
                                  y="9"
                                  width="13"
                                  height="13"
                                  rx="2"
                                  ry="2"
                                />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                              </svg>
                            )}
                          </button>
                        </div>
                      )}
                    {message.role === "assistant" &&
                      message.id &&
                      !message.id.startsWith("assistant-") && (
                        <div className="mt-1 flex items-center gap-0.5">
                          {feedbackGiven[message.id] ? (
                            <p className="px-1 py-1 text-[11px] text-emerald-400/70">
                              Thanks for the feedback
                            </p>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => submitFeedback(message.id, "up")}
                                className="rounded-md p-1 text-white/30 transition-colors hover:text-white/60"
                                title="Helpful"
                              >
                                <svg
                                  viewBox="0 0 24 24"
                                  className="h-3.5 w-3.5"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  submitFeedback(message.id, "down");
                                  setFeedbackCommentOpen(message.id);
                                }}
                                className="rounded-md p-1 text-white/30 transition-colors hover:text-white/60"
                                title="Not helpful"
                              >
                                <svg
                                  viewBox="0 0 24 24"
                                  className="h-3.5 w-3.5"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
                                </svg>
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={async () => {
                              const text = stripThinkingTokens(message.content)
                                .replace(/\[ADVICE_COMPLETE\]/g, "")
                                .trim();
                              const ok = await copyToClipboard(text);
                              if (ok) {
                                setCopiedMessageId(message.id);
                                setTimeout(
                                  () => setCopiedMessageId(null),
                                  2000,
                                );
                              }
                            }}
                            className="rounded-md p-1 text-white/30 transition-colors hover:text-white/60"
                            title="Copy"
                          >
                            {copiedMessageId === message.id ? (
                              <svg
                                viewBox="0 0 24 24"
                                className="h-3.5 w-3.5 text-emerald-400"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            ) : (
                              <svg
                                viewBox="0 0 24 24"
                                className="h-3.5 w-3.5"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <rect
                                  x="9"
                                  y="9"
                                  width="13"
                                  height="13"
                                  rx="2"
                                  ry="2"
                                />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                              </svg>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (active)
                                shareConversation(active, "more", message.id);
                            }}
                            className="rounded-md p-1 text-white/30 transition-colors hover:text-white/60"
                            title="Share message"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              className="h-3.5 w-3.5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <circle cx="18" cy="5" r="3" />
                              <circle cx="6" cy="12" r="3" />
                              <circle cx="18" cy="19" r="3" />
                              <line
                                x1="8.59"
                                y1="13.51"
                                x2="15.42"
                                y2="17.49"
                              />
                              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                            </svg>
                          </button>
                          {(message.type ?? active?.type) === "draft" && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  import("@/lib/export").then((mod) =>
                                    mod.exportAsWord(
                                      message.content,
                                      active?.title || "Legal Document",
                                    ),
                                  )
                                }
                                className="rounded-md p-1 text-white/30 transition-colors hover:text-white/60"
                                title="Download Word"
                              >
                                <svg
                                  viewBox="0 0 24 24"
                                  className="h-3.5 w-3.5"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                  <polyline points="14 2 14 8 20 8" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  import("@/lib/export").then((mod) =>
                                    mod.exportAsPdf(
                                      message.content,
                                      active?.title || "Legal Document",
                                    ),
                                  )
                                }
                                className="rounded-md p-1 text-white/30 transition-colors hover:text-white/60"
                                title="Download PDF"
                              >
                                <svg
                                  viewBox="0 0 24 24"
                                  className="h-3.5 w-3.5"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                  <polyline points="14 2 14 8 20 8" />
                                  <line x1="12" y1="18" x2="12" y2="12" />
                                  <polyline points="9 15 12 18 15 15" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => setActiveTool("filing")}
                                className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-emerald-400/70 transition-colors hover:bg-emerald-500/10 hover:text-emerald-400"
                                title="File & Send to Authority"
                              >
                                <svg
                                  viewBox="0 0 24 24"
                                  className="h-3 w-3"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M22 2L11 13" />
                                  <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                                </svg>
                                File &amp; Send
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    {feedbackCommentOpen === message.id &&
                      feedbackGiven[message.id] === "down" && (
                        <div className="mt-1 flex w-full max-w-md gap-2">
                          <input
                            type="text"
                            placeholder="What was wrong? (optional)"
                            value={feedbackComment[message.id] || ""}
                            onChange={(e) =>
                              setFeedbackComment((prev) => ({
                                ...prev,
                                [message.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                submitFeedback(message.id, "down");
                                setFeedbackCommentOpen(null);
                              }
                            }}
                            className="flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              submitFeedback(message.id, "down");
                              setFeedbackCommentOpen(null);
                            }}
                            className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs text-white/60 hover:text-white"
                          >
                            Send
                          </button>
                        </div>
                      )}
                  </li>
                );
              })}
              {isThinking && showThinking ? (
                <li className="animate-message-in flex justify-start">
                  <div className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/70">
                    <span className="flex gap-1" aria-hidden>
                      <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-white/60" />
                      <span
                        className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-white/60"
                        style={{ animationDelay: "0.15s" }}
                      />
                      <span
                        className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-white/60"
                        style={{ animationDelay: "0.3s" }}
                      />
                    </span>
                    <span
                      key={thinkingStage}
                      role="status"
                      aria-live="polite"
                      className="animate-status-in"
                    >
                      {THINKING_STEPS[thinkingStage]}
                    </span>
                  </div>
                </li>
              ) : null}
              {showSuggestion && !isThinking && (
                <li className="animate-message-in flex justify-start">
                  <div className="max-w-[85%] rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-relaxed text-white/85 sm:text-[15px]">
                    <p>
                      {(() => {
                        const userMsgs = (active?.messages ?? []).filter(
                          (m) => m.role === "user",
                        );
                        const raw =
                          userMsgs[userMsgs.length - 1]?.content ?? "";
                        const fillers = [
                          "what",
                          "who",
                          "when",
                          "where",
                          "why",
                          "how",
                          "can",
                          "is",
                          "are",
                          "do",
                          "does",
                          "did",
                          "tell",
                          "explain",
                          "define",
                          "describe",
                          "the",
                          "a",
                          "an",
                          "me",
                          "about",
                          "it",
                          "its",
                          "this",
                          "that",
                          "these",
                          "those",
                          "by",
                          "in",
                          "on",
                          "of",
                          "to",
                          "for",
                          "with",
                          "under",
                          "between",
                          "from",
                          "please",
                          "i",
                          "want",
                          "to",
                          "know",
                          "like",
                        ];
                        const words = raw
                          .replace(/[?.,!]+$/, "")
                          .trim()
                          .split(/\s+/);
                        const keywords = words
                          .filter((w) => !fillers.includes(w.toLowerCase()))
                          .slice(0, 5)
                          .join(" ");
                        return (
                          <>
                            To know more about &quot;
                            {keywords || raw.slice(0, 40)}&quot;
                          </>
                        );
                      })()}
                      , try the{" "}
                      <button
                        type="button"
                        onClick={() => {
                          switchMode("analysis");
                        }}
                        className="font-semibold text-white underline decoration-white/40 underline-offset-2 hover:text-white/80"
                      >
                        Deep Analysis
                      </button>{" "}
                      feature.
                    </p>
                  </div>
                </li>
              )}
              <div ref={messagesEndRef} />
            </ul>
          ) : (
            <div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center pb-24 text-center">
              {mode === "analysis" ? (
                <div className="animate-fade-up w-full flex flex-col items-center">
                  <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-xs uppercase tracking-[0.3em] text-white/40">
                    Deep Analysis
                  </div>
                  <h2 className="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl">
                    Deep dive into your case
                  </h2>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-white/55">
                    Describe the case, legal issue, or document you want
                    analyzed. I will provide a thorough analysis including
                    relevant laws, precedents, risks, and recommendations.
                  </p>
                  <div className="mt-8 flex w-full flex-col items-end gap-2 md:flex-row md:flex-wrap md:items-center md:justify-center md:gap-3 md:pl-12">
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/50">
                      Risk assessment
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/50">
                      Legal research
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/50">
                      Precedent review
                    </span>
                  </div>
                  <div className="mt-8 w-full">
                    {pendingAttachment && (
                      <div className="mx-auto mb-2 flex max-w-3xl items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-3 py-2">
                        {pendingAttachment.type === "image" ? (
                          <svg
                            viewBox="0 0 24 24"
                            className="h-4 w-4 shrink-0 text-blue-400"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect
                              x="3"
                              y="3"
                              width="18"
                              height="18"
                              rx="2"
                              ry="2"
                            />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                        ) : (
                          <svg
                            viewBox="0 0 24 24"
                            className="h-4 w-4 shrink-0 text-red-400"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                        )}
                        <span className="truncate text-xs text-white/70">
                          {pendingAttachment.fileName}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPendingAttachment(null)}
                          className="ml-auto shrink-0 rounded-full p-0.5 text-white/40 hover:text-white/80 transition-colors"
                          aria-label="Remove attachment"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className="h-3.5 w-3.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    )}
                    <form
                      onSubmit={onSubmit}
                      className="flex items-end gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-2 transition-colors duration-300 focus-within:border-white/30"
                    >
                      <label htmlFor="chat-input" className="sr-only">
                        Message
                      </label>
                      <div className="relative" ref={plusMenuRef}>
                        <button
                          type="button"
                          onClick={() => setPlusMenuOpen((o) => !o)}
                          aria-label="More features"
                          className={`mb-0.5 shrink-0 rounded-full p-2 text-amber-400/70 transition-all duration-300 hover:bg-amber-400/10 hover:text-amber-400 ${plusMenuOpen ? "bg-amber-400/10 text-amber-400" : ""}`}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className={`h-4 w-4 transition-transform duration-300 ${plusMenuOpen ? "rotate-45" : ""}`}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                        </button>
                        <div className="absolute right-full top-1/2 -translate-y-1/2 mr-4 z-50 hidden sm:block">
                          <div
                            className="w-56 flex flex-col gap-1.5"
                            style={{
                              transform: plusMenuOpen
                                ? "translateX(0) scale(1)"
                                : "translateX(12px) scale(0.96)",
                              opacity: plusMenuOpen ? 1 : 0,
                              transformOrigin: "right center",
                              transition:
                                "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                              pointerEvents: plusMenuOpen ? "auto" : "none",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                switchMode("talk-to-ai");
                                setPlusMenuOpen(false);
                              }}
                              className="group flex items-center gap-3 rounded-xl border border-white/10 bg-black/60 backdrop-blur-xl px-3 py-2.5 text-left transition-all duration-300 hover:border-white/30 hover:bg-white/[0.06]"
                            >
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.08] transition-all duration-300 group-hover:bg-white/[0.15]">
                                <svg
                                  viewBox="0 0 24 24"
                                  className="h-3.5 w-3.5 text-white/70"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                              </div>
                              <div>
                                <div className="text-xs font-medium text-white/80 transition-colors group-hover:text-white">
                                  Talk to AI
                                </div>
                                <div className="text-[10px] text-white/30 transition-colors group-hover:text-white/45">
                                  General legal chat
                                </div>
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                switchMode("draft");
                                setPlusMenuOpen(false);
                              }}
                              className="group flex items-center gap-3 rounded-xl border border-blue-400/10 bg-black/60 backdrop-blur-xl px-3 py-2.5 text-left transition-all duration-300 hover:border-blue-400/30 hover:bg-blue-400/[0.06] hover:shadow-[0_0_16px_rgba(96,165,250,0.08)]"
                            >
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-400/[0.08] transition-all duration-300 group-hover:bg-blue-400/[0.15]">
                                <svg
                                  viewBox="0 0 24 24"
                                  className="h-3.5 w-3.5 text-blue-400/80"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                  <polyline points="14 2 14 8 20 8" />
                                  <line x1="16" y1="13" x2="8" y2="13" />
                                  <line x1="16" y1="17" x2="8" y2="17" />
                                </svg>
                              </div>
                              <div>
                                <div className="text-xs font-medium text-white/80 transition-colors group-hover:text-blue-400/90">
                                  Document Drafter
                                </div>
                                <div className="text-[10px] text-white/30 transition-colors group-hover:text-white/45">
                                  Generate legal documents
                                </div>
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                switchMode("review");
                                setPlusMenuOpen(false);
                              }}
                              className="group flex items-center gap-3 rounded-xl border border-emerald-400/10 bg-black/60 backdrop-blur-xl px-3 py-2.5 text-left transition-all duration-300 hover:border-emerald-400/30 hover:bg-emerald-400/[0.06] hover:shadow-[0_0_16px_rgba(52,211,153,0.08)]"
                            >
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-400/[0.08] transition-all duration-300 group-hover:bg-emerald-400/[0.15]">
                                <svg
                                  viewBox="0 0 24 24"
                                  className="h-3.5 w-3.5 text-emerald-400/80"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                  <polyline points="14 2 14 8 20 8" />
                                  <path d="M9 15l2 2 4-4" />
                                </svg>
                              </div>
                              <div>
                                <div className="text-xs font-medium text-white/80 transition-colors group-hover:text-emerald-400/90">
                                  Document Reviewer
                                </div>
                                <div className="text-[10px] text-white/30 transition-colors group-hover:text-white/45">
                                  Review contracts &amp; clauses
                                </div>
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>
                      <input
                        ref={analysisFileInputRef}
                        type="file"
                        accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.webp,.gif"
                        className="hidden"
                        onChange={(e) =>
                          handleFileUpload(e, () =>
                            setAnalysisAttachOpen(false),
                          )
                        }
                      />
                      <div className="relative" ref={analysisAttachMenuRef}>
                        <button
                          type="button"
                          onClick={() => setAnalysisAttachOpen((o) => !o)}
                          disabled={fileUploading}
                          aria-label="Attach file"
                          className="mb-0.5 shrink-0 rounded-full p-2 text-amber-400/70 transition-colors hover:bg-amber-400/10 hover:text-amber-400 disabled:opacity-50"
                        >
                          {fileUploading ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-400/30 border-t-amber-400" />
                          ) : (
                            <svg
                              viewBox="0 0 24 24"
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                            </svg>
                          )}
                        </button>
                        {analysisAttachOpen && !fileUploading && (
                          <div className="animate-dropdown-up absolute bottom-full -left-12 z-50 mb-6 hidden flex-col items-start gap-1.5 sm:flex">
                            <AttachmentOptionButton
                              kind="pdf"
                              label="PDF Document"
                              onClick={() => chooseAttachment("pdf", "analysis")}
                            />
                            <AttachmentOptionButton
                              kind="image"
                              label="Image"
                              onClick={() => chooseAttachment("image", "analysis")}
                            />
                          </div>
                        )}
                      </div>
                      <textarea
                        id="chat-input"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={onKeyDown}
                        placeholder={
                          pendingAttachment
                            ? "Ask about this document, or send to review as-is…"
                            : "Message Lawbite…"
                        }
                        rows={1}
                        className="min-h-[40px] max-h-40 w-full resize-none bg-transparent px-3 py-2 text-sm leading-relaxed text-white placeholder:text-white/35 focus:outline-none"
                      />
                      {renderSendOrStop()}
                    </form>
                  </div>
                </div>
              ) : mode === "talk-to-ai" || mode === "chat" ? (
                <div className="animate-fade-up w-full flex flex-col items-center">
                  <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-xs uppercase tracking-[0.3em] text-white/40">
                    Talk to AI
                  </div>
                  <h2 className="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl">
                    Ask anything about the law
                  </h2>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-white/55">
                    Have a conversation with the AI about legal questions, get
                    explanations, or explore ideas freely.
                  </p>
                  <div className="mt-8 w-full">
                    {pendingAttachment && (
                      <div className="mx-auto mb-2 flex max-w-3xl items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-3 py-2">
                        {pendingAttachment.type === "image" ? (
                          <svg
                            viewBox="0 0 24 24"
                            className="h-4 w-4 shrink-0 text-blue-400"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect
                              x="3"
                              y="3"
                              width="18"
                              height="18"
                              rx="2"
                              ry="2"
                            />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                        ) : (
                          <svg
                            viewBox="0 0 24 24"
                            className="h-4 w-4 shrink-0 text-red-400"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                        )}
                        <span className="truncate text-xs text-white/70">
                          {pendingAttachment.fileName}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPendingAttachment(null)}
                          className="ml-auto shrink-0 rounded-full p-0.5 text-white/40 hover:text-white/80 transition-colors"
                          aria-label="Remove attachment"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className="h-3.5 w-3.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    )}
                    <form
                      onSubmit={onSubmit}
                      className="flex items-end gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-2 transition-colors duration-300 focus-within:border-white/30"
                    >
                      <label htmlFor="chat-input" className="sr-only">
                        Message
                      </label>
                      <div className="relative" ref={plusMenuRef}>
                        <button
                          type="button"
                          onClick={() => setPlusMenuOpen((o) => !o)}
                          aria-label="More features"
                          className={`mb-0.5 shrink-0 rounded-full p-2 text-white/40 transition-all duration-300 hover:bg-white/[0.08] hover:text-white/80 ${plusMenuOpen ? "bg-white/[0.08] text-white/70" : ""}`}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className={`h-4 w-4 transition-transform duration-300 ${plusMenuOpen ? "rotate-45" : ""}`}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                        </button>
                        <div className="absolute right-full top-1/2 -translate-y-1/2 mr-4 z-50 hidden sm:block">
                          <div
                            className="w-56 flex flex-col gap-1.5"
                            style={{
                              transform: plusMenuOpen
                                ? "translateX(0) scale(1)"
                                : "translateX(12px) scale(0.96)",
                              opacity: plusMenuOpen ? 1 : 0,
                              transformOrigin: "right center",
                              transition:
                                "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                              pointerEvents: plusMenuOpen ? "auto" : "none",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                switchMode("analysis");
                                setPlusMenuOpen(false);
                              }}
                              className="group flex items-center gap-3 rounded-xl border border-amber-400/10 bg-black/60 backdrop-blur-xl px-3 py-2.5 text-left transition-all duration-300 hover:border-amber-400/30 hover:bg-amber-400/[0.06] hover:shadow-[0_0_16px_rgba(251,191,36,0.08)]"
                            >
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-400/[0.08] transition-all duration-300 group-hover:bg-amber-400/[0.15]">
                                <svg
                                  viewBox="0 0 24 24"
                                  className="h-3.5 w-3.5 text-amber-400/80"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <circle cx="12" cy="12" r="10" />
                                  <path d="M12 6v6l4 2" />
                                </svg>
                              </div>
                              <div>
                                <div className="text-xs font-medium text-white/80 transition-colors group-hover:text-amber-400/90">
                                  Deep Analysis
                                </div>
                                <div className="text-[10px] text-white/30 transition-colors group-hover:text-white/45">
                                  Deep dive into legal cases
                                </div>
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                switchMode("draft");
                                setPlusMenuOpen(false);
                              }}
                              className="group flex items-center gap-3 rounded-xl border border-blue-400/10 bg-black/60 backdrop-blur-xl px-3 py-2.5 text-left transition-all duration-300 hover:border-blue-400/30 hover:bg-blue-400/[0.06] hover:shadow-[0_0_16px_rgba(96,165,250,0.08)]"
                            >
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-400/[0.08] transition-all duration-300 group-hover:bg-blue-400/[0.15]">
                                <svg
                                  viewBox="0 0 24 24"
                                  className="h-3.5 w-3.5 text-blue-400/80"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                  <polyline points="14 2 14 8 20 8" />
                                  <line x1="16" y1="13" x2="8" y2="13" />
                                  <line x1="16" y1="17" x2="8" y2="17" />
                                </svg>
                              </div>
                              <div>
                                <div className="text-xs font-medium text-white/80 transition-colors group-hover:text-blue-400/90">
                                  Document Drafter
                                </div>
                                <div className="text-[10px] text-white/30 transition-colors group-hover:text-white/45">
                                  Generate legal documents
                                </div>
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                switchMode("review");
                                setPlusMenuOpen(false);
                              }}
                              className="group flex items-center gap-3 rounded-xl border border-emerald-400/10 bg-black/60 backdrop-blur-xl px-3 py-2.5 text-left transition-all duration-300 hover:border-emerald-400/30 hover:bg-emerald-400/[0.06] hover:shadow-[0_0_16px_rgba(52,211,153,0.08)]"
                            >
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-400/[0.08] transition-all duration-300 group-hover:bg-emerald-400/[0.15]">
                                <svg
                                  viewBox="0 0 24 24"
                                  className="h-3.5 w-3.5 text-emerald-400/80"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                  <polyline points="14 2 14 8 20 8" />
                                  <path d="M9 15l2 2 4-4" />
                                </svg>
                              </div>
                              <div>
                                <div className="text-xs font-medium text-white/80 transition-colors group-hover:text-emerald-400/90">
                                  Document Reviewer
                                </div>
                                <div className="text-[10px] text-white/30 transition-colors group-hover:text-white/45">
                                  Review contracts &amp; clauses
                                </div>
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>
                      <input
                        ref={chatFileInputRef}
                        type="file"
                        accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.webp,.gif"
                        className="hidden"
                        onChange={(e) =>
                          handleFileUpload(e, () => setChatAttachOpen(false))
                        }
                      />
                      <div className="relative" ref={chatAttachMenuRef}>
                        <button
                          type="button"
                          onClick={() => setChatAttachOpen((o) => !o)}
                          disabled={fileUploading}
                          aria-label="Attach file"
                          className="mb-0.5 shrink-0 rounded-full p-2 text-white/40 transition-colors hover:bg-white/[0.08] hover:text-white/70 disabled:opacity-50"
                        >
                          {fileUploading ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
                          ) : (
                            <svg
                              viewBox="0 0 24 24"
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                            </svg>
                          )}
                        </button>
                        {chatAttachOpen && !fileUploading && (
                          <div className="animate-dropdown-up absolute bottom-full -left-12 z-50 mb-6 hidden flex-col items-start gap-1.5 sm:flex">
                            <AttachmentOptionButton
                              kind="pdf"
                              label="PDF Document"
                              onClick={() => chooseAttachment("pdf", "chat")}
                            />
                            <AttachmentOptionButton
                              kind="image"
                              label="Image"
                              onClick={() => chooseAttachment("image", "chat")}
                            />
                          </div>
                        )}
                      </div>
                      <textarea
                        id="chat-input"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={onKeyDown}
                        placeholder={
                          pendingAttachment
                            ? "Ask about this document, or send to review as-is…"
                            : "Message Lawbite…"
                        }
                        rows={1}
                        className="min-h-[40px] max-h-40 w-full resize-none bg-transparent px-3 py-2 text-sm leading-relaxed text-white placeholder:text-white/35 focus:outline-none"
                      />
                      {renderSendOrStop()}
                    </form>
                  </div>
                </div>
              ) : mode === "grill" ? (
                <>
                  <div className="rounded-full border border-amber-400/30 bg-amber-400/[0.06] px-4 py-1.5 text-xs uppercase tracking-[0.3em] text-amber-400/70">
                    Case Intake
                  </div>
                  <h2 className="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl">
                    Interrogate an idea with sharp follow-up questions
                  </h2>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-white/55">
                    Describe your legal situation and I will ask only the
                    relevant questions, one at a time, then give you tailored
                    Indian legal advice with relevant sections and next steps.
                  </p>
                  <div className="mt-8 flex flex-wrap justify-center gap-3">
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/50">
                      Step-by-step interrogation
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/50">
                      State-specific laws
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/50">
                      Practical next steps
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/50">
                      Case archive
                    </span>
                  </div>
                  <div className="mt-8 w-full">
                    <form
                      onSubmit={onSubmit}
                      className="flex items-end gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-2 transition-colors duration-300 focus-within:border-white/30"
                    >
                      <label htmlFor="chat-input" className="sr-only">
                        Message
                      </label>
                      <textarea
                        id="chat-input"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={onKeyDown}
                        placeholder={
                          pendingAttachment
                            ? "Ask about this document, or send to review as-is…"
                            : "Message Lawbite…"
                        }
                        rows={1}
                        className="min-h-[40px] max-h-40 w-full resize-none bg-transparent px-3 py-2 text-sm leading-relaxed text-white placeholder:text-white/35 focus:outline-none"
                      />
                      {renderSendOrStop()}
                    </form>
                  </div>
                </>
              ) : mode === "draft" ? (
                <div className="animate-fade-up mx-auto flex h-full max-w-4xl flex-col items-center justify-center px-4">
                  {!selectedDocType ? (
                    <>
                      <div className="rounded-full border border-blue-400/30 bg-blue-400/[0.06] px-4 py-1.5 text-xs uppercase tracking-[0.3em] text-blue-400/70">
                        Document Drafter
                      </div>
                      <h2 className="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl">
                        Draft legal documents in minutes
                      </h2>
                      <p className="mt-3 max-w-md text-center text-sm leading-relaxed text-white/55">
                        Select a document type to start drafting with a
                        structured form, or switch to chat mode to describe your
                        situation.
                      </p>
                      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                        <button
                          type="button"
                          onClick={() => setActiveTool("templates")}
                          className="group flex items-center gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 text-left transition-all hover:border-white/20 hover:bg-white/[0.05]"
                        >
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/50 transition-colors duration-300 group-hover:border-white/20 group-hover:text-white">
                            <svg
                              viewBox="0 0 24 24"
                              className="h-6 w-6"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                          </div>
                          <div>
                            <span className="block text-sm font-medium text-white">
                              Contract Templates
                            </span>
                            <span className="mt-0.5 block text-xs text-white/40">
                              14 ready-to-use Indian legal templates
                            </span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveTool("filing")}
                          className="group flex items-center gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 text-left transition-all hover:border-white/20 hover:bg-white/[0.05]"
                        >
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/50 transition-colors duration-300 group-hover:border-white/20 group-hover:text-white">
                            <svg
                              viewBox="0 0 24 24"
                              className="h-6 w-6"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                              <rect x="9" y="3" width="6" height="4" rx="1" />
                            </svg>
                          </div>
                          <div>
                            <span className="block text-sm font-medium text-white">
                              Filing Assistance
                            </span>
                            <span className="mt-0.5 block text-xs text-white/40">
                              Guides for cyber crime, RTI, FIR &amp; consumer
                              complaints
                            </span>
                          </div>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="w-full max-w-2xl mt-24 self-start">
                      <div className="mb-3 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDocType(null);
                            setFormData({});
                          }}
                          className="rounded-lg p-2 text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <h3 className="text-lg font-semibold text-white">
                          {selectedDocType === "legal-notice"
                            ? "Legal Notice"
                            : selectedDocType === "fir-draft"
                              ? "FIR Draft"
                              : selectedDocType === "consumer-complaint"
                                ? "Consumer Complaint"
                                : selectedDocType === "rti-application"
                                  ? "RTI Application"
                                  : selectedDocType === "will"
                                    ? "Will"
                                    : selectedDocType === "affidavit"
                                      ? "Affidavit"
                                      : selectedDocType === "petition"
                                        ? "Petition"
                                        : "Contract/Agreement"}
                        </h3>
                      </div>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const docType =
                            selectedDocType === "legal-notice"
                              ? "Legal Notice"
                              : selectedDocType === "fir-draft"
                                ? "FIR Draft"
                                : selectedDocType === "consumer-complaint"
                                  ? "Consumer Complaint"
                                  : selectedDocType === "rti-application"
                                    ? "RTI Application"
                                    : selectedDocType === "will"
                                      ? "Will"
                                      : selectedDocType === "affidavit"
                                        ? "Affidavit"
                                        : selectedDocType === "petition"
                                          ? "Petition"
                                          : "Contract/Agreement";
                          const formEntries = Object.entries(formData).filter(
                            ([, v]) => v.trim(),
                          );
                          const formText = formEntries
                            .map(
                              ([k, v]) =>
                                `${k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}: ${v}`,
                            )
                            .join("\n");
                          const message = `Please draft a ${docType} with the following details:\n\n${formText}`;
                          sendMessage(message);
                        }}
                        className="space-y-3"
                      >
                        {selectedDocType === "legal-notice" && (
                          <>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <div>
                                <label className="mb-1 block text-xs text-white/50">
                                  From (Sender Name & Address)
                                </label>
                                <input
                                  type="text"
                                  value={formData.sender || ""}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      sender: e.target.value,
                                    })
                                  }
                                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-blue-400/50 focus:outline-none"
                                  placeholder="Your name and address"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs text-white/50">
                                  To (Recipient Name & Address)
                                </label>
                                <input
                                  type="text"
                                  value={formData.recipient || ""}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      recipient: e.target.value,
                                    })
                                  }
                                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-blue-400/50 focus:outline-none"
                                  placeholder="Recipient name and address"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-white/50">
                                Subject
                              </label>
                              <input
                                type="text"
                                value={formData.subject || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    subject: e.target.value,
                                  })
                                }
                                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-blue-400/50 focus:outline-none"
                                placeholder="Subject of the notice"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-white/50">
                                Facts / Description
                              </label>
                              <textarea
                                value={formData.facts || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    facts: e.target.value,
                                  })
                                }
                                rows={2}
                                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-blue-400/50 focus:outline-none"
                                placeholder="Describe the facts and what happened"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-white/50">
                                Relief / Demand
                              </label>
                              <input
                                type="text"
                                value={formData.relief || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    relief: e.target.value,
                                  })
                                }
                                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-blue-400/50 focus:outline-none"
                                placeholder="What are you demanding?"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-white/50">
                                Deadline (days)
                              </label>
                              <input
                                type="text"
                                value={formData.deadline || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    deadline: e.target.value,
                                  })
                                }
                                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-blue-400/50 focus:outline-none"
                                placeholder="e.g., 15 days"
                              />
                            </div>
                          </>
                        )}
                        {selectedDocType === "fir-draft" && (
                          <>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <div>
                                <label className="mb-1 block text-xs text-white/50">
                                  Complainant Name
                                </label>
                                <input
                                  type="text"
                                  value={formData.complainant || ""}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      complainant: e.target.value,
                                    })
                                  }
                                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-blue-400/50 focus:outline-none"
                                  placeholder="Your name"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs text-white/50">
                                  Accused Name (if known)
                                </label>
                                <input
                                  type="text"
                                  value={formData.accused || ""}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      accused: e.target.value,
                                    })
                                  }
                                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-blue-400/50 focus:outline-none"
                                  placeholder="Name of accused"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-white/50">
                                Offence / Incident
                              </label>
                              <input
                                type="text"
                                value={formData.offence || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    offence: e.target.value,
                                  })
                                }
                                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-blue-400/50 focus:outline-none"
                                placeholder="What offence occurred?"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-white/50">
                                Details of Incident
                              </label>
                              <textarea
                                value={formData.details || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    details: e.target.value,
                                  })
                                }
                                rows={2}
                                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-blue-400/50 focus:outline-none"
                                placeholder="Describe what happened in detail"
                              />
                            </div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <div>
                                <label className="mb-1 block text-xs text-white/50">
                                  Place of Incident
                                </label>
                                <input
                                  type="text"
                                  value={formData.place || ""}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      place: e.target.value,
                                    })
                                  }
                                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-blue-400/50 focus:outline-none"
                                  placeholder="Where did it happen?"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs text-white/50">
                                  Date of Incident
                                </label>
                                <input
                                  type="text"
                                  value={formData.incidentDate || ""}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      incidentDate: e.target.value,
                                    })
                                  }
                                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-blue-400/50 focus:outline-none"
                                  placeholder="When did it happen?"
                                />
                              </div>
                            </div>
                          </>
                        )}
                        {selectedDocType === "consumer-complaint" && (
                          <>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <div>
                                <label className="mb-1 block text-xs text-white/50">
                                  Consumer Name
                                </label>
                                <input
                                  type="text"
                                  value={formData.consumerName || ""}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      consumerName: e.target.value,
                                    })
                                  }
                                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-blue-400/50 focus:outline-none"
                                  placeholder="Your name"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs text-white/50">
                                  Opponent (Company/Seller)
                                </label>
                                <input
                                  type="text"
                                  value={formData.opponent || ""}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      opponent: e.target.value,
                                    })
                                  }
                                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-blue-400/50 focus:outline-none"
                                  placeholder="Company or seller name"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-white/50">
                                Product/Service
                              </label>
                              <input
                                type="text"
                                value={formData.product || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    product: e.target.value,
                                  })
                                }
                                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-blue-400/50 focus:outline-none"
                                placeholder="What product or service?"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-white/50">
                                Deficiency / Problem
                              </label>
                              <textarea
                                value={formData.deficiency || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    deficiency: e.target.value,
                                  })
                                }
                                rows={2}
                                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-blue-400/50 focus:outline-none"
                                placeholder="What is the deficiency in service or product?"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-white/50">
                                Relief Sought
                              </label>
                              <input
                                type="text"
                                value={formData.relief || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    relief: e.target.value,
                                  })
                                }
                                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-blue-400/50 focus:outline-none"
                                placeholder="What compensation/relief do you want?"
                              />
                            </div>
                          </>
                        )}
                        {selectedDocType === "rti-application" && (
                          <>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <div>
                                <label className="mb-1 block text-xs text-white/50">
                                  Applicant Name
                                </label>
                                <input
                                  type="text"
                                  value={formData.applicant || ""}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      applicant: e.target.value,
                                    })
                                  }
                                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-blue-400/50 focus:outline-none"
                                  placeholder="Your name"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs text-white/50">
                                  Applicant Address
                                </label>
                                <input
                                  type="text"
                                  value={formData.applicantAddress || ""}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      applicantAddress: e.target.value,
                                    })
                                  }
                                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-blue-400/50 focus:outline-none"
                                  placeholder="Your address"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-white/50">
                                Public Authority / Department
                              </label>
                              <input
                                type="text"
                                value={formData.authority || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    authority: e.target.value,
                                  })
                                }
                                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-blue-400/50 focus:outline-none"
                                placeholder="Which government department?"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-white/50">
                                Information Sought
                              </label>
                              <textarea
                                value={formData.information || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    information: e.target.value,
                                  })
                                }
                                rows={2}
                                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-blue-400/50 focus:outline-none"
                                placeholder="Describe the information you want in detail"
                              />
                            </div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <div>
                                <label className="mb-1 block text-xs text-white/50">
                                  Period (From)
                                </label>
                                <input
                                  type="text"
                                  value={formData.periodFrom || ""}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      periodFrom: e.target.value,
                                    })
                                  }
                                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-blue-400/50 focus:outline-none"
                                  placeholder="e.g., January 2024"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs text-white/50">
                                  Period (To)
                                </label>
                                <input
                                  type="text"
                                  value={formData.periodTo || ""}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      periodTo: e.target.value,
                                    })
                                  }
                                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-blue-400/50 focus:outline-none"
                                  placeholder="e.g., June 2025"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-white/50">
                                Grounds for Request
                              </label>
                              <textarea
                                value={formData.grounds || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    grounds: e.target.value,
                                  })
                                }
                                rows={2}
                                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-blue-400/50 focus:outline-none"
                                placeholder="Why is this information needed?"
                              />
                            </div>
                          </>
                        )}
                        {selectedDocType === "will" && (
                          <>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <div>
                                <label className="mb-1 block text-xs text-white/50">
                                  Testator Name
                                </label>
                                <input
                                  type="text"
                                  value={formData.testator || ""}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      testator: e.target.value,
                                    })
                                  }
                                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-blue-400/50 focus:outline-none"
                                  placeholder="Your full name"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs text-white/50">
                                  Beneficiary Name
                                </label>
                                <input
                                  type="text"
                                  value={formData.beneficiary || ""}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      beneficiary: e.target.value,
                                    })
                                  }
                                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-blue-400/50 focus:outline-none"
                                  placeholder="Who will inherit?"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-white/50">
                                Property / Asset Details
                              </label>
                              <textarea
                                value={formData.assets || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    assets: e.target.value,
                                  })
                                }
                                rows={2}
                                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-blue-400/50 focus:outline-none"
                                placeholder="List properties, bank accounts, investments, etc."
                              />
                            </div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <div>
                                <label className="mb-1 block text-xs text-white/50">
                                  Executor Name
                                </label>
                                <input
                                  type="text"
                                  value={formData.executor || ""}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      executor: e.target.value,
                                    })
                                  }
                                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-blue-400/50 focus:outline-none"
                                  placeholder="Who will execute the will?"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs text-white/50">
                                  Witness Name
                                </label>
                                <input
                                  type="text"
                                  value={formData.witness || ""}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      witness: e.target.value,
                                    })
                                  }
                                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-blue-400/50 focus:outline-none"
                                  placeholder="Name of witness"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-white/50">
                                Additional Instructions
                              </label>
                              <textarea
                                value={formData.instructions || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    instructions: e.target.value,
                                  })
                                }
                                rows={2}
                                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-blue-400/50 focus:outline-none"
                                placeholder="Any special conditions or directions"
                              />
                            </div>
                          </>
                        )}
                        {selectedDocType === "affidavit" && (
                          <>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <div>
                                <label className="mb-1 block text-xs text-white/50">
                                  Deponent Name
                                </label>
                                <input
                                  type="text"
                                  value={formData.deponent || ""}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      deponent: e.target.value,
                                    })
                                  }
                                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-blue-400/50 focus:outline-none"
                                  placeholder="Your full name"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs text-white/50">
                                  Occupation
                                </label>
                                <input
                                  type="text"
                                  value={formData.occupation || ""}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      occupation: e.target.value,
                                    })
                                  }
                                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-blue-400/50 focus:outline-none"
                                  placeholder="Your occupation"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-white/50">
                                Address
                              </label>
                              <input
                                type="text"
                                value={formData.deponentAddress || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    deponentAddress: e.target.value,
                                  })
                                }
                                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-blue-400/50 focus:outline-none"
                                placeholder="Your full address"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-white/50">
                                Facts / Statement to be Sworn
                              </label>
                              <textarea
                                value={formData.statement || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    statement: e.target.value,
                                  })
                                }
                                rows={2}
                                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-blue-400/50 focus:outline-none"
                                placeholder="Describe the facts you are swearing under oath"
                              />
                            </div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <div>
                                <label className="mb-1 block text-xs text-white/50">
                                  Place
                                </label>
                                <input
                                  type="text"
                                  value={formData.affidavitPlace || ""}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      affidavitPlace: e.target.value,
                                    })
                                  }
                                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-blue-400/50 focus:outline-none"
                                  placeholder="City / location"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs text-white/50">
                                  Date
                                </label>
                                <input
                                  type="text"
                                  value={formData.affidavitDate || ""}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      affidavitDate: e.target.value,
                                    })
                                  }
                                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-blue-400/50 focus:outline-none"
                                  placeholder="Date of swearing"
                                />
                              </div>
                            </div>
                          </>
                        )}
                        {selectedDocType === "petition" && (
                          <>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <div>
                                <label className="mb-1 block text-xs text-white/50">
                                  Petitioner Name
                                </label>
                                <input
                                  type="text"
                                  value={formData.petitioner || ""}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      petitioner: e.target.value,
                                    })
                                  }
                                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-blue-400/50 focus:outline-none"
                                  placeholder="Your name"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs text-white/50">
                                  Respondent Name
                                </label>
                                <input
                                  type="text"
                                  value={formData.respondent || ""}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      respondent: e.target.value,
                                    })
                                  }
                                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-blue-400/50 focus:outline-none"
                                  placeholder="Opposite party name"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-white/50">
                                Subject / Case Title
                              </label>
                              <input
                                type="text"
                                value={formData.caseSubject || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    caseSubject: e.target.value,
                                  })
                                }
                                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-blue-400/50 focus:outline-none"
                                placeholder="Brief subject of the petition"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-white/50">
                                Facts / Grounds
                              </label>
                              <textarea
                                value={formData.petitionFacts || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    petitionFacts: e.target.value,
                                  })
                                }
                                rows={2}
                                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-blue-400/50 focus:outline-none"
                                placeholder="Describe the facts and legal grounds"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-white/50">
                                Relief Sought
                              </label>
                              <textarea
                                value={formData.petitionRelief || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    petitionRelief: e.target.value,
                                  })
                                }
                                rows={2}
                                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-blue-400/50 focus:outline-none"
                                placeholder="What relief or order are you seeking from the court?"
                              />
                            </div>
                          </>
                        )}
                        {selectedDocType === "contract" && (
                          <>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <div>
                                <label className="mb-1 block text-xs text-white/50">
                                  Party A
                                </label>
                                <input
                                  type="text"
                                  value={formData.partyA || ""}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      partyA: e.target.value,
                                    })
                                  }
                                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-blue-400/50 focus:outline-none"
                                  placeholder="First party name"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs text-white/50">
                                  Party B
                                </label>
                                <input
                                  type="text"
                                  value={formData.partyB || ""}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      partyB: e.target.value,
                                    })
                                  }
                                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-blue-400/50 focus:outline-none"
                                  placeholder="Second party name"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-white/50">
                                Contract Subject
                              </label>
                              <input
                                type="text"
                                value={formData.contractSubject || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    contractSubject: e.target.value,
                                  })
                                }
                                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-blue-400/50 focus:outline-none"
                                placeholder="Purpose of the agreement"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-white/50">
                                Key Terms & Conditions
                              </label>
                              <textarea
                                value={formData.keyTerms || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    keyTerms: e.target.value,
                                  })
                                }
                                rows={2}
                                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-blue-400/50 focus:outline-none"
                                placeholder="Key clauses, payment terms, obligations, etc."
                              />
                            </div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <div>
                                <label className="mb-1 block text-xs text-white/50">
                                  Duration / Term
                                </label>
                                <input
                                  type="text"
                                  value={formData.term || ""}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      term: e.target.value,
                                    })
                                  }
                                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-blue-400/50 focus:outline-none"
                                  placeholder="e.g., 12 months, indefinite"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs text-white/50">
                                  Governing Law
                                </label>
                                <input
                                  type="text"
                                  value={formData.govLaw || ""}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      govLaw: e.target.value,
                                    })
                                  }
                                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-blue-400/50 focus:outline-none"
                                  placeholder="e.g., Indian Contract Act"
                                />
                              </div>
                            </div>
                          </>
                        )}
                        <div className="flex gap-3 pt-2">
                          <button
                            type="submit"
                            className="flex-1 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-600"
                          >
                            Generate Document
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDocType(null);
                              setFormData({});
                            }}
                            className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/60 transition-colors hover:bg-white/[0.04]"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              ) : mode === "review" ? (
                <div className="animate-fade-up mx-auto flex h-full max-w-4xl flex-col items-center justify-center px-4">
                  <div className="rounded-full border border-emerald-400/30 bg-emerald-400/[0.06] px-4 py-1.5 text-xs uppercase tracking-[0.3em] text-emerald-400/70">
                    Document Reviewer
                  </div>
                  <h2 className="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl">
                    Review legal documents for risky clauses
                  </h2>
                  <p className="mt-3 max-w-md text-center text-sm leading-relaxed text-white/55">
                    Upload a PDF or image — rental agreement, employment
                    contract, FIR, sale deed, or any legal document — and get a
                    clause-by-clause risk analysis with plain-language
                    explanations.
                  </p>
                  <div className="mt-8 flex flex-wrap justify-center gap-3">
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/50">
                      Risk ratings per clause
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/50">
                      Plain-language explanations
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/50">
                      Indian law references
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/50">
                      Overall risk score
                    </span>
                  </div>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <label className="group flex cursor-pointer items-center gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 text-left transition-all hover:border-white/20 hover:bg-white/[0.05]">
                      <input
                        type="file"
                        accept=".pdf,.docx,.doc"
                        className="hidden"
                        onChange={handleReviewFileUpload}
                      />
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/50 transition-colors duration-300 group-hover:border-white/20 group-hover:text-white">
                        <svg
                          viewBox="0 0 24 24"
                          className="h-6 w-6"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      </div>
                      <div>
                        <span className="block text-sm font-medium text-white">
                          PDF Document
                        </span>
                        <span className="mt-0.5 block text-xs text-white/40">
                          Contracts, agreements, FIRs
                        </span>
                      </div>
                    </label>
                    <label className="group flex cursor-pointer items-center gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 text-left transition-all hover:border-white/20 hover:bg-white/[0.05]">
                      <input
                        type="file"
                        accept=".png,.jpg,.jpeg,.webp,.gif"
                        className="hidden"
                        onChange={handleReviewFileUpload}
                      />
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/50 transition-colors duration-300 group-hover:border-white/20 group-hover:text-white">
                        <svg
                          viewBox="0 0 24 24"
                          className="h-6 w-6"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect
                            x="3"
                            y="3"
                            width="18"
                            height="18"
                            rx="2"
                            ry="2"
                          />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                      </div>
                      <div>
                        <span className="block text-sm font-medium text-white">
                          Image
                        </span>
                        <span className="mt-0.5 block text-xs text-white/40">
                          Photos of documents
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              ) : (
                <>
                  <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-xs uppercase tracking-[0.3em] text-white/40">
                    New conversation
                  </div>
                  <h2 className="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl">
                    How can I help with your legal work today?
                  </h2>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-white/55">
                    Draft documents, review clauses, or ask questions about a
                    matter. I will keep the context of this conversation for the
                    duration of the session.
                  </p>
                  <p className="mt-2 text-xs text-white/35">
                    Get answers to your legal questions in English.
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {((mode !== "talk-to-ai" &&
          mode !== "chat" &&
          mode !== "analysis" &&
          mode !== "grill") ||
          (active && active.messages.length > 0)) && (
          <div
            className={`border-t border-white/10 px-5 py-4 backdrop-blur-md sm:px-8 ${mode === "analysis" || mode === "talk-to-ai" ? "bg-black/60" : "bg-black/40"}`}
          >
            {pendingAttachment && (
              <div className="mx-auto mb-2 flex max-w-3xl items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-3 py-2">
                {pendingAttachment.type === "image" ? (
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4 shrink-0 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4 shrink-0 text-red-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                )}
                <span className="truncate text-xs text-white/70">
                  {pendingAttachment.fileName}
                </span>
                <button
                  type="button"
                  onClick={() => setPendingAttachment(null)}
                  className="ml-auto shrink-0 rounded-full p-0.5 text-white/40 hover:text-white/80 transition-colors"
                  aria-label="Remove attachment"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            )}
            <form
              onSubmit={onSubmit}
              className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-2 transition-colors duration-300 focus-within:border-white/30"
            >
              <label htmlFor="chat-input" className="sr-only">
                Message
              </label>
              <div className="relative" ref={plusMenuRef}>
                <button
                  type="button"
                  onClick={() => setPlusMenuOpen((o) => !o)}
                  aria-label="More features"
                  className={`mb-0.5 shrink-0 rounded-full p-2 text-white/40 transition-all duration-300 hover:bg-white/[0.08] hover:text-white/80 ${plusMenuOpen ? "bg-white/[0.08] text-white/70" : ""}`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className={`h-4 w-4 transition-transform duration-300 ${plusMenuOpen ? "rotate-45" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
                <div className="absolute bottom-full right-full mb-9 -translate-x-2 z-50 hidden sm:block">
                  <div
                    className="w-56 flex flex-col gap-1.5"
                    style={{
                      transform: plusMenuOpen
                        ? "translateX(0) scale(1)"
                        : "translateX(12px) scale(0.96)",
                      opacity: plusMenuOpen ? 1 : 0,
                      transformOrigin: "bottom right",
                      transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                      pointerEvents: plusMenuOpen ? "auto" : "none",
                    }}
                  >
                    {mode !== "talk-to-ai" && mode !== "chat" && (
                      <button
                        type="button"
                        onClick={() => {
                          switchMode("talk-to-ai");
                          setPlusMenuOpen(false);
                        }}
                        className="group flex items-center gap-3 rounded-xl border border-white/10 bg-black/60 backdrop-blur-xl px-3 py-2.5 text-left transition-all duration-300 hover:border-white/30 hover:bg-white/[0.06]"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.08] transition-all duration-300 group-hover:bg-white/[0.15]">
                          <svg
                            viewBox="0 0 24 24"
                            className="h-3.5 w-3.5 text-white/70"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-white/80 transition-colors group-hover:text-white">
                            Talk to AI
                          </div>
                          <div className="text-[10px] text-white/30 transition-colors group-hover:text-white/45">
                            General legal chat
                          </div>
                        </div>
                      </button>
                    )}
                    {mode !== "analysis" && (
                      <button
                        type="button"
                        onClick={() => {
                          switchMode("analysis");
                          setPlusMenuOpen(false);
                        }}
                        className="group flex items-center gap-3 rounded-xl border border-amber-400/10 bg-black/60 backdrop-blur-xl px-3 py-2.5 text-left transition-all duration-300 hover:border-amber-400/30 hover:bg-amber-400/[0.06] hover:shadow-[0_0_16px_rgba(251,191,36,0.08)]"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-400/[0.08] transition-all duration-300 group-hover:bg-amber-400/[0.15]">
                          <svg
                            viewBox="0 0 24 24"
                            className="h-3.5 w-3.5 text-amber-400/80"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 6v6l4 2" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-white/80 transition-colors group-hover:text-amber-400/90">
                            Deep Analysis
                          </div>
                          <div className="text-[10px] text-white/30 transition-colors group-hover:text-white/45">
                            Deep dive into legal cases
                          </div>
                        </div>
                      </button>
                    )}
                    {mode !== "draft" && (
                      <button
                        type="button"
                        onClick={() => {
                          switchMode("draft");
                          setPlusMenuOpen(false);
                        }}
                        className="group flex items-center gap-3 rounded-xl border border-blue-400/10 bg-black/60 backdrop-blur-xl px-3 py-2.5 text-left transition-all duration-300 hover:border-blue-400/30 hover:bg-blue-400/[0.06] hover:shadow-[0_0_16px_rgba(96,165,250,0.08)]"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-400/[0.08] transition-all duration-300 group-hover:bg-blue-400/[0.15]">
                          <svg
                            viewBox="0 0 24 24"
                            className="h-3.5 w-3.5 text-blue-400/80"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-white/80 transition-colors group-hover:text-blue-400/90">
                            Document Drafter
                          </div>
                          <div className="text-[10px] text-white/30 transition-colors group-hover:text-white/45">
                            Generate legal documents
                          </div>
                        </div>
                      </button>
                    )}
                    {mode !== "review" && (
                      <button
                        type="button"
                        onClick={() => {
                          switchMode("review");
                          setPlusMenuOpen(false);
                        }}
                        className="group flex items-center gap-3 rounded-xl border border-emerald-400/10 bg-black/60 backdrop-blur-xl px-3 py-2.5 text-left transition-all duration-300 hover:border-emerald-400/30 hover:bg-emerald-400/[0.06] hover:shadow-[0_0_16px_rgba(52,211,153,0.08)]"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-400/[0.08] transition-all duration-300 group-hover:bg-emerald-400/[0.15]">
                          <svg
                            viewBox="0 0 24 24"
                            className="h-3.5 w-3.5 text-emerald-400/80"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <path d="M9 15l2 2 4-4" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-white/80 transition-colors group-hover:text-emerald-400/90">
                            Document Reviewer
                          </div>
                          <div className="text-[10px] text-white/30 transition-colors group-hover:text-white/45">
                            Review contracts &amp; clauses
                          </div>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {mode === "draft" && active.messages.length > 0 && (
                <div className="relative" ref={draftDocTypeMenuRef}>
                  <button
                    type="button"
                    onClick={() => setDraftDocTypeOpen((o) => !o)}
                    aria-label="Document types"
                    className="mb-0.5 shrink-0 rounded-full p-2 text-blue-400/70 transition-colors hover:bg-blue-400/10 hover:text-blue-400"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  </button>
                  {draftDocTypeOpen && (
                    <div className="animate-dropdown-up absolute bottom-full -left-2 mb-6 w-52 overflow-hidden rounded-lg border border-blue-400/10 bg-black/80 backdrop-blur-xl shadow-xl z-50">
                      {[
                        { id: "legal-notice", label: "Legal Notice" },
                        { id: "fir-draft", label: "FIR Draft" },
                        {
                          id: "consumer-complaint",
                          label: "Consumer Complaint",
                        },
                        { id: "rti-application", label: "RTI Application" },
                        { id: "will", label: "Will" },
                        { id: "affidavit", label: "Affidavit" },
                        { id: "petition", label: "Petition" },
                        { id: "contract", label: "Contract/Agreement" },
                      ].map((doc) => (
                        <button
                          key={doc.id}
                          type="button"
                          onClick={() => {
                            const conv: Conversation = {
                              id: newId("d"),
                              title: doc.label,
                              preview: "Document drafting",
                              type: "draft",
                              createdAt: Date.now(),
                              messages: [],
                            };
                            setConversations((prev) => [conv, ...prev]);
                            setActiveId(conv.id);
                            setMode("draft");
                            setDraft("");
                            setSidebarOpen(false);
                            setFormData({});
                            setSelectedDocType(doc.id);
                            setDraftDocTypeOpen(false);
                          }}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-white/70 hover:bg-blue-400/[0.06] transition-colors"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className="h-4 w-4 shrink-0 text-blue-400"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                          </svg>
                          {doc.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {(mode === "talk-to-ai" ||
                mode === "chat" ||
                mode === "analysis") && (
                <>
                  <input
                    ref={chatFileInputRef}
                    type="file"
                    accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.webp,.gif"
                    className="hidden"
                    onChange={(e) =>
                      handleFileUpload(e, () => setChatAttachOpen(false))
                    }
                  />
                  <div className="relative" ref={chatAttachMenuRef}>
                    <button
                      type="button"
                      onClick={() => setChatAttachOpen((o) => !o)}
                      disabled={fileUploading}
                      aria-label="Attach file"
                      className="mb-0.5 shrink-0 rounded-full p-2 text-white/40 transition-colors hover:bg-white/[0.08] hover:text-white/70 disabled:opacity-50"
                    >
                      {fileUploading ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
                      ) : (
                        <svg
                          viewBox="0 0 24 24"
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                        </svg>
                      )}
                    </button>
                    {chatAttachOpen && !fileUploading && (
                      <div className="animate-dropdown-up absolute bottom-full -left-12 z-50 mb-6 hidden flex-col items-start gap-1.5 sm:flex">
                        <AttachmentOptionButton
                          kind="pdf"
                          label="PDF Document"
                          onClick={() => chooseAttachment("pdf", "chat")}
                        />
                        <AttachmentOptionButton
                          kind="image"
                          label="Image"
                          onClick={() => chooseAttachment("image", "chat")}
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
              {mode === "review" && (
                <>
                  <input
                    ref={reviewFileInputRef}
                    type="file"
                    accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.webp,.gif"
                    className="hidden"
                    onChange={handleReviewFileUpload}
                  />
                  <div className="relative" ref={reviewAttachMenuRef}>
                    <button
                      type="button"
                      onClick={() => setReviewAttachOpen((o) => !o)}
                      disabled={reviewFileUploading}
                      aria-label="Attach file for review"
                      className="mb-0.5 shrink-0 rounded-full p-2 text-white/40 transition-colors hover:bg-white/[0.08] hover:text-white/70 disabled:opacity-50"
                    >
                      {reviewFileUploading ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
                      ) : (
                        <svg
                          viewBox="0 0 24 24"
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                        </svg>
                      )}
                    </button>
                    {reviewAttachOpen && !reviewFileUploading && (
                      <div className="animate-dropdown-up absolute bottom-full -left-12 z-50 mb-6 hidden flex-col items-start gap-1.5 sm:flex">
                        <AttachmentOptionButton
                          kind="pdf"
                          label="PDF Document"
                          onClick={() => chooseAttachment("pdf", "review")}
                        />
                        <AttachmentOptionButton
                          kind="image"
                          label="Image"
                          onClick={() => chooseAttachment("image", "review")}
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
              <textarea
                id="chat-input"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={
                  pendingAttachment
                    ? "Ask about this document, or send to review as-is…"
                    : "Message Lawbite…"
                }
                rows={1}
                className="min-h-[40px] max-h-40 w-full resize-none bg-transparent px-3 py-2 text-sm leading-relaxed text-white placeholder:text-white/35 focus:outline-none"
              />
              {renderSendOrStop()}
            </form>
          </div>
        )}
      </main>

      <MobileModeSheet
        open={plusMenuOpen}
        mode={mode}
        onSelect={(nextMode) => {
          switchMode(nextMode);
          setPlusMenuOpen(false);
        }}
        onClose={() => setPlusMenuOpen(false)}
        sheetRef={mobileModeSheetRef}
      />

      <AttachmentSheet
        open={reviewAttachOpen || analysisAttachOpen || chatAttachOpen}
        onClose={() => {
          setReviewAttachOpen(false);
          setAnalysisAttachOpen(false);
          setChatAttachOpen(false);
        }}
        onPick={(kind) => {
          if (reviewAttachOpen) chooseAttachment(kind, "review");
          else if (analysisAttachOpen) chooseAttachment(kind, "analysis");
          else chooseAttachment(kind, "chat");
        }}
      />

      {confirmAction && (
        <div
          className="animate-overlay-in fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setConfirmAction(null)}
        >
          <div
            className="animate-modal-in w-full max-w-sm rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (confirmAction.type === "clearHistory") {
                  clearHistory(confirmAction.section);
                } else {
                  deleteConversation(confirmAction.id);
                }
                setConfirmAction(null);
              }
              if (e.key === "Escape") {
                setConfirmAction(null);
              }
            }}
          >
            <h3 className="text-base font-semibold text-white">
              {confirmAction.type === "clearHistory"
                ? "Clear History"
                : "Delete Chat"}
            </h3>
            <p className="mt-2 text-sm text-white/55">
              {confirmAction.type === "clearHistory"
                ? confirmAction.section
                  ? `This will permanently delete all ${{ "talk-to-ai": "Talk to AI", chat: "Chat", analysis: "Deep Analysis", grill: "AI Lawyer", draft: "Document Drafter", review: "Document Reviewer" }[confirmAction.section]} history, except pinned chats. This action cannot be undone.`
                  : "This will permanently delete all chat history and case folders of this account. Pinned chats will be kept. This action cannot be undone."
                : "This will permanently delete this conversation. This action cannot be undone."}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="rounded-lg px-4 py-2 text-sm text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => {
                  if (confirmAction.type === "clearHistory") {
                    clearHistory(confirmAction.section);
                  } else {
                    deleteConversation(confirmAction.id);
                  }
                  setConfirmAction(null);
                }}
                className="rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/30"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showClearNotifications && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowClearNotifications(false)}
        >
          <div
            className="animate-overlay-in mx-4 w-full max-w-sm rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold text-white">
              Clear Notifications
            </h3>
            <p className="mt-2 text-sm text-white/50">
              This will dismiss all {upcomingReminders.length} notification
              {upcomingReminders.length !== 1 ? "s" : ""}. They will reappear
              when the deadline enters the next threshold (3 days, 1 day).
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowClearNotifications(false)}
                className="rounded-lg px-4 py-2 text-sm text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                autoFocus
                onClick={clearAllNotifications}
                className="rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/30"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {historyOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setHistoryOpen(false)}
        >
          <div
            className="animate-overlay-in flex w-full max-w-lg flex-col rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <h2 className="text-sm font-semibold">History</h2>
              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                className="rounded-full p-1.5 text-white/60 transition-colors hover:bg-white/5 hover:text-white"
                aria-label="Close history"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex gap-1 border-b border-white/10 px-4 pt-3">
              {(
                ["all", "talk-to-ai", "analysis", "draft", "review"] as const
              ).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setHistoryTab(tab)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${
                    historyTab === tab
                      ? "bg-white/10 text-white"
                      : "text-white/40 hover:text-white/70"
                  }`}
                >
                  {tab === "all"
                    ? "All"
                    : tab === "talk-to-ai"
                      ? "Talk to AI"
                      : tab === "analysis"
                        ? "Analysis"
                        : tab === "draft"
                          ? "Drafter"
                          : "Review"}
                </button>
              ))}
            </div>
            <nav
              aria-label="History"
              className="flex-1 overflow-y-auto px-2 py-4"
            >
              {(historyTab === "all" || historyTab === "talk-to-ai") && (
                <div className="mb-4">
                  <p className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wider text-white/35">
                    Talk to AI
                  </p>
                  {groupConversations("talk-to-ai", now).map((group) => (
                    <div key={group.label} className="mb-2">
                      <p className="px-3 pb-1 pt-1 text-[10px] font-medium text-white/25">
                        {group.label}
                      </p>
                      <ul className="space-y-0.5 text-sm">
                        {group.items.map((conv) => (
                          <li
                            key={conv.id}
                            className="relative"
                            onMouseEnter={() => setHoveredId(conv.id)}
                            onMouseLeave={() => setHoveredId(null)}
                          >
                            {renderConvItem(conv)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmAction({
                        type: "clearHistory",
                        section: "talk-to-ai",
                      })
                    }
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[12px] text-white/30 transition-colors hover:bg-white/[0.04] hover:text-red-400/70"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-3.5 w-3.5 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    Clear history
                  </button>
                </div>
              )}
              {(historyTab === "all" || historyTab === "analysis") &&
                groupConversations("analysis", now).length > 0 && (
                  <div className="mb-4">
                    <p className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wider text-white/35">
                      Deep Analysis
                    </p>
                    {groupConversations("analysis", now).map((group) => (
                      <div key={group.label} className="mb-2">
                        <p className="px-3 pb-1 pt-1 text-[10px] font-medium text-white/25">
                          {group.label}
                        </p>
                        <ul className="space-y-0.5 text-sm">
                          {group.items.map((conv) => (
                            <li
                              key={conv.id}
                              className="relative"
                              onMouseEnter={() => setHoveredId(conv.id)}
                              onMouseLeave={() => setHoveredId(null)}
                            >
                              {renderConvItem(conv)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmAction({
                          type: "clearHistory",
                          section: "analysis",
                        })
                      }
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[12px] text-white/30 transition-colors hover:bg-white/[0.04] hover:text-red-400/70"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-3.5 w-3.5 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                      Clear history
                    </button>
                  </div>
                )}
              {historyTab === "all" && (
                <div className="mb-4">
                  <div className="flex items-center justify-between px-3 pb-1 pt-2">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-white/35">
                      Case Folders
                    </p>
                    <button
                      type="button"
                      onClick={() => setCaseFoldersOpen(!caseFoldersOpen)}
                      className="rounded p-1 text-white/40 transition-colors hover:bg-white/[0.05] hover:text-white"
                      aria-label="Toggle case folders"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </button>
                  </div>
                  {caseFoldersOpen && (
                    <div className="px-3 pb-1">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") createCaseFolder();
                          }}
                          placeholder="New folder name"
                          className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={createCaseFolder}
                          className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-black transition-colors hover:bg-white/90"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}
                  {caseFolders.length > 0
                    ? caseFolders.map((f) => {
                        const folderConvs = conversations.filter(
                          (c) =>
                            c.folderId === f.id &&
                            Array.isArray(c.messages) &&
                            c.messages.length > 0,
                        );
                        return (
                          <div key={f.id} className="group">
                            <div className="flex items-center gap-2 px-3 pb-1 pt-2">
                              <svg
                                viewBox="0 0 24 24"
                                className="h-3.5 w-3.5 shrink-0 text-amber-400/70"
                                fill="currentColor"
                              >
                                <path d="M3 6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v2H3z" />
                                <path d="M3 10h18l-1.5 9a2 2 0 0 1-2 1.7H6.5a2 2 0 0 1-2-1.7z" />
                              </svg>
                              <span className="flex-1 truncate text-xs font-medium text-white/80">
                                {f.name}
                              </span>
                              <span className="text-[10px] text-white/30">
                                {folderConvs.length}
                              </span>
                              <button
                                type="button"
                                onClick={() => deleteCaseFolder(f.id)}
                                className="rounded p-0.5 text-white/25 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                                aria-label={`Delete folder ${f.name}`}
                              >
                                <svg
                                  viewBox="0 0 24 24"
                                  className="h-3 w-3"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                              </button>
                            </div>
                            {folderConvs.length > 0 && (
                              <ul className="space-y-0.5 text-sm">
                                {folderConvs.map((conv) => (
                                  <li
                                    key={conv.id}
                                    className="relative"
                                    onMouseEnter={() => setHoveredId(conv.id)}
                                    onMouseLeave={() => setHoveredId(null)}
                                  >
                                    {renderConvItem(conv)}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        );
                      })
                    : !caseFoldersOpen && (
                        <p className="px-3 text-[11px] text-white/25">
                          Organize cases into folders
                        </p>
                      )}
                </div>
              )}
              {(historyTab === "all" || historyTab === "grill") &&
                groupConversations("grill", now).length > 0 && (
                  <div className="mb-4">
                    <p className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wider text-amber-400/60">
                      AI Lawyer
                    </p>
                    {groupConversations("grill", now).map((group) => (
                      <div key={group.label} className="mb-2">
                        <p className="px-3 pb-1 pt-1 text-[10px] font-medium text-white/25">
                          {group.label}
                        </p>
                        <ul className="space-y-0.5 text-sm">
                          {group.items.map((conv) => (
                            <li
                              key={conv.id}
                              className="relative"
                              onMouseEnter={() => setHoveredId(conv.id)}
                              onMouseLeave={() => setHoveredId(null)}
                            >
                              {renderConvItem(conv)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmAction({
                          type: "clearHistory",
                          section: "grill",
                        })
                      }
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[12px] text-white/30 transition-colors hover:bg-white/[0.04] hover:text-red-400/70"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-3.5 w-3.5 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                      Clear history
                    </button>
                  </div>
                )}
              {(historyTab === "all" || historyTab === "draft") &&
                groupConversations("draft", now).length > 0 && (
                  <div className="mb-4">
                    <p className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wider text-blue-400/60">
                      Document Drafter
                    </p>
                    {groupConversations("draft", now).map((group) => (
                      <div key={group.label} className="mb-2">
                        <p className="px-3 pb-1 pt-1 text-[10px] font-medium text-white/25">
                          {group.label}
                        </p>
                        <ul className="space-y-0.5 text-sm">
                          {group.items.map((conv) => (
                            <li
                              key={conv.id}
                              className="relative"
                              onMouseEnter={() => setHoveredId(conv.id)}
                              onMouseLeave={() => setHoveredId(null)}
                            >
                              {renderConvItem(conv)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmAction({
                          type: "clearHistory",
                          section: "draft",
                        })
                      }
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[12px] text-white/30 transition-colors hover:bg-white/[0.04] hover:text-red-400/70"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-3.5 w-3.5 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                      Clear history
                    </button>
                  </div>
                )}
              {(historyTab === "all" || historyTab === "review") &&
                groupConversations("review", now).length > 0 && (
                  <div className="mb-4">
                    <p className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wider text-emerald-400/60">
                      Document Reviewer
                    </p>
                    {groupConversations("review", now).map((group) => (
                      <div key={group.label} className="mb-2">
                        <p className="px-3 pb-1 pt-1 text-[10px] font-medium text-white/25">
                          {group.label}
                        </p>
                        <ul className="space-y-0.5 text-sm">
                          {group.items.map((conv) => (
                            <li
                              key={conv.id}
                              className="relative"
                              onMouseEnter={() => setHoveredId(conv.id)}
                              onMouseLeave={() => setHoveredId(null)}
                            >
                              {renderConvItem(conv)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmAction({
                          type: "clearHistory",
                          section: "review",
                        })
                      }
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[12px] text-white/30 transition-colors hover:bg-white/[0.04] hover:text-red-400/70"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-3.5 w-3.5 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                      Clear history
                    </button>
                  </div>
                )}
              {historyTab === "all" &&
                groupConversations("talk-to-ai", now).length === 0 &&
                groupConversations("analysis", now).length === 0 &&
                groupConversations("grill", now).length === 0 &&
                groupConversations("draft", now).length === 0 &&
                groupConversations("review", now).length === 0 && (
                  <p className="px-3 py-8 text-center text-xs text-white/35">
                    No conversations yet
                  </p>
                )}
              {historyTab !== "all" &&
                groupConversations(historyTab, now).length === 0 && (
                  <p className="px-3 py-8 text-center text-xs text-white/35">
                    No conversations in this category
                  </p>
                )}
            </nav>
          </div>
        </div>
      )}

      {calculatorOpen && !activeCalculator && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setCalculatorOpen(false)}
        >
          <div
            className="animate-overlay-in mx-4 w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Calculators
                </h3>
                <p className="mt-1 text-sm text-white/50">
                  Choose a calculator to open.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCalculatorOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-white/40 transition-all duration-200 hover:border-white/10 hover:bg-white/5 hover:text-white/70"
                aria-label="Close"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mt-5 space-y-3">
              <button
                type="button"
                onClick={() => setActiveCalculator("limits")}
                className="group flex w-full items-center gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-left transition-all hover:border-white/20 hover:bg-white/[0.05]"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/50 transition-colors duration-300 group-hover:border-white/20 group-hover:text-white">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div>
                  <span className="block text-sm font-medium text-white">
                    Statute of Limitations
                  </span>
                  <span className="mt-0.5 block text-xs text-white/40">
                    Find the deadline to file your case
                  </span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setActiveCalculator("interest")}
                className="group flex w-full items-center gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-left transition-all hover:border-white/20 hover:bg-white/[0.05]"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/50 transition-colors duration-300 group-hover:border-white/20 group-hover:text-white">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                </div>
                <div>
                  <span className="block text-sm font-medium text-white">
                    Interest Calculator
                  </span>
                  <span className="mt-0.5 block text-xs text-white/40">
                    Simple or compound interest on any amount
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeCalculator === "limits" && (
        <CalculatorLimitsModal
          onClose={() => setActiveCalculator(null)}
          onBack={() => {
            setActiveCalculator(null);
            setCalculatorOpen(true);
          }}
        />
      )}

      {activeCalculator === "interest" && (
        <CalculatorInterestModal
          onClose={() => setActiveCalculator(null)}
          onBack={() => {
            setActiveCalculator(null);
            setCalculatorOpen(true);
          }}
        />
      )}

      {toolsOpen && !activeTool && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setToolsOpen(false)}
        >
          <div
            className="animate-overlay-in mx-4 w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Legal Tools
                </h3>
                <p className="mt-1 text-sm text-white/50">
                  Templates, filing guides, and more.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setToolsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-white/40 transition-all duration-200 hover:border-white/10 hover:bg-white/5 hover:text-white/70"
                aria-label="Close"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mt-5 space-y-3">
              <button
                type="button"
                onClick={() => setActiveTool("templates")}
                className="group flex w-full items-center gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-left transition-all hover:border-white/20 hover:bg-white/[0.05]"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/50 transition-colors duration-300 group-hover:border-white/20 group-hover:text-white">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div>
                  <span className="block text-sm font-medium text-white">
                    Contract Templates
                  </span>
                  <span className="mt-0.5 block text-xs text-white/40">
                    14 ready-to-use Indian legal templates
                  </span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setActiveTool("filing")}
                className="group flex w-full items-center gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-left transition-all hover:border-white/20 hover:bg-white/[0.05]"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/50 transition-colors duration-300 group-hover:border-white/20 group-hover:text-white">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                    <rect x="9" y="3" width="6" height="4" rx="1" />
                  </svg>
                </div>
                <div>
                  <span className="block text-sm font-medium text-white">
                    Filing Assistance
                  </span>
                  <span className="mt-0.5 block text-xs text-white/40">
                    Guides for cyber crime, RTI, FIR &amp; consumer complaints
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTool === "templates" && (
        <TemplatesModal
          initialItem={initialItem}
          onClose={() => setActiveTool(null)}
          onBack={() => {
            setActiveTool(null);
            setToolsOpen(true);
          }}
        />
      )}

      {activeTool === "filing" && (
        <FilingModal
          initialItem={initialItem}
          onClose={() => setActiveTool(null)}
          onBack={() => {
            setActiveTool(null);
            setToolsOpen(true);
          }}
        />
      )}

      {remindersOpen && (
        <RemindersModal onClose={() => setRemindersOpen(false)} />
      )}

      {settingsOpen && (
        <div
          className="animate-overlay-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setSettingsOpen(false)}
        >
          <div
            className="animate-modal-in relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">Settings</h2>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
                aria-label="Close settings"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 mb-6">
              {user.image ? (
                <Image
                  src={user.image}
                  alt=""
                  width={48}
                  height={48}
                  unoptimized
                  className="h-12 w-12 shrink-0 rounded-full border border-white/15 object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-lg text-white/60">
                  {(user.name || user.email || "U").charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  {user.name || "User"}
                </p>
                <p className="truncate text-xs text-white/50">{user.email}</p>
              </div>
            </div>

            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  setEditProfileOpen(true);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/70 transition-colors hover:bg-white/[0.05] hover:text-white"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Edit profile
              </button>
              <button
                type="button"
                onClick={() => {
                  setUpgradeOpen(true);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/70 transition-colors hover:bg-white/[0.05] hover:text-white"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
                Upgrade to Plus
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDisclaimer(true);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/70 transition-colors hover:bg-white/[0.05] hover:text-white"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                About / Disclaimer
              </button>
              <button
                type="button"
                onClick={() => {
                  setBugOpen(true);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/70 transition-colors hover:bg-white/[0.05] hover:text-white"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M8 2l1.88 1.88M14.12 3.88L16 2M9 7.13v-1a3 3 0 0 1 6 0v1" />
                  <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6z" />
                  <path d="M12 20v-9M6.53 9H2M6 13H2M6.53 17H2M17.47 9H22M18 13H22M17.47 17H22" />
                </svg>
                Report a Bug
              </button>
              <div className="my-1 border-t border-white/[0.06]" />
              <button
                type="button"
                onClick={() => {
                  setConfirmAction({ type: "clearHistory" });
                  setSettingsOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-amber-400 transition-colors hover:bg-amber-500/10"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
                Clear All History
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-red-400 transition-colors hover:bg-red-500/10"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {upgradeOpen && (
        <div
          className="animate-overlay-in fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setUpgradeOpen(false)}
        >
          <div
            className="animate-modal-in w-full max-w-lg rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">
                Upgrade to Plus
              </h2>
              <button
                type="button"
                onClick={() => setUpgradeOpen(false)}
                className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
                aria-label="Close"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-white/40">
                  Free
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">₹0</p>
                <p className="mt-1 text-xs text-white/40">/month</p>
                <div className="mt-4 space-y-2">
                  <p className="flex items-center gap-2 text-sm text-white/60">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-3.5 w-3.5 shrink-0 text-emerald-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Talk to AI
                  </p>
                  <p className="flex items-center gap-2 text-sm text-white/60">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-3.5 w-3.5 shrink-0 text-emerald-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    20 messages / day
                  </p>
                  <p className="flex items-center gap-2 text-sm text-white/60">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-3.5 w-3.5 shrink-0 text-emerald-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Basic legal info
                  </p>
                </div>
                <p className="mt-5 rounded-lg border border-white/10 py-2 text-center text-sm text-white/40">
                  Current plan
                </p>
              </div>

              <div className="relative rounded-xl border border-white/20 bg-white/[0.05] p-5">
                <span className="absolute -top-2.5 right-4 rounded-full bg-white px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-black">
                  Popular
                </span>
                <p className="text-xs font-medium uppercase tracking-wider text-white/40">
                  Plus
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">₹999</p>
                <p className="mt-1 text-xs text-white/40">/month</p>
                <div className="mt-4 space-y-2">
                  <p className="flex items-center gap-2 text-sm text-white/60">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-3.5 w-3.5 shrink-0 text-emerald-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Everything in Free
                  </p>
                  <p className="flex items-center gap-2 text-sm text-white/60">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-3.5 w-3.5 shrink-0 text-emerald-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Unlimited messages
                  </p>
                  <p className="flex items-center gap-2 text-sm text-white/60">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-3.5 w-3.5 shrink-0 text-emerald-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Deep Analysis
                  </p>
                  <p className="flex items-center gap-2 text-sm text-white/60">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-3.5 w-3.5 shrink-0 text-emerald-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Case Intake mode
                  </p>
                  <p className="flex items-center gap-2 text-sm text-white/60">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-3.5 w-3.5 shrink-0 text-emerald-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Priority support
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setUpgradeOpen(false)}
                  className="mt-5 w-full rounded-lg bg-white py-2 text-sm font-medium text-black transition-colors hover:bg-white/90"
                >
                  Upgrade now
                </button>
              </div>
            </div>

            <p className="mt-5 text-center text-xs text-white/35">
              14-day free trial. Cancel anytime. No credit card required.
            </p>
          </div>
        </div>
      )}

      {disclaimerOpen && (
        <div
          className="animate-overlay-in fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => {
            setShowDisclaimer(false);
          }}
        >
          <div
            className="animate-modal-in w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">
                About Lawbite
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowDisclaimer(false);
                }}
                className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
                aria-label="Close"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 text-sm leading-relaxed text-white/60">
              <p>
                Lawbite is an AI assistant that provides information about
                Indian laws and the constitution based on web searches. It is
                designed to help you understand legal concepts and find relevant
                information.
              </p>
              <p>
                <span className="font-medium text-white/80">
                  Not legal advice.
                </span>{" "}
                The information provided by Lawbite is for general informational
                purposes only and does not constitute legal advice. Lawbite does
                not create a lawyer&ndash;client relationship.
              </p>
              <p>
                <span className="font-medium text-white/80">
                  Consult a professional.
                </span>{" "}
                For advice specific to your situation, always consult a
                qualified legal professional. Lawbite is a web-search-based AI
                assistant and does not provide legal services.
              </p>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <Link
                href="/legal/disclaimer"
                className="text-xs text-white/40 underline underline-offset-2 transition-colors hover:text-white/70"
              >
                Read full disclaimer
              </Link>
              <button
                type="button"
                onClick={() => {
                  rememberDisclaimerAcceptance(sessionId);
                  setAcceptedThisVisit(true);
                  setShowDisclaimer(false);
                }}
                className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-white/90"
              >
                I understand
              </button>
            </div>
          </div>
        </div>
      )}

      {citationOpen && (
        <div
          className="animate-overlay-in fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setCitationOpen(null)}
        >
          <div
            className="animate-modal-in w-full max-w-lg rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 text-blue-400/80"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {citationOpen.type === "web" ? (
                    <>
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </>
                  ) : (
                    <>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </>
                  )}
                </svg>
                <h2 className="text-sm font-semibold tracking-tight text-white">
                  {citationOpen.type === "web" ? "Web source" : "Legal source"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setCitationOpen(null)}
                className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
                aria-label="Close"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <p className="text-sm font-medium text-white/90">
                {citationOpen.label}
              </p>
              {citationOpen.url && (
                <p className="mt-1 break-all text-xs text-blue-400/80">
                  {citationOpen.url}
                </p>
              )}
            </div>

            <div className="max-h-[40vh] overflow-y-auto rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/70">
                {citationOpen.snippet ||
                  "No preview available for this source."}
              </p>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              {citationOpen.url && (
                <a
                  href={citationOpen.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-blue-400/90 transition-colors hover:bg-blue-500/10 hover:text-blue-300"
                >
                  Open source ↗
                </a>
              )}
              <button
                type="button"
                onClick={async () => {
                  const ok = await copyToClipboard(
                    formatCitation(citationOpen),
                  );
                  setCopiedCitation(ok ? "modal" : null);
                  if (ok) setTimeout(() => setCopiedCitation(null), 1800);
                }}
                className="rounded-lg bg-white/[0.06] px-4 py-2 text-sm text-white/70 transition-colors hover:bg-white/[0.1] hover:text-white"
              >
                {copiedCitation === "modal" ? "Copied" : "Copy citation"}
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => setCitationOpen(null)}
                className="rounded-lg bg-white/[0.06] px-4 py-2 text-sm text-white/70 transition-colors hover:bg-white/[0.1] hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {bugOpen && <ReportBugModal onClose={() => setBugOpen(false)} />}

      {editProfileOpen && (
        <EditProfileModal
          user={user}
          onClose={() => setEditProfileOpen(false)}
          onSaved={(updated) => {
            setUser({ ...user, ...updated });
            setEditProfileOpen(false);
          }}
        />
      )}

      {myCasesOpen && (
        <div
          className="animate-overlay-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setMyCasesOpen(false)}
        >
          <div
            className="animate-modal-in relative flex max-h-[80vh] w-full max-w-lg flex-col rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">
                AI Lawyer
              </h2>
              <button
                type="button"
                onClick={() => setMyCasesOpen(false)}
                className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
                aria-label="Close"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-5 flex gap-3">
              <button
                type="button"
                onClick={startGrill}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-400/90 px-4 py-3 text-sm font-semibold text-black transition-all hover:bg-amber-400"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="7" width="18" height="13" rx="2" />
                  <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <path d="M12 11.5v5M9.5 14h5" />
                </svg>
                Start New Case
              </button>
              <a
                href="/cases"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-sm font-medium text-white/70 transition-all hover:border-white/30 hover:text-white"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                Case Tracker
              </a>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {savedCases.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <svg
                    viewBox="0 0 24 24"
                    className="mb-3 h-10 w-10 text-white/20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                  <p className="text-sm text-white/40">No saved cases yet</p>
                  <p className="mt-1 text-xs text-white/25">
                    Complete a case to save it here
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {savedCases.map((sc) => (
                    <li
                      key={sc.id}
                      className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 transition-colors hover:border-white/20 hover:bg-white/[0.05]"
                    >
                      <button
                        type="button"
                        className="w-full text-left"
                        onClick={() => {
                          // Look for existing conversation or create a view from saved data
                          const existing = conversations.find(
                            (c) => c.id === sc.conversationId,
                          );
                          if (existing) {
                            selectConversation(existing.id);
                          } else {
                            const restored: Conversation = {
                              id: sc.conversationId,
                              title: sc.title,
                              preview: sc.problem,
                              type: "grill",
                              createdAt: sc.date,
                              messages: [
                                {
                                  id: newId("u"),
                                  role: "user",
                                  content: sc.problem,
                                },
                                {
                                  id: newId("a"),
                                  role: "assistant",
                                  content: sc.summary,
                                  type: "grill",
                                },
                              ],
                            };
                            setConversations((prev) => [restored, ...prev]);
                            setActiveId(restored.id);
                            setMode("grill");
                          }
                          setMyCasesOpen(false);
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-white">
                              {sc.title}
                            </p>
                            <p className="mt-0.5 line-clamp-2 text-xs text-white/45">
                              {sc.problem}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-md border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-400/80">
                            {sc.state.slice(0, 10)}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-[10px] text-white/25">
                            {new Date(sc.date).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSavedCases((prev) => {
                                const updated = prev.filter(
                                  (c) => c.id !== sc.id,
                                );
                                saveSavedCases(updated);
                                return updated;
                              });
                            }}
                            className="rounded px-1.5 py-0.5 text-[10px] text-white/25 opacity-0 transition-all hover:text-red-400 group-hover:opacity-100"
                          >
                            Delete
                          </button>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EditProfileModal({
  user,
  onClose,
  onSaved,
}: {
  user: ChatUser;
  onClose: () => void;
  onSaved: (updated: Partial<ChatUser>) => void;
}) {
  const [name, setName] = useState(user.name || "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be under 2 MB");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setError(null);
  }

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name cannot be empty");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("name", trimmed);
      if (avatarFile) formData.append("avatar", avatarFile);

      const res = await fetch("/api/user/profile", {
        method: "PUT",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Failed to update profile");
      }

      const data = await res.json();
      onSaved(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="animate-overlay-in fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-modal-in w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Edit Profile</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Close"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group relative"
          >
            {avatarPreview || user.image ? (
              <Image
                src={avatarPreview || user.image!}
                alt=""
                width={80}
                height={80}
                unoptimized
                className="h-20 w-20 rounded-full border border-white/15 object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/15 bg-white/10 text-2xl text-white/60">
                {(user.name || user.email || "U").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <p className="text-xs text-white/35">
            Click avatar to change (max 2 MB)
          </p>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/50">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-white/25"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/50">
              Email
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full rounded-lg border border-white/10 bg-white/[0.02] px-3.5 py-2.5 text-sm text-white/40"
            />
          </div>
        </div>

        {error && (
          <p className="mt-3 text-center text-xs text-red-400">{error}</p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-white/90 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReportBugModal({ onClose }: { onClose: () => void }) {
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleSubmit() {
    if (!description.trim()) return;
    setSending(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSending(false);
    setSubmitted(true);
  }

  return (
    <div
      className="animate-overlay-in fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-modal-in w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Report a Bug</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Close"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {submitted ? (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6 text-emerald-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-sm font-medium text-white">
              Thank you for your report
            </p>
            <p className="mt-1 text-xs text-white/40">
              We will look into it and get back to you if needed.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 rounded-lg bg-white/[0.06] px-5 py-2 text-sm text-white/70 transition-colors hover:bg-white/[0.1] hover:text-white"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-white/50">
              Describe the issue you encountered. Include steps to reproduce if
              possible.
            </p>
            <div className="space-y-3">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="What happened? What did you expect to happen?"
                className="w-full resize-none rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/25"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email (optional — only if you want a reply)"
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/25"
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!description.trim() || sending}
                className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-white/90 disabled:opacity-40"
              >
                {sending ? "Sending..." : "Submit Report"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
