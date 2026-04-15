const mongoose = require('mongoose');

const ExperienceSchema = new mongoose.Schema({
  position: { type: String, trim: true },
  company: { type: String, trim: true },
  duration: { type: String, trim: true },
  description: { type: String, trim: true },
}, { _id: false });

const ResumeSchema = new mongoose.Schema(
  {
    // Unique identifier for public access
    resumeId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Extracted data
    name: {
      type: String,
      trim: true,
      default: 'Unknown',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    skills: {
      type: [String],
      default: [],
    },
    experience: {
      type: [ExperienceSchema],
      default: [],
    },
    rawText: {
      type: String,
      select: false, // Don't return in queries by default (large field)
    },

    // Analysis results
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    scoreBreakdown: {
      skillsScore: { type: Number, default: 0 },     // 40%
      experienceScore: { type: Number, default: 0 }, // 30%
      keywordScore: { type: Number, default: 0 },    // 20%
      formatScore: { type: Number, default: 0 },     // 10%
    },
    missingSkills: {
      type: [String],
      default: [],
    },
    suggestions: {
      type: [String],
      default: [],
    },
    targetRole: {
      type: String,
      trim: true,
      default: null,
    },
    jobDescriptionPreview: {
      type: String,
      default: null,
      maxlength: 8000,
    },
    jdExtractedSkills: {
      type: [String],
      default: [],
    },
    analysisMode: {
      type: String,
      enum: ['job_description', 'blended', 'role_template'],
      default: 'role_template',
    },

    // File metadata
    fileName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      enum: ['pdf', 'docx'],
      required: true,
    },
    fileSize: {
      type: Number, // bytes
      required: true,
    },

    // Status tracking
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    errorMessage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: human-readable file size
ResumeSchema.virtual('fileSizeFormatted').get(function () {
  const bytes = this.fileSize;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
});

// Index for dashboard queries
ResumeSchema.index({ createdAt: -1 });
ResumeSchema.index({ score: -1 });

const Resume = mongoose.model('Resume', ResumeSchema);

module.exports = Resume;
