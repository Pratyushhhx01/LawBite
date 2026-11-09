"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import MattersApp from "@/app/matters/_components/MattersApp";
import AmendmentTrackerApp from "@/app/amendments/_components/AmendmentTrackerApp";

interface CaseDoc {
  id: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  createdAt: string;
}

interface CaseFolder {
  id: string;
  name: string;
  description: string;
  status: string;
  parties: string;
  court: string;
  nextHearing: string | null;
  notes: string;
  createdAt: string;
}

interface CaseDetail extends CaseFolder {
  documents: CaseDoc[];
  conversations: {
    id: string;
    title: string;
    preview: string;
    type: string;
    updatedAt: string;
  }[];
}

interface CasesAppProps {
  user: { id: string; name: string; email: string; image: string | null };
  initialCaseId?: string | null;
  initialTab?: "cases" | "matters" | "amendments" | null;
  initialMatterId?: string | null;
  initialQuery?: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  active:
    "bg-emerald-500/10 text-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.15)]",
  pending:
    "bg-amber-500/10 text-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.15)]",
  closed: "bg-white/5 text-white/40 shadow-[0_0_8px_rgba(255,255,255,0.05)]",
};

function MobileBackButton({
  onClick,
  className = "",
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 text-sm text-white/50 transition-colors hover:text-white md:hidden ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      All cases
    </button>
  );
}

export default function CasesApp({
  user,
  initialCaseId = null,
  initialTab = null,
  initialMatterId = null,
  initialQuery = null,
}: CasesAppProps) {
  const [activeModule, setActiveModuleState] = useState<"cases" | "matters" | "amendments">(
    initialTab || (initialMatterId ? "matters" : "cases")
  );

  const setActiveModule = (mod: "cases" | "matters" | "amendments") => {
    setActiveModuleState(mod);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", mod);
      window.history.replaceState(null, "", url.toString());
    }
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);
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
  const [cases, setCases] = useState<CaseFolder[]>([]);
  const [prevInitialCaseId, setPrevInitialCaseId] = useState(initialCaseId);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialCaseId ?? null
  );
  const [detail, setDetail] = useState<CaseDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(Boolean(initialCaseId));

  if (initialCaseId !== prevInitialCaseId) {
    setPrevInitialCaseId(initialCaseId);
    setSelectedId(initialCaseId ?? null);
    if (initialCaseId) {
      setDetailLoading(true);
    }
  }
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "active",
    parties: "",
    court: "",
    nextHearing: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<
    { file: File; name: string }[]
  >([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formFileInputRef = useRef<HTMLInputElement>(null);
  const casesRef = useRef<CaseFolder[]>(cases);
  useEffect(() => {
    casesRef.current = cases;
  }, [cases]);

  useEffect(() => {
    const handlePopState = () => {
      const sp = new URLSearchParams(window.location.search);
      const urlCaseId = sp.get("caseId") || sp.get("id");
      setSelectedId(urlCaseId || null);
      if (urlCaseId) {
        setDetailLoading(true);
      } else {
        setDetail(null);
      }
      setEditMode(false);
      setShowCreate(false);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const selectCase = (id: string) => {
    if (id !== selectedId) {
      setDetail(null);
      setDetailLoading(true);
      setSelectedId(id);
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.set("caseId", id);
        url.searchParams.delete("id");
        window.history.pushState(null, "", url.toString());
      }
    }
    setEditMode(false);
    setShowCreate(false);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/cases?withConversations=true", {
          credentials: "include",
        });
        const data = await res.json();
        if (!cancelled) setCases(data.folders || []);
      } catch {
        console.error("Failed to load cases");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/cases?caseId=${selectedId}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok || data.error) {
          const local = casesRef.current.find((c) => c.id === selectedId);
          if (local) {
            setDetail({ ...local, documents: [], conversations: [] });
          }
          return;
        }
        setDetail({
          ...data.folder,
          documents: data.documents || [],
          conversations: data.conversations || [],
        });
      } catch {
        const local = casesRef.current.find((c) => c.id === selectedId);
        if (local) setDetail({ ...local, documents: [], conversations: [] });
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const resetForm = () =>
    setForm({
      name: "",
      description: "",
      status: "active",
      parties: "",
      court: "",
      nextHearing: "",
      notes: "",
    });

  const handleFormFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFiles((prev) => [...prev, { file, name: file.name }]);
    if (formFileInputRef.current) formFileInputRef.current.value = "";
  };

  const removePendingFile = (idx: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const uploadPendingFiles = async (caseId: string): Promise<CaseDoc[]> => {
    const uploadedDocs: CaseDoc[] = [];
    for (const pf of pendingFiles) {
      try {
        const fd = new FormData();
        fd.append("file", pf.file);
        fd.append("caseId", caseId);
        const uploadRes = await fetch("/api/cases/documents/upload", {
          method: "POST",
          body: fd,
          credentials: "include",
        });
        if (!uploadRes.ok) continue;
        const { fileUrl, fileName, fileType } = await uploadRes.json();
        const docRes = await fetch("/api/cases/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ caseId, fileName, fileType, fileUrl }),
        });
        if (docRes.ok) {
          const doc = await docRes.json();
          uploadedDocs.push(doc);
        }
      } catch (err) {
        console.error("Pending file upload error:", err);
      }
    }
    setPendingFiles([]);
    return uploadedDocs;
  };

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const created = await res.json();
        let uploadedDocs: CaseDoc[] = [];
        if (pendingFiles.length > 0) {
          uploadedDocs = await uploadPendingFiles(created.id);
        }
        setCases((prev) => [created, ...prev]);
        setShowCreate(false);
        resetForm();
        setDetail({
          ...created,
          documents: uploadedDocs,
          conversations: [],
        });
        setDetailLoading(false);
        setSelectedId(created.id);
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          url.searchParams.set("caseId", created.id);
          url.searchParams.delete("id");
          window.history.pushState(null, "", url.toString());
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedId || !form.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/cases", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: selectedId, ...form }),
      });
      if (res.ok) {
        setCases((prev) =>
          prev.map((c) => (c.id === selectedId ? { ...c, ...form } : c)),
        );
        if (detail) setDetail({ ...detail, ...form });
        setEditMode(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const caseItem = cases.find((c) => c.id === id);
    setDeleteConfirmId(id);
    setDeleteConfirmName(caseItem?.name || "this case");
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    const id = deleteConfirmId;
    setDeleteConfirmId(null);
    setDeleteConfirmName("");
    const res = await fetch("/api/cases", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setCases((prev) => prev.filter((c) => c.id !== id));
      if (selectedId === id) {
        setSelectedId(null);
        setDetail(null);
        setDetailLoading(false);
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          url.searchParams.delete("caseId");
          url.searchParams.delete("id");
          window.history.pushState(
            null,
            "",
            url.pathname + (url.search ? url.search : ""),
          );
        }
      }
    }
  };

  const startEdit = (c?: CaseFolder) => {
    if (c) {
      setForm({
        name: c.name,
        description: c.description || "",
        status: c.status || "active",
        parties: c.parties || "",
        court: c.court || "",
        nextHearing: c.nextHearing ? c.nextHearing.slice(0, 16) : "",
        notes: c.notes || "",
      });
    } else {
      resetForm();
      setPendingFiles([]);
    }
    setEditMode(!!c);
    setShowCreate(!c);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedId) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("caseId", selectedId);
      const uploadRes = await fetch("/api/cases/documents/upload", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      if (!uploadRes.ok) throw new Error("Upload failed");
      const { fileUrl, fileName, fileType } = await uploadRes.json();
      const docRes = await fetch("/api/cases/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          caseId: selectedId,
          fileName,
          fileType,
          fileUrl,
        }),
      });
      if (docRes.ok) {
        const doc = await docRes.json();
        setDetail((prev) =>
          prev
            ? { ...prev, documents: [doc, ...(prev.documents || [])] }
            : prev,
        );
      }
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!selectedId) return;
    const res = await fetch("/api/cases/documents", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id: docId }),
    });
    if (res.ok) {
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              documents: (prev.documents || []).filter((d) => d.id !== docId),
            }
          : prev,
      );
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  const formatDateTime = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const selectedCase = cases.find((c) => c.id === selectedId);

  const backToList = () => {
    setSelectedId(null);
    setDetail(null);
    setDetailLoading(false);
    setShowCreate(false);
    setEditMode(false);
    resetForm();
    setPendingFiles([]);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("caseId");
      url.searchParams.delete("id");
      window.history.pushState(
        null,
        "",
        url.pathname + (url.search ? url.search : ""),
      );
    }
  };

  if (activeModule === "matters") {
    return (
      <MattersApp
        user={user}
        initialMatterId={initialMatterId}
        onSwitchModule={setActiveModule}
      />
    );
  }

  if (activeModule === "amendments") {
    return (
      <AmendmentTrackerApp
        onSwitchModule={setActiveModule}
        initialQuery={initialQuery}
      />
    );
  }

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-black text-white supports-[height:100dvh]:h-dvh">
      {/* Mobile backdrop */}
      <div
        aria-hidden
        className={`fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        id="cases-sidebar"
        aria-label="Case tracker navigation"
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
                aria-label="Back to AI Lawyer menu"
                title="Back to AI Lawyer menu"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/50 transition-all duration-200 hover:bg-white/10 hover:text-white"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1
                className={`text-sm font-semibold text-white/90 whitespace-nowrap transition-opacity duration-200 ${
                  sidebarOpen ? "opacity-100" : "opacity-0 md:hidden"
                }`}
              >
                Cases
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
                aria-label="Open cases menu"
                aria-expanded={sidebarOpen}
                aria-controls="cases-sidebar"
                title="Open panel"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4.5 w-4.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
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
              <span className="rounded-lg bg-white/10 py-1 font-semibold text-white">
                Cases
              </span>
              <button
                type="button"
                onClick={() => {
                  setSidebarOpen(false);
                  setActiveModule("matters");
                }}
                className="rounded-lg py-1 font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
              >
                Matters
              </button>
              <button
                type="button"
                onClick={() => {
                  setSidebarOpen(false);
                  setActiveModule("amendments");
                }}
                className="rounded-lg py-1 font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
              >
                Amendments
              </button>
            </div>
          ) : (
            <div className="mb-3 hidden md:flex flex-col items-center gap-1.5">
              <span title="Cases (Active)" className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
              </span>
              <button
                type="button"
                onClick={() => setActiveModule("matters")}
                title="Switch to Matters"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-white/40 hover:bg-white/5 hover:text-white transition-colors"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  <rect x="8" y="2" width="8" height="4" rx="1" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setActiveModule("amendments")}
                title="Switch to Amendments"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-white/40 hover:bg-white/5 hover:text-white transition-colors"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </button>
            </div>
          )}

          <button
            onClick={() => {
              setSidebarOpen(false);
              startEdit();
            }}
            title="New Case"
            className={`group flex items-center justify-center rounded-xl bg-white text-black transition-all duration-200 hover:bg-white/90 active:scale-[0.98] ${
              sidebarOpen
                ? "w-full gap-2 px-4 py-2.5 text-xs font-semibold"
                : "h-10 w-10 mx-auto"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:rotate-90"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span
              className={`whitespace-nowrap transition-opacity duration-200 ${
                sidebarOpen ? "opacity-100" : "opacity-0 md:hidden"
              }`}
            >
              New Case
            </span>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          {loading ? (
            <div className={`p-4 text-xs text-white/40 ${sidebarOpen ? "block" : "hidden"}`}>Loading cases...</div>
          ) : cases.length === 0 ? (
            sidebarOpen ? (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
                  <svg
                    className="h-7 w-7 text-white/20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium text-white/50">No cases yet</p>
                <p className="mt-1 text-xs text-white/30">
                  Click &quot;New Case&quot; to start tracking
                </p>
              </div>
            ) : null
          ) : (
            cases.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  selectCase(c.id);
                  setSidebarOpen(false);
                }}
                title={c.name}
                className={`w-full transition-all duration-200 hover:bg-white/[0.04] ${
                  sidebarOpen
                    ? "border-b border-white/5 px-4 py-3.5 text-left block"
                    : "flex h-12 w-16 items-center justify-center"
                } ${
                  selectedId === c.id
                    ? sidebarOpen
                      ? "bg-white/[0.06] border-l-2 border-l-amber-400/60"
                      : "bg-white/[0.08] text-amber-400"
                    : "border-l-2 border-l-transparent text-white/60"
                }`}
              >
                {sidebarOpen ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-white">{c.name}</span>
                      <span
                        className={`ml-auto shrink-0 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase ${STATUS_COLORS[c.status] || STATUS_COLORS.active}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${c.status === "active" ? "bg-emerald-400" : c.status === "pending" ? "bg-amber-400" : "bg-white/40"}`}
                        ></span>
                        {c.status}
                      </span>
                    </div>
                    {c.description && (
                      <p className="mt-1 truncate text-xs text-white/40">
                        {c.description}
                      </p>
                    )}
                    {c.nextHearing && (
                      <p className="mt-1 text-[11px] text-amber-400/70">
                        Next: {formatDateTime(c.nextHearing)}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.05] text-xs font-semibold uppercase text-white/80 transition-colors hover:bg-white/10">
                    {c.name.slice(0, 2)}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-black ${
                        c.status === "active"
                          ? "bg-emerald-400"
                          : c.status === "pending"
                          ? "bg-amber-400"
                          : "bg-white/40"
                      }`}
                    />
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </aside>

      <main
        className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden pl-16 transition-[padding] duration-300"
      >
        {/* Top App Navigation Bar */}
        <header className="flex items-center justify-between border-b border-white/10 bg-black/40 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                cancelSidebarClose();
                setSidebarOpen(true);
              }}
              className="rounded-lg p-1.5 text-white/60 hover:bg-white/5 hover:text-white md:hidden"
              aria-label="Open cases menu"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            {selectedId && (
              <MobileBackButton onClick={backToList} />
            )}
            <nav className="flex items-center gap-1.5 text-xs text-white/50">
              <Link
                href="/chat"
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-white/60 transition-colors hover:bg-white/5 hover:text-white"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                AI Chat
              </Link>
              <span>/</span>
              <span className="rounded-lg bg-white/10 px-2.5 py-1 font-semibold text-white">
                Case Tracker
              </span>
              <span>/</span>
              <span className="font-semibold text-white">
                Cases
              </span>
            </nav>
          </div>
        </header>
        {!selectedId && !showCreate && !editMode ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01]">
                <svg
                  className="h-10 w-10 text-white/15"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white/70">
                Cases
              </h2>
              <p className="mt-2 max-w-md text-sm text-white/40">
                Select a case from the sidebar or click &quot;New Case&quot; to begin tracking
              </p>
              <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={() => startEdit()}
                  className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-black transition-all hover:bg-white/90"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                  </svg>
                  New Case
                </button>
                <Link
                  href="/chat"
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white/80 transition-all hover:bg-white/10 hover:text-white"
                >
                  AI Chat →
                </Link>
              </div>
            </div>
          </div>
        ) : showCreate || editMode ? (
          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="mx-auto max-w-2xl">
              <h2 className="mb-6 text-lg font-semibold">
                {editMode ? "Edit Case" : "New Case"}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-white/50">
                    Case Name *
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-white/25"
                    placeholder="e.g. Sharma v. State of Maharashtra"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-white/50">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    rows={3}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-white/25"
                    placeholder="Brief description of the case..."
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-white/50">
                      Status
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) =>
                        setForm({ ...form, status: e.target.value })
                      }
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-white/25 [&>option]:bg-[#1a1a1a] [&>option]:text-white"
                    >
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-white/50">
                      Next Hearing
                    </label>
                    <input
                      type="datetime-local"
                      value={form.nextHearing}
                      onChange={(e) =>
                        setForm({ ...form, nextHearing: e.target.value })
                      }
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-white/25"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-white/50">
                    Parties Involved
                  </label>
                  <input
                    value={form.parties}
                    onChange={(e) =>
                      setForm({ ...form, parties: e.target.value })
                    }
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-white/25"
                    placeholder="e.g. Rajesh Sharma vs State of Maharashtra"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-white/50">
                    Court
                  </label>
                  <input
                    value={form.court}
                    onChange={(e) =>
                      setForm({ ...form, court: e.target.value })
                    }
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-white/25"
                    placeholder="e.g. Bombay High Court"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-white/50">
                    Notes
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={(e) =>
                      setForm({ ...form, notes: e.target.value })
                    }
                    rows={4}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-white/25"
                    placeholder="Additional notes..."
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-white/50">
                    Documents
                  </label>
                  <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-4">
                    <input
                      ref={formFileInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                      onChange={handleFormFileAdd}
                    />
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => formFileInputRef.current?.click()}
                        className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-medium text-white/70 transition-colors hover:bg-white/20"
                      >
                        <svg
                          className="h-3.5 w-3.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                          />
                        </svg>
                        Add files
                      </button>
                      <span className="text-[11px] text-white/30">
                        PDF, DOC, images — will be uploaded after saving
                      </span>
                    </div>
                    {pendingFiles.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        {pendingFiles.map((pf, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 rounded-md bg-white/[0.04] px-3 py-2"
                          >
                            <svg
                              className="h-3.5 w-3.5 shrink-0 text-white/30"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                              />
                            </svg>
                            <span className="min-w-0 flex-1 truncate text-xs text-white/60">
                              {pf.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => removePendingFile(i)}
                              className="shrink-0 text-[10px] text-white/30 hover:text-red-400"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={editMode ? handleUpdate : handleCreate}
                    disabled={saving || !form.name.trim()}
                    className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/20 disabled:opacity-40"
                  >
                    {saving
                      ? "Saving..."
                      : editMode
                        ? "Update Case"
                        : "Create Case"}
                  </button>
                  <button
                    onClick={() => {
                      setShowCreate(false);
                      setEditMode(false);
                      resetForm();
                      setPendingFiles([]);
                    }}
                    className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/50 transition-colors hover:text-white/70"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : detailLoading ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            <p className="text-sm text-white/40">Loading case...</p>
          </div>
        ) : detail ? (
          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="mx-auto max-w-3xl">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-semibold">{detail.name}</h2>
                    <span
                      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase ${STATUS_COLORS[detail.status] || STATUS_COLORS.active}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${detail.status === "active" ? "bg-emerald-400" : detail.status === "pending" ? "bg-amber-400" : "bg-white/40"}`}
                      ></span>
                      {detail.status}
                    </span>
                  </div>
                  {detail.description && (
                    <p className="mt-2 text-sm text-white/50">
                      {detail.description}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => startEdit(selectedCase)}
                    className="rounded-md border border-white/10 px-3 py-1.5 text-xs text-white/50 transition-colors hover:text-white/70"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(detail.id)}
                    className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-white/40 transition-all duration-200 hover:bg-red-500/10 hover:text-red-400"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-xs font-medium text-white/40">
                    Parties
                  </div>
                  <div className="mt-1 text-sm">
                    {detail.parties || "Not specified"}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-xs font-medium text-white/40">Court</div>
                  <div className="mt-1 text-sm">
                    {detail.court || "Not specified"}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-xs font-medium text-white/40">
                    Next Hearing
                  </div>
                  <div
                    className={`mt-1 text-sm ${detail.nextHearing ? "text-amber-400" : "text-white/30"}`}
                  >
                    {detail.nextHearing
                      ? formatDateTime(detail.nextHearing)
                      : "Not scheduled"}
                  </div>
                </div>
              </div>

              {detail.notes && (
                <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-xs font-medium text-white/40 mb-2">
                    Notes
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-white/70">
                    {detail.notes}
                  </p>
                </div>
              )}

              <div className="mb-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white/60">
                    Documents ({detail.documents?.length ?? 0})
                  </h3>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                    onChange={handleUpload}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:bg-white/20 disabled:opacity-50"
                  >
                    {uploading ? (
                      <svg
                        className="h-3.5 w-3.5 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          strokeDasharray="42"
                          strokeDashoffset="14"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                        />
                      </svg>
                    )}
                    {uploading ? "Uploading..." : "Upload"}
                  </button>
                </div>
                {(detail.documents?.length ?? 0) === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/10 p-8 text-center">
                    <svg
                      className="mx-auto mb-3 h-8 w-8 text-white/15"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                      />
                    </svg>
                    <p className="text-xs text-white/30">
                      No documents uploaded yet
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-2 text-xs text-blue-400 hover:text-blue-300"
                    >
                      Upload a file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {detail.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="group flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3"
                      >
                        <svg
                          className="h-4 w-4 shrink-0 text-white/30"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                          />
                        </svg>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm">{doc.fileName}</div>
                          <div className="text-[11px] text-white/30">
                            {formatDate(doc.createdAt)}
                          </div>
                        </div>
                        <a
                          href={`/api/cases/documents/${doc.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-white/40 hover:text-white/60"
                        >
                          Open
                        </a>
                        <button
                          onClick={() => handleDeleteDoc(doc.id)}
                          className="ml-1 rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-white/30 opacity-100 transition-all duration-200 hover:bg-red-500/10 hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white/60">
                    Linked Conversations ({detail.conversations?.length ?? 0})
                  </h3>
                  <Link
                    href={`/chat?caseId=${encodeURIComponent(detail.id)}`}
                    className="flex items-center gap-1.5 rounded-lg border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-400 transition-colors hover:bg-blue-500/20 hover:text-blue-300"
                  >
                    <svg
                      aria-hidden
                      viewBox="0 0 24 24"
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Start new conversation
                  </Link>
                </div>
                {(detail.conversations?.length ?? 0) === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/10 p-6 text-center">
                    <p className="text-xs text-white/30">
                      No conversations linked yet
                    </p>
                    <Link
                      href={`/chat?caseId=${encodeURIComponent(detail.id)}`}
                      className="mt-2 inline-block text-xs text-blue-400 hover:text-blue-300"
                    >
                      Start a conversation
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {detail.conversations.map((conv) => (
                      <Link
                        key={conv.id}
                        href={`/chat?conversation=${encodeURIComponent(conv.id)}&caseId=${encodeURIComponent(detail.id)}`}
                        className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 transition-colors hover:bg-white/[0.06]"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm">{conv.title}</div>
                          <div className="truncate text-[11px] text-white/30">
                            {conv.preview}
                          </div>
                        </div>
                        <span className="text-[10px] text-white/25">
                          {conv.type}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm text-white/50">Case not found.</p>
            <p className="text-xs text-white/30">
              It may have been deleted or you may no longer have access.
            </p>
          </div>
        )}
      </main>

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#111] p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">Delete Case</h3>
            <p className="mt-2 text-sm text-white/50">
              Are you sure you want to delete{" "}
              <span className="font-medium text-white/70">
                {deleteConfirmName}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setDeleteConfirmId(null);
                  setDeleteConfirmName("");
                }}
                className="rounded-lg bg-white/5 px-4 py-2 text-sm text-white/50 transition-colors hover:bg-white/10 hover:text-white/70"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
