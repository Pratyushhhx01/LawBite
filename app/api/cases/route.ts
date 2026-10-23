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
    const withConversations = searchParams.get("withConversations") === "true";
    const caseId = searchParams.get("caseId");

    if (caseId) {
      const folder = await db
        .selectFrom("case_folder")
        .selectAll()
        .where("id", "=", caseId)
        .where("userId", "=", user.id)
        .executeTakeFirst();

      if (!folder) {
        return NextResponse.json({ error: "Case not found" }, { status: 404 });
      }

      let documents: unknown[] = [];
      try {
        documents = await db
          .selectFrom("case_document")
          .selectAll()
          .where("caseId", "=", caseId)
          .orderBy("createdAt", "desc")
          .execute();
      } catch (docErr) {
        console.error("Documents query failed:", docErr);
      }

      let conversations: unknown[] = [];
      try {
        conversations = await db
          .selectFrom("conversation")
          .select(["id", "title", "preview", "type", "updatedAt"])
          .where("folderId", "=", caseId)
          .where("userId", "=", user.id)
          .execute();
      } catch (convErr) {
        console.error("Conversations query failed:", convErr);
      }

      return NextResponse.json({ folder, documents, conversations });
    }

    const folders = await db
      .selectFrom("case_folder")
      .selectAll()
      .where("userId", "=", user.id)
      .orderBy("createdAt", "desc")
      .execute();

    if (!withConversations) {
      return NextResponse.json({ folders });
    }

    const convs = await db
      .selectFrom("conversation")
      .select(["id", "title", "preview", "type", "folderId", "updatedAt"])
      .where("userId", "=", user.id)
      .where("folderId", "is not", null)
      .execute();

    const byFolder: Record<string, unknown[]> = {};
    for (const c of convs) {
      if (!c.folderId) continue;
      (byFolder[c.folderId] ??= []).push({
        id: c.id,
        title: c.title,
        preview: c.preview,
        type: c.type,
        updatedAt: new Date(c.updatedAt).getTime(),
      });
    }

    return NextResponse.json({ folders, byFolder });
  } catch (err) {
    console.error("Cases GET error:", err);
    return NextResponse.json(
      { error: "Failed to load case folders" },
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
    const name =
      typeof body?.name === "string" ? body.name.trim().slice(0, 120) : "";
    if (!name) {
      return NextResponse.json(
        { error: "Folder name is required" },
        { status: 400 },
      );
    }

    const folder = await db
      .insertInto("case_folder")
      .values({
        id: crypto.randomUUID(),
        userId: user.id,
        name,
        description:
          typeof body?.description === "string"
            ? body.description.trim().slice(0, 2000)
            : "",
        status: typeof body?.status === "string" ? body.status : "active",
        parties:
          typeof body?.parties === "string"
            ? body.parties.trim().slice(0, 1000)
            : "",
        court:
          typeof body?.court === "string"
            ? body.court.trim().slice(0, 500)
            : "",
        nextHearing: body?.nextHearing ? new Date(body.nextHearing) : null,
        notes:
          typeof body?.notes === "string"
            ? body.notes.trim().slice(0, 5000)
            : "",
      })
      .returning([
        "id",
        "name",
        "description",
        "status",
        "parties",
        "court",
        "nextHearing",
        "notes",
        "createdAt",
      ])
      .executeTakeFirst();

    return NextResponse.json(folder, { status: 201 });
  } catch (err) {
    console.error("Cases POST error:", err);
    return NextResponse.json(
      { error: "Failed to create case folder" },
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
      return NextResponse.json({ error: "Missing folder id" }, { status: 400 });
    }

    if (
      body.name !== undefined ||
      body.description !== undefined ||
      body.status !== undefined ||
      body.parties !== undefined ||
      body.court !== undefined ||
      body.notes !== undefined ||
      body.nextHearing !== undefined
    ) {
      const updates: Record<string, unknown> = {};
      if (body.name !== undefined)
        updates.name =
          typeof body.name === "string" ? body.name.trim().slice(0, 120) : "";
      if (body.description !== undefined)
        updates.description =
          typeof body.description === "string"
            ? body.description.trim().slice(0, 2000)
            : "";
      if (body.status !== undefined)
        updates.status =
          typeof body.status === "string" ? body.status : "active";
      if (body.parties !== undefined)
        updates.parties =
          typeof body.parties === "string"
            ? body.parties.trim().slice(0, 1000)
            : "";
      if (body.court !== undefined)
        updates.court =
          typeof body.court === "string" ? body.court.trim().slice(0, 500) : "";
      if (body.notes !== undefined)
        updates.notes =
          typeof body.notes === "string"
            ? body.notes.trim().slice(0, 5000)
            : "";
      if (body.nextHearing !== undefined)
        updates.nextHearing = body.nextHearing
          ? new Date(body.nextHearing)
          : null;

      if (Object.keys(updates).length > 0) {
        await db
          .updateTable("case_folder")
          .set(updates)
          .where("id", "=", id)
          .where("userId", "=", user.id)
          .execute();
      }
      return NextResponse.json({ ok: true });
    }

    if (
      body.assignConversationId !== undefined ||
      body.conversationIds !== undefined
    ) {
      const ids = Array.isArray(body.conversationIds)
        ? body.conversationIds.filter(
            (i: unknown): i is string => typeof i === "string",
          )
        : body.assignConversationId
          ? [String(body.assignConversationId)]
          : [];
      const folderId = body.clear === true ? null : id;
      for (const convId of ids) {
        await db
          .updateTable("conversation")
          .set({ folderId })
          .where("id", "=", convId)
          .where("userId", "=", user.id)
          .execute();
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  } catch (err) {
    console.error("Cases PATCH error:", err);
    return NextResponse.json(
      { error: "Failed to update case folder" },
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
      return NextResponse.json({ error: "Missing folder id" }, { status: 400 });
    }

    await db.transaction().execute(async (trx) => {
      await trx
        .updateTable("conversation")
        .set({ folderId: null })
        .where("folderId", "=", id)
        .where("userId", "=", user.id)
        .execute();
      await trx
        .deleteFrom("case_document")
        .where("caseId", "=", id)
        .where("userId", "=", user.id)
        .execute();
      await trx
        .deleteFrom("case_folder")
        .where("id", "=", id)
        .where("userId", "=", user.id)
        .execute();
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Cases DELETE error:", err);
    return NextResponse.json(
      { error: "Failed to delete case folder" },
      { status: 500 },
    );
  }
}
