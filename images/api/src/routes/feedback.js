const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const container = require('../container');
const { decodeToken } = require('../helpers/authHelpers');
const { asyncHandler, HTTP_STATUS } = require('../middleware/errorHandler');
const {
  validateRequiredFields,
  validateUUID,
  sanitizeText
} = require('../middleware/validation');
const { v4: uuidv4 } = require('uuid');

// Configure multer for image uploads
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'text/plain', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files and PDF documents are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

/**
 * @route GET /feedback/classroom/:classroom_uuid/student/:student_uuid
 * @description Get feedback for a student in a classroom
 * @access Protected
 * @headers {string} Authorization - Bearer token
 * @param {string} classroom_uuid - Classroom UUID
 * @param {string} student_uuid - Student UUID
 * @returns {Array<Object>} Array of feedback objects with images and documents
 * @throws {AuthenticationError} 401 - Invalid or missing token
 * @throws {ValidationError} 400 - Invalid UUID format
 * @throws {AuthorizationError} 403 - Not authorized to view this feedback
 */
router.get(
  '/classroom/:classroom_uuid/student/:student_uuid',
  decodeToken,
  validateUUID('classroom_uuid'),
  validateUUID('student_uuid'),
  asyncHandler(async (req, res) => {
    const feedbackService = container.get('feedbackService');
    const classroomUuid = req.params.classroom_uuid;
    const studentUuid = req.params.student_uuid;
    const userUuid = req.user.uuid;

    const feedback = await feedbackService.getStudentFeedback(classroomUuid, studentUuid, userUuid);

    res.status(HTTP_STATUS.OK).json(feedback);
  })
);

/**
 * @route GET /feedback/classroom/:classroom_uuid/my-feedback
 * @description Get all feedback for current user (student) in a classroom
 * @access Protected
 * @headers {string} Authorization - Bearer token
 * @param {string} classroom_uuid - Classroom UUID
 * @returns {Array<Object>} Array of feedback objects with images and documents
 * @throws {AuthenticationError} 401 - Invalid or missing token
 * @throws {ValidationError} 400 - Invalid UUID format
 * @throws {AuthorizationError} 403 - Not a member of this classroom
 */
router.get(
  '/classroom/:classroom_uuid/my-feedback',
  decodeToken,
  validateUUID('classroom_uuid'),
  asyncHandler(async (req, res) => {
    const feedbackService = container.get('feedbackService');
    const classroomUuid = req.params.classroom_uuid;
    const userUuid = req.user.uuid;

    const feedback = await feedbackService.getStudentFeedback(classroomUuid, userUuid, userUuid);

    res.status(HTTP_STATUS.OK).json(feedback);
  })
);

/**
 * @route POST /feedback
 * @description Create feedback (teachers can give feedback to students, students can add their own)
 * @access Protected
 * @headers {string} Authorization - Bearer token
 * @body {string} classroom_uuid - Classroom UUID
 * @body {string} student_uuid - Student UUID
 * @body {string} content - Feedback content
 * @returns {Object} Created feedback object
 * @throws {AuthenticationError} 401 - Invalid or missing token
 * @throws {ValidationError} 400 - Missing or invalid fields
 * @throws {AuthorizationError} 403 - Not authorized to create feedback
 */
router.post(
  '/',
  decodeToken,
  validateRequiredFields(['classroom_uuid', 'student_uuid', 'content']),
  sanitizeText(['content'], 5000),
  asyncHandler(async (req, res) => {
    const feedbackService = container.get('feedbackService');
    const { classroom_uuid, student_uuid, content } = req.body;
    const userUuid = req.user.uuid;

    const feedback = await feedbackService.createFeedback(
      {
        classroom_uuid,
        student_uuid,
        content
      },
      userUuid
    );

    res.status(HTTP_STATUS.CREATED).json({
      ...feedback,
      message: 'success'
    });
  })
);

/**
 * @route PUT /feedback/:uuid
 * @description Update feedback content
 * @access Protected
 * @headers {string} Authorization - Bearer token
 * @param {string} uuid - Feedback UUID
 * @body {string} content - Updated feedback content
 * @returns {Object} Updated feedback object
 * @throws {AuthenticationError} 401 - Invalid or missing token
 * @throws {ValidationError} 400 - Invalid UUID format or missing content
 * @throws {AuthorizationError} 403 - Not authorized to edit this feedback
 * @throws {NotFoundError} 404 - Feedback not found
 */
router.put(
  '/:uuid',
  decodeToken,
  validateUUID('uuid'),
  validateRequiredFields(['content']),
  sanitizeText(['content'], 5000),
  asyncHandler(async (req, res) => {
    const feedbackService = container.get('feedbackService');
    const feedbackUuid = req.params.uuid;
    const { content } = req.body;
    const userUuid = req.user.uuid;

    const updatedFeedback = await feedbackService.updateFeedback(feedbackUuid, content, userUuid);

    res.status(HTTP_STATUS.OK).json({
      ...updatedFeedback,
      message: 'success'
    });
  })
);

/**
 * @route PUT /feedback/:uuid/lock
 * @description Lock/unlock feedback (teacher only)
 * @access Protected (Teacher only)
 * @headers {string} Authorization - Bearer token
 * @param {string} uuid - Feedback UUID
 * @body {boolean} locked - Lock status
 * @returns {Object} Success message with lock status
 * @throws {AuthenticationError} 401 - Invalid or missing token
 * @throws {ValidationError} 400 - Invalid UUID format or missing locked field
 * @throws {AuthorizationError} 403 - Only teachers can lock/unlock feedback
 * @throws {NotFoundError} 404 - Feedback not found
 */
router.put(
  '/:uuid/lock',
  decodeToken,
  validateUUID('uuid'),
  validateRequiredFields(['locked']),
  asyncHandler(async (req, res) => {
    const feedbackService = container.get('feedbackService');
    const feedbackUuid = req.params.uuid;
    const { locked } = req.body;
    const userUuid = req.user.uuid;

    await feedbackService.lockFeedback(feedbackUuid, locked, userUuid);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'success',
      locked
    });
  })
);

/**
 * @route POST /feedback/:uuid/images
 * @description Upload images for feedback
 * @access Protected
 * @headers {string} Authorization - Bearer token
 * @param {string} uuid - Feedback UUID
 * @returns {Object} Object with images array
 * @throws {AuthenticationError} 401 - Invalid or missing token
 * @throws {ValidationError} 400 - Invalid UUID format or no images uploaded
 * @throws {AuthorizationError} 403 - Not authorized to add images
 * @throws {NotFoundError} 404 - Feedback not found
 */
router.post(
  '/:uuid/images',
  decodeToken,
  validateUUID('uuid'),
  upload.array('images', 10),
  asyncHandler(async (req, res) => {
    const feedbackService = container.get('feedbackService');
    const feedbackUuid = req.params.uuid;
    const userUuid = req.user.uuid;

    if (!req.files || req.files.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'No images uploaded'
      });
    }

    const images = await feedbackService.addImages(feedbackUuid, req.files, userUuid);

    res.status(HTTP_STATUS.CREATED).json({
      images,
      message: 'success'
    });
  })
);

/**
 * @route DELETE /feedback/images/:image_uuid
 * @description Delete an image from feedback
 * @access Protected
 * @headers {string} Authorization - Bearer token
 * @param {string} image_uuid - Image UUID
 * @returns {Object} Success message
 * @throws {AuthenticationError} 401 - Invalid or missing token
 * @throws {ValidationError} 400 - Invalid UUID format
 * @throws {AuthorizationError} 403 - Not authorized to delete this image
 * @throws {NotFoundError} 404 - Image not found
 */
router.delete(
  '/images/:image_uuid',
  decodeToken,
  validateUUID('image_uuid'),
  asyncHandler(async (req, res) => {
    const feedbackService = container.get('feedbackService');
    const imageUuid = req.params.image_uuid;
    const userUuid = req.user.uuid;

    await feedbackService.deleteImage(imageUuid, userUuid);

    res.status(HTTP_STATUS.OK).json({ message: 'success' });
  })
);

/**
 * @route POST /feedback/:uuid/documents
 * @description Upload documents for feedback
 * @access Protected
 * @headers {string} Authorization - Bearer token
 * @param {string} uuid - Feedback UUID
 * @returns {Object} Object with documents array
 * @throws {AuthenticationError} 401 - Invalid or missing token
 * @throws {ValidationError} 400 - Invalid UUID format or no documents uploaded
 * @throws {AuthorizationError} 403 - Not authorized to add documents
 * @throws {NotFoundError} 404 - Feedback not found
 */
router.post(
  '/:uuid/documents',
  decodeToken,
  validateUUID('uuid'),
  upload.array('documents', 10),
  asyncHandler(async (req, res) => {
    const feedbackService = container.get('feedbackService');
    const feedbackUuid = req.params.uuid;
    const userUuid = req.user.uuid;

    if (!req.files || req.files.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'No documents uploaded'
      });
    }

    const documents = await feedbackService.addDocuments(feedbackUuid, req.files, userUuid);

    res.status(HTTP_STATUS.CREATED).json({
      documents,
      message: 'success'
    });
  })
);

/**
 * @route DELETE /feedback/documents/:document_uuid
 * @description Delete a document from feedback
 * @access Protected
 * @headers {string} Authorization - Bearer token
 * @param {string} document_uuid - Document UUID
 * @returns {Object} Success message
 * @throws {AuthenticationError} 401 - Invalid or missing token
 * @throws {ValidationError} 400 - Invalid UUID format
 * @throws {AuthorizationError} 403 - Not authorized to delete this document
 * @throws {NotFoundError} 404 - Document not found
 */
router.delete(
  '/documents/:document_uuid',
  decodeToken,
  validateUUID('document_uuid'),
  asyncHandler(async (req, res) => {
    const feedbackService = container.get('feedbackService');
    const documentUuid = req.params.document_uuid;
    const userUuid = req.user.uuid;

    await feedbackService.deleteDocument(documentUuid, userUuid);

    res.status(HTTP_STATUS.OK).json({ message: 'success' });
  })
);

module.exports = router;
