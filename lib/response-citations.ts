import type { Citation } from "@/lib/citations";
import type { CitationVerificationSummary } from "@/lib/citation-verifier";

/**
 * Attach a verification state to the citations that are sent to the browser.
 *
 * The chat route already knows which act/section each citation refers to, but
 * until now "verified" was only available through the separate
 * `/api/citations/verify` endpoint. This module closes that gap: every chat
 * response is checked against the S3 bare acts while the answer streams, and
 * the Sources strip can show a verified badge instead of an unqualified claim.
 *
 * State rules:
 * - `verified`    the section exists in the named bare act (or a trusted web source)
 * - `not_found`   a section was named but the bare act does not contain it
 * - `unavailable` the knowledge base lookup failed; this is NOT a hallucination
 * - `undefined`   the citation is an act reference without a section, or was not
 *                 part of the structured set that could be checked
 *
 * Keeping `lookup_error` separate is deliberate: an S3 outage must never be
 * reported as a model hallucination (see docs/architecture.md invariants).
 */

export type CitationVerificationState =
  "verified" | "not_found" | "unavailable";

export type DisplayCitation = Citation & {
  verification?: CitationVerificationState;
};

export type CitationPayload = {
  citations: DisplayCitation[];
  summary: CitationVerificationSummary | null;
};

type VerifierResult = {
  type: "act" | "web";
  label: string;
  url?: string;
  verified: boolean;
  reason: string;
  source: "text" | "structured";
};

export type CitationVerifier = (input: { citations: Citation[] }) => Promise<{
  results: VerifierResult[];
  summary: CitationVerificationSummary;
}>;

/** Verification must never delay the end of a response by more than this. */
export const DEFAULT_CITATION_VERIFY_TIMEOUT_MS = 4_000;

function citationKey(type: "act" | "web", label: string, url?: string): string {
  return `${type}|${label}|${url ?? ""}`.toLowerCase();
}

/**
 * Pure mapping step: given verification results, mark the citations that were
 * actually checked. Exported so tests can cover the state mapping without S3.
 */
export function annotateCitations(
  citations: Citation[],
  results: VerifierResult[],
): DisplayCitation[] {
  const byKey = new Map<string, VerifierResult>();

  for (const result of results) {
    if (result.source !== "structured" || result.type !== "act") continue;
    byKey.set(citationKey(result.type, result.label, result.url), result);
  }

  return citations.map((citation) => {
    if (citation.type !== "act") return citation;

    const match = byKey.get(
      citationKey(citation.type, citation.label, citation.url),
    );
    if (!match) return citation;

    if (match.verified) {
      return { ...citation, verification: "verified" as const };
    }
    if (match.reason === "lookup_error") {
      return { ...citation, verification: "unavailable" as const };
    }
    if (match.reason === "section_not_found") {
      return { ...citation, verification: "not_found" as const };
    }
    // Act references without a parsed section are not a correctness signal.
    return citation;
  });
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Verify structured citations against the bare acts.
 *
 * The real verifier is imported lazily so importing this module never
 * initialises AWS credentials, and tests can inject a fake verifier.
 */
export async function verifyResponseCitations(
  citations: Citation[],
  options: {
    timeoutMs?: number;
    verify?: CitationVerifier;
    onError?: (error: unknown) => void;
  } = {},
): Promise<CitationPayload> {
  if (!citations.some((citation) => citation.type === "act")) {
    return { citations, summary: null };
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_CITATION_VERIFY_TIMEOUT_MS;

  try {
    const verify =
      options.verify ??
      ((await import("@/lib/citation-verifier"))
        .verifyCitations as CitationVerifier);

    const verification = await withTimeout(verify({ citations }), timeoutMs);

    if (!verification) {
      options.onError?.(
        new Error(`citation verification timed out after ${timeoutMs}ms`),
      );
      return { citations, summary: null };
    }

    return {
      citations: annotateCitations(citations, verification.results),
      summary: verification.summary,
    };
  } catch (error) {
    options.onError?.(error);
    return { citations, summary: null };
  }
}
