const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Parse a resume file (PDF or DOCX) and extract raw text
 * @param {string} filePath - Absolute path to the uploaded file
 * @param {string} fileType - 'pdf' | 'docx'
 * @returns {Promise<string>} Extracted plain text
 */
const parseFile = async (filePath, fileType) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found at path: ${filePath}`);
  }

  const fileBuffer = fs.readFileSync(filePath);

  try {
    if (fileType === 'pdf') {
      return await parsePDF(fileBuffer);
    } else if (fileType === 'docx') {
      return await parseDOCX(fileBuffer);
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
  } finally {
    // Clean up temp file after parsing
    cleanupFile(filePath);
  }
};

/**
 * Parse PDF buffer using pdf-parse
 */
const parsePDF = async (buffer) => {
  try {
    const data = await pdfParse(buffer, {
      // Custom page render — plain text only
      pagerender: (pageData) => {
        return pageData.getTextContent().then((textContent) => {
          return textContent.items
            .map((item) => item.str)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
        });
      },
    });

    const text = data.text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\f/g, '\n') // Form feeds (page breaks)
      .replace(/\t/g, ' ')
      .replace(/[ ]{2,}/g, ' ') // Multiple spaces
      .replace(/\n{3,}/g, '\n\n') // Multiple blank lines
      .trim();

    if (!text || text.length < 50) {
      throw new Error(
        'PDF appears to be empty or contains only images (not parseable). Please upload a text-based PDF.'
      );
    }

    return text;
  } catch (err) {
    if (err.message.includes('not parseable')) throw err;
    throw new Error(`Failed to parse PDF: ${err.message}`);
  }
};

/**
 * Parse DOCX buffer using mammoth
 */
const parseDOCX = async (buffer) => {
  try {
    const result = await mammoth.extractRawText({ buffer });

    if (result.messages.length > 0) {
      const warnings = result.messages
        .filter((m) => m.type === 'warning')
        .map((m) => m.message);
      if (warnings.length > 0) {
        console.warn('[DOCX Parser Warnings]:', warnings);
      }
    }

    const text = result.value
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\t/g, ' ')
      .replace(/[ ]{2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (!text || text.length < 50) {
      throw new Error(
        'DOCX appears to be empty or unreadable. Please check the file and try again.'
      );
    }

    return text;
  } catch (err) {
    if (err.message.includes('unreadable')) throw err;
    throw new Error(`Failed to parse DOCX: ${err.message}`);
  }
};

/**
 * Safely delete temp file
 */
const cleanupFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.warn(`[Cleanup Warning] Could not delete temp file: ${filePath}`);
  }
};

/**
 * Get file type from extension
 */
const getFileType = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.pdf') return 'pdf';
  if (ext === '.docx') return 'docx';
  throw new Error(`Unsupported file extension: ${ext}`);
};

module.exports = { parseFile, getFileType };
