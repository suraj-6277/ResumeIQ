const {
  extractEmail,
  extractPhone,
  extractName,
  extractExperience,
} = require('../utils/extractors');
const { buildBasicSuggestions } = require('./suggestionsService');

/** Kept for GET /api/roles — minimal shape */
const JOB_ROLES = {
  fullstack_developer: {
    name: 'Full Stack Developer',
    required: [],
    preferred: [],
  },
};

const SKILL_LIST = [
  'javascript',
  'react',
  'node',
  'mongodb',
  'express',
  'sql',
  'excel',
  'python',
  'java',
  'data',
  'analysis',
  'dashboard',
  'visualization',
];

const JD_KEYWORDS = ['develop', 'analyze', 'build'];
const FALLBACK_KEYWORDS = ['developed', 'built', 'project', 'experience'];

const extractListMatches = (text, list) => {
  const lowerText = (text || '').toLowerCase();
  return list.filter((item) => lowerText.includes(item));
};

const validateResume = (text) => {
  const lowerText = (text || '').toLowerCase();
  const emailRegex = /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/;

  const hasEmail = emailRegex.test(lowerText);
  const hasSkills = extractListMatches(lowerText, SKILL_LIST).length > 0;
  const hasExperience = ['experience', 'project', 'intern'].some((word) =>
    lowerText.includes(word)
  );
  const hasEducation = ['education', 'degree', 'bachelor'].some((word) =>
    lowerText.includes(word)
  );

  const resumeConfidence = [hasEmail, hasSkills, hasExperience, hasEducation].filter(
    Boolean
  ).length;

  console.log('Resume confidence:', resumeConfidence);

  return {
    isValid: resumeConfidence >= 2,
    resumeConfidence,
  };
};

const calculateScoreBreakdown = (email, rawText, jobDescription) => {
  if (!rawText || !rawText.trim()) {
    return {
      score: 0,
      breakdown: {},
      foundSkills: [],
      jdSkills: [],
      matchedSkills: [],
      keywordCount: 0,
      matchedKeywords: [],
      hasExperience: false,
      hasEmail: false,
    };
  }

  const lowerText = rawText.toLowerCase();
  const lowerJD = (jobDescription || '').toLowerCase();
  const emailRegex = /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/;
  const hasEmail = emailRegex.test(rawText) || Boolean(email);
  const foundSkills = extractListMatches(lowerText, SKILL_LIST);
  const jdSkills = extractListMatches(lowerJD, SKILL_LIST);
  const matchedSkills = foundSkills.filter((skill) => jdSkills.includes(skill));
  const skillScore = jdSkills.length > 0
    ? Math.min((matchedSkills.length / jdSkills.length) * 40, 40)
    : Math.min(foundSkills.length * 10, 40);

  const hasExperience = ['experience', 'intern', 'project'].some((term) =>
    lowerText.includes(term)
  );
  const experienceScore = hasExperience ? 30 : 0;
  const jdKeywords = extractListMatches(lowerJD, JD_KEYWORDS);
  const matchedKeywords = jdKeywords.filter((kw) => lowerText.includes(kw));
  const fallbackKeywordCount = FALLBACK_KEYWORDS.filter((word) =>
    lowerText.includes(word)
  ).length;
  const keywordScore = jdKeywords.length > 0
    ? Math.min((matchedKeywords.length / jdKeywords.length) * 20, 20)
    : Math.min(fallbackKeywordCount * 5, 20);
  const basicScore = hasEmail ? 10 : 0;

  const breakdown = {
    skills: Number(skillScore.toFixed(1)),
    experience: experienceScore,
    keywords: Number(keywordScore.toFixed(1)),
    basic: basicScore,
  };

  const score = Math.round(
    Math.min(
    100,
    breakdown.skills + breakdown.experience + breakdown.keywords + breakdown.basic
    )
  );

  console.log('JD Skills:', jdSkills);
  console.log('Resume Skills:', foundSkills);
  console.log('Matched Skills:', matchedSkills);
  console.log('Final Score:', score);
  console.log('Breakdown:', breakdown);

  return {
    score,
    breakdown,
    foundSkills,
    jdSkills,
    matchedSkills,
    keywordCount: jdKeywords.length > 0 ? matchedKeywords.length : fallbackKeywordCount,
    matchedKeywords,
    hasExperience,
    hasEmail,
  };
};

/**
 * Parse resume text → core fields + score + suggestions
 * @param {string} rawText
 * @param {{ jobDescription?: string }} [options]
 */
const analyzeResume = (rawText, options = {}) => {
  if (!rawText || rawText.trim().length === 0) {
    return {
      name: 'Unknown Candidate',
      email: null,
      skills: [],
      score: 0,
      breakdown: {},
      scoreBreakdown: {},
      suggestions: ['Unable to analyze resume'],
      experience: [],
      phone: null,
      missingSkills: [],
      jdSkillKeywords: [],
    };
  }

  const jobDescription = (options.jobDescription || '').trim();
  const validation = validateResume(rawText);
  if (!validation.isValid) {
    return {
      name: 'Unknown Candidate',
      email: null,
      skills: [],
      score: 0,
      breakdown: {},
      scoreBreakdown: {},
      suggestions: [
        'Uploaded file does not appear to be a valid resume',
        'Please upload a resume with skills, experience, and contact details',
      ],
      experience: [],
      phone: null,
      missingSkills: [],
      jdSkillKeywords: [],
    };
  }

  const name = extractName(rawText);
  const email = extractEmail(rawText);
  const phone = extractPhone(rawText);
  const experience = extractExperience(rawText);
  const scoreData = calculateScoreBreakdown(email, rawText, jobDescription);
  const skills = scoreData.foundSkills;
  const suggestions = [
    ...buildBasicSuggestions({
      skills,
      hasExperience: scoreData.hasExperience,
      keywordCount: scoreData.keywordCount,
      hasEmail: scoreData.hasEmail,
    }),
  ];

  const jdSkillKeywords = scoreData.jdSkills;
  const missingSkills = jdSkillKeywords.filter((s) => !scoreData.matchedSkills.includes(s));
  if (jobDescription.length > 0) {
    if (jdSkillKeywords.length > 0 && scoreData.matchedSkills.length === 0) {
      suggestions.push('Your resume does not match key skills required for this role');
    } else if (
      jdSkillKeywords.length > 0 &&
      scoreData.matchedSkills.length > 0 &&
      scoreData.matchedSkills.length < jdSkillKeywords.length
    ) {
      suggestions.push('Consider adding relevant skills from the job description');
    }

    if (missingSkills.length > 0) {
      suggestions.push(
        `Add or emphasize skills from the job description: ${missingSkills.slice(0, 5).join(', ')}.`
      );
    }
  } 

  return {
    name,
    email,
    skills,
    score: scoreData.score,
    breakdown: scoreData.breakdown,
    scoreBreakdown: scoreData.breakdown,
    suggestions,
    experience,
    phone,
    missingSkills,
    jdSkillKeywords,
  };
};

module.exports = {
  analyzeResume,
  JOB_ROLES,
  calculateScoreBreakdown,
};
