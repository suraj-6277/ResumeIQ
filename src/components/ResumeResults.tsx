"use client";

import { suggestionText, type ResumeAnalysisPayload } from "@/types/resume";

type Props = {
  data: ResumeAnalysisPayload;
  onDownloadJson?: () => void;
};

export default function ResumeResults({ data, onDownloadJson }: Props) {
  const score = Math.min(100, Math.max(0, data.score));
  const category = data.scoreCategory?.label;

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm transition-shadow hover:shadow-md sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Resume score
            </h2>
            {category && (
              <p className="mt-1 text-sm text-[var(--muted)]">{category}</p>
            )}
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <span className="text-4xl font-bold tabular-nums text-[var(--accent)]">
              {score}
              <span className="text-lg font-medium text-[var(--muted)]">/100</span>
            </span>
            <ScoreBar value={score} />
          </div>
        </div>
        {data.targetRole && (
          <p className="mt-4 text-sm text-[var(--muted)]">
            Compared against:{" "}
            <span className="font-medium text-[var(--foreground)]">
              {data.targetRole}
            </span>
            {data.analysisMode && data.analysisMode !== "role_template" && (
              <span className="ml-2 text-xs text-[var(--muted)]">
                (
                {data.analysisMode === "job_description"
                  ? "JD skills"
                  : "JD + role template"}
                )
              </span>
            )}
          </p>
        )}
      </section>

      {(data.jobDescriptionSnippet || (data.jdSkillKeywords?.length ?? 0) > 0) && (
        <Card title="Job description (used for this analysis)">
          {data.jobDescriptionSnippet && (
            <p className="mb-4 max-h-48 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-[var(--foreground)]/90">
              {data.jobDescriptionSnippet}
            </p>
          )}
          {(data.jdSkillKeywords?.length ?? 0) > 0 && (
            <>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                Terms detected in JD
              </p>
              <ul className="flex flex-wrap gap-2">
                {data.jdSkillKeywords!.map((k) => (
                  <li
                    key={k}
                    className="rounded-md bg-[var(--muted-bg)] px-2 py-1 text-xs text-[var(--foreground)]"
                  >
                    {k}
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      )}

      <section className="grid gap-6 sm:grid-cols-2">
        <Card title="Contact">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-[var(--muted)]">Name</dt>
              <dd className="font-medium text-[var(--foreground)]">{data.name}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Email</dt>
              <dd className="font-medium text-[var(--foreground)]">
                {data.email ?? "—"}
              </dd>
            </div>
            {data.phone != null && data.phone !== "" && (
              <div>
                <dt className="text-[var(--muted)]">Phone</dt>
                <dd className="font-medium text-[var(--foreground)]">{data.phone}</dd>
              </div>
            )}
          </dl>
        </Card>
        <Card title="Score breakdown">
          <ul className="space-y-3 text-sm">
            <BreakdownRow
              label="Skills match (40%)"
              value={data.scoreBreakdown.skillsScore}
            />
            <BreakdownRow
              label="Experience (30%)"
              value={data.scoreBreakdown.experienceScore}
            />
            <BreakdownRow
              label="Keywords (20%)"
              value={data.scoreBreakdown.keywordScore}
            />
            <BreakdownRow
              label="Completeness (10%)"
              value={data.scoreBreakdown.formatScore}
            />
          </ul>
        </Card>
      </section>

      <Card title="Skills">
        {data.skills.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No skills detected from keywords.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {data.skills.map((skill) => (
              <li
                key={skill}
                className="rounded-full bg-[var(--accent-muted)] px-3 py-1 text-xs font-medium text-[var(--accent)]"
              >
                {skill}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Skill gap vs. job description">
        {data.missingSkills.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            No major gaps vs. the JD profile, or listed skills already appear on your resume.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {data.missingSkills.map((skill) => (
              <li
                key={skill}
                className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-800 dark:text-amber-200"
              >
                {skill}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Experience">
        {data.experience.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            No structured roles parsed. Try clearer dates and job titles in the document.
          </p>
        ) : (
          <ul className="space-4">
            {data.experience.map((exp, i) => (
              <li
                key={`${exp.position}-${i}`}
                className="border-l-2 border-[var(--accent)] pl-4"
              >
                <p className="font-semibold text-[var(--foreground)]">
                  {exp.position || "Role"}
                </p>
                <p className="text-sm text-[var(--muted)]">
                  {[exp.company, exp.duration].filter(Boolean).join(" · ")}
                </p>
                {exp.description && (
                  <p className="mt-2 text-sm leading-relaxed text-[var(--foreground)]/90">
                    {exp.description}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Suggestions">
        {data.suggestions.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No suggestions.</p>
        ) : (
          <ul className="space-y-3">
            {data.suggestions.map((s, i) => (
              <li
                key={i}
                className="flex gap-2 text-sm leading-relaxed text-[var(--foreground)]"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                {suggestionText(s)}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {data.fileInfo && (
        <p className="text-center text-xs text-[var(--muted)]">
          File: {data.fileInfo.name}
          {data.fileInfo.sizeFormatted != null
            ? ` · ${data.fileInfo.sizeFormatted}`
            : ""}
        </p>
      )}

      {onDownloadJson && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onDownloadJson}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:border-[var(--accent)]"
          >
            Download report (JSON)
          </button>
        </div>
      )}
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm transition-shadow hover:shadow-md">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
        {title}
      </h3>
      {children}
    </section>
  );
}

function BreakdownRow({ label, value }: { label: string; value: number }) {
  return (
    <li className="flex items-center justify-between gap-4 border-b border-[var(--border)] py-2 last:border-0">
      <span className="text-[var(--muted)]">{label}</span>
      <span className="tabular-nums font-semibold text-[var(--foreground)]">
        {Math.round(value)}
      </span>
    </li>
  );
}

function ScoreBar({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div
      className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-[var(--muted-bg)] sm:w-56"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-[var(--accent)] transition-all duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
