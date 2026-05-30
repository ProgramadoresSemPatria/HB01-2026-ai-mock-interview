import type { StructuredSummary } from "@/modules/resumes/validations/resume-schemas";

export function resumeToMarkdown(summary: StructuredSummary): string {
  const lines: string[] = [];
  const { personal_info, skills, experiences, projects, certifications } =
    summary;

  if (personal_info) {
    if (personal_info.name) lines.push(`**Name:** ${personal_info.name}`);
    if (personal_info.title) lines.push(`**Title:** ${personal_info.title}`);
    if (personal_info.about) lines.push(`\n${personal_info.about}`);
  }

  if (skills?.length) {
    lines.push(`\n**Skills:** ${skills.join(", ")}`);
  }

  if (experiences?.length) {
    lines.push(`\n**Experience:**`);
    for (const exp of experiences) {
      lines.push(`\n- **${exp.role}** at ${exp.company}`);
      for (const highlight of exp.highlights) {
        lines.push(`  - ${highlight}`);
      }
    }
  }

  if (projects?.length) {
    lines.push(`\n**Projects:**`);
    for (const project of projects) {
      if (project.name) lines.push(`\n- **${project.name}**`);
      if (project.description) lines.push(`  ${project.description}`);
      if (project.highlights?.length) {
        for (const highlight of project.highlights) {
          lines.push(`  - ${highlight}`);
        }
      }
    }
  }

  if (certifications?.length) {
    lines.push(`\n**Certifications:** ${certifications.join(", ")}`);
  }

  return lines.join("\n");
}
