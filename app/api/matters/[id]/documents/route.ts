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
    if (!body?.fileName || !body?.fileUrl) {
      return NextResponse.json(
        { error: "fileName and fileUrl are required" },
        { status: 400 },
      );
    }

    const doc = await MatterService.addDocumentVersion(user.id, matterId, {
      fileName: body.fileName,
      fileType: body.fileType || "pdf",
      fileUrl: body.fileUrl,
      fileSize: body.fileSize,
      docType: body.docType,
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message.includes("unauthorized")) {
      return NextResponse.json({ error: "Matter not found or unauthorized" }, { status: 404 });
    }
    console.error("[API] /api/matters/[id]/documents POST error:", err);
    return NextResponse.json({ error: "Failed to add document version" }, { status: 500 });
  }
}
