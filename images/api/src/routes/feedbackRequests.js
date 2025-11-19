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
 * @route GET /feedback-requests/classroom/:classroom_uuid
 * @description Get all feedback requests for a classroom (teacher only)
 * @access Protected (Teacher only)
 * @headers {string} Authorization - Bearer token
 * @param {string} classroom_uuid - Classroom UUID
 * @returns {Array<Object>} Array of feedback request objects
 * @throws {AuthenticationError} 401 - Invalid or missing token
 * @throws {ValidationError} 400 - Invalid UUID format
 * @throws {AuthorizationError} 403 - Only teachers can view feedback requests
 */
router.get(
  '/classroom/:classroom_uuid',
  decodeToken,
  validateUUID('classroom_uuid'),
  asyncHandler(async (req, res) => {
    const feedbackService = container.get('feedbackService');
    const classroomUuid = req.params.classroom_uuid;
    const userUuid = req.user.uuid;

    const requests = await feedbackService.getClassroomRequests(classroomUuid, userUuid);

    res.status(HTTP_STATUS.OK).json(requests);
  })
);

/**
 * @route GET /feedback-requests/count
 * @description Get unresolved feedback request count for teacher
 * @access Protected (Teacher only)
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

    const count = await feedbackService.getUnresolvedRequestCount(userUuid);

    res.status(HTTP_STATUS.OK).json({ count });
  })
);

/**
 * @route POST /feedback-requests
 * @description Create a feedback request (student only)
 * @access Protected (Student only)
 * @headers {string} Authorization - Bearer token
 * @body {string} classroom_uuid - Classroom UUID
 * @body {string} [message] - Optional request message
 * @returns {Object} Created feedback request object
 * @throws {AuthenticationError} 401 - Invalid or missing token
 * @throws {ValidationError} 400 - Missing or invalid fields
 * @throws {AuthorizationError} 403 - Only active students can request feedback
 */
router.post(
  '/',
  decodeToken,
  validateRequiredFields(['classroom_uuid']),
  sanitizeText(['message'], 500),
  asyncHandler(async (req, res) => {
    const feedbackService = container.get('feedbackService');
    const { classroom_uuid, message } = req.body;
    const userUuid = req.user.uuid;

    const request = await feedbackService.createFeedbackRequest(
      {
        classroom_uuid,
        message: message || null
      },
      userUuid
    );

    res.status(HTTP_STATUS.CREATED).json({
      ...request,
      message: 'Feedback request created'
    });
  })
);

/**
 * @route PUT /feedback-requests/:uuid/resolve
 * @description Mark feedback request as resolved (teacher only)
 * @access Protected (Teacher only)
 * @headers {string} Authorization - Bearer token
 * @param {string} uuid - Request UUID
 * @returns {Object} Updated feedback request object
 * @throws {AuthenticationError} 401 - Invalid or missing token
 * @throws {ValidationError} 400 - Invalid UUID format
 * @throws {AuthorizationError} 403 - Only teachers can resolve feedback requests
 * @throws {NotFoundError} 404 - Feedback request not found
 */
router.put(
  '/:uuid/resolve',
  decodeToken,
  validateUUID('uuid'),
  asyncHandler(async (req, res) => {
    const feedbackService = container.get('feedbackService');
    const requestUuid = req.params.uuid;
    const userUuid = req.user.uuid;

    const updated = await feedbackService.resolveFeedbackRequest(requestUuid, userUuid);

    res.status(HTTP_STATUS.OK).json({
      ...updated,
      message: 'Feedback request resolved'
    });
  })
);

/**
 * @route DELETE /feedback-requests/:uuid
 * @description Delete a feedback request
 * @access Protected
 * @headers {string} Authorization - Bearer token
 * @param {string} uuid - Request UUID
 * @returns {Object} Success message
 * @throws {AuthenticationError} 401 - Invalid or missing token
 * @throws {ValidationError} 400 - Invalid UUID format
 * @throws {AuthorizationError} 403 - Not authorized to delete this request
 * @throws {NotFoundError} 404 - Feedback request not found
 */
router.delete(
  '/:uuid',
  decodeToken,
  validateUUID('uuid'),
  asyncHandler(async (req, res) => {
    const feedbackService = container.get('feedbackService');
    const requestUuid = req.params.uuid;
    const userUuid = req.user.uuid;

    await feedbackService.deleteFeedbackRequest(requestUuid, userUuid);

    res.status(HTTP_STATUS.OK).json({
      message: 'Feedback request deleted'
    });
  })
);

module.exports = router;
