export type ScoreCategory = {
  label: string;
  color: string;
};

export type ScoreBreakdown = {
  skillsScore: number;
  experienceScore: number;
  keywordScore: number;
  formatScore: number;
};

export type ExperienceEntry = {
  position: string;
  company: string;
  duration: string;
  description: string;
};

export type SuggestionItem =
  | string
  | {
      text: string;
      priority?: string;
    };

export type ResumeAnalysisPayload = {
  id?: string;
  resumeId: string;
  name: string;
  email: string | null;
  phone?: string | null;
  skills: string[];
  experience: ExperienceEntry[];
  yearsOfExperience?: number;
  score: number;
  scoreCategory?: ScoreCategory;
  scoreBreakdown: ScoreBreakdown;
  targetRole?: string;
  /** Snippet of the job description used for this run */
  jobDescriptionSnippet?: string | null;
  /** Skills/keywords extracted from the JD for matching */
  jdSkillKeywords?: string[];
  usedJobDescription?: boolean;
  analysisMode?: "job_description" | "blended" | "role_template";
  missingSkills: string[];
  matchedSkills?: string[];
  suggestions: SuggestionItem[];
  fileInfo?: {
    name: string;
    type: string;
    size: number;
    sizeFormatted?: string;
  };
  createdAt?: string;
};

export type ResumeListItem = {
  resumeId: string;
  name: string;
  score: number;
  createdAt: string;
  fileName?: string;
  scoreCategory?: ScoreCategory;
};

export function suggestionText(s: SuggestionItem): string {
  return typeof s === "string" ? s : s.text;
}
