import { describe, it, expect, vi } from "vitest";
import { POST } from "@/app/api/review/route";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(async () => ({ user: { id: "test-user" } })),
    },
  },
}));

// The in-memory limiter is shared across tests in this file; disable it so the
// assertions exercise parsing behaviour, not the 10-per-minute upload quota.
vi.mock("@/lib/utils", () => ({
  checkRateLimit: () => ({ allowed: true, retryAfterMs: 0 }),
}));

describe("POST /api/review file upload tests", () => {
  it("processes a standard image file (PNG with image/png MIME)", async () => {
    const formData = new FormData();
    const blob = new Blob(["png content"], { type: "image/png" });
    formData.append("file", blob, "sample.png");

    const req = new NextRequest("http://localhost:3000/api/review", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.type).toBe("image");
    expect(json.fileName).toBe("sample.png");
    expect(json.imageBase64).toContain("data:image/png;base64,");
  });

  it("processes an image with empty MIME type by filename extension (.jpg)", async () => {
    const formData = new FormData();
    // Simulate Windows/browser empty type
    const blob = new Blob(["jpeg content"], { type: "" });
    formData.append("file", blob, "photo.JPG");

    const req = new NextRequest("http://localhost:3000/api/review", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.type).toBe("image");
    expect(json.fileName).toBe("photo.JPG");
    expect(json.imageBase64).toContain("data:image/jpeg;base64,");
  });

  it("processes an image with application/octet-stream by filename extension (.webp)", async () => {
    const formData = new FormData();
    const blob = new Blob(["webp content"], { type: "application/octet-stream" });
    formData.append("file", blob, "photo.webp");

    const req = new NextRequest("http://localhost:3000/api/review", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.type).toBe("image");
    expect(json.fileName).toBe("photo.webp");
    expect(json.imageBase64).toContain("data:image/webp;base64,");
  });

  it("processes a real PDF with text", async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    doc.text("Non-Disclosure Agreement Clause 1: Confidentiality", 10, 10);
    const arrayBuffer = doc.output("arraybuffer");
    const blob = new Blob([arrayBuffer], { type: "application/pdf" });

    const formData = new FormData();
    formData.append("file", blob, "nda.pdf");

    const req = new NextRequest("http://localhost:3000/api/review", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.fileName).toBe("nda.pdf");
    expect(json.text).toContain("Non-Disclosure Agreement Clause 1: Confidentiality");
    // Ensure page markers are stripped
    expect(json.text).not.toContain("-- 1 of 1 --");
  });

  it("processes a PDF even when browser reports application/octet-stream", async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    doc.text("Contract terms and conditions", 10, 10);
    const arrayBuffer = doc.output("arraybuffer");
    const blob = new Blob([arrayBuffer], { type: "application/octet-stream" });

    const formData = new FormData();
    formData.append("file", blob, "contract.PDF");

    const req = new NextRequest("http://localhost:3000/api/review", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.fileName).toBe("contract.PDF");
    expect(json.text).toContain("Contract terms and conditions");
  });

  it("rejects unsupported file formats gracefully", async () => {
    const formData = new FormData();
    const blob = new Blob(["some code"], { type: "text/javascript" });
    formData.append("file", blob, "test.js");

    const req = new NextRequest("http://localhost:3000/api/review", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Unsupported file type");
  });

  it("tags PDF responses with type 'pdf' and strips page markers", async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    doc.text("Lease deed clause 4: rent escalation", 10, 10);
    const arrayBuffer = doc.output("arraybuffer");
    const formData = new FormData();
    formData.append(
      "file",
      new Blob([arrayBuffer], { type: "application/pdf" }),
      "lease.pdf",
    );

    const req = new NextRequest("http://localhost:3000/api/review", {
      method: "POST",
      body: formData,
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.type).toBe("pdf");
    expect(json.text).toContain("rent escalation");
    expect(json.text).not.toContain("-- 1 of 1 --");
  });

  it("processes a Word document", async () => {
    const { Document, Packer, Paragraph, TextRun } = await import("docx");
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              children: [new TextRun("EMPLOYMENT CONTRACT")],
            }),
            new Paragraph({
              children: [new TextRun("Clause 2: Notice period is 60 days.")],
            }),
          ],
        },
      ],
    });
    const buffer = await Packer.toBuffer(doc);
    const formData = new FormData();
    formData.append(
      "file",
      new Blob([new Uint8Array(buffer)], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }),
      "contract.docx",
    );

    const req = new NextRequest("http://localhost:3000/api/review", {
      method: "POST",
      body: formData,
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.type).toBe("pdf");
    expect(json.text).toContain("Notice period is 60 days");
  });

  it("rejects a legacy .doc file with clear guidance", async () => {
    const formData = new FormData();
    formData.append(
      "file",
      new Blob(["legacy word bytes"], { type: "application/msword" }),
      "old-contract.doc",
    );

    const req = new NextRequest("http://localhost:3000/api/review", {
      method: "POST",
      body: formData,
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain(".docx");
  });

  it("rejects a scanned PDF that has no text layer with actionable guidance", async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    // 1x1 transparent PNG: a page with an image but no text layer.
    doc.addImage(
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "PNG",
      10,
      10,
      50,
      50,
    );
    const arrayBuffer = doc.output("arraybuffer");
    const formData = new FormData();
    formData.append(
      "file",
      new Blob([arrayBuffer], { type: "application/pdf" }),
      "scan.pdf",
    );

    const req = new NextRequest("http://localhost:3000/api/review", {
      method: "POST",
      body: formData,
    });
    const res = await POST(req);

    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error).toContain("No readable text was found");
    expect(json.error).toContain("image");
  });

  it("reports a corrupt PDF as corrupt instead of a generic failure", async () => {
    const formData = new FormData();
    formData.append(
      "file",
      new Blob(["%PDF-1.4 not really a pdf"], { type: "application/pdf" }),
      "broken.pdf",
    );

    const req = new NextRequest("http://localhost:3000/api/review", {
      method: "POST",
      body: formData,
    });
    const res = await POST(req);

    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error).toMatch(/corrupted|could not be read/i);
  });
});
