const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const ensureUploadDirs = () => {
  const dirs = ['uploads/aadhaar', 'uploads/pan', 'uploads/photos', 'uploads/logos'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

ensureUploadDirs();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/';
    
    switch (file.fieldname) {
      case 'aadhaarCard':
        uploadPath += 'aadhaar/';
        break;
      case 'panCard':
        uploadPath += 'pan/';
        break;
      case 'photo':
        uploadPath += 'photos/';
        break;
      case 'logo':
        uploadPath += 'logos/';
        break;
      default:
        uploadPath += 'documents/';
    }
    
    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and PDF files are allowed'), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB default
  },
  fileFilter
});

// Middleware for handling multiple document uploads
const uploadDocuments = upload.fields([
  { name: 'aadhaarCard', maxCount: 1 },
  { name: 'panCard', maxCount: 1 },
  { name: 'photo', maxCount: 1 }
]);

// Middleware for single file upload
const uploadSingle = (fieldName) => upload.single(fieldName);

module.exports = {
  uploadDocuments,
  uploadSingle,
  upload
};