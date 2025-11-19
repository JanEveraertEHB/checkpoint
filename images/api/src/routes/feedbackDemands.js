const express = require('express');
const router = express.Router();
const container = require('../container');
const { decodeToken } = require('../helpers/authHelpers');
const { asyncHandler, HTTP_STATUS } = require('../middleware/errorHandler');
const {
  validateRequiredFields,
  validateUUID,
  sanitizeText
} = require('../middleware/validation');

/**
 * @route GET /feedback-demands/student
 * @description Get all feedback demands for a student
 * @access Protected
 * @headers {string} Authorization - Bearer token
 * @returns {Array<Object>} Array of feedback demand objects
 * @throws {AuthenticationError} 401 - Invalid or missing token
 */
router.get(
  '/student',
  decodeToken,
  asyncHandler(async (req, res) => {
    const feedbackService = container.get('feedbackService');
    const userUuid = req.user.uuid;

    const demands = await feedbackService.getStudentDemands(userUuid);

    res.status(HTTP_STATUS.OK).json(demands);
  })
);

/**
 * @route GET /feedback-demands/count
 * @description Get unfulfilled feedback demand count for student
 * @access Protected
 * @headers {string} Authorization - Bearer token
 * @returns {Object} Object with count property
 * @throws {AuthenticationError} 401 - Invalid or missing token
 */
router.get(
  '/count',
  decodeToken,
  asyncHandler(async (req, res) => {
    const feedbackService = container.get('feedbackService');
    const userUuid = req.user.uuid;

    const count = await feedbackService.getUnfulfilledDemandCount(userUuid);

    res.status(HTTP_STATUS.OK).json({ count });
  })
);

/**
 * @route GET /feedback-demands/classroom/:classroom_uuid
 * @description Get all feedback demands for a classroom (teacher only)
 * @access Protected (Teacher only)
 * @headers {string} Authorization - Bearer token
 * @param {string} classroom_uuid - Classroom UUID
 * @returns {Array<Object>} Array of feedback demand objects
 * @throws {AuthenticationError} 401 - Invalid or missing token
 * @throws {ValidationError} 400 - Invalid UUID format
 * @throws {AuthorizationError} 403 - Only teachers can view feedback demands
 */
router.get(
  '/classroom/:classroom_uuid',
  decodeToken,
  validateUUID('classroom_uuid'),
  asyncHandler(async (req, res) => {
    const feedbackService = container.get('feedbackService');
    const classroomUuid = req.params.classroom_uuid;
    const userUuid = req.user.uuid;

    const demands = await feedbackService.getClassroomDemands(classroomUuid, userUuid);

    res.status(HTTP_STATUS.OK).json(demands);
  })
);

/**
 * @route POST /feedback-demands
 * @description Create a feedback demand (teacher only)
 * @access Protected (Teacher only)
 * @headers {string} Authorization - Bearer token
 * @body {string} classroom_uuid - Classroom UUID
 * @body {string} student_uuid - Student UUID
 * @body {string} [message] - Optional demand message
 * @returns {Object} Created feedback demand object
 * @throws {AuthenticationError} 401 - Invalid or missing token
 * @throws {ValidationError} 400 - Missing or invalid fields
 * @throws {AuthorizationError} 403 - Only teachers can demand feedback
 */
router.post(
  '/',
  decodeToken,
  validateRequiredFields(['classroom_uuid', 'student_uuid']),
  sanitizeText(['message'], 500),
  asyncHandler(async (req, res) => {
    const feedbackService = container.get('feedbackService');
    const { classroom_uuid, student_uuid, message } = req.body;
    const userUuid = req.user.uuid;

    const demand = await feedbackService.createFeedbackDemand(
      {
        classroom_uuid,
        student_uuid,
        message: message || null
      },
      userUuid
    );

    res.status(HTTP_STATUS.CREATED).json({
      ...demand,
      message: 'Feedback demand created'
    });
  })
);

/**
 * @route POST /feedback-demands/classroom-wide
 * @description Create feedback demands for all students in classroom (teacher only)
 * @access Protected (Teacher only)
 * @headers {string} Authorization - Bearer token
 * @body {string} classroom_uuid - Classroom UUID
 * @body {string} [message] - Optional demand message
 * @returns {Object} Success message with count
 * @throws {AuthenticationError} 401 - Invalid or missing token
 * @throws {ValidationError} 400 - Missing or invalid fields
 * @throws {AuthorizationError} 403 - Only teachers can demand feedback
 */
router.post(
  '/classroom-wide',
  decodeToken,
  validateRequiredFields(['classroom_uuid']),
  sanitizeText(['message'], 500),
  asyncHandler(async (req, res) => {
    const feedbackService = container.get('feedbackService');
    const { classroom_uuid, message } = req.body;
    const userUuid = req.user.uuid;

    const demands = await feedbackService.createClassroomWideDemands(
      classroom_uuid,
      message || null,
      userUuid
    );

    res.status(HTTP_STATUS.CREATED).json({
      message: `Feedback demands created for ${demands.length} students`,
      count: demands.length
    });
  })
);

/**
 * @route PUT /feedback-demands/:uuid/fulfill
 * @description Mark feedback demand as fulfilled (student only)
 * @access Protected (Student only)
 * @headers {string} Authorization - Bearer token
 * @param {string} uuid - Demand UUID
 * @returns {Object} Updated feedback demand object
 * @throws {AuthenticationError} 401 - Invalid or missing token
 * @throws {ValidationError} 400 - Invalid UUID format
 * @throws {AuthorizationError} 403 - Only the student can fulfill this demand
 * @throws {NotFoundError} 404 - Feedback demand not found
 */
router.put(
  '/:uuid/fulfill',
  decodeToken,
  validateUUID('uuid'),
  asyncHandler(async (req, res) => {
    const feedbackService = container.get('feedbackService');
    const demandUuid = req.params.uuid;
    const userUuid = req.user.uuid;

    const updated = await feedbackService.fulfillFeedbackDemand(demandUuid, userUuid);

    res.status(HTTP_STATUS.OK).json({
      ...updated,
      message: 'Feedback demand fulfilled'
    });
  })
);

/**
 * @route DELETE /feedback-demands/:uuid
 * @description Delete a feedback demand
 * @access Protected
 * @headers {string} Authorization - Bearer token
 * @param {string} uuid - Demand UUID
 * @returns {Object} Success message
 * @throws {AuthenticationError} 401 - Invalid or missing token
 * @throws {ValidationError} 400 - Invalid UUID format
 * @throws {AuthorizationError} 403 - Not authorized to delete this demand
 * @throws {NotFoundError} 404 - Feedback demand not found
 */
router.delete(
  '/:uuid',
  decodeToken,
  validateUUID('uuid'),
  asyncHandler(async (req, res) => {
    const feedbackService = container.get('feedbackService');
    const demandUuid = req.params.uuid;
    const userUuid = req.user.uuid;

    await feedbackService.deleteFeedbackDemand(demandUuid, userUuid);

    res.status(HTTP_STATUS.OK).json({
      message: 'Feedback demand deleted'
    });
  })
);

module.exports = router;
