/**
 * Legal Matter Management Types
 */

export type MatterStatus = "active" | "archived" | "pending" | "closed";
export type MatterPriority = "Low" | "Medium" | "High" | "Urgent";
export type MatterStage =
  | "Pre-litigation"
  | "Pleadings"
  | "Evidence"
  | "Arguments"
  | "Judgment/Decree"
  | "Appeal"
  | "Closed";

export interface LegalMatter {
  id: string;
  userId: string;
  name: string;
  description: string;
  status: MatterStatus;
  stage: MatterStage;
  matterType: string;
  priority: MatterPriority;
  parties: string;
  court: string;
  nextHearing: string | null;
  notes: string;
  createdAt: string;
  documentCount?: number;
  conversationCount?: number;
  reportCount?: number;
}

export interface MatterDocument {
  id: string;
  caseId: string;
  userId: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  version: number;
  docType: string;
  fileSize: number;
  createdAt: string;
}

export interface MatterActivity {
  id: string;
  matterId: string;
  userId: string;
  activityType:
    | "created"
    | "status_updated"
    | "details_updated"
    | "document_uploaded"
    | "contract_analyzed"
    | "document_compared"
    | "courtroom_prep_generated"
    | "reminder_added"
    | "archived"
    | "unarchived";
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface MatterReport {
  id: string;
  matterId: string;
  userId: string;
  reportType: "contract_risk" | "document_comparison" | "courtroom_prep";
  title: string;
  summary: string;
  reportData: unknown;
  createdAt: string;
}

export interface MatterReminder {
  id: string;
  userId: string;
  title: string;
  deadlineAt: string;
  type: string;
  completed: boolean;
  createdAt: string;
}

export interface MatterWorkspace {
  matter: LegalMatter;
  documents: MatterDocument[];
  conversations: Array<{
    id: string;
    title: string;
    preview: string;
    type: string;
    updatedAt: string;
  }>;
  reports: MatterReport[];
  activities: MatterActivity[];
  reminders: MatterReminder[];
}

export interface MatterFilterOptions {
  status?: MatterStatus | "all";
  stage?: string;
  priority?: string;
  matterType?: string;
  query?: string;
  sortBy?: "createdAt" | "nextHearing" | "name";
  sortOrder?: "asc" | "desc";
}
