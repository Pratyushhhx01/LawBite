import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { MatterService } from "@/lib/matter-service";
import type { LegalMatter, MatterWorkspace } from "@/lib/matter-types";
import CasesApp from "./_components/CasesApp";

export const metadata: Metadata = {
  title: "AI Case Tracker & Litigation Workspace — LawBite",
  description:
    "Integrated Indian legal case management, 8-stage litigation matter docketing, courtroom hearing prep, and statutory amendment comparison.",
  keywords: [
    "Indian Case Tracker",
    "Legal Matter Management",
    "Courtroom Prep",
    "Contract Risk Analyzer",
    "Indian Statutory Amendments",
    "BNS 2023",
    "BNSS",
    "LawBite",
  ],
  robots: { index: true, follow: true },
};

const DEMO_CASES = [
  {
    id: "demo-case-1",
    name: "M/s Horizon Infra v. NHAI (Arbitration)",
    description:
      "Commercial arbitration under Section 11 & Section 34 of Arbitration & Conciliation Act 1996 for delayed EPC payments and escalation claims.",
    status: "active",
    parties: "Horizon Infra Projects Ltd. vs. National Highways Authority of India (NHAI)",
    court: "Delhi International Arbitration Centre (DIAC)",
    nextHearing: "2026-12-10",
    notes:
      "Statement of Claim filed. Statement of Defence and Section 16 jurisdiction objection awaited.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo-case-2",
    name: "State of Maharashtra v. Rajesh Sharma",
    description:
      "Criminal proceeding under Section 103 & 111 Bharatiya Nyaya Sanhita 2023 with statutory transition analysis from IPC 302.",
    status: "active",
    parties: "State of Maharashtra vs. Rajesh Sharma & Ors.",
    court: "Sessions Court, Greater Mumbai",
    nextHearing: "2026-11-28",
    notes: "Bail application under Section 480 BNSS scheduled for hearing.",
    createdAt: new Date().toISOString(),
  },
];

const DEMO_DETAIL = {
  ...DEMO_CASES[0],
  documents: [
    {
      id: "doc-demo-1",
      fileName: "Statement_of_Claim_Final.pdf",
      fileType: "application/pdf",
      fileUrl: "/sample-claim.pdf",
      createdAt: new Date().toISOString(),
    },
    {
      id: "doc-demo-2",
      fileName: "EPC_Contract_Clause_25_Arbitration.pdf",
      fileType: "application/pdf",
      fileUrl: "/contract-epc.pdf",
      createdAt: new Date().toISOString(),
    },
  ],
  conversations: [
    {
      id: "conv-demo-1",
      title: "Arbitration clause enforceability under Section 8 & Section 11",
      preview:
        "Analysis of whether the unilateral arbitrator appointment clause violates TRF Ltd v. Energo Engineering...",
      type: "chat",
      updatedAt: new Date().toISOString(),
    },
  ],
};

const DEMO_MATTERS: LegalMatter[] = [
  {
    id: "demo-matter-1",
    userId: "guest",
    name: "Horizon Infra EPC Dispute",
    description:
      "Multi-crore infrastructure arbitration involving delay penalties, liquidated damages under ICA §74, and unilateral appointment challenges.",
    status: "active",
    stage: "Arguments",
    matterType: "Commercial Arbitration",
    priority: "High",
    parties: "Horizon Infra Projects Ltd. vs. NHAI",
    court: "High Court of Delhi / DIAC",
    nextHearing: "2026-12-10T10:00:00.000Z",
    notes:
      "Prepare arguments on Perkins Eastman and Section 12(5) fifth schedule disqualification.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo-matter-2",
    userId: "guest",
    name: "Quashing Petition under Section 528 BNSS",
    description:
      "Criminal petition for quashing of FIR registered under Section 318(4) BNS (Cheating) arising out of purely civil breach of contract.",
    status: "active",
    stage: "Pleadings",
    matterType: "Criminal Writ",
    priority: "Urgent",
    parties: "Anil Kapoor vs. State of Karnataka & Anr.",
    court: "High Court of Karnataka, Bengaluru",
    nextHearing: "2026-11-22T10:30:00.000Z",
    notes: "Rely on State of Haryana v. Bhajan Lal and Indian Oil Corp v. NEPC India principles.",
    createdAt: new Date().toISOString(),
  },
];

const DEMO_WORKSPACE: MatterWorkspace = {
  matter: DEMO_MATTERS[0],
  documents: [
    {
      id: "matter-doc-1",
      caseId: "demo-matter-1",
      userId: "guest",
      fileName: "EPC_Contract_General_Conditions.pdf",
      fileType: "application/pdf",
      fileUrl: "/epc-gcc.pdf",
      version: 1,
      docType: "contract",
      fileSize: 245000,
      createdAt: new Date().toISOString(),
    },
  ],
  conversations: [],
  reports: [
    {
      id: "rep-1",
      matterId: "demo-matter-1",
      userId: "guest",
      reportType: "contract_risk",
      title: "EPC Contract Risk Audit — Unilateral Indemnity & Limitation of Liability",
      summary:
        "High risk identified under Section 28 of Indian Contract Act regarding extinguishment of right to sue.",
      reportData: {
        summary:
          "High risk identified under Section 28 of Indian Contract Act regarding extinguishment of right to sue.",
        overallRisk: "high",
        risks: [
          {
            clause: "Clause 42.1 (Dispute Resolution)",
            issue:
              "Unilateral arbitrator nomination by NHAI chairman violates Perkins Eastman precedent.",
            severity: "critical",
            recommendation:
              "Invoke Section 11(6) before the High Court for independent arbitrator appointment.",
          },
          {
            clause: "Clause 18.3 (Liquidated Damages)",
            issue:
              "Pre-estimated penalty of 10% without proof of actual loss contrary to Kailash Nath Associates v. DDA.",
            severity: "high",
            recommendation: "Demand proof of actual loss under Section 74 Indian Contract Act.",
          },
        ],
      },
      createdAt: new Date().toISOString(),
    },
  ],
  activities: [
    {
      id: "act-1",
      matterId: "demo-matter-1",
      userId: "guest",
      activityType: "status_updated",
      description: "Matter advanced to Arguments stage before Arbitral Tribunal.",
      createdAt: new Date().toISOString(),
    },
  ],
  reminders: [
    {
      id: "rem-1",
      userId: "guest",
      title: "File Written Submissions and Compilation of Judgments",
      deadlineAt: "2026-12-05T17:00:00.000Z",
      type: "filing",
      completed: false,
      createdAt: new Date().toISOString(),
    },
  ],
};

export default async function CasesPage({
  searchParams,
}: {
  searchParams?: Promise<{
    caseId?: string;
    id?: string;
    tab?: string;
    matterId?: string;
    q?: string;
  }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const initialCaseId = params?.caseId ?? params?.id ?? null;
  const rawTab = params?.tab?.toLowerCase();
  const initialTab: "cases" | "matters" | "amendments" | null =
    rawTab === "matters" || rawTab === "workspace" || Boolean(params?.matterId)
      ? "matters"
      : rawTab === "amendments"
      ? "amendments"
      : rawTab === "cases"
      ? "cases"
      : null;

  let session = null;
  try {
    session = await auth.api.getSession({
      headers: await headers(),
    });
  } catch {
    session = null;
  }

  // If user is not authenticated, render guest advocate workspace with demo data
  // so external AI tools, evaluators, and public visitors can crawl, analyze, and test all 3 modules.
  if (!session) {
    const activeDemoCase = initialCaseId
      ? DEMO_CASES.find((c) => c.id === initialCaseId) ?? DEMO_CASES[0]
      : DEMO_CASES[0];
    const activeDemoMatter = params?.matterId
      ? DEMO_MATTERS.find((m) => m.id === params.matterId) ?? DEMO_MATTERS[0]
      : DEMO_MATTERS[0];

    const guestWorkspace: MatterWorkspace = {
      ...DEMO_WORKSPACE,
      matter: activeDemoMatter,
    };

    return (
      <CasesApp
        user={{
          id: "guest-advocate",
          name: "Guest Advocate",
          email: "guest@lawbite.local",
          image: null,
        }}
        initialCaseId={initialCaseId ?? activeDemoCase.id}
        initialTab={initialTab}
        initialMatterId={params?.matterId ?? activeDemoMatter.id}
        initialQuery={params?.q ?? null}
        initialCases={DEMO_CASES}
        initialDetail={{
          ...activeDemoCase,
          documents: DEMO_DETAIL.documents,
          conversations: DEMO_DETAIL.conversations,
        }}
        initialMatters={DEMO_MATTERS}
        initialMatterWorkspace={guestWorkspace}
      />
    );
  }

  // Pre-fetch cases and matters in parallel on the server for logged-in users
  const [casesRows, mattersList] = await Promise.all([
    db
      .selectFrom("case_folder")
      .selectAll()
      .where("userId", "=", session.user.id)
      .orderBy("createdAt", "desc")
      .execute()
      .catch((err) => {
        console.error("Failed to prefetch cases:", err);
        return [];
      }),
    MatterService.listMatters(session.user.id).catch((err) => {
      console.error("Failed to prefetch matters:", err);
      return [];
    }),
  ]);

  const serializedCases = casesRows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description || "",
    status: r.status,
    parties: r.parties || "",
    court: r.court || "",
    nextHearing: r.nextHearing
      ? new Date(r.nextHearing).toISOString().split("T")[0]
      : null,
    notes: r.notes || "",
    createdAt: new Date(r.createdAt).toISOString(),
  }));

  const targetCaseId =
    initialCaseId ||
    (initialTab !== "matters" && serializedCases.length > 0
      ? serializedCases[0].id
      : null);

  const targetMatterId =
    params?.matterId ||
    (initialTab === "matters" && mattersList.length > 0
      ? mattersList[0].id
      : null);

  const [detailResult, workspaceResult] = await Promise.all([
    targetCaseId
      ? Promise.all([
          db
            .selectFrom("case_document")
            .selectAll()
            .where("caseId", "=", targetCaseId)
            .orderBy("createdAt", "desc")
            .execute()
            .catch(() => []),
          db
            .selectFrom("conversation")
            .select(["id", "title", "preview", "type", "updatedAt"])
            .where("folderId", "=", targetCaseId)
            .where("userId", "=", session.user.id)
            .execute()
            .catch(() => []),
        ])
          .then(([docs, convs]) => {
            const folder = serializedCases.find((c) => c.id === targetCaseId);
            if (!folder) return null;
            return {
              ...folder,
              documents: docs.map((d) => ({
                id: d.id,
                fileName: d.fileName,
                fileType: d.fileType,
                fileUrl: d.fileUrl,
                createdAt: new Date(d.createdAt).toISOString(),
              })),
              conversations: convs.map((c) => ({
                id: c.id,
                title: c.title,
                preview: c.preview,
                type: c.type,
                updatedAt: new Date(c.updatedAt).toISOString(),
              })),
            };
          })
          .catch(() => null)
      : Promise.resolve(null),
    targetMatterId
      ? MatterService.getMatterWorkspace(targetMatterId, session.user.id).catch(
          () => null
        )
      : Promise.resolve(null),
  ]);

  return (
    <CasesApp
      user={{
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image ?? null,
      }}
      initialCaseId={initialCaseId}
      initialTab={initialTab}
      initialMatterId={params?.matterId ?? null}
      initialQuery={params?.q ?? null}
      initialCases={serializedCases}
      initialDetail={detailResult}
      initialMatters={mattersList}
      initialMatterWorkspace={workspaceResult}
    />
  );
}
