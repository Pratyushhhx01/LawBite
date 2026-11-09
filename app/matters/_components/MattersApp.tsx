"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import type {
  LegalMatter,
  MatterDocument,
  MatterWorkspace,
  MatterStatus,
  MatterStage,
  MatterPriority,
} from "@/lib/matter-types";
import type {
  ContractAnalysisReport,
  ClauseRiskItem,
  MissingClauseItem,
} from "@/lib/contract-analyzer";
import type {
  DocumentComparisonReport,
  ClauseDiff,
} from "@/lib/doc-comparison";
import type {
  CourtroomPrepBrief,
  LegalIssueItem,
  ArgumentPair,
  HearingQuestionItem,
  CrossExaminationQuestion,
  EvidenceChecklistItem,
} from "@/lib/courtroom-prep";

interface MattersAppProps {
  user?: { id: string; name: string; email: string; image: string | null };
  initialMatterId?: string | null;
  onSwitchModule?: (mod: "cases" | "matters" | "amendments") => void;
  sidebarOpen?: boolean;
  onSidebarOpenChange?: (open: boolean) => void;
}

const STAGE_COLORS: Record<string, string> = {
  "Pre-litigation": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Pleadings: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  Evidence: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Arguments: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "Judgment/Decree": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Appeal: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  Closed: "bg-white/5 text-white/40 border-white/10",
};

const PRIORITY_COLORS: Record<string, string> = {
  Urgent: "bg-red-500/10 text-red-400 border-red-500/20",
  High: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Medium: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Low: "bg-white/5 text-white/50 border-white/10",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  closed: "bg-white/5 text-white/40 border-white/10",
  archived: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

const MATTER_STAGES: MatterStage[] = [
  "Pre-litigation",
  "Pleadings",
  "Evidence",
  "Arguments",
  "Judgment/Decree",
  "Appeal",
  "Closed",
];

const MATTER_PRIORITIES: MatterPriority[] = ["Low", "Medium", "High", "Urgent"];

export default function MattersApp({
  initialMatterId = null,
  onSwitchModule,
  sidebarOpen: controlledSidebarOpen,
  onSidebarOpenChange,
}: MattersAppProps = {}) {
  // State
  const [matters, setMatters] = useState<LegalMatter[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(initialMatterId);
  const [workspace, setWorkspace] = useState<MatterWorkspace | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "documents" | "contract_risk" | "doc_compare" | "courtroom_prep" | "reports" | "activity"
  >("overview");

  const [internalSidebarOpen, setInternalSidebarOpen] = useState(false);
  const isControlled = typeof controlledSidebarOpen === "boolean";
  const sidebarOpen = isControlled ? controlledSidebarOpen : internalSidebarOpen;

  const setSidebarOpen = useCallback(
    (val: boolean | ((prev: boolean) => boolean)) => {
      if (isControlled) {
        const next = typeof val === "function" ? val(controlledSidebarOpen!) : val;
        onSidebarOpenChange?.(next);
      } else {
        setInternalSidebarOpen(val);
      }
    },
    [isControlled, controlledSidebarOpen, onSidebarOpenChange]
  );

  const sidebarCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelSidebarClose = () => {
    if (sidebarCloseTimer.current) {
      clearTimeout(sidebarCloseTimer.current);
      sidebarCloseTimer.current = null;
    }
  };

  const scheduleSidebarClose = (delay = 150) => {
    cancelSidebarClose();
    sidebarCloseTimer.current = setTimeout(() => {
      setSidebarOpen(false);
      sidebarCloseTimer.current = null;
    }, delay);
  };

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  // Modals & Forms
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDocUploadModal, setShowDocUploadModal] = useState(false);
  const [formSaving, setFormSaving] = useState(false);

  // Matter Form
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    matterType: "Commercial Dispute",
    stage: "Pre-litigation" as MatterStage,
    priority: "Medium" as MatterPriority,
    status: "active" as MatterStatus,
    parties: "",
    court: "",
    nextHearing: "",
    notes: "",
  });

  // Upload Form
  const [uploadFormData, setUploadFormData] = useState({
    file: null as File | null,
    docType: "Pleadings",
    version: 1,
  });
  const [uploading, setUploading] = useState(false);
  const docFileInputRef = useRef<HTMLInputElement>(null);

  // Contract Risk Analyzer tab state
  const [contractText, setContractText] = useState("");
  const [contractType, setContractType] = useState("Commercial / Vendor");
  const [analyzingRisk, setAnalyzingRisk] = useState(false);
  const [riskResult, setRiskResult] = useState<ContractAnalysisReport | null>(null);

  // Doc Comparison tab state
  const [compareDocA, setCompareDocA] = useState("");
  const [compareDocB, setCompareDocB] = useState("");
  const [titleA, setTitleA] = useState("Original Agreement (v1)");
  const [titleB, setTitleB] = useState("Revised Agreement (v2)");
  const [comparingDocs, setComparingDocs] = useState(false);
  const [compareResult, setCompareResult] = useState<DocumentComparisonReport | null>(null);

  // Courtroom Prep tab state
  const [prepFacts, setPrepFacts] = useState("");
  const [prepClaimType, setPrepClaimType] = useState("Commercial Injunction & Specific Performance");
  const [preppingCourtroom, setPreppingCourtroom] = useState(false);
  const [prepResult, setPrepResult] = useState<CourtroomPrepBrief | null>(null);

  // Load matters list
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingList(true);
        const res = await fetch("/api/matters", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            const list = data.matters || [];
            setMatters(list);
            if (initialMatterId) {
              setSelectedId(initialMatterId);
            } else if (list.length > 0) {
              setSelectedId((prev) => (prev ? prev : list[0].id));
            }
          }
        }
      } catch (e) {
        console.error("Failed to load matters", e);
      } finally {
        if (!cancelled) setLoadingList(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialMatterId]);

  // Load workspace when selectedId changes
  useEffect(() => {
    let cancelled = false;
    if (!selectedId) {
      return;
    }
    (async () => {
      try {
        setLoadingWorkspace(true);
        const res = await fetch(`/api/matters/${encodeURIComponent(selectedId)}`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            setWorkspace(data);
            if (data.matter) {
              setPrepFacts(
                `${data.matter.name}\nParties: ${data.matter.parties || "Not specified"}\nCourt: ${data.matter.court || "Not specified"}\n\nFacts & Background:\n${data.matter.description || data.matter.notes || "Commercial breach and claim for relief."}`
              );
            }
          }
        }
      } catch (e) {
        console.error("Failed to load workspace", e);
      } finally {
        if (!cancelled) setLoadingWorkspace(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  // Filtered matters
  const filteredMatters = useMemo(() => {
    return matters.filter((m) => {
      if (statusFilter !== "all" && m.status !== statusFilter) return false;
      if (stageFilter !== "all" && m.stage !== stageFilter) return false;
      if (priorityFilter !== "all" && m.priority !== priorityFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        m.name.toLowerCase().includes(q) ||
        m.parties.toLowerCase().includes(q) ||
        m.court.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.matterType.toLowerCase().includes(q)
      );
    });
  }, [matters, statusFilter, stageFilter, priorityFilter, searchQuery]);

  // Handle Create Matter
  const handleCreateMatter = async () => {
    if (!formData.name.trim()) return;
    setFormSaving(true);
    try {
      const res = await fetch("/api/matters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const created = await res.json();
        setMatters((prev) => [created, ...prev]);
        setSelectedId(created.id);
        setShowCreateModal(false);
        resetForm();
      }
    } finally {
      setFormSaving(false);
    }
  };

  // Handle Edit Matter
  const handleUpdateMatter = async () => {
    if (!selectedId || !formData.name.trim()) return;
    setFormSaving(true);
    try {
      const res = await fetch(`/api/matters/${encodeURIComponent(selectedId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setMatters((prev) =>
          prev.map((m) => (m.id === selectedId ? { ...m, ...formData } : m))
        );
        if (workspace) {
          setWorkspace({
            ...workspace,
            matter: { ...workspace.matter, ...formData },
          });
        }
        setShowEditModal(false);
      }
    } finally {
      setFormSaving(false);
    }
  };

  // Archive / Restore
  const handleToggleArchive = async () => {
    if (!selectedId || !workspace) return;
    const isArchived = workspace.matter.status === "archived";
    const newStatus: MatterStatus = isArchived ? "active" : "archived";
    try {
      const res = await fetch("/api/matters", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: selectedId,
          archive: !isArchived,
        }),
      });
      if (res.ok) {
        setMatters((prev) =>
          prev.map((m) => (m.id === selectedId ? { ...m, status: newStatus } : m))
        );
        setWorkspace({
          ...workspace,
          matter: { ...workspace.matter, status: newStatus },
        });
      }
    } catch (e) {
      console.error("Archive toggle failed", e);
    }
  };

  // Delete Matter
  const handleDeleteMatter = async () => {
    if (!selectedId || !confirm("Are you sure you want to delete this matter and all associated files/reports?")) {
      return;
    }
    try {
      const res = await fetch(`/api/matters/${encodeURIComponent(selectedId)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        const remaining = matters.filter((m) => m.id !== selectedId);
        setMatters(remaining);
        if (remaining.length > 0) {
          setSelectedId(remaining[0].id);
        } else {
          setSelectedId(null);
          setWorkspace(null);
        }
      }
    } catch (e) {
      console.error("Delete failed", e);
    }
  };

  // Handle Document Upload
  const handleUploadDocument = async () => {
    if (!selectedId || !uploadFormData.file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", uploadFormData.file);
      fd.append("caseId", selectedId);
      const s3Res = await fetch("/api/cases/documents/upload", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      if (!s3Res.ok) throw new Error("File upload failed");
      const { fileUrl, fileName, fileType } = await s3Res.json();

      const docRes = await fetch(`/api/matters/${encodeURIComponent(selectedId)}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fileName,
          fileType,
          fileUrl,
          docType: uploadFormData.docType,
          version: uploadFormData.version,
          fileSize: uploadFormData.file.size,
        }),
      });

      if (docRes.ok) {
        const newDoc: MatterDocument = await docRes.json();
        if (workspace) {
          setWorkspace({
            ...workspace,
            documents: [newDoc, ...workspace.documents],
            activities: [
              {
                id: `act-${Date.now()}`,
                matterId: selectedId,
                userId: "",
                activityType: "document_uploaded",
                description: `Uploaded document "${fileName}" (${uploadFormData.docType} v${uploadFormData.version})`,
                createdAt: new Date().toISOString(),
              },
              ...workspace.activities,
            ],
          });
        }
        setShowDocUploadModal(false);
        setUploadFormData({ file: null, docType: "Pleadings", version: 1 });
      }
    } catch (e) {
      console.error("Upload error", e);
      alert("Failed to upload document. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // Run Contract Analysis
  const handleAnalyzeContract = async () => {
    if (!contractText.trim()) return;
    setAnalyzingRisk(true);
    setRiskResult(null);
    try {
      const res = await fetch("/api/contract/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          contractText,
          contractType,
          matterId: selectedId || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setRiskResult(data.report || data);
        if (selectedId) {
          const wsRes = await fetch(`/api/matters/${encodeURIComponent(selectedId)}`, {
            credentials: "include",
          });
          if (wsRes.ok) {
            const wsData = await wsRes.json();
            setWorkspace(wsData);
          }
        }
      } else {
        alert("Contract analysis failed. Please check your document text.");
      }
    } catch (e) {
      console.error("Contract analysis error", e);
    } finally {
      setAnalyzingRisk(false);
    }
  };

  // Run Document Comparison
  const handleCompareDocuments = async () => {
    if (!compareDocA.trim() || !compareDocB.trim()) return;
    setComparingDocs(true);
    setCompareResult(null);
    try {
      const res = await fetch("/api/contract/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          versionAText: compareDocA,
          versionBText: compareDocB,
          versionATitle: titleA,
          versionBTitle: titleB,
          matterId: selectedId || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCompareResult(data.report || data);
        if (selectedId) {
          const wsRes = await fetch(`/api/matters/${encodeURIComponent(selectedId)}`, {
            credentials: "include",
          });
          if (wsRes.ok) {
            const wsData = await wsRes.json();
            setWorkspace(wsData);
          }
        }
      } else {
        alert("Comparison failed. Please verify both documents contain text.");
      }
    } catch (e) {
      console.error("Comparison error", e);
    } finally {
      setComparingDocs(false);
    }
  };

  // Run Courtroom Prep
  const handleGenerateCourtroomPrep = async () => {
    if (!prepFacts.trim()) return;
    setPreppingCourtroom(true);
    setPrepResult(null);
    try {
      const res = await fetch("/api/courtroom/prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          caseTitle: workspace?.matter.name || "Commercial Dispute",
          caseFacts: prepFacts,
          claimType: prepClaimType,
          matterId: selectedId || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPrepResult(data.brief || data);
        if (selectedId) {
          const wsRes = await fetch(`/api/matters/${encodeURIComponent(selectedId)}`, {
            credentials: "include",
          });
          if (wsRes.ok) {
            const wsData = await wsRes.json();
            setWorkspace(wsData);
          }
        }
      } else {
        alert("Courtroom prep failed. Please provide detailed case facts.");
      }
    } catch (e) {
      console.error("Courtroom prep error", e);
    } finally {
      setPreppingCourtroom(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      matterType: "Commercial Dispute",
      stage: "Pre-litigation",
      priority: "Medium",
      status: "active",
      parties: "",
      court: "",
      nextHearing: "",
      notes: "",
    });
  };

  const startEditMatter = () => {
    if (!workspace?.matter) return;
    const m = workspace.matter;
    setFormData({
      name: m.name,
      description: m.description,
      matterType: m.matterType,
      stage: m.stage,
      priority: m.priority,
      status: m.status,
      parties: m.parties,
      court: m.court,
      nextHearing: m.nextHearing ? m.nextHearing.slice(0, 16) : "",
      notes: m.notes,
    });
    setShowEditModal(true);
  };

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-black text-white selection:bg-amber-400/30 selection:text-white">
      {/* Mobile backdrop */}
      <div
        aria-hidden
        className={`fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar: Matters List & Filtering */}
      <aside
        onMouseEnter={() => {
          cancelSidebarClose();
          setSidebarOpen(true);
        }}
        onMouseLeave={() => scheduleSidebarClose(150)}
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-white/10 bg-black/95 backdrop-blur-xl shadow-2xl transition-[width,transform] duration-300 ease-in-out md:translate-x-0 ${
          sidebarOpen
            ? "w-80 translate-x-0 shadow-[0_0_30px_rgba(0,0,0,0.8)]"
            : "w-16 translate-x-0 md:w-16 md:translate-x-0"
        }`}
      >
        <div className="border-b border-white/10 p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <Link
                href="/chat?modal=cases"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                title="Back to AI Lawyer menu"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1
                className={`text-sm font-bold tracking-tight text-white whitespace-nowrap transition-opacity duration-200 ${
                  sidebarOpen ? "opacity-100" : "opacity-0 md:hidden"
                }`}
              >
                Matters
              </h1>
            </div>
            {sidebarOpen && (
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="rounded-full p-1.5 text-white/60 hover:bg-white/5 hover:text-white md:hidden"
                aria-label="Close sidebar"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Three horizontal line button just below the back arrow icon to open the closed panel (mobile view only) */}
          {!sidebarOpen && (
            <div className="mb-3 flex justify-center md:hidden">
              <button
                type="button"
                onClick={() => {
                  cancelSidebarClose();
                  setSidebarOpen(true);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white/80 transition-all hover:border-white/30 hover:bg-white/10 hover:text-white active:scale-95"
                aria-label="Open matters menu"
                aria-expanded={sidebarOpen}
                aria-controls="matters-sidebar"
                title="Open panel"
              >
                <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="18" x2="20" y2="18" />
                </svg>
              </button>
            </div>
          )}

          {/* Module Switcher Tabs */}
          {sidebarOpen ? (
            <div className="mb-3 grid grid-cols-3 gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1 text-center text-xs">
              <Link
                href="/cases?tab=cases"
                onClick={onSwitchModule ? (e) => { e.preventDefault(); cancelSidebarClose(); onSwitchModule("cases"); } : undefined}
                className="rounded-lg py-1 font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
              >
                Cases
              </Link>
              <span className="rounded-lg bg-amber-400/20 py-1 font-semibold text-amber-300">
                Matters
              </span>
              <Link
                href="/cases?tab=amendments"
                onClick={onSwitchModule ? (e) => { e.preventDefault(); cancelSidebarClose(); onSwitchModule("amendments"); } : undefined}
                className="rounded-lg py-1 font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
              >
                Amendments
              </Link>
            </div>
          ) : (
            <div className="mb-3 hidden md:flex flex-col items-center gap-1.5">
              <Link
                href="/cases?tab=cases"
                onClick={onSwitchModule ? (e) => { e.preventDefault(); cancelSidebarClose(); onSwitchModule("cases"); } : undefined}
                title="Switch to Cases"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-white/40 hover:bg-white/5 hover:text-white transition-colors"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
              </Link>
              <span title="Matters (Active)" className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/20 text-amber-300">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  <rect x="8" y="2" width="8" height="4" rx="1" />
                </svg>
              </span>
              <Link
                href="/cases?tab=amendments"
                onClick={onSwitchModule ? (e) => { e.preventDefault(); cancelSidebarClose(); onSwitchModule("amendments"); } : undefined}
                title="Switch to Amendments"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-white/40 hover:bg-white/5 hover:text-white transition-colors"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </Link>
            </div>
          )}

          <button
            onClick={() => {
              setSidebarOpen(false);
              resetForm();
              setShowCreateModal(true);
            }}
            title="New Matter"
            className={`flex items-center justify-center rounded-xl bg-white text-black transition-all hover:bg-white/90 active:scale-[0.98] ${
              sidebarOpen
                ? "w-full gap-2 px-3.5 py-2.5 text-xs font-semibold"
                : "h-10 w-10 mx-auto"
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
            </svg>
            <span
              className={`whitespace-nowrap transition-opacity duration-200 ${
                sidebarOpen ? "opacity-100" : "opacity-0 md:hidden"
              }`}
            >
              New Matter
            </span>
          </button>

          {/* Search & Filters */}
          {sidebarOpen && (
            <>
              <div className="relative mt-3">
                <svg
                  className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter matters..."
                  className="w-full rounded-lg border border-white/10 bg-white/5 pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/40 outline-none focus:border-white/20"
                />
              </div>

              {/* Quick Filters */}
              <div className="mt-2.5 flex items-center gap-1 overflow-x-auto text-[10px]">
                {["all", "active", "pending", "closed", "archived"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`rounded px-2 py-0.5 capitalize transition-all ${
                      statusFilter === st
                        ? "bg-white/20 text-white font-semibold"
                        : "text-white/40 hover:text-white"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div className="mt-2 grid grid-cols-2 gap-1.5 text-[10px]">
                <select
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value)}
                  style={{ colorScheme: "dark" }}
                  className="rounded-lg border border-white/10 bg-[#141414] px-2 py-1.5 text-white/90 outline-none transition-colors focus:border-white/20 [&>option]:bg-[#141414] [&>option]:text-white"
                >
                  <option value="all" className="bg-[#141414] text-white">All Stages</option>
                  <option value="Pre-litigation" className="bg-[#141414] text-white">Pre-litigation</option>
                  <option value="Pleadings" className="bg-[#141414] text-white">Pleadings</option>
                  <option value="Evidence" className="bg-[#141414] text-white">Evidence</option>
                  <option value="Arguments" className="bg-[#141414] text-white">Arguments</option>
                  <option value="Judgment/Decree" className="bg-[#141414] text-white">Judgment/Decree</option>
                  <option value="Appeal" className="bg-[#141414] text-white">Appeal</option>
                  <option value="Closed" className="bg-[#141414] text-white">Closed</option>
                </select>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  style={{ colorScheme: "dark" }}
                  className="rounded-lg border border-white/10 bg-[#141414] px-2 py-1.5 text-white/90 outline-none transition-colors focus:border-white/20 [&>option]:bg-[#141414] [&>option]:text-white"
                >
                  <option value="all" className="bg-[#141414] text-white">All Priorities</option>
                  <option value="Low" className="bg-[#141414] text-white">Low</option>
                  <option value="Medium" className="bg-[#141414] text-white">Medium</option>
                  <option value="High" className="bg-[#141414] text-white">High</option>
                  <option value="Urgent" className="bg-[#141414] text-white">Urgent</option>
                </select>
              </div>
            </>
          )}
        </div>

        {/* Matters List */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {loadingList ? (
            <div className={`p-4 text-xs text-white/40 ${sidebarOpen ? "block" : "hidden"}`}>Loading legal matters...</div>
          ) : filteredMatters.length === 0 ? (
            sidebarOpen ? (
              <div className="px-6 py-12 text-center">
                <p className="text-xs font-medium text-white/50">No matters found</p>
                <p className="mt-1 text-[11px] text-white/30">
                  Click &quot;New Matter&quot; to organize a case
                </p>
              </div>
            ) : null
          ) : (
            filteredMatters.map((m) => {
              const isSelected = selectedId === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    setSelectedId(m.id);
                    setSidebarOpen(false);
                  }}
                  title={m.name}
                  className={`w-full transition-all hover:bg-white/[0.04] ${
                    sidebarOpen
                      ? "border-b border-white/5 px-4 py-3.5 text-left block"
                      : "flex h-12 w-16 items-center justify-center"
                  } ${
                    isSelected
                      ? sidebarOpen
                        ? "bg-white/[0.08] border-l-2 border-l-amber-400"
                        : "bg-white/[0.08] text-amber-400"
                      : "border-l-2 border-l-transparent text-white/60"
                  }`}
                >
                  {sidebarOpen ? (
                    <>
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="truncate text-xs font-semibold text-white">
                          {m.name}
                        </span>
                        <span
                          className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold border ${
                            PRIORITY_COLORS[m.priority] || PRIORITY_COLORS.Medium
                          }`}
                        >
                          {m.priority}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center gap-1.5 text-[10px] text-white/50">
                        <span className={`rounded px-1.5 py-0.2 border ${STAGE_COLORS[m.stage] || STAGE_COLORS["Pre-litigation"]}`}>
                          {m.stage}
                        </span>
                        <span className="truncate">{m.matterType}</span>
                      </div>

                      {m.parties && (
                        <p className="mt-1 truncate text-[11px] text-white/40">
                          {m.parties}
                        </p>
                      )}

                      {m.nextHearing && (
                        <p className="mt-1 flex items-center gap-1 text-[10px] text-amber-400/80">
                          <svg className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 6v6l4 2" />
                          </svg>
                          {new Date(m.nextHearing).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.05] text-xs font-semibold uppercase text-white/80 transition-colors hover:bg-white/10">
                      {m.name.slice(0, 2)}
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-black ${
                          m.priority === "Urgent"
                            ? "bg-red-400"
                            : m.priority === "High"
                            ? "bg-amber-400"
                            : "bg-emerald-400"
                        }`}
                      />
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Main Workspace Pane */}
      <main className="flex flex-1 flex-col overflow-hidden bg-black/95 pl-16 transition-[padding] duration-300">
        {/* Top App Navigation Bar */}
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-white/10 bg-black/40 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                cancelSidebarClose();
                setSidebarOpen(true);
              }}
              className="rounded-lg p-1.5 text-white/60 hover:bg-white/5 hover:text-white md:hidden"
              aria-label="Open matters menu"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <nav className="flex items-center gap-2 text-xs text-white/50">
              <Link
                href="/chat"
                className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-white/60 transition-colors hover:bg-white/5 hover:text-white"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                AI Chat
              </Link>
              <span>/</span>
              <span className="font-semibold text-white">
                Matters
              </span>
            </nav>
          </div>
        </header>
        {!workspace || loadingWorkspace ? (
          <div className="flex flex-1 items-center justify-center text-center">
            <div className="max-w-xs p-6">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10">
                <svg className="h-6 w-6 text-white/30" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <p className="text-sm font-medium text-white/60">
                {loadingWorkspace ? "Loading matter workspace..." : "Select or create a legal matter"}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Matter Header Banner */}
            <header className="border-b border-white/10 bg-white/[0.02] px-6 py-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${STATUS_COLORS[workspace.matter.status]}`}>
                      {workspace.matter.status}
                    </span>
                    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${STAGE_COLORS[workspace.matter.stage]}`}>
                      {workspace.matter.stage}
                    </span>
                    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${PRIORITY_COLORS[workspace.matter.priority]}`}>
                      {workspace.matter.priority} Priority
                    </span>
                    <span className="text-xs text-white/40">•</span>
                    <span className="text-xs text-white/50">{workspace.matter.matterType}</span>
                  </div>
                  <h2 className="mt-1.5 text-xl font-bold text-white tracking-tight">
                    {workspace.matter.name}
                  </h2>
                  <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-white/60">
                    {workspace.matter.parties && (
                      <span><strong>Parties:</strong> {workspace.matter.parties}</span>
                    )}
                    {workspace.matter.court && (
                      <span><strong>Court/Forum:</strong> {workspace.matter.court}</span>
                    )}
                  </div>
                </div>

                {/* Header Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={startEditMatter}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white"
                  >
                    Edit Details
                  </button>
                  <button
                    onClick={handleToggleArchive}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/60 hover:bg-white/10 hover:text-white"
                  >
                    {workspace.matter.status === "archived" ? "Unarchive" : "Archive"}
                  </button>
                  <button
                    onClick={handleDeleteMatter}
                    className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Navigation Tabs */}
              <nav className="mt-5 -mb-4 flex space-x-2 border-b border-transparent overflow-x-auto text-xs">
                {[
                  { id: "overview", label: "Overview" },
                  { id: "documents", label: `Documents (${workspace.documents.length})` },
                  { id: "contract_risk", label: "Contract Risk Analyzer" },
                  { id: "doc_compare", label: "Document Comparison" },
                  { id: "courtroom_prep", label: "Courtroom Prep Mode" },
                  { id: "reports", label: `Saved Reports (${workspace.reports.length})` },
                  { id: "activity", label: `Timeline (${workspace.activities.length})` },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as typeof activeTab)}
                    className={`whitespace-nowrap pb-3 px-3 font-semibold transition-all border-b-2 ${
                      activeTab === t.id
                        ? "border-amber-400 text-white"
                        : "border-transparent text-white/50 hover:text-white/80"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </nav>
            </header>

            {/* Tab Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* TAB 1: OVERVIEW */}
              {activeTab === "overview" && (
                <div className="mx-auto max-w-5xl space-y-6">
                  {workspace.matter.nextHearing && (
                    <div className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs text-amber-300">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-white">Upcoming Hearing / Court Appearance</p>
                          <p className="text-amber-200/80">
                            {new Date(workspace.matter.nextHearing).toLocaleString("en-IN", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                      <span className="rounded bg-amber-400/20 px-2 py-1 text-[11px] font-semibold text-amber-300">
                        Court Action Required
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4 md:col-span-2">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <svg className="h-4 w-4 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Matter Description & Scope
                      </h3>
                      <p className="text-xs text-white/70 leading-relaxed whitespace-pre-wrap">
                        {workspace.matter.description || "No specific description added yet."}
                      </p>

                      {workspace.matter.notes && (
                        <div className="pt-4 border-t border-white/5">
                          <h4 className="text-xs font-semibold text-white/60 mb-1">Case Notes:</h4>
                          <p className="text-xs text-white/60 whitespace-pre-wrap">{workspace.matter.notes}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                        <h3 className="text-sm font-bold text-white mb-3">Matter Assets</h3>
                        <div className="space-y-2.5 text-xs text-white/70">
                          <div className="flex justify-between border-b border-white/5 pb-2">
                            <span>Documents:</span>
                            <strong className="text-white">{workspace.documents.length}</strong>
                          </div>
                          <div className="flex justify-between border-b border-white/5 pb-2">
                            <span>AI Reports & Briefs:</span>
                            <strong className="text-amber-400">{workspace.reports.length}</strong>
                          </div>
                          <div className="flex justify-between border-b border-white/5 pb-2">
                            <span>Conversations:</span>
                            <strong className="text-white">{workspace.conversations.length}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Logged Activities:</span>
                            <strong className="text-white">{workspace.activities.length}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent p-5">
                        <h3 className="text-sm font-bold text-white mb-3">AI Intelligence Tools</h3>
                        <div className="space-y-2">
                          <button
                            onClick={() => setActiveTab("contract_risk")}
                            className="w-full flex items-center justify-between rounded-xl bg-white/5 border border-white/10 p-2.5 text-xs text-white/80 hover:bg-white/10 hover:text-white"
                          >
                            <span>Analyze Contract Risk</span>
                            <span>→</span>
                          </button>
                          <button
                            onClick={() => setActiveTab("doc_compare")}
                            className="w-full flex items-center justify-between rounded-xl bg-white/5 border border-white/10 p-2.5 text-xs text-white/80 hover:bg-white/10 hover:text-white"
                          >
                            <span>Compare Documents</span>
                            <span>→</span>
                          </button>
                          <button
                            onClick={() => setActiveTab("courtroom_prep")}
                            className="w-full flex items-center justify-between rounded-xl bg-white/5 border border-white/10 p-2.5 text-xs text-white/80 hover:bg-white/10 hover:text-white"
                          >
                            <span>Courtroom Prep Assistant</span>
                            <span>→</span>
                          </button>
                          <Link
                            href={`/chat?folderId=${encodeURIComponent(workspace.matter.id)}`}
                            className="w-full flex items-center justify-between rounded-xl bg-white/5 border border-white/10 p-2.5 text-xs text-white/80 hover:bg-white/10 hover:text-white"
                          >
                            <span>Ask AI Legal Chat</span>
                            <span>↗</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>

                  {workspace.conversations.length > 0 && (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                      <h3 className="text-sm font-bold text-white mb-3">Linked Research & Chat Sessions</h3>
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        {workspace.conversations.map((c) => (
                          <Link
                            key={c.id}
                            href={`/chat?conversationId=${encodeURIComponent(c.id)}`}
                            className="rounded-xl border border-white/5 bg-white/[0.03] p-3 transition-all hover:bg-white/[0.06]"
                          >
                            <p className="text-xs font-semibold text-white truncate">{c.title}</p>
                            <p className="mt-1 text-[11px] text-white/40 truncate">{c.preview}</p>
                            <p className="mt-2 text-[10px] text-white/30">
                              Updated {new Date(c.updatedAt).toLocaleDateString("en-IN")}
                            </p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: DOCUMENTS */}
              {activeTab === "documents" && (
                <div className="mx-auto max-w-5xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white">Matter Documents & Evidence</h3>
                      <p className="text-xs text-white/50">Store versioned agreements, pleadings, affidavits, and court orders.</p>
                    </div>
                    <button
                      onClick={() => setShowDocUploadModal(true)}
                      className="flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-xs font-semibold text-black hover:bg-white/90"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Upload Document
                    </button>
                  </div>

                  {workspace.documents.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center">
                      <p className="text-sm font-medium text-white/60">No documents uploaded for this matter</p>
                      <button
                        onClick={() => setShowDocUploadModal(true)}
                        className="mt-3 rounded-lg bg-white/10 px-4 py-1.5 text-xs font-semibold text-white hover:bg-white/15"
                      >
                        Upload First Document
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-white/10 bg-white/[0.03] text-white/50">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Document Name</th>
                            <th className="px-4 py-3 font-semibold">Type</th>
                            <th className="px-4 py-3 font-semibold">Version</th>
                            <th className="px-4 py-3 font-semibold">Size</th>
                            <th className="px-4 py-3 font-semibold">Date Uploaded</th>
                            <th className="px-4 py-3 text-right font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {workspace.documents.map((doc) => (
                            <tr key={doc.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="px-4 py-3.5 font-medium text-white flex items-center gap-2">
                                <svg className="h-4 w-4 text-white/40 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <span className="truncate max-w-xs">{doc.fileName}</span>
                              </td>
                              <td className="px-4 py-3.5">
                                <span className="rounded bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] text-white/70">
                                  {doc.docType || "General"}
                                </span>
                              </td>
                              <td className="px-4 py-3.5">
                                <span className="rounded bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                                  v{doc.version || 1}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-white/50">
                                {doc.fileSize ? `${Math.round(doc.fileSize / 1024)} KB` : "—"}
                              </td>
                              <td className="px-4 py-3.5 text-white/50">
                                {new Date(doc.createdAt).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </td>
                              <td className="px-4 py-3.5 text-right space-x-2">
                                {doc.fileUrl && (
                                  <a
                                    href={doc.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="rounded bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white/70 hover:bg-white/10 hover:text-white"
                                  >
                                    View ↗
                                  </a>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: CONTRACT RISK ANALYZER */}
              {activeTab === "contract_risk" && (
                <div className="mx-auto max-w-5xl space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-white">Contract Risk & Clause Analyzer</h3>
                    <p className="text-xs text-white/50">
                      Audit commercial agreements clause-by-clause against Indian statutory provisions (Indian Contract Act, Specific Relief Act, MSMED Act, etc.).
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-white/70 mb-1">Contract Type</label>
                      <input
                        type="text"
                        value={contractType}
                        onChange={(e) => setContractType(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-white/20"
                        placeholder="e.g. Master Services Agreement, Non-Disclosure Agreement, Employment Contract"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-white/70 mb-1">
                        Contract Text or Clauses to Analyze
                      </label>
                      <textarea
                        rows={8}
                        value={contractText}
                        onChange={(e) => setContractText(e.target.value)}
                        placeholder="Paste contract clauses or agreement text here (e.g., non-compete clauses, damages provisions, payment terms)..."
                        className="w-full rounded-xl border border-white/10 bg-white/5 p-3 font-mono text-xs text-white placeholder-white/30 outline-none focus:border-white/20"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[11px] text-white/40">
                        {contractText.length} characters • Analyzed against verified Indian statutes
                      </span>
                      <button
                        onClick={handleAnalyzeContract}
                        disabled={analyzingRisk || !contractText.trim()}
                        className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-black transition-all hover:bg-white/90 disabled:opacity-50"
                      >
                        {analyzingRisk ? (
                          <>
                            <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                            Analyzing Clauses...
                          </>
                        ) : (
                          "Run Statutory Risk Analysis"
                        )}
                      </button>
                    </div>
                  </div>

                  {riskResult && (
                    <div className="space-y-6 pt-4 border-t border-white/10">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
                          <div>
                            <span className="text-xs uppercase tracking-wider text-white/50">Executive Risk Assessment</span>
                            <h4 className="text-lg font-bold text-white mt-1">
                              Overall Risk Score: <span className="text-amber-400">{riskResult.overallRiskScore} / 100</span>
                            </h4>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="rounded bg-red-500/10 border border-red-500/20 px-2 py-1 text-red-400 font-semibold">
                              {riskResult.riskSummary.criticalCount} Critical
                            </span>
                            <span className="rounded bg-orange-500/10 border border-orange-500/20 px-2 py-1 text-orange-400 font-semibold">
                              {riskResult.riskSummary.highCount} High
                            </span>
                            <span className="rounded bg-amber-500/10 border border-amber-500/20 px-2 py-1 text-amber-400 font-semibold">
                              {riskResult.riskSummary.mediumCount} Medium
                            </span>
                            <span className="rounded bg-blue-500/10 border border-blue-500/20 px-2 py-1 text-blue-400 font-semibold">
                              {riskResult.riskSummary.lowCount} Low
                            </span>
                          </div>
                        </div>

                        <p className="mt-4 text-xs text-white/80 leading-relaxed">
                          {riskResult.executiveSummary}
                        </p>

                        <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-3 text-[11px] text-amber-300">
                          {riskResult.legalDisclaimer}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-sm font-bold text-white">Identified Clause Risks</h4>
                        {riskResult.identifiedRisks.map((risk: ClauseRiskItem) => (
                          <div
                            key={risk.id}
                            className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`rounded px-2.5 py-0.5 text-[10px] font-bold uppercase border ${
                                  risk.severity === "Critical"
                                    ? "bg-red-500/20 text-red-400 border-red-500/30"
                                    : risk.severity === "High"
                                    ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                                    : risk.severity === "Medium"
                                    ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                                    : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                                }`}
                              >
                                {risk.severity} Risk
                              </span>
                              <span className="text-[11px] text-white/40">{risk.clauseTitle}</span>
                            </div>

                            <div className="rounded-xl bg-black/60 border border-white/5 p-3 font-mono text-[11px] text-white/70">
                              &quot;{risk.clauseText}&quot;
                            </div>

                            <div>
                              <p className="text-xs text-white/90">
                                <strong>Legal & Commercial Risk:</strong> {risk.riskExplanation}
                              </p>
                            </div>

                            {risk.indianLawGrounding && (
                              <div className="flex items-start gap-2 rounded-xl bg-amber-500/[0.03] border border-amber-500/20 p-2.5 text-xs text-amber-300">
                                <svg className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <div>
                                  <span className="font-semibold">{risk.indianLawGrounding.section} {risk.indianLawGrounding.statute}:</span>{" "}
                                  <span>{risk.indianLawGrounding.principle}</span>
                                </div>
                              </div>
                            )}

                            {risk.suggestedWording && (
                              <div className="rounded-xl bg-emerald-500/[0.04] border border-emerald-500/20 p-3">
                                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block mb-1">
                                  Suggested Remedial Wording:
                                </span>
                                <p className="font-mono text-xs text-emerald-200/90 leading-relaxed">
                                  {risk.suggestedWording}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {riskResult.missingClauses.length > 0 && (
                        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
                          <h4 className="text-sm font-bold text-white">Missing Essential Clauses</h4>
                          <div className="space-y-2">
                            {riskResult.missingClauses.map((mc: MissingClauseItem, idx: number) => (
                              <div key={idx} className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs">
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-white">{mc.clauseName}</span>
                                  <span className={`text-[10px] font-semibold uppercase ${mc.importance === "Essential" ? "text-red-400" : "text-amber-400"}`}>
                                    {mc.importance} Importance
                                  </span>
                                </div>
                                <p className="mt-1 text-white/60">{mc.explanation}</p>
                                <p className="mt-1 text-[11px] text-white/50 font-mono">
                                  Standard Sample: {mc.standardSampleClause}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: DOCUMENT COMPARISON */}
              {activeTab === "doc_compare" && (
                <div className="mx-auto max-w-5xl space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-white">Legal Document Comparison & Diff</h3>
                    <p className="text-xs text-white/50">
                      Compare two versions of an agreement side-by-side and evaluate the commercial and legal impact of altered obligations, payment terms, and liability.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                      <input
                        type="text"
                        value={titleA}
                        onChange={(e) => setTitleA(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-white outline-none"
                      />
                      <textarea
                        rows={10}
                        value={compareDocA}
                        onChange={(e) => setCompareDocA(e.target.value)}
                        placeholder="Paste Version A / Original contract text here..."
                        className="w-full rounded-xl border border-white/10 bg-white/5 p-3 font-mono text-xs text-white outline-none"
                      />
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                      <input
                        type="text"
                        value={titleB}
                        onChange={(e) => setTitleB(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-white outline-none"
                      />
                      <textarea
                        rows={10}
                        value={compareDocB}
                        onChange={(e) => setCompareDocB(e.target.value)}
                        placeholder="Paste Version B / Revised contract text here..."
                        className="w-full rounded-xl border border-white/10 bg-white/5 p-3 font-mono text-xs text-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleCompareDocuments}
                      disabled={comparingDocs || !compareDocA.trim() || !compareDocB.trim()}
                      className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-semibold text-black transition-all hover:bg-white/90 disabled:opacity-50"
                    >
                      {comparingDocs ? "Comparing Documents..." : "Run Side-by-Side Comparison"}
                    </button>
                  </div>

                  {compareResult && (
                    <div className="space-y-6 pt-4 border-t border-white/10">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                        <h4 className="text-sm font-bold text-white mb-2">Comparison Overview</h4>
                        <p className="text-xs text-white/70">{compareResult.executiveSummary}</p>
                        <div className="mt-3 flex gap-3 text-xs">
                          <span className="text-emerald-400 font-semibold">{compareResult.addedCount} Added Clauses</span>
                          <span className="text-red-400 font-semibold">{compareResult.removedCount} Removed Clauses</span>
                          <span className="text-amber-400 font-semibold">{compareResult.modifiedCount} Modified Clauses</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-sm font-bold text-white">Clause-by-Clause Variations</h4>
                        {compareResult.clauseDiffs.map((item: ClauseDiff) => (
                          <div
                            key={item.id}
                            className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                                  item.changeType === "added"
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : item.changeType === "removed"
                                    ? "bg-red-500/20 text-red-400"
                                    : "bg-amber-500/20 text-amber-400"
                                }`}
                              >
                                {item.changeType}
                              </span>
                              <span className="text-[11px] font-medium text-white/50">{item.category}</span>
                            </div>

                            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 text-[11px] font-mono">
                              <div className="rounded bg-black/60 border border-white/5 p-2 text-white/60">
                                <span className="text-[10px] text-white/40 block mb-1">Version A:</span>
                                {item.versionAText || "<Not present in Version A>"}
                              </div>
                              <div className="rounded bg-black/60 border border-white/5 p-2 text-white/80">
                                <span className="text-[10px] text-white/40 block mb-1">Version B:</span>
                                {item.versionBText || "<Deleted in Version B>"}
                              </div>
                            </div>

                            <div className="rounded-lg bg-amber-500/[0.03] border border-amber-500/15 p-2 text-xs text-amber-200/90">
                              <strong>Legal Impact:</strong> {item.legalSignificance}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: COURTROOM PREP MODE */}
              {activeTab === "courtroom_prep" && (
                <div className="mx-auto max-w-5xl space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-white">Courtroom Hearing & Trial Preparation</h3>
                    <p className="text-xs text-white/50">
                      Formulate bilateral arguments, anticipate Bench inquiry questions, prepare tactical witness cross-examination, and review statutory evidence rules.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-white/70 mb-1">Claim / Proceeding Type</label>
                      <input
                        type="text"
                        value={prepClaimType}
                        onChange={(e) => setPrepClaimType(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-white/70 mb-1">
                        Case Facts, Pleadings & Evidentiary Background
                      </label>
                      <textarea
                        rows={7}
                        value={prepFacts}
                        onChange={(e) => setPrepFacts(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white outline-none"
                        placeholder="Detail the undisputed facts, allegations, claims, and current stage of the dispute..."
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={handleGenerateCourtroomPrep}
                        disabled={preppingCourtroom || !prepFacts.trim()}
                        className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-semibold text-black transition-all hover:bg-white/90 disabled:opacity-50"
                      >
                        {preppingCourtroom ? "Assembling Courtroom Strategy..." : "Generate Trial & Hearing Brief"}
                      </button>
                    </div>
                  </div>

                  {prepResult && (
                    <div className="space-y-6 pt-4 border-t border-white/10">
                      {/* Legal Issues */}
                      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
                        <h4 className="text-sm font-bold text-white">Framed Legal Issues</h4>
                        <div className="space-y-2">
                          {prepResult.legalIssues.map((issue: LegalIssueItem) => (
                            <div key={issue.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs">
                              <p className="font-semibold text-white">{issue.issueText}</p>
                              <div className="mt-1 flex gap-2 text-[11px] text-white/50">
                                <span>Governing Law:</span>
                                <span className="text-amber-400 font-mono">{issue.governingLaw}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Bilateral Arguments: Petitioner vs Respondent */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-bold text-white">Bilateral Arguments & Counterarguments</h4>
                        {prepResult.arguments.map((arg: ArgumentPair) => (
                          <div key={arg.issueId} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.02] p-5 space-y-3">
                              <h5 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Petitioner / Plaintiff Arguments</h5>
                              <ul className="list-disc pl-4 space-y-2 text-xs text-white/80">
                                {arg.petitionerArguments.map((pa, idx) => (
                                  <li key={idx}>{pa}</li>
                                ))}
                              </ul>
                              {arg.weaknessesPetitioner.length > 0 && (
                                <div className="pt-2 border-t border-emerald-500/10">
                                  <span className="text-[10px] text-amber-300 font-semibold block">Vulnerabilities to Watch:</span>
                                  <ul className="list-disc pl-4 text-[11px] text-white/60">
                                    {arg.weaknessesPetitioner.map((wp, idx) => (
                                      <li key={idx}>{wp}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>

                            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.02] p-5 space-y-3">
                              <h5 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Respondent / Defence Positions</h5>
                              <ul className="list-disc pl-4 space-y-2 text-xs text-white/80">
                                {arg.respondentArguments.map((ra, idx) => (
                                  <li key={idx}>{ra}</li>
                                ))}
                              </ul>
                              {arg.weaknessesRespondent.length > 0 && (
                                <div className="pt-2 border-t border-blue-500/10">
                                  <span className="text-[10px] text-amber-300 font-semibold block">Rebuttal Strategy:</span>
                                  <ul className="list-disc pl-4 text-[11px] text-white/60">
                                    {arg.weaknessesRespondent.map((wr, idx) => (
                                      <li key={idx}>{wr}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Bench Hearing Questions & Cross Exam */}
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
                          <h4 className="text-sm font-bold text-white">Probable Bench Inquiry Questions</h4>
                          <div className="space-y-2">
                            {prepResult.hearingQuestions.map((bq: HearingQuestionItem, idx: number) => (
                              <div key={idx} className="rounded-xl border border-white/5 bg-black/40 p-3 text-xs space-y-1">
                                <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] text-white/60 uppercase">{bq.targetedParty}</span>
                                <p className="font-semibold text-white mt-1">&quot;{bq.question}&quot;</p>
                                <p className="text-[11px] text-white/50">Focus: {bq.strategicIntent}</p>
                                <p className="text-[11px] text-emerald-300">Strategy: {bq.suggestedAnswerStrategy}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
                          <h4 className="text-sm font-bold text-white">Tactical Cross-Examination Questions</h4>
                          <div className="space-y-2">
                            {prepResult.crossExamination.map((cq: CrossExaminationQuestion, idx: number) => (
                              <div key={idx} className="rounded-xl border border-white/5 bg-black/40 p-3 text-xs space-y-1">
                                <p className="text-[10px] text-amber-400 font-semibold uppercase">{cq.targetWitness}</p>
                                <p className="font-semibold text-white">&quot;{cq.question}&quot;</p>
                                <p className="text-[11px] text-white/50">Purpose: {cq.purpose}</p>
                                <p className="text-[10px] text-white/40">Basis: {cq.statutoryBasis}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Statutory Evidence Checklist */}
                      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
                        <h4 className="text-sm font-bold text-white">Statutory Evidence Checklist</h4>
                        <div className="space-y-2">
                          {prepResult.evidenceChecklist.map((ec: EvidenceChecklistItem, idx: number) => (
                            <div key={idx} className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs">
                              <span className="shrink-0 rounded bg-red-500/20 text-red-400 px-1.5 py-0.5 text-[9px] font-bold uppercase">
                                {ec.status}
                              </span>
                              <div>
                                <p className="font-semibold text-white">{ec.documentOrExhibit}</p>
                                <p className="text-white/60 text-[11px]">{ec.relevance}</p>
                                <p className="text-amber-400/80 text-[10px] font-mono mt-0.5">{ec.mandatoryPrerequisite}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: SAVED REPORTS */}
              {activeTab === "reports" && (
                <div className="mx-auto max-w-5xl space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-white">Generated Reports & Legal Intelligence</h3>
                    <p className="text-xs text-white/50">Historical reports, contract audits, and courtroom trial briefs saved to this matter.</p>
                  </div>

                  {workspace.reports.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center">
                      <p className="text-sm font-medium text-white/60">No reports generated yet</p>
                      <p className="mt-1 text-xs text-white/40">
                        Use the Contract Risk Analyzer, Document Comparison, or Courtroom Prep tabs to generate reports.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {workspace.reports.map((rep) => (
                        <div
                          key={rep.id}
                          className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="rounded bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 text-[10px] font-semibold text-amber-400 uppercase">
                              {rep.reportType.replace("_", " ")}
                            </span>
                            <span className="text-[11px] text-white/40">
                              {new Date(rep.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white">{rep.title}</h4>
                          <p className="text-xs text-white/70 leading-relaxed">{rep.summary}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 7: ACTIVITY TIMELINE */}
              {activeTab === "activity" && (
                <div className="mx-auto max-w-5xl space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-white">Matter Activity & Audit Trail</h3>
                    <p className="text-xs text-white/50">Chronological history of all edits, document additions, and intelligence generated.</p>
                  </div>

                  <div className="relative border-l border-white/10 pl-4 ml-2 space-y-4">
                    {workspace.activities.map((act) => (
                      <div key={act.id} className="relative">
                        <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-amber-400 ring-4 ring-black" />
                        <div className="text-xs">
                          <span className="text-[10px] font-mono text-white/40">
                            {new Date(act.createdAt).toLocaleString("en-IN")}
                          </span>
                          <p className="mt-0.5 text-white/90 font-medium">{act.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* CREATE MATTER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-neutral-900 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Create New Legal Matter</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-white/40 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-white/60 mb-1">Matter Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Acme Corp v. Union of India"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-white/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/60 mb-1">Stage</label>
                  <select
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value as MatterStage })}
                    className="w-full rounded-lg border border-white/10 bg-[#141414] px-3 py-2 text-white outline-none focus:border-white/20 [&>option]:bg-[#141414] [&>option]:text-white"
                  >
                    {MATTER_STAGES.map((s) => (
                      <option key={s} value={s} className="bg-[#141414] text-white">{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-white/60 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as MatterPriority })}
                    className="w-full rounded-lg border border-white/10 bg-[#141414] px-3 py-2 text-white outline-none focus:border-white/20 [&>option]:bg-[#141414] [&>option]:text-white"
                  >
                    {MATTER_PRIORITIES.map((p) => (
                      <option key={p} value={p} className="bg-[#141414] text-white">{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-white/60 mb-1">Parties Involved</label>
                <input
                  type="text"
                  value={formData.parties}
                  onChange={(e) => setFormData({ ...formData, parties: e.target.value })}
                  placeholder="e.g. Petitioner: Acme Ltd | Respondent: Tax Authority"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-white/60 mb-1">Court / Forum</label>
                <input
                  type="text"
                  value={formData.court}
                  onChange={(e) => setFormData({ ...formData, court: e.target.value })}
                  placeholder="e.g. High Court of Delhi / NCLT"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-white/60 mb-1">Next Hearing Date</label>
                <input
                  type="datetime-local"
                  value={formData.nextHearing}
                  onChange={(e) => setFormData({ ...formData, nextHearing: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-white/60 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief summary of matter facts..."
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/15"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateMatter}
                disabled={formSaving || !formData.name.trim()}
                className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-white/90 disabled:opacity-50"
              >
                {formSaving ? "Creating..." : "Create Matter"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MATTER MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-neutral-900 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Edit Matter Details</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-white/40 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-white/60 mb-1">Matter Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/60 mb-1">Stage</label>
                  <select
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value as MatterStage })}
                    className="w-full rounded-lg border border-white/10 bg-[#141414] px-3 py-2 text-white outline-none focus:border-white/20 [&>option]:bg-[#141414] [&>option]:text-white"
                  >
                    {MATTER_STAGES.map((s) => (
                      <option key={s} value={s} className="bg-[#141414] text-white">{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-white/60 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as MatterPriority })}
                    className="w-full rounded-lg border border-white/10 bg-[#141414] px-3 py-2 text-white outline-none focus:border-white/20 [&>option]:bg-[#141414] [&>option]:text-white"
                  >
                    {MATTER_PRIORITIES.map((p) => (
                      <option key={p} value={p} className="bg-[#141414] text-white">{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-white/60 mb-1">Parties Involved</label>
                <input
                  type="text"
                  value={formData.parties}
                  onChange={(e) => setFormData({ ...formData, parties: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-white/60 mb-1">Court / Forum</label>
                <input
                  type="text"
                  value={formData.court}
                  onChange={(e) => setFormData({ ...formData, court: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-white/60 mb-1">Next Hearing Date</label>
                <input
                  type="datetime-local"
                  value={formData.nextHearing}
                  onChange={(e) => setFormData({ ...formData, nextHearing: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-white/60 mb-1">Notes</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowEditModal(false)}
                className="rounded-lg bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/15"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateMatter}
                disabled={formSaving || !formData.name.trim()}
                className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-white/90 disabled:opacity-50"
              >
                {formSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD DOCUMENT MODAL */}
      {showDocUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-900 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Upload Document</h3>
              <button
                onClick={() => setShowDocUploadModal(false)}
                className="text-white/40 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-white/60 mb-1">Select File</label>
                <input
                  ref={docFileInputRef}
                  type="file"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setUploadFormData({ ...uploadFormData, file: f });
                  }}
                  className="w-full rounded-lg border border-white/10 bg-white/5 p-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-white/60 mb-1">Document Category</label>
                <select
                  value={uploadFormData.docType}
                  onChange={(e) => setUploadFormData({ ...uploadFormData, docType: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-[#141414] px-3 py-2 text-white outline-none focus:border-white/20 [&>option]:bg-[#141414] [&>option]:text-white"
                >
                  <option value="Pleadings" className="bg-[#141414] text-white">Pleadings (Plaint / Written Statement / Petition)</option>
                  <option value="Agreement" className="bg-[#141414] text-white">Agreement / Contract / NDA</option>
                  <option value="Evidence" className="bg-[#141414] text-white">Documentary Evidence / Affidavit</option>
                  <option value="Court Order" className="bg-[#141414] text-white">Court Order / Judgment / Notice</option>
                  <option value="General" className="bg-[#141414] text-white">General Correspondence</option>
                </select>
              </div>

              <div>
                <label className="block text-white/60 mb-1">Version Number</label>
                <input
                  type="number"
                  min={1}
                  value={uploadFormData.version}
                  onChange={(e) => setUploadFormData({ ...uploadFormData, version: parseInt(e.target.value, 10) || 1 })}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDocUploadModal(false)}
                className="rounded-lg bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/15"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadDocument}
                disabled={uploading || !uploadFormData.file}
                className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-white/90 disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Upload File"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
