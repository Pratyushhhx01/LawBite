import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { S3_BUCKET } from "@/lib/s3";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

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

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const caseId = formData.get("caseId") as string | null;

    if (!file || !caseId) {
      return NextResponse.json(
        { error: "file and caseId are required" },
        { status: 400 },
      );
    }

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File must be under 10MB" },
        { status: 400 },
      );
    }

    const folder = await db
      .selectFrom("case_folder")
      .select("id")
      .where("id", "=", caseId)
      .where("userId", "=", user.id)
      .executeTakeFirst();

    if (!folder) {
      return NextResponse.json(
        { error: "Case folder not found" },
        { status: 404 },
      );
    }

    const ext = file.name.split(".").pop() || "bin";
    const key = `cases/${user.id}/${caseId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

    const arrayBuffer = await file.arrayBuffer();
    const body = Buffer.from(arrayBuffer);

    await s3Client.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: body,
        ContentType: file.type || "application/octet-stream",
      }),
    );

    const fileUrl = `https://${S3_BUCKET}.s3.ap-south-1.amazonaws.com/${key}`;

    return NextResponse.json({ fileUrl, fileName: file.name, fileType: ext });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
