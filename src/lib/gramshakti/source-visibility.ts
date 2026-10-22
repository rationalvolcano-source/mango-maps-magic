// Internal research material (crosswalks, Production Context, working spreadsheets) must never be
// linked or downloadable from the app. Only external public publications may be opened.
const internalHosts = ["docs.google.com", "drive.google.com", "drive.usercontent.google.com"];

export function isPublicSource(url: string | undefined): url is string {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    return !internalHosts.some((h) => parsed.hostname === h || parsed.hostname.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

const locatorLine =
  /(body block \d+|^(Mandatory Crops Statewise Production|District APY Master) · row \d+$|\.(docx|xlsx|pdf|svg)\b|FINAL STATIC|compiler)/i;
const tablePrefix = /^[^:\n]{0,60}— source table \d+, row \d+:\s*/;

/** Removes automated document/table/row addresses so only readable source content is shown. */
export function readablePassage(passage: string): string {
  const text = passage
    .split("\n")
    .filter((line) => !locatorLine.test(line.trim()))
    .map((line) => line.replace(tablePrefix, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return text || "A readable passage is not available for this record.";
}
