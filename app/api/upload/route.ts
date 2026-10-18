import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { parseDocument } from "@/lib/parse-document";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 },
      );
    }

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];
    const lower = file.name.toLowerCase();
    const isValidType =
      allowedTypes.includes(file.type) ||
      lower.endsWith(".pdf") ||
      lower.endsWith(".docx") ||
      lower.endsWith(".doc");
    if (!isValidType) {
      return NextResponse.json(
        {
          error: "Unsupported file type. Please upload a PDF or Word document.",
        },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const text = await parseDocument(buffer, file.name);

    if (!text.trim()) {
      return NextResponse.json(
        { error: "Could not extract text from the document." },
        { status: 400 },
      );
    }

    const MAX_CHARS = 15000;
    const truncated =
      text.length > MAX_CHARS
        ? text.slice(0, MAX_CHARS) + "\n\n[Truncated...]"
        : text;

    return NextResponse.json({
      text: truncated,
      fileName: file.name,
      charCount: truncated.length,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to process document." },
      { status: 500 },
    );
  }
}
