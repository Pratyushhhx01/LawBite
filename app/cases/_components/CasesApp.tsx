"use client";

import { useState, useEffect, useRef } from "react";

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
}

const STATUS_COLORS: Record<string, string> = {
  active:
    "bg-emerald-500/10 text-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.15)]",
  pending:
    "bg-amber-500/10 text-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.15)]",
  closed: "bg-white/5 text-white/40 shadow-[0_0_8px_rgba(255,255,255,0.05)]",
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function CasesApp(_props: CasesAppProps) {
  const [cases, setCases] = useState<CaseFolder[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CaseDetail | null>(null);
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

  const uploadPendingFiles = async (caseId: string) => {
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
        await fetch("/api/cases/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ caseId, fileName, fileType, fileUrl }),
        });
      } catch {
        /* skip failed uploads */
      }
    }
    setPendingFiles([]);
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
        setCases((prev) => [created, ...prev]);
        setShowCreate(false);
        resetForm();
        setSelectedId(created.id);
        if (pendingFiles.length > 0) {
          await uploadPendingFiles(created.id);
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

  return (
    <div className="flex h-screen bg-black text-white">
      <aside className="flex w-80 flex-col border-r border-white/10 bg-black/50">
        <div className="border-b border-white/10 p-4">
          <div className="mb-3 flex items-center gap-3">
            <button
              onClick={() => window.history.back()}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-white/40 transition-all duration-200 hover:bg-white/10 hover:text-white/70"
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
            </button>
            <h1 className="text-sm font-semibold text-white/80">
              Case Tracker
            </h1>
          </div>
          <button
            onClick={() => startEdit()}
            className="group flex w-full items-center justify-center gap-2.5 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4.5 w-4.5 transition-transform duration-300 group-hover:rotate-90"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            New Case
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-sm text-white/40">Loading cases...</div>
          ) : cases.length === 0 ? (
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
          ) : (
            cases.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedId(c.id);
                  setEditMode(false);
                  setShowCreate(false);
                }}
                className={`w-full border-b border-white/5 px-4 py-3.5 text-left transition-all duration-200 hover:bg-white/[0.04] ${selectedId === c.id ? "bg-white/[0.06] border-l-2 border-l-amber-400/60" : "border-l-2 border-l-transparent"}`}
              >
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{c.name}</span>
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
              </button>
            ))
          )}
        </div>
      </aside>

      <main className="flex flex-1 flex-col overflow-hidden">
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
              <h2 className="text-xl font-semibold text-white/50">
                Case Tracker
              </h2>
              <p className="mt-2 max-w-xs text-sm text-white/30">
                Select a case from the sidebar or create a new one to get
                started
              </p>
            </div>
          </div>
        ) : showCreate || editMode ? (
          <div className="flex-1 overflow-y-auto p-6">
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
                <div className="grid grid-cols-2 gap-4">
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
                    }}
                    className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/50 transition-colors hover:text-white/70"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : detail ? (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mx-auto max-w-3xl">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
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
                <div className="flex gap-2">
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

              <div className="mb-6 grid grid-cols-3 gap-4">
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
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-white/40 hover:text-white/60"
                        >
                          Open
                        </a>
                        <button
                          onClick={() => handleDeleteDoc(doc.id)}
                          className="ml-1 rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-white/30 opacity-0 transition-all duration-200 hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
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
                </div>
                {(detail.conversations?.length ?? 0) === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/10 p-6 text-center">
                    <p className="text-xs text-white/30">
                      No conversations linked yet
                    </p>
                    <a
                      href="/chat"
                      className="mt-2 inline-block text-xs text-blue-400 hover:text-blue-300"
                    >
                      Start a conversation
                    </a>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {detail.conversations.map((conv) => (
                      <a
                        key={conv.id}
                        href={`/chat`}
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
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </main>

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
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
