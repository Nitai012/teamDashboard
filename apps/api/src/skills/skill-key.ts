/** Normalises a skill name for case- and spacing-insensitive uniqueness. */
export function skillKey(name: string): string {
  return displayName(name).toLowerCase();
}

/** Trims a skill name and collapses inner whitespace. */
export function displayName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}
