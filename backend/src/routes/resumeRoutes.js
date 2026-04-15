const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
  uploadAndAnalyze,
  parseResume,
  analyzeText,
  getResumeById,
  getAllResumes,
  deleteResume,
  getJobRoles,
} = require('../controllers/resumeController');

// ─── File Upload Routes ───────────────────────────────────────────────────────

// POST /api/upload — Full pipeline: upload + parse + analyze + store
router.post(
  '/upload',
  upload.single('resume'), // 'resume' = form field name
  uploadAndAnalyze
);

// POST /api/parse — Parse file, return raw text only
router.post(
  '/parse',
  upload.single('resume'),
  parseResume
);

// ─── Analysis Routes ──────────────────────────────────────────────────────────

// POST /api/analyze — Analyze raw text (no file upload)
router.post('/analyze', analyzeText);

// ─── Resume CRUD Routes ───────────────────────────────────────────────────────

// GET /api/resumes — List all resumes (dashboard)
router.get('/resumes', getAllResumes);

// GET /api/resume/:id — Get single resume by resumeId
router.get('/resume/:id', getResumeById);

// DELETE /api/resume/:id — Delete resume
router.delete('/resume/:id', deleteResume);

// ─── Utility Routes ───────────────────────────────────────────────────────────

// GET /api/roles — List available job roles
router.get('/roles', getJobRoles);

module.exports = router;
