interface IcsEvent {
  uid: string;
  summary: string;
  description: string;
  start: Date;
}

function escapeText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function formatDate(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

function buildVEvent({ uid, summary, description, start }: IcsEvent): string {
  const dtStart = formatDate(start);
  const dtEnd = formatDate(new Date(start.getTime() + 60 * 60 * 1000));
  const now = formatDate(new Date());

  return [
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeText(summary)}`,
    `DESCRIPTION:${escapeText(description)}`,
    "END:VEVENT",
  ].join("\r\n");
}

export function buildIcsEvent(event: IcsEvent): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Lawbite//EN",
    "CALSCALE:GREGORIAN",
    buildVEvent(event),
    "END:VCALENDAR",
  ].join("\r\n");
}

export function buildIcsCalendar(events: IcsEvent[]): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Lawbite//EN",
    "CALSCALE:GREGORIAN",
    ...events.map(buildVEvent),
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadIcs(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
