export function buildResumeExtractionPrompt(rawText: string): string {
  return `Extract a structured summary from this résumé for an AI-guided technical mock interview.

Rules:
- Use only information present in the text; do not invent details.
- Omit optional fields when the résumé does not contain them.
- For experiences, capture résumé bullet points as highlights (achievements, metrics, responsibilities).
- For projects, include name and any description, technologies, or highlights when available.
- Skills should be concrete technologies, languages, frameworks, or tools.
- Include certifications only when present in the text.
- Keep strings concise; preserve the résumé language (Portuguese or English).

Résumé text:

${rawText}`;
}
