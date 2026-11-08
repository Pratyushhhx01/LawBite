import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { MatterService } from "@/lib/matter-service";

async function getSessionUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user ?? null;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Matter ID is required" }, { status: 400 });
    }

    const workspace = await MatterService.getMatterWorkspace(user.id, id);
    if (!workspace) {
      return NextResponse.json({ error: "Matter not found" }, { status: 404 });
    }

    return NextResponse.json(workspace);
  } catch (err) {
    console.error("[API] /api/matters/[id] GET error:", err);
    return NextResponse.json({ error: "Failed to retrieve matter workspace" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Matter ID is required" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    if (body.archive !== undefined) {
      const ok = await MatterService.setArchiveStatus(user.id, id, Boolean(body.archive));
      return NextResponse.json({ ok });
    }

    const ok = await MatterService.updateMatter(user.id, id, body);
    return NextResponse.json({ ok });
  } catch (err) {
    console.error("[API] /api/matters/[id] PATCH error:", err);
    return NextResponse.json({ error: "Failed to update matter" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Matter ID is required" }, { status: 400 });
    }

    const ok = await MatterService.deleteMatter(user.id, id);
    return NextResponse.json({ ok });
  } catch (err) {
    console.error("[API] /api/matters/[id] DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete matter" }, { status: 500 });
  }
}
