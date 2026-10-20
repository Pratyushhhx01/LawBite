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
 * Labels that introduce a section or an explained point are never glossary
 * terms. Treating them as terms produced "Definition: Who it applies to" cards
 * instead of readable headings.
 */
export function isSectionHeading(term: string): boolean {
  const t = term.trim().toLowerCase();
  if (!t) return true;
  return (
    /\b(short answer|the law|how it applies|practical takeaway|key takeaways?|key points?|key features?|key provisions?|summary|conclusion|overview|introduction|background|current status|consequences?|abrogation|definitions?|what is|why (it|this) matters|example|note|important|warning|disclaimer|caution|bottom line|the bottom line|who|what|when|where|why|how|jurisdiction|timing|conditions?|eligibility|scope|applicability|effect|punishment|penalty|governing law|nature|exception|deadline|cost|documents?|process|steps?|remedy|remedies|relief|grounds?|requirements?)\b/.test(
      t,
    ) || /^key\s/.test(t)
  );
}

type Step = { title: string; content: string };

/**
 * Match both step styles the model uses:
 *   **Step 1: Title** extra text
 *   **Step 1:** action text
 */
function matchStepLine(line: string): Step | null {
  const withTitle = line.match(
    /^\*\*Step\s+(\d+)\s*[:\u2013\u2014\-]\s*(.+?)\*\*\s*(.*)$/i,
  );
  if (withTitle) {
    return {
      title: withTitle[1],
      content: (withTitle[2] + " " + withTitle[3]).trim(),
    };
  }
  const labelOnly = line.match(
    /^\*\*Step\s+(\d+)\s*[:\u2013\u2014\-]\s*\*\*\s*(.+)$/i,
  );
  if (labelOnly) {
    return { title: labelOnly[1], content: labelOnly[2].trim() };
  }
  return null;
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

    const firstStep = matchStepLine(line);
    if (firstStep) {
      const steps: Step[] = [firstStep];
      i++;
      while (i < lines.length) {
        const next = lines[i].trim();
        if (!next) {
          // Steps are often separated by a blank line. Keep them in one block
          // when the next non-empty line is another step.
          let j = i + 1;
          while (j < lines.length && !lines[j].trim()) j++;
          if (j < lines.length && matchStepLine(lines[j].trim())) {
            i = j;
            continue;
          }
          i++;
          break;
        }
        const nextStep = matchStepLine(next);
        if (nextStep) {
          steps.push(nextStep);
          i++;
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
    const defMatch = line.match(
      /^\*\*([^*]{1,60}?)(?::\s*|\s+[\u2013\u2014-]\s+)(.+)$/,
    );
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

export type SegmentVariant = "lead" | "takeaway" | "warning" | "plain";

export type TextSegment = { heading: string | null; lines: string[] };

/**
 * Decide how a section heading should be presented.
 *
 * Most sections stay plain so a long answer is not a wall of boxes. Only the
 * lead answer, the conclusion and genuine warnings get a highlighted callout.
 */
export function sectionVariant(title: string): SegmentVariant {
  const t = title.trim().toLowerCase().replace(/[:\s]+$/, "");
  if (/^(short answer|answer|in short)$/.test(t)) return "lead";
  if (
    /^(bottom line|the bottom line|practical takeaway|key takeaways?|takeaways?|summary|conclusion|in summary|to summarize|final word|what this means)$/.test(
      t,
    )
  )
    return "takeaway";
  if (/^(warning|important|note|caution|disclaimer)$/.test(t)) return "warning";
  return "plain";
}

const BOLD_HEADING = /^\s*\*\*([^*]{1,80}?):?\*\*\s*$/;

export function splitTextSegments(lines: string[]): TextSegment[] {
  const segments: TextSegment[] = [];
  let current: TextSegment = { heading: null, lines: [] };
  const flush = () => {
    if (current.heading !== null || current.lines.some((l) => l.trim())) {
      segments.push(current);
    }
  };
  for (const l of lines) {
    const headingMatch = l.match(/^#{1,6}\s+(.+)/) || l.match(BOLD_HEADING);
    if (headingMatch) {
      flush();
      current = { heading: headingMatch[1].trim(), lines: [] };
    } else {
      current.lines.push(l);
    }
  }
  flush();
  return segments;
}
