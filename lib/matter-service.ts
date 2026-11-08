import { db } from "@/lib/db";
import type {
  LegalMatter,
  MatterActivity,
  MatterDocument,
  MatterFilterOptions,
  MatterReminder,
  MatterReport,
  MatterWorkspace,
} from "./matter-types";

/**
 * Matter Management Service
 * Provides complete lifecycle management for Indian legal matters,
 * dedicated workspaces, activity tracking, and report linking.
 */
export class MatterService {
  /**
   * List all legal matters for a user with flexible filtering & search.
   */
  public static async listMatters(
    userId: string,
    filter: MatterFilterOptions = {},
  ): Promise<LegalMatter[]> {
    let query = db
      .selectFrom("case_folder")
      .selectAll()
      .where("userId", "=", userId);

    if (filter.status && filter.status !== "all") {
      query = query.where("status", "=", filter.status);
    }
    if (filter.stage) {
      query = query.where("stage", "=", filter.stage);
    }
    if (filter.priority) {
      query = query.where("priority", "=", filter.priority);
    }
    if (filter.matterType) {
      query = query.where("matterType", "=", filter.matterType);
    }

    const sortCol = filter.sortBy || "createdAt";
    const sortDir = filter.sortOrder || "desc";
    query = query.orderBy(sortCol, sortDir);

    const rows = await query.execute();

    let results: LegalMatter[] = rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      name: r.name,
      description: r.description || "",
      status: (r.status as LegalMatter["status"]) || "active",
      stage: (r.stage as LegalMatter["stage"]) || "Pre-litigation",
      matterType: r.matterType || "General",
      priority: (r.priority as LegalMatter["priority"]) || "Medium",
      parties: r.parties || "",
      court: r.court || "",
      nextHearing: r.nextHearing ? new Date(r.nextHearing).toISOString() : null,
      notes: r.notes || "",
      createdAt: new Date(r.createdAt).toISOString(),
    }));

    if (filter.query) {
      const q = filter.query.toLowerCase().trim();
      results = results.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.parties.toLowerCase().includes(q) ||
          m.court.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q),
      );
    }

    return results;
  }

  /**
   * Get dedicated workspace for a specific matter.
   */
  public static async getMatterWorkspace(
    userId: string,
    matterId: string,
  ): Promise<MatterWorkspace | null> {
    const matterRow = await db
      .selectFrom("case_folder")
      .selectAll()
      .where("id", "=", matterId)
      .where("userId", "=", userId)
      .executeTakeFirst();

    if (!matterRow) return null;

    const matter: LegalMatter = {
      id: matterRow.id,
      userId: matterRow.userId,
      name: matterRow.name,
      description: matterRow.description || "",
      status: (matterRow.status as LegalMatter["status"]) || "active",
      stage: (matterRow.stage as LegalMatter["stage"]) || "Pre-litigation",
      matterType: matterRow.matterType || "General",
      priority: (matterRow.priority as LegalMatter["priority"]) || "Medium",
      parties: matterRow.parties || "",
      court: matterRow.court || "",
      nextHearing: matterRow.nextHearing
        ? new Date(matterRow.nextHearing).toISOString()
        : null,
      notes: matterRow.notes || "",
      createdAt: new Date(matterRow.createdAt).toISOString(),
    };

    // 1. Documents
    const docRows = await db
      .selectFrom("case_document")
      .selectAll()
      .where("caseId", "=", matterId)
      .where("userId", "=", userId)
      .orderBy("createdAt", "desc")
      .execute();

    const documents: MatterDocument[] = docRows.map((d) => ({
      id: d.id,
      caseId: d.caseId,
      userId: d.userId,
      fileName: d.fileName,
      fileType: d.fileType,
      fileUrl: d.fileUrl,
      version: d.version || 1,
      docType: d.docType || "general",
      fileSize: d.fileSize || 0,
      createdAt: new Date(d.createdAt).toISOString(),
    }));

    // 2. Linked conversations
    const convRows = await db
      .selectFrom("conversation")
      .select(["id", "title", "preview", "type", "updatedAt"])
      .where("folderId", "=", matterId)
      .where("userId", "=", userId)
      .orderBy("updatedAt", "desc")
      .execute();

    const conversations = convRows.map((c) => ({
      id: c.id,
      title: c.title,
      preview: c.preview || "",
      type: c.type,
      updatedAt: new Date(c.updatedAt).toISOString(),
    }));

    // 3. AI Generated Reports
    const reportRows = await db
      .selectFrom("matter_report")
      .selectAll()
      .where("matterId", "=", matterId)
      .where("userId", "=", userId)
      .orderBy("createdAt", "desc")
      .execute();

    const reports: MatterReport[] = reportRows.map((r) => ({
      id: r.id,
      matterId: r.matterId,
      userId: r.userId,
      reportType: r.reportType as MatterReport["reportType"],
      title: r.title,
      summary: r.summary,
      reportData: r.reportData,
      createdAt: new Date(r.createdAt).toISOString(),
    }));

    // 4. Activity history
    const activityRows = await db
      .selectFrom("matter_activity")
      .selectAll()
      .where("matterId", "=", matterId)
      .where("userId", "=", userId)
      .orderBy("createdAt", "desc")
      .execute();

    const activities: MatterActivity[] = activityRows.map((a) => ({
      id: a.id,
      matterId: a.matterId,
      userId: a.userId,
      activityType: a.activityType as MatterActivity["activityType"],
      description: a.description,
      metadata: a.metadata as Record<string, unknown> | undefined,
      createdAt: new Date(a.createdAt).toISOString(),
    }));

    // 5. Linked Reminders
    const reminderRows = await db
      .selectFrom("reminder")
      .selectAll()
      .where("userId", "=", userId)
      .where("title", "ilike", `%${matter.name}%`)
      .orderBy("deadlineAt", "asc")
      .execute();

    const reminders: MatterReminder[] = reminderRows.map((rem) => ({
      id: rem.id,
      userId: rem.userId,
      title: rem.title,
      deadlineAt: new Date(rem.deadlineAt).toISOString(),
      type: rem.type,
      completed: rem.completed || false,
      createdAt: new Date(rem.createdAt).toISOString(),
    }));

    return {
      matter,
      documents,
      conversations,
      reports,
      activities,
      reminders,
    };
  }

  /**
   * Create a new legal matter and record initial activity.
   */
  public static async createMatter(
    userId: string,
    data: {
      name: string;
      description?: string;
      status?: LegalMatter["status"];
      stage?: LegalMatter["stage"];
      matterType?: string;
      priority?: LegalMatter["priority"];
      parties?: string;
      court?: string;
      nextHearing?: string | null;
      notes?: string;
    },
  ): Promise<LegalMatter> {
    const id = crypto.randomUUID();
    const nextHearingDate = data.nextHearing ? new Date(data.nextHearing) : null;

    const row = await db
      .insertInto("case_folder")
      .values({
        id,
        userId,
        name: data.name.trim().slice(0, 120),
        description: (data.description || "").trim().slice(0, 2000),
        status: data.status || "active",
        stage: data.stage || "Pre-litigation",
        matterType: data.matterType || "General",
        priority: data.priority || "Medium",
        parties: (data.parties || "").trim().slice(0, 1000),
        court: (data.court || "").trim().slice(0, 500),
        nextHearing: nextHearingDate,
        notes: (data.notes || "").trim().slice(0, 5000),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    // Record initial activity
    await this.recordActivity(
      userId,
      id,
      "created",
      `Matter "${row.name}" was created.`,
      { stage: row.stage, priority: row.priority },
    );

    // If next hearing was provided, optionally create a reminder
    if (nextHearingDate) {
      await db
        .insertInto("reminder")
        .values({
          id: crypto.randomUUID(),
          userId,
          title: `Hearing for Matter: ${row.name}`,
          deadlineAt: nextHearingDate,
          type: "hearing",
          completed: false,
        })
        .execute();
    }

    return {
      id: row.id,
      userId: row.userId,
      name: row.name,
      description: row.description || "",
      status: (row.status as LegalMatter["status"]) || "active",
      stage: (row.stage as LegalMatter["stage"]) || "Pre-litigation",
      matterType: row.matterType || "General",
      priority: (row.priority as LegalMatter["priority"]) || "Medium",
      parties: row.parties || "",
      court: row.court || "",
      nextHearing: row.nextHearing ? new Date(row.nextHearing).toISOString() : null,
      notes: row.notes || "",
      createdAt: new Date(row.createdAt).toISOString(),
    };
  }

  /**
   * Update matter details.
   */
  public static async updateMatter(
    userId: string,
    matterId: string,
    updates: Partial<{
      name: string;
      description: string;
      status: LegalMatter["status"];
      stage: LegalMatter["stage"];
      matterType: string;
      priority: LegalMatter["priority"];
      parties: string;
      court: string;
      nextHearing: string | null;
      notes: string;
    }>,
  ): Promise<boolean> {
    const patch: Record<string, unknown> = {};
    if (updates.name !== undefined) patch.name = updates.name.trim().slice(0, 120);
    if (updates.description !== undefined) patch.description = updates.description.trim().slice(0, 2000);
    if (updates.status !== undefined) patch.status = updates.status;
    if (updates.stage !== undefined) patch.stage = updates.stage;
    if (updates.matterType !== undefined) patch.matterType = updates.matterType;
    if (updates.priority !== undefined) patch.priority = updates.priority;
    if (updates.parties !== undefined) patch.parties = updates.parties.trim().slice(0, 1000);
    if (updates.court !== undefined) patch.court = updates.court.trim().slice(0, 500);
    if (updates.notes !== undefined) patch.notes = updates.notes.trim().slice(0, 5000);
    if (updates.nextHearing !== undefined) {
      patch.nextHearing = updates.nextHearing ? new Date(updates.nextHearing) : null;
    }

    if (Object.keys(patch).length === 0) return false;

    const res = await db
      .updateTable("case_folder")
      .set(patch)
      .where("id", "=", matterId)
      .where("userId", "=", userId)
      .execute();

    if (res.length > 0) {
      await this.recordActivity(
        userId,
        matterId,
        updates.status ? "status_updated" : "details_updated",
        `Matter was updated (${Object.keys(patch).join(", ")}).`,
        patch,
      );
      return true;
    }
    return false;
  }

  /**
   * Archive or unarchive a matter.
   */
  public static async setArchiveStatus(
    userId: string,
    matterId: string,
    archive: boolean,
  ): Promise<boolean> {
    const newStatus: LegalMatter["status"] = archive ? "archived" : "active";
    const res = await db
      .updateTable("case_folder")
      .set({ status: newStatus })
      .where("id", "=", matterId)
      .where("userId", "=", userId)
      .execute();

    if (res.length > 0) {
      await this.recordActivity(
        userId,
        matterId,
        archive ? "archived" : "unarchived",
        archive ? "Matter was archived." : "Matter was unarchived and restored to active.",
      );
      return true;
    }
    return false;
  }

  /**
   * Delete a matter and all associated activities, documents, and reports.
   */
  public static async deleteMatter(
    userId: string,
    matterId: string,
  ): Promise<boolean> {
    return await db.transaction().execute(async (trx) => {
      // Detach conversations
      await trx
        .updateTable("conversation")
        .set({ folderId: null })
        .where("folderId", "=", matterId)
        .where("userId", "=", userId)
        .execute();

      // Delete matter documents
      await trx
        .deleteFrom("case_document")
        .where("caseId", "=", matterId)
        .where("userId", "=", userId)
        .execute();

      // Delete reports
      await trx
        .deleteFrom("matter_report")
        .where("matterId", "=", matterId)
        .where("userId", "=", userId)
        .execute();

      // Delete activities
      await trx
        .deleteFrom("matter_activity")
        .where("matterId", "=", matterId)
        .where("userId", "=", userId)
        .execute();

      // Delete matter itself
      const res = await trx
        .deleteFrom("case_folder")
        .where("id", "=", matterId)
        .where("userId", "=", userId)
        .execute();

      return res.length > 0;
    });
  }

  /**
   * Record activity event in matter timeline.
   */
  public static async recordActivity(
    userId: string,
    matterId: string,
    activityType: MatterActivity["activityType"],
    description: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    try {
      await db
        .insertInto("matter_activity")
        .values({
          id: crypto.randomUUID(),
          matterId,
          userId,
          activityType,
          description,
          metadata: metadata || {},
        })
        .execute();
    } catch (err) {
      console.error("[MatterService] Failed to record activity:", err);
    }
  }

  /**
   * Save an AI-generated report linked to a matter.
   */
  public static async saveMatterReport(
    userId: string,
    matterIdOrInput:
      | string
      | {
          matterId: string;
          reportType: MatterReport["reportType"];
          title: string;
          summary?: string;
          reportData: unknown;
        },
    reportTypeArg?: MatterReport["reportType"],
    titleArg?: string,
    summaryArg?: string,
    reportDataArg?: unknown,
  ): Promise<MatterReport> {
    let matterId: string;
    let reportType: MatterReport["reportType"];
    let title: string;
    let summary: string;
    let reportData: unknown;

    if (typeof matterIdOrInput === "object" && matterIdOrInput !== null) {
      matterId = matterIdOrInput.matterId;
      reportType = matterIdOrInput.reportType;
      title = matterIdOrInput.title;
      summary = matterIdOrInput.summary || "";
      reportData = matterIdOrInput.reportData;
    } else {
      matterId = matterIdOrInput;
      reportType = reportTypeArg!;
      title = titleArg || "Report";
      summary = summaryArg || "";
      reportData = reportDataArg;
    }
    const id = crypto.randomUUID();
    const row = await db
      .insertInto("matter_report")
      .values({
        id,
        matterId,
        userId,
        reportType,
        title,
        summary,
        reportData,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    await this.recordActivity(
      userId,
      matterId,
      reportType === "contract_risk"
        ? "contract_analyzed"
        : reportType === "document_comparison"
          ? "document_compared"
          : "courtroom_prep_generated",
      `Saved report: "${title}"`,
      { reportId: id, reportType },
    );

    return {
      id: row.id,
      matterId: row.matterId,
      userId: row.userId,
      reportType: row.reportType as MatterReport["reportType"],
      title: row.title,
      summary: row.summary,
      reportData: row.reportData,
      createdAt: new Date(row.createdAt).toISOString(),
    };
  }

  /**
   * Add a document version to a matter.
   */
  public static async addDocumentVersion(
    userId: string,
    matterIdOrData:
      | string
      | {
          caseId?: string;
          matterId?: string;
          fileName: string;
          fileType: string;
          fileUrl: string;
          fileSize?: number;
          docType?: string;
          version?: number;
        },
    dataArg?: {
      fileName: string;
      fileType: string;
      fileUrl: string;
      fileSize?: number;
      docType?: string;
      version?: number;
    },
  ): Promise<MatterDocument> {
    let matterId: string;
    let data: {
      fileName: string;
      fileType: string;
      fileUrl: string;
      fileSize?: number;
      docType?: string;
      version?: number;
    };

    if (typeof matterIdOrData === "object" && matterIdOrData !== null) {
      matterId = matterIdOrData.caseId || matterIdOrData.matterId || "";
      data = matterIdOrData;
    } else {
      matterId = matterIdOrData;
      data = dataArg!;
    }
    // Check if a document with this fileName already exists to increment version
    const existing = await db
      .selectFrom("case_document")
      .select(["id", "version"])
      .where("caseId", "=", matterId)
      .where("fileName", "=", data.fileName)
      .orderBy("version", "desc")
      .executeTakeFirst();

    const newVersion = (existing?.version || 0) + 1;
    const docId = crypto.randomUUID();

    const row = await db
      .insertInto("case_document")
      .values({
        id: docId,
        caseId: matterId,
        userId,
        fileName: data.fileName,
        fileType: data.fileType,
        fileUrl: data.fileUrl,
        version: newVersion,
        docType: data.docType || "general",
        fileSize: data.fileSize || 0,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    await this.recordActivity(
      userId,
      matterId,
      "document_uploaded",
      `Uploaded document: "${data.fileName}" (Version ${newVersion}).`,
      { docId, version: newVersion, fileType: data.fileType },
    );

    return {
      id: row.id,
      caseId: row.caseId,
      userId: row.userId,
      fileName: row.fileName,
      fileType: row.fileType,
      fileUrl: row.fileUrl,
      version: row.version || 1,
      docType: row.docType || "general",
      fileSize: row.fileSize || 0,
      createdAt: new Date(row.createdAt).toISOString(),
    };
  }
}
