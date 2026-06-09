/**
 * Build and download an .ics calendar file for an event so visitors can add
 * it to Google/Apple/Outlook calendars. Modeled as an all-day event on the
 * event date (the free-text `time` field isn't reliably machine-parseable, so
 * it's surfaced in the description instead).
 */

function escapeIcs(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function compactDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

function compactStamp(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

export interface IcsEvent {
  id: string;
  title: string;
  description?: string | null;
  date: string; // YYYY-MM-DD
  time?: string | null;
  venue?: string | null;
}

export function downloadEventIcs(event: IcsEvent): void {
  const start = new Date(`${event.date}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 1); // all-day DTEND is exclusive

  const descParts = [event.description, event.time ? `Time: ${event.time}` : null].filter(
    Boolean
  ) as string[];

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//IIC VIT//Events//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${event.id}@iicvit`,
    `DTSTAMP:${compactStamp(new Date())}`,
    `DTSTART;VALUE=DATE:${compactDate(start)}`,
    `DTEND;VALUE=DATE:${compactDate(end)}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    descParts.length ? `DESCRIPTION:${escapeIcs(descParts.join("\n"))}` : null,
    event.venue ? `LOCATION:${escapeIcs(event.venue)}` : null,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean) as string[];

  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const slug = event.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "event";
  const link = document.createElement("a");
  link.href = url;
  link.download = `${slug}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
