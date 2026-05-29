"use client";

import { useState, useRef } from "react";
import { uploadResume, getResume } from "@/lib/api/resumes";
import type { ResumeDetail } from "@/lib/api/resumes";
import { cn } from "@/lib/utils";
import { Upload, FileText, CheckCircle, XCircle, Loader2, Eye, EyeOff } from "lucide-react";

type UploadState = "idle" | "uploading" | "polling" | "done" | "error";

export default function UploadTestPage() {
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<UploadState>("idle");
  const [result, setResult] = useState<ResumeDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  function startPolling(id: string, tok: string) {
    setState("polling");
    setPollCount(0);
    pollRef.current = setInterval(async () => {
      setPollCount((n) => n + 1);
      try {
        const detail = await getResume(id, tok);
        if (detail.status === "ready") {
          stopPolling();
          setResult(detail);
          setState("done");
        } else if (detail.status === "failed") {
          stopPolling();
          setError("O backend falhou ao processar o currículo.");
          setState("error");
        }
      } catch (e) {
        stopPolling();
        setError(e instanceof Error ? e.message : "Erro ao buscar status.");
        setState("error");
      }
    }, 3000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !token) return;

    setError(null);
    setResult(null);
    setState("uploading");

    try {
      const preview = await uploadResume(file, token);
      startPolling(preview.id, token);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro no upload.");
      setState("error");
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setResult(null);
    setError(null);
    setState("idle");
    stopPolling();
  }

  function handleReset() {
    setFile(null);
    setResult(null);
    setError(null);
    setState("idle");
    setPollCount(0);
    stopPolling();
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const isLoading = state === "uploading" || state === "polling";

  return (
    <div className="min-h-screen bg-(--background) font-sans p-6 md:p-10">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-sm font-medium text-(--primary) bg-(--accent) px-3 py-1 rounded-full">
            <FileText className="w-3.5 h-3.5" />
            Teste de Integração
          </div>
          <h1 className="text-2xl font-semibold text-(--foreground) mt-2">
            Upload de Currículo
          </h1>
          <p className="text-(--muted-foreground) text-sm">
            Envia um PDF para <code className="bg-(--muted) px-1.5 py-0.5 rounded text-xs">POST /api/resumes/</code> e
            faz polling em <code className="bg-(--muted) px-1.5 py-0.5 rounded text-xs">GET /api/resumes/:id</code> até o{" "}
            <code className="bg-(--muted) px-1.5 py-0.5 rounded text-xs">structured_summary</code> aparecer.
          </p>
        </div>

        {/* Form card */}
        <div className="bg-(--card) border border-(--border) rounded-xl p-6 shadow-sm space-y-5">

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Token input */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-(--foreground)">
                JWT Bearer Token
              </label>
              <div className="relative">
                <input
                  type={showToken ? "text" : "password"}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full bg-(--input) border border-(--border) rounded-lg px-3 py-2 pr-10 text-sm text-(--foreground) placeholder:text-(--muted-foreground) focus:outline-none focus:ring-2 focus:ring-(--ring) transition-shadow"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-(--muted-foreground) hover:text-(--foreground) transition-colors"
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-(--muted-foreground)">
                Pegue via Postman ou faça login em <code>/login</code> e copie o token da resposta.
              </p>
            </div>

            {/* File drop zone */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-(--foreground)">
                Arquivo PDF
              </label>
              <label
                className={cn(
                  "flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-8 cursor-pointer transition-colors",
                  file
                    ? "border-(--primary) bg-(--accent)"
                    : "border-(--border) hover:border-(--primary)/50 hover:bg-(--muted)",
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="sr-only"
                  required
                />
                {file ? (
                  <>
                    <FileText className="w-8 h-8 text-(--primary)" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-(--foreground)">{file.name}</p>
                      <p className="text-xs text-(--muted-foreground)">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-(--muted-foreground)" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-(--foreground)">
                        Clique para selecionar
                      </p>
                      <p className="text-xs text-(--muted-foreground)">PDF · máx. 5 MB</p>
                    </div>
                  </>
                )}
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isLoading || !file || !token}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all",
                  "bg-(--primary) text-(--primary-foreground)",
                  "hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed",
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {state === "uploading" ? "Enviando..." : `Aguardando IA... (${pollCount}x)`}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Enviar Currículo
                  </>
                )}
              </button>
              {(state !== "idle") && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium border border-(--border) text-(--muted-foreground) hover:text-(--foreground) transition-colors"
                >
                  Limpar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Error */}
        {state === "error" && error && (
          <div className="flex items-start gap-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-400">Erro</p>
              <p className="text-sm text-red-600 dark:text-red-500 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Polling indicator */}
        {state === "polling" && (
          <div className="flex items-center gap-3 bg-(--accent) border border-(--border) rounded-xl p-4">
            <Loader2 className="w-5 h-5 text-(--primary) animate-spin shrink-0" />
            <div>
              <p className="text-sm font-medium text-(--foreground)">Processando com IA</p>
              <p className="text-xs text-(--muted-foreground) mt-0.5">
                Verificação #{pollCount} · a cada 3s · aguardando status <code>ready</code>
              </p>
            </div>
          </div>
        )}

        {/* Result */}
        {state === "done" && result && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-(--primary)">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-semibold">structured_summary gerado com sucesso</span>
            </div>

            {/* Summary cards */}
            {result.structuredSummary && (
              <div className="space-y-3">
                {/* Personal info */}
                <div className="bg-(--card) border border-(--border) rounded-xl p-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground) mb-3">
                    Informações Pessoais
                  </h3>
                  <p className="font-semibold text-(--foreground)">{result.structuredSummary.personal_info.name}</p>
                  <p className="text-sm text-(--primary) font-medium">{result.structuredSummary.personal_info.title}</p>
                  <p className="text-sm text-(--muted-foreground) mt-2">{result.structuredSummary.personal_info.about}</p>
                </div>

                {/* Skills */}
                <div className="bg-(--card) border border-(--border) rounded-xl p-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground) mb-3">
                    Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {result.structuredSummary.skills.map((s) => (
                      <span key={s} className="bg-(--accent) text-(--accent-foreground) text-xs font-medium px-2.5 py-1 rounded-full">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Experiences */}
                {result.structuredSummary.experiences.length > 0 && (
                  <div className="bg-(--card) border border-(--border) rounded-xl p-5">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground) mb-3">
                      Experiências
                    </h3>
                    <div className="space-y-4">
                      {result.structuredSummary.experiences.map((exp, i) => (
                        <div key={i} className="border-l-2 border-(--primary) pl-4">
                          <p className="font-medium text-(--foreground) text-sm">{exp.role}</p>
                          <p className="text-xs text-(--muted-foreground)">{exp.company}</p>
                          <ul className="mt-2 space-y-1">
                            {exp.highlights.map((h, j) => (
                              <li key={j} className="text-xs text-(--muted-foreground) flex gap-2">
                                <span className="text-(--primary) shrink-0">·</span>
                                {h}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Raw JSON toggle */}
                <details className="bg-(--muted) border border-(--border) rounded-xl">
                  <summary className="px-5 py-3 text-sm font-medium text-(--muted-foreground) cursor-pointer hover:text-(--foreground) transition-colors">
                    Ver JSON completo
                  </summary>
                  <pre className="px-5 pb-5 pt-2 text-xs text-(--foreground) overflow-auto max-h-96">
                    {JSON.stringify(result.structuredSummary, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
