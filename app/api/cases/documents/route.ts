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
    const caseId = searchParams.get("caseId");
    if (!caseId) {
      return NextResponse.json(
        { error: "caseId is required" },
        { status: 400 },
      );
    }

    const docs = await db
      .selectFrom("case_document")
      .selectAll()
      .where("caseId", "=", caseId)
      .where("userId", "=", user.id)
      .orderBy("createdAt", "desc")
      .execute();

    return NextResponse.json({ documents: docs });
  } catch (err) {
    console.error("Case documents GET error:", err);
    return NextResponse.json(
      { error: "Failed to load documents" },
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
    const caseId = typeof body?.caseId === "string" ? body.caseId : "";
    const fileName =
      typeof body?.fileName === "string" ? body.fileName.trim() : "";
    const fileType =
      typeof body?.fileType === "string" ? body.fileType.trim() : "";
    const fileUrl =
      typeof body?.fileUrl === "string" ? body.fileUrl.trim() : "";

    if (!caseId || !fileName || !fileType || !fileUrl) {
      return NextResponse.json(
        { error: "caseId, fileName, fileType, and fileUrl are required" },
        { status: 400 },
      );
    }

    const folder = await db
      .selectFrom("case_folder")
      .select("id")
      .where("id", "=", caseId)
      .where("userId", "=", user.id)
      .executeTakeFirst();

    if (!folder) {
      return NextResponse.json(
        { error: "Case folder not found" },
        { status: 404 },
      );
    }

    const doc = await db
      .insertInto("case_document")
      .values({
        id: crypto.randomUUID(),
        caseId,
        userId: user.id,
        fileName,
        fileType,
        fileUrl,
      })
      .returning(["id", "fileName", "fileType", "fileUrl", "createdAt"])
      .executeTakeFirst();

    return NextResponse.json(doc, { status: 201 });
  } catch (err) {
    console.error("Case documents POST error:", err);
    return NextResponse.json(
      { error: "Failed to add document" },
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
      return NextResponse.json(
        { error: "Missing document id" },
        { status: 400 },
      );
    }

    await db
      .deleteFrom("case_document")
      .where("id", "=", id)
      .where("userId", "=", user.id)
      .execute();

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Case documents DELETE error:", err);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 },
    );
  }
}
