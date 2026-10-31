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
});
