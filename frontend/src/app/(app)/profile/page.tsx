"use client";

import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Code,
  FolderGit2,
  Award,
  Loader2,
  FileText,
  AlertCircle,
} from "lucide-react";

import { AppShell } from "@/features/dashboard/app-shell";
import { useResumes } from "@/lib/query/hooks/use-resumes";
import { useResume } from "@/lib/query/hooks/use-resume";
import { getStoredResumeId } from "@/features/auth/session-storage";
import { cn } from "@/lib/utils";

type TabType = "personal" | "experiences" | "projects" | "skills" | "certifications";

export default function ProfilePage() {
  const { data: resumesData, isLoading: isLoadingList } = useResumes();
  const resumes = resumesData?.resumes ?? [];
  const readyResumes = resumes.filter((r) => r.status === "ready");

  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("personal");

  // Sync selectedResumeId with the active stored resume, or the first ready one
  useEffect(() => {
    if (readyResumes.length > 0 && !selectedResumeId) {
      const activeId = getStoredResumeId();
      const hasActive = readyResumes.some((r) => r.id === activeId);
      setSelectedResumeId(hasActive ? activeId : readyResumes[0].id);
    }
  }, [readyResumes, selectedResumeId]);

  const { data: resume, isLoading: isLoadingResume } = useResume(selectedResumeId);

  const parsed = resume?.structuredSummary;

  const tabs: { value: TabType; label: string; icon: typeof User }[] = [
    { value: "personal", label: "Personal Info", icon: User },
    { value: "experiences", label: "Work Experience", icon: Briefcase },
    { value: "projects", label: "Projects", icon: FolderGit2 },
    { value: "skills", label: "Skills", icon: Code },
    { value: "certifications", label: "Certifications", icon: Award },
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-(--foreground)">
              Resume Profile
            </h1>
            <p className="mt-1 text-sm text-(--muted-foreground)">
              Parsed data automatically extracted by AI from your uploaded CV.
            </p>
          </div>

          {/* Resume Selector */}
          {readyResumes.length > 1 && (
            <div className="flex items-center gap-2">
              <label htmlFor="resume-select" className="text-xs font-semibold text-(--muted-foreground) uppercase tracking-wider">
                Select CV:
              </label>
              <select
                id="resume-select"
                value={selectedResumeId ?? ""}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                className="cursor-pointer rounded-lg border border-(--border) bg-(--background) px-3 py-1.5 text-sm font-medium text-(--foreground) focus:outline-none focus:ring-2 focus:ring-(--primary)"
              >
                {readyResumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {isLoadingList && (
          <div className="flex items-center gap-2 py-12 text-sm text-(--muted-foreground) justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading profiles…
          </div>
        )}

        {!isLoadingList && readyResumes.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center border border-dashed border-(--border) rounded-2xl bg-(--card)">
            <AlertCircle className="h-10 w-10 text-amber-500" />
            <div className="max-w-md">
              <h3 className="text-sm font-semibold text-(--foreground)">No ready CV found</h3>
              <p className="mt-1 text-xs text-(--muted-foreground)">
                We couldn't find any successfully processed resumes. Please upload a PDF resume in the Resumes tab first.
              </p>
            </div>
            <a
              href="/resumes"
              className="cursor-pointer mt-2 rounded-lg bg-(--foreground) px-4 py-2 text-xs font-medium text-(--background) transition-opacity hover:opacity-85"
            >
              Go to Resumes
            </a>
          </div>
        )}

        {!isLoadingList && readyResumes.length > 0 && (
          <div className="space-y-6">
            {/* Tabs Selector */}
            <div className="flex border-b border-(--border) overflow-x-auto gap-4 scrollbar-none">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.value;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setActiveTab(tab.value)}
                    className={cn(
                      "cursor-pointer flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors shrink-0 px-1",
                      active
                        ? "border-(--primary) text-(--primary)"
                        : "border-transparent text-(--muted-foreground) hover:text-(--foreground)",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Profile Tab Contents */}
            {isLoadingResume && (
              <div className="flex items-center gap-2 py-12 text-sm text-(--muted-foreground) justify-center">
                <Loader2 className="h-5 w-5 animate-spin" />
                Parsing CV details…
              </div>
            )}

            {!isLoadingResume && parsed && (
              <div className="rounded-2xl border border-(--border) bg-(--card) p-6 shadow-sm min-h-[300px]">
                {/* Personal Tab */}
                {activeTab === "personal" && (
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="flex size-14 items-center justify-center rounded-xl bg-(--accent)/30 text-(--primary)">
                        <User className="h-7 w-7" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-(--foreground)">
                          {parsed.personal_info.name}
                        </h2>
                        <p className="text-sm font-medium text-(--primary) mt-0.5">
                          {parsed.personal_info.title}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-(--border)">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-(--muted-foreground) mb-2">
                        About
                      </h3>
                      <p className="text-sm text-(--foreground) leading-relaxed whitespace-pre-line">
                        {parsed.personal_info.about || "No summary provided."}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-(--border) text-sm">
                      <div className="flex items-center gap-2.5 text-(--muted-foreground)">
                        <FileText className="h-4 w-4 shrink-0" />
                        <span className="truncate text-(--foreground)">
                          Source: {resume.name}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Experiences Tab */}
                {activeTab === "experiences" && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-(--foreground) border-b border-(--border) pb-2">
                      Work History
                    </h2>
                    {parsed.experiences.length === 0 ? (
                      <p className="text-sm text-(--muted-foreground) text-center py-8">
                        No work experiences found.
                      </p>
                    ) : (
                      <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-(--border)">
                        {parsed.experiences.map((exp, idx) => (
                          <div key={idx} className="relative pl-8">
                            <div className="absolute left-[7px] top-1.5 size-2.5 rounded-full bg-(--primary) ring-4 ring-(--card)" />
                            <div>
                              <h3 className="text-base font-bold text-(--foreground)">
                                {exp.role}
                              </h3>
                              <p className="text-sm font-medium text-(--primary) mt-0.5">
                                {exp.company}
                              </p>
                              {exp.highlights && exp.highlights.length > 0 && (
                                <ul className="list-disc list-outside pl-4 mt-3 space-y-1.5 text-sm text-(--muted-foreground)">
                                  {exp.highlights.map((item, key) => (
                                    <li key={key}>{item}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Projects Tab */}
                {activeTab === "projects" && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-(--foreground) border-b border-(--border) pb-2">
                      Technical Projects
                    </h2>
                    {parsed.projects.length === 0 ? (
                      <p className="text-sm text-(--muted-foreground) text-center py-8">
                        No projects found.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 gap-6">
                        {parsed.projects.map((proj, idx) => (
                          <div
                            key={idx}
                            className="rounded-xl border border-(--border) p-5 bg-(--background)/40 space-y-3"
                          >
                            <div>
                              <h3 className="text-base font-bold text-(--foreground)">
                                {proj.name}
                              </h3>
                              <p className="text-sm text-(--muted-foreground) mt-1">
                                {proj.description}
                              </p>
                            </div>

                            {proj.technologies && proj.technologies.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {proj.technologies.map((tech, key) => (
                                  <span
                                    key={key}
                                    className="px-2 py-0.5 rounded bg-(--accent)/35 text-(--accent-foreground) text-[11px] font-medium"
                                  >
                                    {tech}
                                  </span>
                                ))}
                              </div>
                            )}

                            {proj.highlights && proj.highlights.length > 0 && (
                              <ul className="list-disc pl-4 space-y-1 text-sm text-(--muted-foreground) pt-2 border-t border-(--border)/50">
                                {proj.highlights.map((item, key) => (
                                  <li key={key}>{item}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Skills Tab */}
                {activeTab === "skills" && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-(--foreground) border-b border-(--border) pb-2">
                      Professional Skills
                    </h2>
                    {parsed.skills.length === 0 ? (
                      <p className="text-sm text-(--muted-foreground) text-center py-8">
                        No skills found.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {parsed.skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-3.5 py-1.5 rounded-xl bg-(--primary)/8 text-(--primary) border border-(--primary)/15 font-medium text-xs shadow-sm"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Certifications Tab */}
                {activeTab === "certifications" && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-(--foreground) border-b border-(--border) pb-2">
                      Certifications & Licenses
                    </h2>
                    {parsed.certifications.length === 0 ? (
                      <p className="text-sm text-(--muted-foreground) text-center py-8">
                        No certifications found.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        {parsed.certifications.map((cert, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 p-3.5 rounded-xl border border-(--border) bg-(--background)/30"
                          >
                            <Award className="h-5 w-5 text-(--primary) shrink-0" />
                            <span className="text-sm font-semibold text-(--foreground)">
                              {cert}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
