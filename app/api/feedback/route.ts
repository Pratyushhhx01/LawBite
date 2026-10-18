import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { messageId, rating, comment } = body;

    if (!messageId || !rating || !["up", "down"].includes(rating)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    await db
      .insertInto("feedback")
      .values({
        userId: session.user.id,
        messageId,
        rating,
        comment: comment || null,
      })
      .execute();

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Feedback POST error:", err);
    return NextResponse.json(
      { error: "Failed to save feedback" },
      { status: 500 },
    );
  }
}
