import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

async function getSessionUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const noticeId = searchParams.get("id");

    if (noticeId) {
      const notice = await db
        .selectFrom("legal_notice")
        .selectAll()
        .where("id", "=", noticeId)
        .where("userId", "=", user.id)
        .executeTakeFirst();
      if (!notice) {
        return NextResponse.json(
          { error: "Notice not found" },
          { status: 404 },
        );
      }
      return NextResponse.json({ notice });
    }

    const notices = await db
      .selectFrom("legal_notice")
      .selectAll()
      .where("userId", "=", user.id)
      .orderBy("createdAt", "desc")
      .execute();

    return NextResponse.json({ notices });
  } catch (err) {
    console.error("Notices GET error:", err);
    return NextResponse.json(
      { error: "Failed to load notices" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const recipientName =
      typeof body?.recipientName === "string" ? body.recipientName.trim() : "";
    const subject =
      typeof body?.subject === "string" ? body.subject.trim() : "";
    const content =
      typeof body?.content === "string" ? body.content.trim() : "";

    if (!recipientName || !subject || !content) {
      return NextResponse.json(
        { error: "recipientName, subject, and content are required" },
        { status: 400 },
      );
    }

    const notice = await db
      .insertInto("legal_notice")
      .values({
        id: crypto.randomUUID(),
        userId: user.id,
        caseId: typeof body?.caseId === "string" ? body.caseId : null,
        recipientName,
        recipientEmail:
          typeof body?.recipientEmail === "string"
            ? body.recipientEmail.trim()
            : "",
        recipientAddress:
          typeof body?.recipientAddress === "string"
            ? body.recipientAddress.trim()
            : "",
        subject,
        content,
        status: "draft",
      })
      .returning(["id", "recipientName", "subject", "status", "createdAt"])
      .executeTakeFirst();

    return NextResponse.json(notice, { status: 201 });
  } catch (err) {
    console.error("Notices POST error:", err);
    return NextResponse.json(
      { error: "Failed to create notice" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const id = typeof body?.id === "string" ? body.id : "";
    if (!id) {
      return NextResponse.json({ error: "Missing notice id" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (body.recipientName !== undefined)
      updates.recipientName =
        typeof body.recipientName === "string" ? body.recipientName.trim() : "";
    if (body.recipientEmail !== undefined)
      updates.recipientEmail =
        typeof body.recipientEmail === "string"
          ? body.recipientEmail.trim()
          : "";
    if (body.recipientAddress !== undefined)
      updates.recipientAddress =
        typeof body.recipientAddress === "string"
          ? body.recipientAddress.trim()
          : "";
    if (body.subject !== undefined)
      updates.subject =
        typeof body.subject === "string" ? body.subject.trim() : "";
    if (body.content !== undefined)
      updates.content =
        typeof body.content === "string" ? body.content.trim() : "";
    if (body.status !== undefined) {
      updates.status = body.status;
      if (body.status === "sent") updates.sentAt = new Date();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 },
      );
    }

    await db
      .updateTable("legal_notice")
      .set(updates)
      .where("id", "=", id)
      .where("userId", "=", user.id)
      .execute();

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Notices PATCH error:", err);
    return NextResponse.json(
      { error: "Failed to update notice" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const id = typeof body?.id === "string" ? body.id : "";
    if (!id) {
      return NextResponse.json({ error: "Missing notice id" }, { status: 400 });
    }

    await db
      .deleteFrom("legal_notice")
      .where("id", "=", id)
      .where("userId", "=", user.id)
      .execute();

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Notices DELETE error:", err);
    return NextResponse.json(
      { error: "Failed to delete notice" },
      { status: 500 },
    );
  }
}
