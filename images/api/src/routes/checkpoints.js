const express = require('express');
const router = express.Router();
const container = require('../container');
const { decodeToken } = require('../helpers/authHelpers');
const { asyncHandler, HTTP_STATUS } = require('../middleware/errorHandler');
const {
  validateRequiredFields,
  validateUUID
} = require('../middleware/validation');

/**
 * @route GET /checkpoints/classroom/:classroom_uuid
 * @description Get all checkpoints for a classroom
 * @access Protected
 * @headers {string} Authorization - Bearer token
 * @param {string} classroom_uuid - Classroom UUID
 * @returns {Array<Object>} Array of checkpoint objects
 * @throws {AuthenticationError} 401 - Invalid or missing token
 * @throws {ValidationError} 400 - Invalid UUID format
 * @throws {AuthorizationError} 403 - Not a member of this classroom
 */
router.get(
  '/classroom/:classroom_uuid',
  decodeToken,
  validateUUID('classroom_uuid'),
  asyncHandler(async (req, res) => {
    const checkpointService = container.get('checkpointService');
    const classroomUuid = req.params.classroom_uuid;
    const userUuid = req.user.uuid;

    const checkpoints = await checkpointService.getClassroomCheckpoints(classroomUuid, userUuid);

    res.status(HTTP_STATUS.OK).json(checkpoints);
  })
);

/**
 * @route GET /checkpoints/classroom/:classroom_uuid/has-progress
 * @description Check if any checkpoint in a classroom has been reached by any student
 * @access Protected (Teacher only)
 * @headers {string} Authorization - Bearer token
 * @param {string} classroom_uuid - Classroom UUID
 * @returns {Object} Object with has_progress boolean
 * @throws {AuthenticationError} 401 - Invalid or missing token
 * @throws {ValidationError} 400 - Invalid UUID format
 * @throws {AuthorizationError} 403 - Only teachers can check progress
 */
router.get(
  '/classroom/:classroom_uuid/has-progress',
  decodeToken,
  validateUUID('classroom_uuid'),
  asyncHandler(async (req, res) => {
    const checkpointService = container.get('checkpointService');
    const classroomUuid = req.params.classroom_uuid;
    const userUuid = req.user.uuid;

    const hasProgress = await checkpointService.hasAnyProgress(classroomUuid, userUuid);

    res.status(HTTP_STATUS.OK).json({ has_progress: hasProgress });
  })
);

/**
 * @route POST /checkpoints
 * @description Create a new checkpoint (teacher only)
 * @access Protected (Teacher only)
 * @headers {string} Authorization - Bearer token
 * @body {string} classroom_uuid - Classroom UUID
 * @body {string} name - Checkpoint name
 * @body {string} [description] - Optional checkpoint description
 * @returns {Object} Created checkpoint object
 * @throws {AuthenticationError} 401 - Invalid or missing token
 * @throws {ValidationError} 400 - Missing or invalid fields
 * @throws {AuthorizationError} 403 - Only teachers can create checkpoints
 */
router.post(
  '/',
  decodeToken,
  validateRequiredFields(['classroom_uuid', 'name']),
  asyncHandler(async (req, res) => {
    const checkpointService = container.get('checkpointService');
    const { classroom_uuid, name, description } = req.body;
    const userUuid = req.user.uuid;

    const checkpoint = await checkpointService.createCheckpoint(
      {
        classroom_uuid,
        name,
        description: description || ''
      },
      userUuid
    );

    res.status(HTTP_STATUS.CREATED).json({
      ...checkpoint,
      message: 'success'
    });
  })
);

/**
 * @route PUT /checkpoints/:uuid
 * @description Update a checkpoint (teacher only)
 * @access Protected (Teacher only)
 * @headers {string} Authorization - Bearer token
 * @param {string} uuid - Checkpoint UUID
 * @body {string} [name] - Updated checkpoint name
 * @body {string} [description] - Updated checkpoint description
 * @returns {Object} Updated checkpoint object
 * @throws {AuthenticationError} 401 - Invalid or missing token
 * @throws {ValidationError} 400 - Invalid UUID format or no fields to update
 * @throws {AuthorizationError} 403 - Only teachers can update checkpoints
 * @throws {NotFoundError} 404 - Checkpoint not found
 */
router.put(
  '/:uuid',
  decodeToken,
  validateUUID('uuid'),
  asyncHandler(async (req, res) => {
    const checkpointService = container.get('checkpointService');
    const checkpointUuid = req.params.uuid;
    const { name, description } = req.body;
    const userUuid = req.user.uuid;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    if (Object.keys(updateData).length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'No fields to update'
      });
    }

    const updatedCheckpoint = await checkpointService.updateCheckpoint(
      checkpointUuid,
      updateData,
      userUuid
    );

    res.status(HTTP_STATUS.OK).json({
      ...updatedCheckpoint,
      message: 'success'
    });
  })
);

/**
 * @route DELETE /checkpoints/:uuid
 * @description Delete a checkpoint (teacher only)
 * @access Protected (Teacher only)
 * @headers {string} Authorization - Bearer token
 * @param {string} uuid - Checkpoint UUID
 * @returns {Object} Success message
 * @throws {AuthenticationError} 401 - Invalid or missing token
 * @throws {ValidationError} 400 - Invalid UUID format or checkpoint has progress
 * @throws {AuthorizationError} 403 - Only teachers can delete checkpoints
 * @throws {NotFoundError} 404 - Checkpoint not found
 */
router.delete(
  '/:uuid',
  decodeToken,
  validateUUID('uuid'),
  asyncHandler(async (req, res) => {
    const checkpointService = container.get('checkpointService');
    const checkpointUuid = req.params.uuid;
    const userUuid = req.user.uuid;

    await checkpointService.deleteCheckpoint(checkpointUuid, userUuid);

    res.status(HTTP_STATUS.OK).json({ message: 'success' });
  })
);

/**
 * @route PUT /checkpoints/:uuid/reorder
 * @description Update checkpoint order (teacher only)
 * @access Protected (Teacher only)
 * @headers {string} Authorization - Bearer token
 * @param {string} uuid - Checkpoint UUID
 * @body {number} order_index - New order index
 * @returns {Object} Success message
 * @throws {AuthenticationError} 401 - Invalid or missing token
 * @throws {ValidationError} 400 - Invalid UUID format or missing order_index
 * @throws {AuthorizationError} 403 - Only teachers can reorder checkpoints
 * @throws {NotFoundError} 404 - Checkpoint not found
 */
router.put(
  '/:uuid/reorder',
  decodeToken,
  validateUUID('uuid'),
  validateRequiredFields(['order_index']),
  asyncHandler(async (req, res) => {
    const checkpointService = container.get('checkpointService');
    const checkpointUuid = req.params.uuid;
    const newOrderIndex = req.body.order_index;
    const userUuid = req.user.uuid;

    await checkpointService.reorderCheckpoint(checkpointUuid, newOrderIndex, userUuid);

    res.status(HTTP_STATUS.OK).json({ message: 'success' });
  })
);

/**
 * @route POST /checkpoints/:checkpoint_uuid/students/:student_uuid
 * @description Mark a checkpoint as reached for a student (teacher only)
 * @access Protected (Teacher only)
 * @headers {string} Authorization - Bearer token
 * @param {string} checkpoint_uuid - Checkpoint UUID
 * @param {string} student_uuid - Student UUID
 * @returns {Object} Created progress object
 * @throws {AuthenticationError} 401 - Invalid or missing token
 * @throws {ValidationError} 400 - Invalid UUID format or already marked
 * @throws {AuthorizationError} 403 - Only teachers can mark checkpoints
 * @throws {NotFoundError} 404 - Checkpoint not found
 */
router.post(
  '/:checkpoint_uuid/students/:student_uuid',
  decodeToken,
  validateUUID('checkpoint_uuid'),
  validateUUID('student_uuid'),
  asyncHandler(async (req, res) => {
    const checkpointService = container.get('checkpointService');
    const checkpointUuid = req.params.checkpoint_uuid;
    const studentUuid = req.params.student_uuid;
    const userUuid = req.user.uuid;

    const studentCheckpoint = await checkpointService.markCheckpointReached(
      checkpointUuid,
      studentUuid,
      userUuid
    );

    res.status(HTTP_STATUS.CREATED).json({
      ...studentCheckpoint,
      message: 'success'
    });
  })
);

/**
 * @route DELETE /checkpoints/:checkpoint_uuid/students/:student_uuid
 * @description Unmark a checkpoint for a student (teacher only)
 * @access Protected (Teacher only)
 * @headers {string} Authorization - Bearer token
 * @param {string} checkpoint_uuid - Checkpoint UUID
 * @param {string} student_uuid - Student UUID
 * @returns {Object} Success message
 * @throws {AuthenticationError} 401 - Invalid or missing token
 * @throws {ValidationError} 400 - Invalid UUID format
 * @throws {AuthorizationError} 403 - Only teachers can unmark checkpoints
 * @throws {NotFoundError} 404 - Checkpoint not found
 */
router.delete(
  '/:checkpoint_uuid/students/:student_uuid',
  decodeToken,
  validateUUID('checkpoint_uuid'),
  validateUUID('student_uuid'),
  asyncHandler(async (req, res) => {
    const checkpointService = container.get('checkpointService');
    const checkpointUuid = req.params.checkpoint_uuid;
    const studentUuid = req.params.student_uuid;
    const userUuid = req.user.uuid;

    await checkpointService.unmarkCheckpointReached(checkpointUuid, studentUuid, userUuid);

    res.status(HTTP_STATUS.OK).json({ message: 'success' });
  })
);

/**
 * @route GET /checkpoints/classroom/:classroom_uuid/student/:student_uuid/progress
 * @description Get student's checkpoint progress
 * @access Protected
 * @headers {string} Authorization - Bearer token
 * @param {string} classroom_uuid - Classroom UUID
 * @param {string} student_uuid - Student UUID
 * @returns {Object} Object with checkpoints array and next_checkpoint
 * @throws {AuthenticationError} 401 - Invalid or missing token
 * @throws {ValidationError} 400 - Invalid UUID format
 * @throws {AuthorizationError} 403 - Not authorized to view this progress
 */
router.get(
  '/classroom/:classroom_uuid/student/:student_uuid/progress',
  decodeToken,
  validateUUID('classroom_uuid'),
  validateUUID('student_uuid'),
  asyncHandler(async (req, res) => {
    const checkpointService = container.get('checkpointService');
    const classroomUuid = req.params.classroom_uuid;
    const studentUuid = req.params.student_uuid;
    const userUuid = req.user.uuid;

    const checkpoints = await checkpointService.getStudentProgress(
      classroomUuid,
      studentUuid,
      userUuid
    );

    // Format progress data
    const progress = checkpoints.map(cp => ({
      ...cp,
      reached: !!cp.reached_at,
      reached_at: cp.reached_at || null
    }));

    // Find next checkpoint
    const nextCheckpoint = progress.find(cp => !cp.reached) || null;

    res.status(HTTP_STATUS.OK).json({
      checkpoints: progress,
      next_checkpoint: nextCheckpoint
    });
  })
);

module.exports = router;
