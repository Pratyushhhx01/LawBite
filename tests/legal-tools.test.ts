import { describe, it, expect } from "vitest";
import {
  searchStatutesTool,
  searchCasesTool,
  compareTransitionTool,
} from "@/lib/legal-tools";

const describeDb =
  process.env.CI_SKIP_DB_TESTS === "1" ? describe.skip : describe;

describeDb("Legal Tools Suite", () => {
  it("searchStatutesTool: looks up exact IPC section in PostgreSQL KB", async () => {
    const res = await searchStatutesTool("420", "indian-penal-code");
    expect(res.success).toBe(true);
    expect(res.data.length).toBeGreaterThan(0);
    expect(res.data[0].provision).toBe("Section 420");
    expect(res.data[0].title).toContain("Cheating");
  });

  it("searchStatutesTool: resolves shorthand 'ipc' alias seamlessly", async () => {
    const res = await searchStatutesTool("Section 420", "ipc");
    expect(res.success).toBe(true);
    expect(res.data.length).toBeGreaterThan(0);
    expect(res.data[0].provision).toBe("Section 420");
    expect(res.data[0].title).toContain("Cheating");
  });

  it("searchStatutesTool: resolves shorthand 'bns' alias for Section 318", async () => {
    const res = await searchStatutesTool("318", "bns");
    expect(res.success).toBe(true);
    expect(res.data.length).toBeGreaterThan(0);
    expect(res.data[0].provision).toBe("Section 318");
    expect(res.data[0].title).toContain("Cheating");
  });

  it("searchStatutesTool: looks up Indian Contract Act section in PostgreSQL KB", async () => {
    const res = await searchStatutesTool("10", "indian-contract-act");
    expect(res.success).toBe(true);
    expect(res.data.length).toBeGreaterThan(0);
    expect(res.data[0].provision).toBe("Section 10");
  });

  it("searchStatutesTool: correctly returns empty for non-existent section", async () => {
    const res = await searchStatutesTool("99999", "ipc");
    expect(res.success).toBe(true);
    expect(res.data.length).toBe(0);
  });

  it("searchStatutesTool: pushes down act filter for text search", async () => {
    const res = await searchStatutesTool("dishonestly", "ipc", 3);
    expect(res.success).toBe(true);
    expect(res.data.length).toBeGreaterThan(0);
    for (const chunk of res.data) {
      expect(["indian-penal-code", "ipc"]).toContain(chunk.act_id);
    }
  });

  it("searchCasesTool: retrieves landmark Supreme Court precedent", async () => {
    const res = await searchCasesTool("Arnesh Kumar");
    expect(res.success).toBe(true);
    expect(res.data.length).toBeGreaterThan(0);
    expect(res.data[0].title).toContain("Arnesh Kumar");
  });

  it("compareTransitionTool: resolves Section 420 IPC to BNS Section 318", () => {
    const res = compareTransitionTool("420");
    expect(res.success).toBe(true);
    const match = res.data.find((m) => m.oldSection === "420");
    expect(match).toBeDefined();
    expect(match?.newSection).toBe("318");
  });

  it("compareTransitionTool: handles invalid or empty inputs gracefully", () => {
    const res = compareTransitionTool("");
    expect(res.success).toBe(false);
    expect(res.data.length).toBe(0);
  });
});
