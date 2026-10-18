import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reminders = await db
      .selectFrom("reminder")
      .select(["id", "title", "deadlineAt", "type", "completed", "createdAt"])
      .where("userId", "=", session.user.id)
      .orderBy("deadlineAt", "asc")
      .execute();

    return NextResponse.json(reminders);
  } catch (err) {
    console.error("Reminders GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch reminders" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, deadlineAt, type } = body;

    if (!title || !deadlineAt) {
      return NextResponse.json(
        { error: "Title and deadline are required" },
        { status: 400 },
      );
    }

    const result = await db
      .insertInto("reminder")
      .values({
        userId: session.user.id,
        title,
        deadlineAt: new Date(deadlineAt),
        type: type || "other",
      })
      .returning([
        "id",
        "title",
        "deadlineAt",
        "type",
        "completed",
        "createdAt",
      ])
      .executeTakeFirst();

    return NextResponse.json(result);
  } catch (err) {
    console.error("Reminders POST error:", err);
    return NextResponse.json(
      { error: "Failed to create reminder" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    await db
      .deleteFrom("reminder")
      .where("id", "=", id)
      .where("userId", "=", session.user.id)
      .execute();

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Reminders DELETE error:", err);
    return NextResponse.json(
      { error: "Failed to delete reminder" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, completed } = body;

    if (!id || typeof completed !== "boolean") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    await db
      .updateTable("reminder")
      .set({ completed })
      .where("id", "=", id)
      .where("userId", "=", session.user.id)
      .execute();

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Reminders PATCH error:", err);
    return NextResponse.json(
      { error: "Failed to update reminder" },
      { status: 500 },
    );
  }
}
