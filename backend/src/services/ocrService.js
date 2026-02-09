const vision = require('@google-cloud/vision');
const fs = require('fs');
const path = require('path');
const OCRJob = require('../models/OCRJob');

class OCRService {
  constructor() {
    this.client = new vision.ImageAnnotatorClient();
  }

  async processDocument(filePath, documentType, userId) {
    const jobId = this.generateJobId();
    
    // Create OCR job record
    const ocrJob = new OCRJob({
      jobId,
      documentType,
      filePath,
      createdBy: userId
    });
    
    await ocrJob.save();
    
    // Process document asynchronously
    this.processDocumentAsync(ocrJob);
    
    return { jobId, status: 'Processing' };
  }

  async processDocumentAsync(ocrJob) {
    try {
      let extractedData;
      
      if (ocrJob.documentType === 'aadhaar') {
        extractedData = await this.processAadhaar(ocrJob.filePath);
      } else if (ocrJob.documentType === 'pan') {
        extractedData = await this.processPAN(ocrJob.filePath);
      } else {
        throw new Error('Unsupported document type');
      }
      
      // Update job with results
      ocrJob.status = 'Completed';
      ocrJob.extractedData = extractedData;
      ocrJob.completedAt = new Date();
      
      await ocrJob.save();
      
    } catch (error) {
      console.error('OCR processing error:', error);
      
      // Update job with error
      ocrJob.status = 'Failed';
      ocrJob.error = error.message;
      ocrJob.completedAt = new Date();
      
      await ocrJob.save();
    }
  }

  async processAadhaar(imagePath) {
    const [result] = await this.client.textDetection(imagePath);
    const detections = result.textAnnotations;
    
    if (!detections || detections.length === 0) {
      throw new Error('No text detected in the image');
    }
    
    const fullText = detections[0].description;
    
    return {
      name: this.extractAadhaarName(fullText),
      dateOfBirth: this.extractAadhaarDOB(fullText),
      gender: this.extractAadhaarGender(fullText),
      aadhaarNumber: this.extractAadhaarNumber(fullText),
      rawText: fullText
    };
  }

  async processPAN(imagePath) {
    const [result] = await this.client.textDetection(imagePath);
    const detections = result.textAnnotations;
    
    if (!detections || detections.length === 0) {
      throw new Error('No text detected in the image');
    }
    
    const fullText = detections[0].description;
    
    return {
      name: this.extractPANName(fullText),
      panNumber: this.extractPANNumber(fullText),
      fatherName: this.extractPANFatherName(fullText),
      rawText: fullText
    };
  }

  extractAadhaarName(text) {
    // Look for name patterns in Aadhaar card
    const lines = text.split('\n');
    
    // Name is usually after "Government of India" and before DOB
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip government headers and numbers
      if (line.includes('Government') || line.includes('India') || 
          line.includes('Aadhaar') || /^\d+$/.test(line) || line.length < 3) {
        continue;
      }
      
      // Look for name pattern (alphabetic characters)
      if (/^[A-Za-z\s]+$/.test(line) && line.length > 3) {
        return line.trim();
      }
    }
    
    return null;
  }

  extractAadhaarDOB(text) {
    // Look for date patterns (DD/MM/YYYY, DD-MM-YYYY, etc.)
    const datePatterns = [
      /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/,
      /\b(\d{1,2})\s+(\d{1,2})\s+(\d{4})\b/
    ];
    
    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        const [, day, month, year] = match;
        return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
      }
    }
    
    return null;
  }

  extractAadhaarGender(text) {
    const genderPatterns = [
      /\b(Male|Female|MALE|FEMALE)\b/i
    ];
    
    for (const pattern of genderPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
      }
    }
    
    return null;
  }

  extractAadhaarNumber(text) {
    // Aadhaar number is 12 digits, often with spaces
    const aadhaarPattern = /\b(\d{4})\s*(\d{4})\s*(\d{4})\b/;
    const match = text.match(aadhaarPattern);
    
    if (match) {
      return `${match[1]}${match[2]}${match[3]}`;
    }
    
    return null;
  }

  extractPANName(text) {
    const lines = text.split('\n');
    
    // Name is usually prominently displayed
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip headers and PAN number lines
      if (trimmed.includes('INCOME TAX') || trimmed.includes('DEPARTMENT') ||
          trimmed.includes('PERMANENT') || trimmed.includes('ACCOUNT') ||
          /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(trimmed) || trimmed.length < 3) {
        continue;
      }
      
      // Look for name pattern
      if (/^[A-Za-z\s]+$/.test(trimmed) && trimmed.length > 3) {
        return trimmed;
      }
    }
    
    return null;
  }

  extractPANNumber(text) {
    // PAN format: AAAAA9999A
    const panPattern = /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/;
    const match = text.match(panPattern);
    
    return match ? match[0] : null;
  }

  extractPANFatherName(text) {
    // Look for father's name patterns
    const fatherPatterns = [
      /Father['\s]*s?\s*Name[:\s]*([A-Za-z\s]+)/i,
      /Father[:\s]*([A-Za-z\s]+)/i
    ];
    
    for (const pattern of fatherPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return null;
  }

  async getJobStatus(jobId, userId) {
    const job = await OCRJob.findOne({ jobId, createdBy: userId });
    
    if (!job) {
      throw new Error('Job not found');
    }
    
    return {
      jobId: job.jobId,
      status: job.status,
      extractedData: job.extractedData,
      error: job.error,
      createdAt: job.createdAt,
      completedAt: job.completedAt
    };
  }

  generateJobId() {
    return `ocr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Retry logic for API failures
  async retryOperation(operation, maxRetries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        
        console.log(`OCR attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }
}

module.exports = new OCRService();