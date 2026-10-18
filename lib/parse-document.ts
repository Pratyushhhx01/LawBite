import mammoth from "mammoth";

export async function parsePdf(buffer: Buffer): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const data = new Uint8Array(buffer);
  const doc = await pdfjsLib.getDocument({ data }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const strings = (content.items as Array<{ str: string }>).map(
      (item) => item.str,
    );
    pages.push(strings.join(" "));
  }
  return pages.join("\n\n");
}

export async function parseDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

export function parseDocument(
  buffer: Buffer,
  fileName: string,
): Promise<string> {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) return parsePdf(buffer);
  if (lower.endsWith(".docx") || lower.endsWith(".doc"))
    return parseDocx(buffer);
  throw new Error(
    `Unsupported file type: ${fileName}. Please upload a PDF or Word document.`,
  );
}
