"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { apiUrl, networkErrorMessage } from "@/lib/api";
import type { ResumeAnalysisPayload } from "@/types/resume";

const MAX_BYTES = 5 * 1024 * 1024;
const MIN_JD_CHARS = 80;
const ACCEPT = ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export default function FileDropzone() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);

  const jdLen = jobDescription.trim().length;
  const jdOk = jdLen >= MIN_JD_CHARS;

  const validateAndSet = useCallback((f: File | null) => {
    if (!f) return;
    const okType =
      f.type === "application/pdf" ||
      f.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    const okName = /\.(pdf|docx)$/i.test(f.name);
    if (!okType && !okName) {
      toast.error("Please upload a PDF or DOCX file.");
      return;
    }
    if (f.size > MAX_BYTES) {
      toast.error("File must be 5 MB or smaller.");
      return;
    }
    setFile(f);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files?.[0];
      validateAndSet(f ?? null);
    },
    [validateAndSet]
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Choose a resume file first.");
      return;
    }
    if (!jdOk) {
      toast.error(
        `Paste the full job description (at least ${MIN_JD_CHARS} characters).`
      );
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("resume", file);
    formData.append("jobDescription", jobDescription.trim());

    try {
      const res = await fetch(apiUrl("/upload"), {
        method: "POST",
        body: formData,
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          json?.error?.message || json?.message || "Upload failed.";
        throw new Error(msg);
      }

      const data = json.data as ResumeAnalysisPayload | undefined;
      const resumeId = data?.resumeId ?? json.resumeId;
      if (!resumeId) {
        throw new Error("No resume ID returned from server.");
      }

      toast.success("Analysis complete.");
      router.push(`/results/${resumeId}`);
    } catch (err) {
      toast.error(networkErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div
        role="button"
        tabIndex={0}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            document.getElementById("resume-file")?.click();
          }
        }}
        className={`relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 transition-all duration-200 ${
          dragOver
            ? "border-[var(--accent)] bg-[var(--accent-muted)] scale-[1.01]"
            : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)]/50"
        }`}
        onClick={() => document.getElementById("resume-file")?.click()}
      >
        <input
          id="resume-file"
          type="file"
          accept={ACCEPT}
          className="sr-only"
          onChange={(e) => validateAndSet(e.target.files?.[0] ?? null)}
          onClick={(e) => e.stopPropagation()}
        />
        <div className="rounded-full bg-[var(--muted-bg)] p-3 text-[var(--accent)]">
          <UploadIcon />
        </div>
        <p className="mt-4 text-center text-sm font-medium text-[var(--foreground)]">
          Drag and drop your resume here
        </p>
        <p className="mt-1 text-center text-xs text-[var(--muted)]">
          or click to browse — PDF or DOCX, max 5 MB
        </p>
        {file && (
          <p className="mt-4 truncate text-sm text-[var(--accent)]" title={file.name}>
            {file.name}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="job-description"
          className="mb-2 block text-sm font-medium text-[var(--foreground)]"
        >
          Job description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="job-description"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          rows={10}
          placeholder="Paste the full job posting (requirements, responsibilities, tech stack). Analysis matches your resume against this text."
          className="w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
          required
          minLength={MIN_JD_CHARS}
        />
        <p className="mt-1 text-xs text-[var(--muted)]">
          {jdLen < MIN_JD_CHARS
            ? `${MIN_JD_CHARS - jdLen} more characters needed`
            : `${jdLen} characters — ready`}
        </p>
      </div>

      <button
        type="submit"
        disabled={!file || !jdOk || loading}
        className="w-full rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Analyzing…" : "Analyze resume vs. job description"}
      </button>
    </form>
  );
}

function UploadIcon() {
  return (
    <svg
      className="h-8 w-8"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
      />
    </svg>
  );
}
