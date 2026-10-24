import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { verifyCitations } from "@/lib/citation-verifier";
import { checkRateLimit } from "@/lib/utils";

const MAX_TEXT_LENGTH = 20_000;
const MAX_CITATIONS = 50;
const MAX_LABEL_LENGTH = 500;
const MAX_SNIPPET_LENGTH = 5_000;
const MAX_URL_LENGTH = 2_000;

type CitationInput = {
  type: "act" | "web";
  label: string;
  snippet?: string;
  url?: string;
};

function isCitationInput(value: unknown): value is CitationInput {
  if (!value || typeof value !== "object") return false;
  const citation = value as Record<string, unknown>;
  return (
    (citation.type === "act" || citation.type === "web") &&
    typeof citation.label === "string" &&
    citation.label.length <= MAX_LABEL_LENGTH &&
    (citation.snippet === undefined ||
      (typeof citation.snippet === "string" &&
        citation.snippet.length <= MAX_SNIPPET_LENGTH)) &&
    (citation.url === undefined ||
      (typeof citation.url === "string" &&
        citation.url.length <= MAX_URL_LENGTH))
  );
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limit = checkRateLimit(
      `citation-verify:${session.user.id}`,
      60,
      60_000,
    );
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many verification requests. Please retry shortly." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)),
          },
        },
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const textValue = (body as Record<string, unknown>).text;
    const citationsValue = (body as Record<string, unknown>).citations;

    if (textValue !== undefined && typeof textValue !== "string") {
      return NextResponse.json(
        { error: "text must be a string" },
        { status: 400 },
      );
    }

    if (typeof textValue === "string" && textValue.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `text must be at most ${MAX_TEXT_LENGTH} characters` },
        { status: 400 },
      );
    }

    if (citationsValue !== undefined && !Array.isArray(citationsValue)) {
      return NextResponse.json(
        { error: "citations must be an array" },
        { status: 400 },
      );
    }

    const citations = citationsValue ?? [];
    if (citations.length > MAX_CITATIONS) {
      return NextResponse.json(
        { error: `citations must contain at most ${MAX_CITATIONS} items` },
        { status: 400 },
      );
    }

    if (!citations.every(isCitationInput)) {
      return NextResponse.json(
        { error: "One or more citations are invalid" },
        { status: 400 },
      );
    }

    const text = typeof textValue === "string" ? textValue : "";
    if (!text && citations.length === 0) {
      return NextResponse.json(
        { error: "Provide text or at least one citation" },
        { status: 400 },
      );
    }

    const verification = await verifyCitations({
      text,
      citations: citations.map((citation) => ({
        type: citation.type,
        label: citation.label,
        snippet: citation.snippet ?? "",
        url: citation.url,
      })),
    });
    return NextResponse.json(verification);
  } catch (error) {
    console.error("Citation verification failed:", error);
    return NextResponse.json(
      { error: "Unable to verify citations right now" },
      { status: 500 },
    );
  }
}
