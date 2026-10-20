/**
 * Pure markdown-ish message parser used by the chat renderer.
 *
 * Kept in its own module (no React, no browser APIs) so the block
 * classification can be unit-tested and regressions are caught in CI.
 */

export type ContentBlockType =
  | { type: "text"; content: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "steps"; steps: { title: string; content: string }[] }
  | {
      type: "warning";
      content: string;
      variant: "warning" | "important" | "note";
    }
  | { type: "definition"; term: string; content: string }
  | { type: "summary"; content: string[] };

/**
 * Section titles such as "Short answer", "The law" or "Practical takeaway"
 * are headings, not terms. Detecting them stops the parser from wrapping
 * every bold heading in a definition card.
 */
export function isSectionHeading(term: string): boolean {
  const t = term.trim().toLowerCase();
  if (!t) return true;
  return (
    /\b(short answer|the law|how it applies|practical takeaway|key takeaways?|key points?|key features?|key provisions?|summary|conclusion|overview|introduction|background|current status|consequences?|abrogation|definitions?|what is|why (it|this) matters|example|note|important|warning|disclaimer|caution)\b/.test(
      t,
    ) || /^key\s/.test(t)
  );
}

export function parseContent(text: string): ContentBlockType[] {
  const blocks: ContentBlockType[] = [];
  const lines = text.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    if (!line) {
      i++;
      continue;
    }

    const stepMatch = line.match(
      /^\*\*Step\s+(\d+)[:\u2013\u2014\-]+\s*(.+?)\*\*\s*(.*)/i,
    );
    if (stepMatch) {
      const steps: { title: string; content: string }[] = [];
      steps.push({
        title: stepMatch[1],
        content: (stepMatch[2] + " " + stepMatch[3]).trim(),
      });
      i++;
      while (i < lines.length) {
        const next = lines[i].trim();
        const nextStep = next.match(
          /^\*\*Step\s+(\d+)[:\u2013\u2014\-]+\s*(.+?)\*\*\s*(.*)/i,
        );
        if (nextStep) {
          steps.push({
            title: nextStep[1],
            content: (nextStep[2] + " " + nextStep[3]).trim(),
          });
          i++;
        } else if (!next) {
          i++;
          break;
        } else {
          steps[steps.length - 1].content += " " + next;
          i++;
        }
      }
      blocks.push({ type: "steps", steps });
      continue;
    }

    const warningMatch = line.match(
      /^\*\*(Warning|Important|Note|Disclaimer|Caution)[:\u2013\u2014\-]\s*(.+)/i,
    );
    if (warningMatch) {
      let content = warningMatch[2];
      const variant = warningMatch[1].toLowerCase() as
        | "warning"
        | "important"
        | "note";
      i++;
      while (i < lines.length) {
        const next = lines[i].trim();
        if (!next) {
          i++;
          break;
        }
        const nextWarning = next.match(
          /^\*\*(Warning|Important|Note|Disclaimer|Caution)[:\u2013\u2014\-]/i,
        );
        if (nextWarning) break;
        content += " " + next;
        i++;
      }
      blocks.push({ type: "warning", content, variant });
      continue;
    }

    const tableLines: string[] = [];
    if (line.startsWith("|")) {
      while (i < lines.length) {
        const l = lines[i].trim();
        if (!l.startsWith("|")) break;
        tableLines.push(l);
        i++;
      }
      if (tableLines.length >= 3) {
        const noSep = tableLines.filter(
          (l) => !/^\|[\s\-:]+\|[\s\-:]+\|/.test(l),
        );
        if (noSep.length >= 2) {
          const headers = noSep[0]
            .split("|")
            .map((h) => h.trim())
            .filter(Boolean);
          const rows = noSep.slice(1).map((r) => {
            const cells = r.split("|").map((c) => c.trim());
            while (cells.length > 0 && cells[0] === "") cells.shift();
            while (cells.length > 0 && cells[cells.length - 1] === "")
              cells.pop();
            return cells;
          });
          if (rows.length > 0 && rows[0].length > 1) {
            blocks.push({ type: "table", headers, rows });
            continue;
          }
        }
      }
      tableLines.length = 0;
    }

    const tabLines: string[] = [];
    if (line.includes("\t")) {
      while (i < lines.length) {
        const l = lines[i];
        if (!l.includes("\t")) break;
        tabLines.push(l);
        i++;
      }
      if (tabLines.length >= 2) {
        const headers = tabLines[0]
          .split("\t")
          .map((h) => h.trim())
          .filter(Boolean);
        const rows = tabLines.slice(1).map((r) =>
          r
            .split("\t")
            .map((c) => c.trim())
            .filter(Boolean),
        );
        if (headers.length >= 2 && rows.length > 0 && rows[0].length >= 2) {
          blocks.push({ type: "table", headers, rows });
          continue;
        }
      }
      tabLines.length = 0;
    }

    // A definition card is ONLY for a non-bulleted "**Term:** meaning" line
    // where the meaning is real text on the same line. Section headings such
    // as "**Short answer:**" must render as headings, and bulleted bold
    // lead-ins like "* **Source:** ..." must stay bullets — not become boxes.
    const defMatch = line.match(/^\*\*([^*]{1,60}?)[:\u2013\u2014-]\s*(.+)$/);
    if (defMatch) {
      const term = defMatch[1].trim();
      const content = defMatch[2]
        .replace(/^\*+\s*/, "")
        .replace(/\*+\s*$/, "")
        .trim();
      const substantive = /[A-Za-z0-9]/.test(content) && content.length >= 3;
      if (substantive && !isSectionHeading(term)) {
        blocks.push({ type: "definition", term, content });
        i++;
        continue;
      }
    }

    const summaryMatch = line.match(
      /^\*{0,2}(Key Takeaways|Summary|To Summarize|In Summary|Conclusion)\*{0,2}\s*[:\u2013\u2014\-]?\s*(.*)/i,
    );
    if (summaryMatch) {
      const points: string[] = [];
      if (summaryMatch[2]) {
        const s = summaryMatch[2]
          .trim()
          .replace(/^\s*[-*+>]\s*/, "")
          .trim();
        if (/[a-zA-Z0-9]/.test(s)) points.push(summaryMatch[2].trim());
      }
      i++;
      while (i < lines.length) {
        const next = lines[i].trim();
        if (!next) {
          i++;
          continue;
        }
        if (/^[*#|]/.test(next)) break;
        if (/[a-zA-Z0-9]/.test(next.replace(/^\s*[-*+>]\s*/, "")))
          points.push(next);
        i++;
      }
      if (points.length === 0) {
        continue;
      }
      if (blocks.length > 0 && blocks[blocks.length - 1].type === "summary") {
        (
          blocks[blocks.length - 1] as { type: "summary"; content: string[] }
        ).content.push(...points);
      } else {
        blocks.push({ type: "summary", content: points });
      }
      continue;
    }

    let textContent = line;
    i++;
    while (i < lines.length) {
      const next = lines[i];
      if (
        !next.trim() ||
        next.trim().startsWith("**") ||
        next.trim().startsWith("|")
      )
        break;
      if (/^\d+\.?\s/.test(next.trim())) break;
      textContent += "\n" + next;
      i++;
    }
    blocks.push({ type: "text", content: textContent });
  }

  return blocks;
}
