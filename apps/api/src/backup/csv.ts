/** UTF-8 byte order mark, so Excel opens Hebrew text correctly. */
export const CSV_BOM = '﻿';

const FORMULA_START = /^[=+\-@\t\r]/;

/**
 * Escapes one CSV cell. Values that a spreadsheet would run as a formula are
 * prefixed with an apostrophe (CSV injection guard).
 */
export function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  let text = String(value);
  if (typeof value === 'string' && FORMULA_START.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(rows: readonly (readonly (string | number | null | undefined)[])[]): string {
  return CSV_BOM + rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
}
