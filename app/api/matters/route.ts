import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { MatterService } from "@/lib/matter-service";
import type { MatterFilterOptions } from "@/lib/matter-types";

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
    const matterId = searchParams.get("matterId") || searchParams.get("id");

    if (matterId) {
      const workspace = await MatterService.getMatterWorkspace(user.id, matterId);
      if (!workspace) {
        return NextResponse.json({ error: "Matter not found" }, { status: 404 });
      }
      return NextResponse.json(workspace);
    }

    const filter: MatterFilterOptions = {
      status: (searchParams.get("status") as MatterFilterOptions["status"]) || undefined,
      stage: searchParams.get("stage") || undefined,
      priority: searchParams.get("priority") || undefined,
      matterType: searchParams.get("matterType") || undefined,
      query: searchParams.get("query") || searchParams.get("q") || undefined,
      sortBy: (searchParams.get("sortBy") as MatterFilterOptions["sortBy"]) || "createdAt",
      sortOrder: (searchParams.get("sortOrder") as MatterFilterOptions["sortOrder"]) || "desc",
    };

    const matters = await MatterService.listMatters(user.id, filter);
    return NextResponse.json({ matters, total: matters.length });
  } catch (err) {
    console.error("[API] /api/matters GET error:", err);
    return NextResponse.json({ error: "Failed to load matters" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body?.name || typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json({ error: "Matter name is required" }, { status: 400 });
    }

    const matter = await MatterService.createMatter(user.id, {
      name: body.name,
      description: body.description,
      status: body.status,
      stage: body.stage,
      matterType: body.matterType,
      priority: body.priority,
      parties: body.parties,
      court: body.court,
      nextHearing: body.nextHearing,
      notes: body.notes,
    });

    return NextResponse.json(matter, { status: 201 });
  } catch (err) {
    console.error("[API] /api/matters POST error:", err);
    return NextResponse.json({ error: "Failed to create matter" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const matterId = body?.id || body?.matterId;
    if (!matterId || typeof matterId !== "string") {
      return NextResponse.json({ error: "Matter ID is required" }, { status: 400 });
    }

    if (body.archive !== undefined) {
      const ok = await MatterService.setArchiveStatus(user.id, matterId, Boolean(body.archive));
      return NextResponse.json({ ok });
    }

    const ok = await MatterService.updateMatter(user.id, matterId, {
      name: body.name,
      description: body.description,
      status: body.status,
      stage: body.stage,
      matterType: body.matterType,
      priority: body.priority,
      parties: body.parties,
      court: body.court,
      nextHearing: body.nextHearing,
      notes: body.notes,
    });

    return NextResponse.json({ ok });
  } catch (err) {
    console.error("[API] /api/matters PATCH error:", err);
    return NextResponse.json({ error: "Failed to update matter" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const matterId = body?.id || body?.matterId;
    if (!matterId || typeof matterId !== "string") {
      return NextResponse.json({ error: "Matter ID is required" }, { status: 400 });
    }

    const ok = await MatterService.deleteMatter(user.id, matterId);
    return NextResponse.json({ ok });
  } catch (err) {
    console.error("[API] /api/matters DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete matter" }, { status: 500 });
  }
}
