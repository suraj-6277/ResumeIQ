"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { apiUrl, networkErrorMessage } from "@/lib/api";
import type { ResumeListItem } from "@/types/resume";

export default function DashboardPage() {
  const [items, setItems] = useState<ResumeListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(apiUrl("/resumes?limit=50"));
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json?.error?.message || "Could not load resumes.");
        }
        const list = (json.data || []) as ResumeListItem[];
        if (!cancelled) setItems(list);
      } catch (e) {
        if (!cancelled) {
          toast.error(networkErrorMessage(e));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Previously analyzed resumes
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:brightness-110"
        >
          New upload
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-2xl bg-[var(--muted-bg)]"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] px-6 py-16 text-center">
          <p className="text-[var(--muted)]">No resumes yet.</p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm font-medium text-[var(--accent)] hover:underline"
          >
            Upload your first resume
          </Link>
        </div>
      ) : (
        <ul className="space-4">
          {items.map((row) => (
            <li key={row.resumeId}>
              <Link
                href={`/results/${row.resumeId}`}
                className="block rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm transition-all duration-200 hover:border-[var(--accent)]/40 hover:shadow-md"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">
                      {row.name || "Untitled"}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {row.fileName && <span>{row.fileName} · </span>}
                      {formatDate(row.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {row.scoreCategory?.label && (
                      <span className="text-xs font-medium text-[var(--muted)]">
                        {row.scoreCategory.label}
                      </span>
                    )}
                    <span className="rounded-full bg-[var(--accent-muted)] px-3 py-1 text-sm font-bold tabular-nums text-[var(--accent)]">
                      {row.score}/100
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function formatDate(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}
