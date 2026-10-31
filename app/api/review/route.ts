import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/utils";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_TEXT_LENGTH = 8000;

const IMAGE_MIME_BY_EXT: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  bmp: "image/bmp",
  tiff: "image/tiff",
  svg: "image/svg+xml",
};

const DOCX_EXTS = [".docx", ".doc"];

function getExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf(".");
  return lastDot !== -1 ? fileName.substring(lastDot + 1).toLowerCase() : "";
}

function resolveMimeAndCategory(file: File): {
  category: "pdf" | "image" | "docx" | "unsupported";
  mimeType: string;
} {
  const type = (file.type || "").toLowerCase().trim();
  const ext = getExtension(file.name);

  // 1. PDF detection
  if (type === "application/pdf" || ext === "pdf") {
    return { category: "pdf", mimeType: "application/pdf" };
  }

  // 2. Image detection
  if (type.startsWith("image/") || IMAGE_MIME_BY_EXT[ext]) {
    const mimeType = type.startsWith("image/") ? type : IMAGE_MIME_BY_EXT[ext];
    return { category: "image", mimeType };
  }

  // 3. Word document detection
  if (
    type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    type === "application/msword" ||
    DOCX_EXTS.some((e) => file.name.toLowerCase().endsWith(e))
  ) {
    return {
      category: "docx",
      mimeType:
        type ||
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };
  }

  return { category: "unsupported", mimeType: type || "unknown" };
}

export async function POST(request: NextRequest) {
  try {
    let session = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        session = await auth.api.getSession({
          headers: request.headers,
        });
        break;
      } catch (authErr) {
        if (attempt === 0) {
          await new Promise((r) => setTimeout(r, 200));
          continue;
        }
        console.error("Auth getSession error in /api/review:", authErr);
        session = null;
      }
    }

    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitKey = `review:${session.user.id}`;
    const { allowed, retryAfterMs } = checkRateLimit(rateLimitKey, 10, 60_000);
    if (!allowed) {
      return Response.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) },
        },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        { error: "File size must be under 10MB" },
        { status: 400 },
      );
    }

    const { category, mimeType } = resolveMimeAndCategory(file);

    if (category === "unsupported") {
      return Response.json(
        {
          error:
            "Unsupported file type. Please upload a PDF, Word document, or image (PNG, JPEG, WebP, GIF).",
        },
        { status: 400 },
      );
    }

    if (category === "pdf") {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const parser = new PDFParse({ data: buffer });
      let data;
      try {
        data = await parser.getText();
      } finally {
        await parser.destroy();
      }

      // Strip page marker comments like "\n\n-- 1 of 2 --\n\n" produced by PDFParse
      const rawText = (data.text ?? "").replace(/\n\s*--\s*\d+\s+of\s+\d+\s*--\s*\n/g, "\n");
      let text = rawText.trim();
      const truncated = text.length > MAX_TEXT_LENGTH;
      if (truncated) {
        text = text.substring(0, MAX_TEXT_LENGTH);
      }

      return Response.json({
        text,
        fileName: file.name,
        pageCount: data.total ?? 0,
        truncated,
      });
    }

    if (category === "docx") {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const result = await mammoth.extractRawText({ buffer });
      let text = result.value?.trim() ?? "";
      const truncated = text.length > MAX_TEXT_LENGTH;
      if (truncated) {
        text = text.substring(0, MAX_TEXT_LENGTH);
      }
      return Response.json({
        text,
        fileName: file.name,
        truncated,
      });
    }

    if (category === "image") {
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");

      return Response.json({
        imageBase64: `data:${mimeType};base64,${base64}`,
        fileName: file.name,
        type: "image",
      });
    }

    return Response.json({ error: "Unsupported file type" }, { status: 400 });
  } catch (error) {
    console.error("Review error:", error);
    const message =
      error instanceof Error &&
      /XRef|PDF|corrupt|invalid|parse|format/i.test(error.message)
        ? "The PDF file is corrupted or could not be read. Please try a different PDF, or convert it to an image (PNG/JPEG) and upload that."
        : error instanceof Error && error.message
          ? error.message
          : "Failed to process file";
    return Response.json({ error: message }, { status: 422 });
  }
}
