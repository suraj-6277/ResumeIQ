// ─── Email Extractor ─────────────────────────────────────────────────────────
const extractEmail = (text) => {
  const emailRegex = /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/g;
  const matches = text.match(emailRegex);
  return matches ? matches[0].toLowerCase() : null;
};

// ─── Phone Extractor ─────────────────────────────────────────────────────────
const extractPhone = (text) => {
  const phoneRegex =
    /(?:\+?(\d{1,3}))?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const matches = text.match(phoneRegex);
  return matches ? matches[0].trim() : null;
};

// ─── Name Extractor ──────────────────────────────────────────────────────────
const extractName = (text) => {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  for (const line of lines.slice(0, 8)) {
    const isEmail = /[@.]/.test(line);
    const isPhone = /\d{7,}/.test(line);
    const isHeader = /^(resume|curriculum|cv|objective|summary|profile)$/i.test(
      line
    );
    const isTooLong = line.split(' ').length > 6;
    const isTooShort = line.split(' ').length < 2;
    const hasSpecialChars = /[|•\\/\[\]<>{}=+*&^%$#@!]/.test(line);
    const namePattern = /^[A-Z][a-zA-Z\-']+(?: [A-Z][a-zA-Z\-']+){1,3}$/;

    if (
      !isEmail &&
      !isPhone &&
      !isHeader &&
      !isTooLong &&
      !isTooShort &&
      !hasSpecialChars &&
      namePattern.test(line)
    ) {
      return line;
    }
  }

  return 'Unknown Candidate';
};

// ─── Skills (predefined list, case-insensitive) ───────────────────────────────
const PREDEFINED_SKILLS = [
  'javascript',
  'react',
  'node',
  'mongodb',
  'express',
  'html',
  'css',
  'python',
  'java',
];

const extractSkills = (text) => {
  const lowerText = (text || '').toLowerCase();
  return PREDEFINED_SKILLS.filter((skill) => lowerText.includes(skill));
};

// Legacy exports for any external use
const SKILL_KEYWORDS = { predefined: PREDEFINED_SKILLS };
const ALL_SKILLS = [...PREDEFINED_SKILLS];

// ─── Experience Extractor ────────────────────────────────────────────────────
const extractExperience = (text) => {
  const experiences = [];
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  const datePattern =
    /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)?\s*\d{4}\s*[-–]\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)?\s*(?:\d{4}|Present|Current|Now)/i;

  const titleKeywords =
    /\b(engineer|developer|designer|manager|analyst|architect|lead|senior|junior|intern|consultant|director|specialist|coordinator|administrator|scientist|researcher)\b/i;

  let currentExp = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const hasDate = datePattern.test(line);
    const hasTitle = titleKeywords.test(line);

    if (hasDate || (hasTitle && line.split(' ').length <= 8)) {
      if (currentExp) experiences.push(currentExp);

      const dateMatch = line.match(datePattern);
      currentExp = {
        position: '',
        company: '',
        duration: dateMatch ? dateMatch[0].trim() : '',
        description: '',
      };

      if (hasTitle) {
        currentExp.position = line.replace(datePattern, '').trim();
      } else if (i + 1 < lines.length && titleKeywords.test(lines[i + 1])) {
        currentExp.position = lines[i + 1];
      }

      if (i + 1 < lines.length && !titleKeywords.test(lines[i + 1])) {
        currentExp.company = lines[i + 1].replace(datePattern, '').trim();
      }
    } else if (
      currentExp &&
      line.length > 20 &&
      currentExp.description.length < 500
    ) {
      currentExp.description += (currentExp.description ? ' ' : '') + line;
    }
  }

  if (currentExp) experiences.push(currentExp);

  return experiences.slice(0, 10);
};

// ─── Years of Experience Calculator ──────────────────────────────────────────
const calculateYearsOfExperience = (text) => {
  const yearPattern = /\b(20\d{2}|19\d{2})\b/g;
  const years = text.match(yearPattern);
  if (!years || years.length < 2) return 0;

  const uniqueYears = [...new Set(years)].map(Number).sort();
  const minYear = Math.min(...uniqueYears);
  const maxYear = Math.max(...uniqueYears);
  const currentYear = new Date().getFullYear();

  const endYear = Math.min(maxYear, currentYear);
  return Math.max(0, endYear - minYear);
};

module.exports = {
  extractEmail,
  extractPhone,
  extractName,
  extractSkills,
  extractExperience,
  calculateYearsOfExperience,
  PREDEFINED_SKILLS,
  SKILL_KEYWORDS,
  ALL_SKILLS,
};
