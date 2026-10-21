import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  createSharedChat,
  getSharedChat,
  isShareId,
  resolvePublicOrigin,
} from "@/lib/shares";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const conversationId =
      body && typeof body.conversationId === "string"
        ? body.conversationId
        : null;

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId required" },
        { status: 400 },
      );
    }

    // Optional: share just one message instead of the whole conversation.
    const messageId =
      body && typeof body.messageId === "string" && body.messageId.trim()
        ? body.messageId.trim()
        : null;

    const shared = await createSharedChat({
      userId: session.user.id,
      userName: session.user.name,
      conversationId,
      messageId,
    });

    if (!shared) {
      return NextResponse.json(
        {
          error: messageId
            ? "Message not found or not shareable"
            : "Conversation not found or empty",
        },
        { status: 404 },
      );
    }

    const origin = resolvePublicOrigin(
      request.url,
      process.env.NEXT_PUBLIC_APP_URL,
    );

    return NextResponse.json({
      shareId: shared.shareId,
      url: `${origin}/shared/${shared.shareId}`,
    });
  } catch (error) {
    console.error("Share error:", error);
    return NextResponse.json({ error: "Failed to share" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const shareId = url.searchParams.get("id");

    if (!shareId) {
      return NextResponse.json({ error: "Share ID required" }, { status: 400 });
    }

    if (!isShareId(shareId)) {
      return NextResponse.json(
        { error: "Share link expired or invalid" },
        { status: 404 },
      );
    }

    const data = await getSharedChat(shareId);
    if (!data) {
      return NextResponse.json(
        { error: "Share link expired or invalid" },
        { status: 404 },
      );
    }

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  } catch (error) {
    console.error("Get share error:", error);
    return NextResponse.json(
      { error: "Failed to load shared conversation" },
      { status: 500 },
    );
  }
}
