const INJECTION_PATTERNS: RegExp[] = [
  /\bignore\s+(all\s+)?(previous|prior|above)\s+instructions?\b/gi,
  /\bdisregard\s+(all\s+)?(previous|prior|above)\b/gi,
  /\byou\s+are\s+now\b/gi,
  /\bsystem\s+prompt\b/gi,
  /\breveal\s+(your\s+)?(system\s+)?instructions?\b/gi,
  /\bact\s+as\b/gi,
  /\bnew\s+instructions?\s*:/gi,
];

const SCRIPT_TAG_PATTERN = /<script\b[^>]*>[\s\S]*?<\/script>/gi;
const HTML_TAG_PATTERN = /<[^>]+>/g;

function stripControlChars(value: string): string {
  return value
    .replace(/[^\S\n\t]+/g, " ")
    .split("")
    .filter((char) => {
      const code = char.charCodeAt(0);
      return (
        code === 9 || code === 10 || code === 13 || (code >= 32 && code !== 127)
      );
    })
    .join("");
}

function collapseExcessiveNewlines(value: string): string {
  return value.replace(/\n{3,}/g, "\n\n");
}

function neutralizeInjectionPhrases(value: string): string {
  let result = value;
  for (const pattern of INJECTION_PATTERNS) {
    result = result.replace(pattern, "[removed]");
  }
  return result;
}

function stripHtml(value: string): string {
  return value.replace(SCRIPT_TAG_PATTERN, "").replace(HTML_TAG_PATTERN, "");
}

/**
 * Sanitizes user-provided job description text before persistence and prompt use.
 * Returns null when the result is empty after sanitization.
 */
export function sanitizeJobDescription(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  let result = stripControlChars(trimmed);
  result = stripHtml(result);
  result = neutralizeInjectionPhrases(result);
  result = collapseExcessiveNewlines(result);
  result = result.trim();

  return result.length > 0 ? result : null;
}
