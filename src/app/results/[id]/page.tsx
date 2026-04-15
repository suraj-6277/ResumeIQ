"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import ResumeResults from "@/components/ResumeResults";
import { apiUrl, networkErrorMessage } from "@/lib/api";
import type { ResumeAnalysisPayload, ScoreBreakdown } from "@/types/resume";

type ApiResume = {
  resumeId: string;
  name?: string;
  email?: string | null;
  phone?: string | null;
  skills?: string[];
  experience?: ResumeAnalysisPayload["experience"];
  score?: number;
  scoreBreakdown?: Partial<ScoreBreakdown>;
  missingSkills?: string[];
  suggestions?: ResumeAnalysisPayload["suggestions"];
  scoreCategory?: ResumeAnalysisPayload["scoreCategory"];
  fileName?: string;
  fileSize?: number;
  fileSizeFormatted?: string;
  fileType?: string;
  createdAt?: string;
  targetRole?: string;
  matchedSkills?: string[];
  jobDescriptionSnippet?: string | null;
  jobDescriptionPreview?: string | null;
  jdSkillKeywords?: string[];
  jdExtractedSkills?: string[];
  usedJobDescription?: boolean;
  analysisMode?: ResumeAnalysisPayload["analysisMode"];
};

function normalizePayload(raw: ApiResume): ResumeAnalysisPayload {
  const breakdown = raw.scoreBreakdown || {};
  return {
    resumeId: raw.resumeId,
    name: raw.name ?? "Unknown",
    email: raw.email ?? null,
    phone: raw.phone ?? null,
    skills: raw.skills ?? [],
    experience: raw.experience ?? [],
    score: raw.score ?? 0,
    scoreCategory: raw.scoreCategory,
    scoreBreakdown: {
      skillsScore: breakdown.skillsScore ?? 0,
      experienceScore: breakdown.experienceScore ?? 0,
      keywordScore: breakdown.keywordScore ?? 0,
      formatScore: breakdown.formatScore ?? 0,
    },
    targetRole: raw.targetRole,
    jobDescriptionSnippet:
      raw.jobDescriptionSnippet ?? raw.jobDescriptionPreview ?? null,
    jdSkillKeywords: raw.jdSkillKeywords ?? raw.jdExtractedSkills ?? [],
    usedJobDescription:
      raw.usedJobDescription ??
      (raw.analysisMode != null
        ? raw.analysisMode !== "role_template"
        : false),
    analysisMode: raw.analysisMode,
    missingSkills: raw.missingSkills ?? [],
    matchedSkills: raw.matchedSkills,
    suggestions: raw.suggestions ?? [],
    fileInfo: raw.fileName
      ? {
          name: raw.fileName,
          type: raw.fileType ?? "",
          size: raw.fileSize ?? 0,
          sizeFormatted: raw.fileSizeFormatted,
        }
      : undefined,
    createdAt: raw.createdAt,
  };
}

export default function ResultsPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : params.id?.[0];
  const [data, setData] = useState<ResumeAnalysisPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setError("Missing resume ID.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(apiUrl(`/resume/${encodeURIComponent(id)}`));
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json?.error?.message || "Could not load resume.");
        }
        const raw = json.data as ApiResume;
        if (!raw?.resumeId) {
          throw new Error("Invalid response from server.");
        }
        if (!cancelled) setData(normalizePayload(raw));
      } catch (e) {
        if (!cancelled) {
          const msg = networkErrorMessage(e);
          setError(msg);
          toast.error(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const downloadJson = useCallback(() => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resume-report-${data.resumeId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded.");
  }, [data]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-2/3 rounded-lg bg-[var(--muted-bg)]" />
          <div className="h-40 rounded-2xl bg-[var(--muted-bg)]" />
          <div className="h-32 rounded-2xl bg-[var(--muted-bg)]" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <p className="text-[var(--foreground)]">{error || "Not found."}</p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block text-sm font-medium text-[var(--accent)] hover:underline"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
            Analysis results
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Parsed data, score, and recommendations
          </p>
        </div>
        <Link
          href="/"
          className="text-sm font-medium text-[var(--accent)] transition-colors hover:underline"
        >
          Analyze another
        </Link>
      </div>
      <ResumeResults data={data} onDownloadJson={downloadJson} />
    </div>
  );
}
