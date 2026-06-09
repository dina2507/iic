/**
 * Safe CSV export helpers.
 *
 * Two classes of bug this guards against:
 *  1. CSV injection / formula injection — a spreadsheet treats a cell that
 *     starts with `=`, `+`, `-`, `@`, or a leading tab/CR as a formula. A
 *     malicious registrant could set their name to `=HYPERLINK(...)` or
 *     `=cmd|'/c calc'!A1` and have it execute when an admin opens the export.
 *     We neutralize this by prefixing risky cells with a single quote.
 *  2. Broken quoting — naively wrapping a value in double quotes corrupts the
 *     file when the value itself contains a double quote. RFC 4180 says embedded
 *     quotes must be doubled.
 */

/** Escape a single value into an RFC-4180-safe, injection-safe CSV field. */
export function escapeCsvCell(value: unknown): string {
  let cell = value === null || value === undefined ? "" : String(value);

  // Neutralize spreadsheet formula injection.
  if (/^[=+\-@\t\r]/.test(cell)) {
    cell = `'${cell}`;
  }

  // Always quote, doubling any embedded quotes.
  return `"${cell.replace(/"/g, '""')}"`;
}

/** Build CSV text from a header row and data rows. */
export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [
    headers.map(escapeCsvCell).join(","),
    ...rows.map((row) => row.map(escapeCsvCell).join(",")),
  ];
  // Prepend a UTF-8 BOM so Excel renders non-ASCII (names, etc.) correctly.
  return "﻿" + lines.join("\r\n");
}

/** Trigger a browser download of CSV content. */
export function downloadCsv(filename: string, headers: string[], rows: unknown[][]): void {
  const blob = new Blob([toCsv(headers, rows)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
