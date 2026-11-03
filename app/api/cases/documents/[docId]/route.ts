import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { S3_BUCKET } from "@/lib/s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      }
    : {}),
});

async function getSessionUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user ?? null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ docId: string }> },
) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { docId } = await params;
    if (!docId) {
      return NextResponse.json({ error: "Document ID required" }, { status: 400 });
    }

    const doc = await db
      .selectFrom("case_document")
      .selectAll()
      .where("id", "=", docId)
      .where("userId", "=", user.id)
      .executeTakeFirst();

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const fileUrl = doc.fileUrl;
    const download = request.nextUrl.searchParams.get("download") === "1";

    // 1. Data URI stored directly in PostgreSQL
    if (fileUrl.startsWith("data:")) {
      const commaIndex = fileUrl.indexOf(",");
      if (commaIndex === -1) {
        return NextResponse.json({ error: "Corrupted document data" }, { status: 500 });
      }
      const meta = fileUrl.slice(5, commaIndex); // e.g. "application/pdf;base64"
      const base64Data = fileUrl.slice(commaIndex + 1);
      const [mimeType] = meta.split(";");
      const buffer = Buffer.from(base64Data, "base64");

      const disposition = download ? "attachment" : "inline";
      const encodedFilename = encodeURIComponent(doc.fileName);

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": mimeType || "application/octet-stream",
          "Content-Disposition": `${disposition}; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`,
          "Cache-Control": "private, max-age=3600",
        },
      });
    }

    // 2. AWS S3 URL
    if (fileUrl.includes(".amazonaws.com/")) {
      const parsedUrl = new URL(fileUrl);
      const key = parsedUrl.pathname.replace(/^\/+/, "");

      try {
        const s3Res = await s3Client.send(
          new GetObjectCommand({
            Bucket: S3_BUCKET,
            Key: key,
          }),
        );

        if (!s3Res.Body) {
          return NextResponse.json({ error: "Empty S3 document" }, { status: 502 });
        }

        const bytes = await s3Res.Body.transformToByteArray();
        const disposition = download ? "attachment" : "inline";
        const encodedFilename = encodeURIComponent(doc.fileName);

        return new NextResponse(Buffer.from(bytes), {
          headers: {
            "Content-Type": s3Res.ContentType || "application/octet-stream",
            "Content-Disposition": `${disposition}; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`,
            "Cache-Control": "private, max-age=3600",
          },
        });
      } catch (s3Err) {
        console.error("Failed to stream from S3:", s3Err);
        return NextResponse.json({ error: "Failed to retrieve from storage" }, { status: 502 });
      }
    }

    // 3. Fallback redirect for other external URLs
    return NextResponse.redirect(new URL(fileUrl, request.url));
  } catch (err) {
    console.error("Document access error:", err);
    return NextResponse.json({ error: "Failed to access document" }, { status: 500 });
  }
}
