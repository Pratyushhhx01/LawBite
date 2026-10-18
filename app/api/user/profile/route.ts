import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { s3Client, S3_BUCKET } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";

export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const name = formData.get("name") as string | null;
    const avatar = formData.get("avatar") as File | null;

    let imageUrl: string | undefined;

    if (avatar && avatar.size > 0) {
      const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB
      if (avatar.size > MAX_AVATAR_SIZE) {
        return NextResponse.json(
          { error: "Avatar must be under 5MB" },
          { status: 400 },
        );
      }

      const allowedImageTypes = [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/webp",
      ];
      if (!allowedImageTypes.includes(avatar.type)) {
        return NextResponse.json(
          { error: "Avatar must be PNG, JPEG, or WebP" },
          { status: 400 },
        );
      }

      const extMap: Record<string, string> = {
        "image/png": "png",
        "image/jpeg": "jpg",
        "image/jpg": "jpg",
        "image/webp": "webp",
      };
      const ext = extMap[avatar.type] || "jpg";
      const key = `avatars/${session.user.id}.${ext}`;

      const bytes = await avatar.arrayBuffer();
      await s3Client.send(
        new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: key,
          Body: Buffer.from(bytes),
          ContentType: avatar.type,
        }),
      );

      imageUrl = `https://${S3_BUCKET}.s3.${process.env.AWS_REGION || "ap-south-1"}.amazonaws.com/${key}`;
    }

    const updateData: Record<string, string> = {};
    if (name !== null && name !== undefined && name.trim().length > 0) {
      if (name.length > 100) {
        return NextResponse.json(
          { error: "Name must be under 100 characters" },
          { status: 400 },
        );
      }
      updateData.name = name.trim();
    }
    if (imageUrl) updateData.image = imageUrl;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    await auth.api.updateUser({
      body: updateData,
      headers: request.headers,
    });

    return NextResponse.json({
      user: {
        name: updateData.name ?? session.user.name,
        image: updateData.image ?? session.user.image,
      },
    });
  } catch (err) {
    console.error("Profile update error:", err);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
