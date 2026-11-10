import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockSession = {
  user: {
    id: "user-test-sec",
    name: "Advocate Test",
    email: "test@lawbite.local",
  },
};

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(async () => mockSession),
    },
  },
}));

vi.mock("@/lib/db", () => ({
  db: {
    selectFrom: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      executeTakeFirst: vi.fn(async () => ({ id: "case-valid-123" })),
    })),
  },
}));

import { POST } from "@/app/api/cases/documents/upload/route";

describe("Case Document Upload Security & Validation", () => {
  it("rejects non-whitelisted executable file types", async () => {
    const formData = new FormData();
    const maliciousBlob = new Blob(["malicious binary"], { type: "application/x-msdownload" });
    formData.append("file", maliciousBlob, "exploit.exe");
    formData.append("caseId", "case-valid-123");

    const req = new NextRequest("http://localhost:3000/api/cases/documents/upload", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Invalid file type/i);
  });

  it("rejects HTML/script uploads to prevent stored XSS", async () => {
    const formData = new FormData();
    const htmlBlob = new Blob(["<script>alert(1)</script>"], { type: "text/html" });
    formData.append("file", htmlBlob, "payload.html");
    formData.append("caseId", "case-valid-123");

    const req = new NextRequest("http://localhost:3000/api/cases/documents/upload", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Invalid file type/i);
  });

  it("rejects uploads missing caseId or file", async () => {
    const formData = new FormData();
    formData.append("caseId", "case-valid-123");

    const req = new NextRequest("http://localhost:3000/api/cases/documents/upload", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/file and caseId are required/i);
  });

  it("accepts valid PDF document uploads", async () => {
    const formData = new FormData();
    const pdfBlob = new Blob(["%PDF-1.4 mock legal brief content"], { type: "application/pdf" });
    formData.append("file", pdfBlob, "written-submission.pdf");
    formData.append("caseId", "case-valid-123");

    const req = new NextRequest("http://localhost:3000/api/cases/documents/upload", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.fileName).toBe("written-submission.pdf");
    expect(json.fileType).toBe("pdf");
    expect(json.fileUrl).toBeDefined();
  });
});
