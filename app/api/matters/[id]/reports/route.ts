import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { MatterService } from "@/lib/matter-service";

async function getSessionUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user ?? null;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: matterId } = await context.params;
    if (!matterId) {
      return NextResponse.json({ error: "Matter ID is required" }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    if (!body?.reportType || !body?.title || !body?.reportData) {
      return NextResponse.json(
        { error: "reportType, title, and reportData are required" },
        { status: 400 },
      );
    }

    const report = await MatterService.saveMatterReport(
      user.id,
      matterId,
      body.reportType,
      body.title,
      body.summary || "",
      body.reportData,
    );

    return NextResponse.json(report, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message.includes("unauthorized")) {
      return NextResponse.json({ error: "Matter not found or unauthorized" }, { status: 404 });
    }
    console.error("[API] /api/matters/[id]/reports POST error:", err);
    return NextResponse.json({ error: "Failed to save report" }, { status: 500 });
  }
}
