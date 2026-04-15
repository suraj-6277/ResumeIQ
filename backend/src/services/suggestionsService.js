/**
 * Simple rule-based suggestions (fresher-level)
 */
const buildBasicSuggestions = ({ skills = [], hasExperience = false, keywordCount = 0, hasEmail = false }) => {
  const out = [];
  if (skills.length < 3) {
    out.push('Add more technical skills');
  }
  if (!hasExperience) {
    out.push('Include projects or experience');
  }
  if (keywordCount < 2) {
    out.push('Use action words like built, developed');
  }
  if (!hasEmail) {
    out.push('Add a valid email');
  }
  return out;
};

/**
 * Format suggestions with priority levels
 * @param {string[]} rawSuggestions
 * @returns {object[]} Formatted suggestions with priority
 */
const formatSuggestions = (rawSuggestions) => {
  const priorityMap = {
    email: 'high',
    phone: 'high',
    github: 'high',
    skills: 'high',
    experience: 'medium',
    metrics: 'medium',
    linkedin: 'low',
    portfolio: 'low',
    certif: 'low',
    action: 'medium',
    education: 'low',
    short: 'high',
  };

  return rawSuggestions.map((text) => {
    let priority = 'medium';
    const lowerText = text.toLowerCase();

    for (const [key, prio] of Object.entries(priorityMap)) {
      if (lowerText.includes(key)) {
        priority = prio;
        break;
      }
    }

    return { text, priority };
  });
};

/**
 * Get score category label
 */
const getScoreCategory = (score) => {
  if (score >= 85) return { label: 'Excellent', color: 'green' };
  if (score >= 70) return { label: 'Good', color: 'blue' };
  if (score >= 55) return { label: 'Fair', color: 'yellow' };
  if (score >= 40) return { label: 'Needs Work', color: 'orange' };
  return { label: 'Poor', color: 'red' };
};

module.exports = { formatSuggestions, getScoreCategory, buildBasicSuggestions };
