import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateCourtroomPrepBrief } from "@/lib/courtroom-prep";
import { MatterService } from "@/lib/matter-service";

async function getSessionUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user ?? null;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    const body = await request.json().catch(() => null);

    const facts = body?.caseFacts || body?.facts || body?.content;
    if (!facts || typeof facts !== "string" || !facts.trim()) {
      return NextResponse.json(
        { error: "Case facts are required for courtroom preparation" },
        { status: 400 },
      );
    }

    const brief = await generateCourtroomPrepBrief({
      caseTitle: body?.caseTitle || body?.title,
      courtForum: body?.courtForum || body?.court,
      caseFacts: facts,
      parties: body?.parties,
    });

    // If matterId is provided and user is authenticated, save into matter workspace
    let savedReport = null;
    if (user && body?.matterId) {
      try {
        savedReport = await MatterService.saveMatterReport(
          user.id,
          body.matterId,
          "courtroom_prep",
          `Courtroom Preparation Brief: ${brief.caseTitle}`,
          `Courtroom prep brief with ${brief.legalIssues.length} issue(s) and ${brief.authoritativePrecedents.length} verified precedent(s).`,
          brief,
        );
      } catch (saveErr) {
        console.error("[API] Failed to auto-save courtroom brief to matter:", saveErr);
      }
    }

    return NextResponse.json({
      brief,
      savedToMatter: savedReport ? { id: savedReport.id, matterId: body.matterId } : null,
    });
  } catch (error) {
    console.error("[API] /api/courtroom/prep error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate courtroom preparation brief",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
