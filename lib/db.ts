import { Pool } from "pg";
import { Kysely, PostgresDialect, Generated } from "kysely";
import { config } from "dotenv";

if (!process.env.DATABASE_URL) {
  config({ path: ".env.local" });
  config({ path: ".env" });
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_URL?.includes("neon.tech") ||
    process.env.DATABASE_URL?.includes("sslmode=require") ||
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : undefined,
  max: 10,
});

const dialect = new PostgresDialect({ pool });

interface ConversationTable {
  id: string;
  userId: string;
  title: string;
  preview: string;
  type: string;
  pinned: boolean;
  messages: unknown;
  folderId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface FeedbackTable {
  id: Generated<string>;
  userId: string;
  messageId: string;
  rating: string;
  comment: string | null;
  createdAt: Generated<Date>;
}

interface ReminderTable {
  id: Generated<string>;
  userId: string;
  title: string;
  deadlineAt: Date;
  type: string;
  completed: boolean | null;
  createdAt: Generated<Date>;
}

interface CaseFolderTable {
  id: string;
  userId: string;
  name: string;
  description: string;
  status: string;
  parties: string;
  court: string;
  nextHearing: Date | null;
  notes: string;
  stage?: Generated<string>;
  matterType?: Generated<string>;
  priority?: Generated<string>;
  createdAt: Generated<Date>;
}

interface CaseDocumentTable {
  id: string;
  caseId: string;
  userId: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  version?: Generated<number>;
  docType?: Generated<string>;
  fileSize?: Generated<number>;
  createdAt: Generated<Date>;
}

interface MatterActivityTable {
  id: string;
  matterId: string;
  userId: string;
  activityType: string;
  description: string;
  metadata?: unknown;
  createdAt: Generated<Date>;
}

interface MatterReportTable {
  id: string;
  matterId: string;
  userId: string;
  reportType: string;
  title: string;
  summary: string;
  reportData: unknown;
  createdAt: Generated<Date>;
}

interface LegalNoticeTable {
  id: string;
  userId: string;
  caseId: string | null;
  recipientName: string;
  recipientEmail: string;
  recipientAddress: string;
  subject: string;
  content: string;
  status: string;
  sentAt: Date | null;
  createdAt: Generated<Date>;
}

interface UserTable {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface SessionTable {
  id: string;
  expiresAt: Date;
  token: string;
  ipAddress: string | null;
  userAgent: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface AccountTable {
  id: string;
  accountId: string;
  providerId: string;
  userId: string;
  accessToken: string | null;
  refreshToken: string | null;
  idToken: string | null;
  accessTokenExpiresAt: Date | null;
  refreshTokenExpiresAt: Date | null;
  scope: string | null;
  password: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface VerificationTable {
  id: string;
  identifier: string;
  value: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface Database {
  user: UserTable;
  session: SessionTable;
  account: AccountTable;
  verification: VerificationTable;
  conversation: ConversationTable;
  feedback: FeedbackTable;
  reminder: ReminderTable;
  case_folder: CaseFolderTable;
  case_document: CaseDocumentTable;
  matter_activity: MatterActivityTable;
  matter_report: MatterReportTable;
  legal_notice: LegalNoticeTable;
}

export const db = new Kysely<Database>({ dialect });
