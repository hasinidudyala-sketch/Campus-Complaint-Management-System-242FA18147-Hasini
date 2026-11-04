/**
 * Multer File Upload Middleware
 * Supports complaint attachments and user profile images
 * Strictly filters file formats (JPG, JPEG, PNG, PDF) and file size (max 5MB)
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const complaintUploadDir = path.join(__dirname, '../public/uploads/complaints');
const profileUploadDir = path.join(__dirname, '../public/uploads/profiles');

if (!fs.existsSync(complaintUploadDir)) {
  fs.mkdirSync(complaintUploadDir, { recursive: true });
}
if (!fs.existsSync(profileUploadDir)) {
  fs.mkdirSync(profileUploadDir, { recursive: true });
}

// Storage engine for Complaint Attachments
const complaintStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, complaintUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `attachment-${cleanBase}-${uniqueSuffix}${ext}`);
  }
});

// Storage engine for Profile Pictures
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profileUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `profile-${req.session.userId || 'user'}-${uniqueSuffix}${ext}`);
  }
});

// File filter for allowed extensions
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();

  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/pjpeg',
    'application/pdf'
  ];

  if (allowedExtensions.includes(ext) && allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Only JPG, JPEG, PNG, and PDF files are allowed.'), false);
  }
};

// Profile image file filter (images only)
const imageOnlyFilter = (req, file, cb) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();

  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/pjpeg'];

  if (allowedExtensions.includes(ext) && allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, JPEG, and PNG images are allowed for profile picture.'), false);
  }
};

const uploadComplaintFiles = multer({
  storage: complaintStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max per file
  fileFilter: fileFilter
}).array('attachments', 5); // Up to 5 files per complaint

const uploadProfileImage = multer({
  storage: profileStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB max
  fileFilter: imageOnlyFilter
}).single('profileImage');

module.exports = {
  uploadComplaintFiles,
  uploadProfileImage
};

