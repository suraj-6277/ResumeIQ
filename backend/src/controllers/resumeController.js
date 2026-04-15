const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Resume = require('../models/Resume');
const { parseFile, getFileType } = require('../services/parserService');
const { analyzeResume, JOB_ROLES } = require('../services/analyzerService');
const { formatSuggestions, getScoreCategory } = require('../services/suggestionsService');

const successResponse = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    ...data,
  });
};

const errorResponse = (res, message, statusCode = 400) => {
  return res.status(statusCode).json({
    success: false,
    error: { message },
  });
};

const MIN_JD_LENGTH = 80;
const MAX_JD_LENGTH = 25000;

const validateJobDescription = (jd) => {
  const trimmed = (jd || '').trim();
  if (!trimmed) {
    return { value: '' };
  }
  if (trimmed.length > MAX_JD_LENGTH) {
    return { error: `Job description is too long (max ${MAX_JD_LENGTH} characters).` };
  }
  return { value: trimmed };
};

// ─── POST /api/upload ─────────────────────────────────────────────────────────
const uploadAndAnalyze = async (req, res, next) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'No file uploaded. Please attach a PDF or DOCX file.', 400);
    }

    const { file } = req;
    const filePath = path.resolve(file.path);
    const fileType = getFileType(file.originalname);

    const jdCheck = validateJobDescription(req.body.jobDescription);
    if (jdCheck.error) {
      return errorResponse(res, jdCheck.error, 400);
    }
    const jobDescription = jdCheck.value;

    let rawText;
    try {
      rawText = await parseFile(filePath, fileType);
      console.log('Parsed text:', rawText?.slice(0, 200));
    } catch (parseErr) {
      return errorResponse(res, `File parsing failed: ${parseErr.message}`, 422);
    }

    if (!rawText || !rawText.trim()) {
      return successResponse(res, {
        data: {
          score: 0,
          breakdown: {},
          skills: [],
          suggestions: ['Unable to analyze resume'],
        },
      });
    }

    let analysis;
    try {
      analysis = analyzeResume(rawText, { jobDescription });
    } catch (analyzeErr) {
      return errorResponse(res, `Analysis failed: ${analyzeErr.message}`, 422);
    }

    const formattedSuggestions = formatSuggestions(analysis.suggestions);
    const scoreCategory = getScoreCategory(analysis.score);
    const resumeId = uuidv4();

    let resume;
    try {
      resume = await Resume.create({
        resumeId,
        name: analysis.name,
        email: analysis.email,
        phone: analysis.phone,
        skills: analysis.skills,
        experience: analysis.experience,
        rawText,
        score: analysis.score,
        scoreBreakdown: {
          skillsScore: analysis.scoreBreakdown?.skills || 0,
          experienceScore: analysis.scoreBreakdown?.experience || 0,
          keywordScore: analysis.scoreBreakdown?.keywords || 0,
          formatScore: analysis.scoreBreakdown?.basic || 0,
        },
        missingSkills: analysis.missingSkills || [],
        suggestions: analysis.suggestions,
        targetRole: null,
        jobDescriptionPreview: jobDescription ? jobDescription.slice(0, 1500) : null,
        jdExtractedSkills: (analysis.jdSkillKeywords || []).slice(0, 40),
        analysisMode: jobDescription ? 'job_description' : 'blended',
        fileName: file.originalname,
        fileType,
        fileSize: file.size,
        status: 'completed',
      });
    } catch (dbErr) {
      dbErr.statusCode = 503;
      dbErr.message =
        'Analysis completed, but saving failed. Please check database connection and try again.';
      return next(dbErr);
    }

    return successResponse(res, {
      message: 'Resume analyzed successfully',
      resumeId: resume.resumeId,
      data: {
        data: {
          score: analysis.score,
          breakdown: analysis.breakdown || analysis.scoreBreakdown || {},
          skills: analysis.skills || [],
          suggestions: formattedSuggestions,
        },
        name: analysis.name,
        email: analysis.email,
        skills: analysis.skills,
        score: analysis.score,
        breakdown: analysis.breakdown || analysis.scoreBreakdown || {},
        scoreBreakdown: {
          skillsScore: analysis.scoreBreakdown?.skills || 0,
          experienceScore: analysis.scoreBreakdown?.experience || 0,
          keywordScore: analysis.scoreBreakdown?.keywords || 0,
          formatScore: analysis.scoreBreakdown?.basic || 0,
        },
        suggestions: formattedSuggestions,
        resumeId: resume.resumeId,
        id: resume._id,
        scoreCategory,
        jobDescriptionSnippet: resume.jobDescriptionPreview,
        jdSkillKeywords: resume.jdExtractedSkills,
        missingSkills: analysis.missingSkills || [],
        createdAt: resume.createdAt,
        fileInfo: {
          name: file.originalname,
          type: fileType,
          size: file.size,
          sizeFormatted: resume.fileSizeFormatted,
        },
      },
    }, 201);
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/parse ──────────────────────────────────────────────────────────
const parseResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'No file uploaded.', 400);
    }

    const filePath = path.resolve(req.file.path);
    const fileType = getFileType(req.file.originalname);

    const rawText = await parseFile(filePath, fileType);
    console.log('Parsed text:', rawText?.slice(0, 200));

    if (!rawText || !rawText.trim()) {
      return errorResponse(res, 'Parsed text is empty. Please upload a readable PDF or DOCX.', 422);
    }

    return successResponse(res, {
      message: 'File parsed successfully',
      data: {
        rawText,
        characterCount: rawText.length,
        wordCount: rawText.split(/\s+/).filter(Boolean).length,
        fileType,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/analyze ────────────────────────────────────────────────────────
const analyzeText = async (req, res, next) => {
  try {
    const { text, jobDescription } = req.body;

    if (!text || text.trim().length < 50) {
      return errorResponse(
        res,
        'Text is too short. Provide at least 50 characters of resume text.',
        400
      );
    }

    const jdCheck = validateJobDescription(jobDescription);
    if (jdCheck.error) {
      return errorResponse(res, jdCheck.error, 400);
    }

    const analysis = analyzeResume(text.trim(), {
      jobDescription: jdCheck.value,
    });
    const formattedSuggestions = formatSuggestions(analysis.suggestions);
    const scoreCategory = getScoreCategory(analysis.score);

    return successResponse(res, {
      message: 'Text analyzed successfully',
      data: {
        data: {
          score: analysis.score,
          breakdown: analysis.breakdown || analysis.scoreBreakdown || {},
          skills: analysis.skills || [],
          suggestions: formattedSuggestions,
        },
        name: analysis.name,
        email: analysis.email,
        skills: analysis.skills,
        score: analysis.score,
        breakdown: analysis.breakdown || analysis.scoreBreakdown || {},
        scoreBreakdown: {
          skillsScore: analysis.scoreBreakdown?.skills || 0,
          experienceScore: analysis.scoreBreakdown?.experience || 0,
          keywordScore: analysis.scoreBreakdown?.keywords || 0,
          formatScore: analysis.scoreBreakdown?.basic || 0,
        },
        suggestions: formattedSuggestions,
        scoreCategory,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/resume/:id ──────────────────────────────────────────────────────
const getResumeById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const resume = await Resume.findOne({ resumeId: id }).select('-__v');

    if (!resume) {
      return errorResponse(res, `Resume with ID "${id}" not found.`, 404);
    }

    const scoreCategory = getScoreCategory(resume.score);
    const formattedSuggestions = formatSuggestions(resume.suggestions);

    const o = resume.toObject();
    const normalizedBreakdown = {
      skills: o.scoreBreakdown?.skillsScore || 0,
      experience: o.scoreBreakdown?.experienceScore || 0,
      keywords: o.scoreBreakdown?.keywordScore || 0,
      basic: o.scoreBreakdown?.formatScore || 0,
    };

    return successResponse(res, {
      data: {
        data: {
          score: o.score,
          breakdown: normalizedBreakdown,
          skills: o.skills || [],
          suggestions: formattedSuggestions,
        },
        name: o.name,
        email: o.email,
        skills: o.skills,
        score: o.score,
        breakdown: normalizedBreakdown,
        scoreBreakdown: normalizedBreakdown,
        suggestions: formattedSuggestions,
        resumeId: o.resumeId,
        id: o._id,
        scoreCategory,
        phone: o.phone,
        experience: o.experience,
        jobDescriptionSnippet: o.jobDescriptionPreview,
        jdSkillKeywords: o.jdExtractedSkills,
        missingSkills: o.missingSkills,
        fileName: o.fileName,
        fileType: o.fileType,
        fileSize: o.fileSize,
        fileSizeFormatted: resume.fileSizeFormatted,
        createdAt: o.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/resumes ─────────────────────────────────────────────────────────
const getAllResumes = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const [resumes, total] = await Promise.all([
      Resume.find({ status: 'completed' })
        .select('-rawText -__v')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      Resume.countDocuments({ status: 'completed' }),
    ]);

    const formattedResumes = resumes.map((r) => ({
      ...r,
      scoreCategory: getScoreCategory(r.score),
    }));

    return successResponse(res, {
      data: formattedResumes,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/resume/:id ───────────────────────────────────────────────────
const deleteResume = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await Resume.findOneAndDelete({ resumeId: id });

    if (!deleted) {
      return errorResponse(res, `Resume with ID "${id}" not found.`, 404);
    }

    return successResponse(res, {
      message: 'Resume deleted successfully',
      deletedId: id,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/roles ───────────────────────────────────────────────────────────
const getJobRoles = (req, res) => {
  const roles = Object.entries(JOB_ROLES).map(([key, value]) => ({
    key,
    name: value.name,
    requiredSkills: value.required,
    preferredSkills: value.preferred,
  }));

  return successResponse(res, { data: roles });
};

module.exports = {
  uploadAndAnalyze,
  parseResume,
  analyzeText,
  getResumeById,
  getAllResumes,
  deleteResume,
  getJobRoles,
};
