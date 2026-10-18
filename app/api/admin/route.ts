import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter((e) => e.length > 0);

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email?.toLowerCase() || "";
    if (!ADMIN_EMAILS.includes(email) && ADMIN_EMAILS.length > 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [
      userCount,
      conversationCount,
      feedbackStats,
      recentConversations,
      feedbackByRating,
      recentFeedback,
    ] = await Promise.all([
      db
        .selectFrom("user")
        .select(db.fn.count("id").as("count"))
        .executeTakeFirst(),
      db
        .selectFrom("conversation")
        .select(db.fn.count("id").as("count"))
        .executeTakeFirst(),
      db
        .selectFrom("feedback")
        .select([
          db.fn.count("id").as("total"),
          db.fn.count("id").filterWhere("rating", "=", "up").as("positive"),
          db.fn.count("id").filterWhere("rating", "=", "down").as("negative"),
        ])
        .executeTakeFirst(),
      db
        .selectFrom("conversation")
        .select(["id", "title", "type", "createdAt"])
        .orderBy("createdAt", "desc")
        .limit(20)
        .execute(),
      db
        .selectFrom("feedback")
        .select(["rating", db.fn.count("id").as("count")])
        .groupBy("rating")
        .execute(),
      db
        .selectFrom("feedback")
        .select(["id", "messageId", "rating", "comment", "createdAt"])
        .orderBy("createdAt", "desc")
        .limit(20)
        .execute(),
    ]);

    return NextResponse.json({
      stats: {
        totalUsers: Number(userCount?.count || 0),
        totalConversations: Number(conversationCount?.count || 0),
        totalFeedback: Number(feedbackStats?.total || 0),
        positiveFeedback: Number(feedbackStats?.positive || 0),
        negativeFeedback: Number(feedbackStats?.negative || 0),
      },
      feedbackByRating: feedbackByRating.map((r) => ({
        rating: r.rating,
        count: Number(r.count),
      })),
      recentConversations,
      recentFeedback,
    });
  } catch (error) {
    console.error("Admin API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin data" },
      { status: 500 },
    );
  }
}
