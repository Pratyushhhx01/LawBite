import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, messages, format } = await request.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "messages required" }, { status: 400 });
    }

    const validMessages = messages.filter(
      (m: { role?: string; content?: string }) =>
        m && typeof m.role === "string" && typeof m.content === "string",
    );

    if (format === "txt") {
      let text = `${title || "LawBite Conversation"}\n${"=".repeat(40)}\n\n`;
      for (const m of validMessages) {
        const role = m.role === "user" ? "You" : "LawBite AI";
        text += `${role}:\n${m.content}\n\n`;
      }
      text += `\nExported from LawBite on ${new Date().toLocaleDateString("en-IN")}`;

      return new NextResponse(text, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": `attachment; filename="${(title || "conversation").replace(/[^a-z0-9]/gi, "_")}.txt"`,
        },
      });
    }

    if (format === "json") {
      const data = {
        title: title || "LawBite Conversation",
        exportedAt: new Date().toISOString(),
        messages: validMessages,
      };
      return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${(title || "conversation").replace(/[^a-z0-9]/gi, "_")}.json"`,
        },
      });
    }

    return NextResponse.json(
      { error: "format must be 'txt' or 'json'" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
