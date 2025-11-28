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
 * @route GET /classrooms
 * @description Get all classrooms for the current user (both as teacher and student)
 * @access Protected
 * @headers {string} Authorization - Bearer token
 * @returns {Array<Object>} Array of classroom objects with membership info
 * @throws {AuthenticationError} 401 - Invalid or missing token
 * @throws {InternalServerError} 500 - Database error
 */
router.get(
  '/',
  decodeToken,
  asyncHandler(async (req, res) => {
    const classroomService = container.get('classroomService');
    const classrooms = await classroomService.getUserClassrooms(req.user.uuid);

    res.status(HTTP_STATUS.OK).json(classrooms);
  })
);

/**
 * @route GET /classrooms/:uuid
 * @description Get classroom details by UUID
 * @access Protected
 * @headers {string} Authorization - Bearer token
 * @param {string} uuid - Classroom UUID
 * @returns {Object} Classroom object with membership info and students list (if teacher)
 * @throws {AuthenticationError} 401 - Invalid or missing token
 * @throws {ValidationError} 400 - Invalid UUID format
 * @throws {AuthorizationError} 403 - Not a member of this classroom
 * @throws {NotFoundError} 404 - Classroom not found
 */
router.get(
  '/:uuid',
  decodeToken,
  validateUUID('uuid'),
  asyncHandler(async (req, res) => {
    const classroomService = container.get('classroomService');
    const classroomUuid = req.params.uuid;
    const userUuid = req.user.uuid;

    const classroom = await classroomService.getClassroom(classroomUuid, userUuid);

    // If user is a teacher, get all members (students) and pending members
    let students = [];
    let pendingStudents = [];
    if (classroom.userRole === 'teacher') {
      const members = await classroomService.getClassroomMembers(classroomUuid, userUuid);
      students = members
        .filter(member => member.role === 'student')
        .map(member => ({
          uuid: member.user_uuid,
          first_name: member.first_name,
          last_name: member.last_name,
          email: member.email,
          active: member.active
        }));

      // Get pending members
      const pending = await classroomService.getPendingMembers(classroomUuid, userUuid);
      pendingStudents = pending.map(p => ({
        email: p.email,
        pending: true,
        created_at: p.created_at
      }));
    }

    // Rename userRole and userActive for backward compatibility
    const { userRole, userActive, ...classroomData } = classroom;

    res.status(HTTP_STATUS.OK).json({
      ...classroomData,
      role: userRole,
      active: userActive,
      students,
      pendingStudents
    });
  })
);

/**
 * @route POST /classrooms
 * @description Create a new classroom
 * @access Protected
 * @headers {string} Authorization - Bearer token
 * @body {string} name - Classroom name
 * @body {string} academic_year - Academic year for the classroom
 * @body {string} [allowed_email_domain] - Optional email domain restriction
 * @returns {Object} Created classroom object
 * @throws {AuthenticationError} 401 - Invalid or missing token
 * @throws {ValidationError} 400 - Missing or invalid fields
 * @throws {InternalServerError} 500 - Database error
 */
router.post(
  '/',
  decodeToken,
  validateRequiredFields(['name', 'academic_year']),
  sanitizeText(['name', 'academic_year', 'allowed_email_domain'], 200),
  asyncHandler(async (req, res) => {
    const classroomService = container.get('classroomService');
    const { name, academic_year, allowed_email_domain } = req.body;

    const classroom = await classroomService.createClassroom(
      {
        name,
        academic_year,
        allowed_email_domain
      },
      req.user.uuid
    );

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      ...classroom,
      message: 'Classroom created successfully'
    });
  })
);

/**
 * @route PUT /classrooms/:uuid
 * @description Update a classroom (teacher only)
 * @access Protected (Teacher only)
 * @headers {string} Authorization - Bearer token
 * @param {string} uuid - Classroom UUID
 * @body {string} [name] - Updated classroom name
 * @body {string} [academic_year] - Updated academic year
 * @body {string} [allowed_email_domain] - Updated allowed email domain (null or empty string to remove restriction)
 * @returns {Object} Updated classroom object
 * @throws {AuthenticationError} 401 - Invalid or missing token
 * @throws {ValidationError} 400 - Invalid UUID format or no valid fields to update
 * @throws {AuthorizationError} 403 - Only teachers can update classrooms
 * @throws {NotFoundError} 404 - Classroom not found
 */
router.put(
  '/:uuid',
  decodeToken,
  validateUUID('uuid'),
  sanitizeText(['name', 'academic_year', 'allowed_email_domain'], 200),
  asyncHandler(async (req, res) => {
    const classroomService = container.get('classroomService');
    const classroomUuid = req.params.uuid;
    const userUuid = req.user.uuid;
    const { name, academic_year, allowed_email_domain } = req.body;

    // Build updates object (only include fields that are present)
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (academic_year !== undefined) updates.academic_year = academic_year;
    if (allowed_email_domain !== undefined) {
      // Allow null or empty string to remove email domain restriction
      updates.allowed_email_domain = allowed_email_domain || null;
    }

    const updatedClassroom = await classroomService.updateClassroom(
      classroomUuid,
      updates,
      userUuid
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      ...updatedClassroom,
      message: 'Classroom updated successfully'
    });
  })
);

/**
 * @route POST /classrooms/join/:invite_code
 * @description Join a classroom using an invite code
 * @access Protected
 * @headers {string} Authorization - Bearer token
 * @param {string} invite_code - Classroom invite code
 * @returns {Object} Joined classroom object
 * @throws {AuthenticationError} 401 - Invalid or missing token
 * @throws {ValidationError} 400 - Already a member or classroom completed
 * @throws {AuthorizationError} 403 - Email domain mismatch
 * @throws {NotFoundError} 404 - Invalid invite code
 */
router.post(
  '/join/:invite_code',
  decodeToken,
  asyncHandler(async (req, res) => {
    const classroomService = container.get('classroomService');
    const inviteCode = req.params.invite_code;
    const userUuid = req.user.uuid;
    const userEmail = req.user.email;

    // Join the classroom as a student (service will handle email domain validation)
    const joinedClassroom = await classroomService.joinClassroom(inviteCode, userUuid, 'student', userEmail);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      ...joinedClassroom,
      role: 'student',
      message: 'Successfully joined classroom'
    });
  })
);

/**
 * @route GET /classrooms/:uuid/invite
 * @description Get invite code for a classroom (teacher only)
 * @access Protected (Teacher only)
 * @headers {string} Authorization - Bearer token
 * @param {string} uuid - Classroom UUID
 * @returns {Object} Object containing invite code
 * @throws {AuthenticationError} 401 - Invalid or missing token
 * @throws {ValidationError} 400 - Invalid UUID format
 * @throws {AuthorizationError} 403 - Only teachers can get invite codes
 * @throws {NotFoundError} 404 - Classroom not found
 */
router.get(
  '/:uuid/invite',
  decodeToken,
  validateUUID('uuid'),
  asyncHandler(async (req, res) => {
    const classroomService = container.get('classroomService');
    const classroomUuid = req.params.uuid;
    const userUuid = req.user.uuid;

    const inviteCode = await classroomService.getInviteCode(classroomUuid, userUuid);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      invite_code: inviteCode
    });
  })
);

/**
 * @route DELETE /classrooms/:uuid/students/:student_uuid
 * @description Remove student from classroom (teacher only)
 * @access Protected (Teacher only)
 * @headers {string} Authorization - Bearer token
 * @param {string} uuid - Classroom UUID
 * @param {string} student_uuid - Student UUID to remove
 * @returns {Object} Success message
 * @throws {AuthenticationError} 401 - Invalid or missing token
 * @throws {ValidationError} 400 - Invalid UUID format or user is not a student
 * @throws {AuthorizationError} 403 - Only teachers can remove students
 * @throws {NotFoundError} 404 - Student not found in classroom
 */
router.delete(
  '/:uuid/students/:student_uuid',
  decodeToken,
  validateUUID('uuid'),
  validateUUID('student_uuid'),
  asyncHandler(async (req, res) => {
    const classroomService = container.get('classroomService');
    const classroomUuid = req.params.uuid;
    const studentUuid = req.params.student_uuid;
    const userUuid = req.user.uuid;

    await classroomService.removeStudent(classroomUuid, studentUuid, userUuid);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Student removed from classroom'
    });
  })
);

/**
 * @route POST /classrooms/:uuid/students/bulk
 * @description Add students to classroom by email addresses (teacher only)
 * @access Protected (Teacher only)
 * @headers {string} Authorization - Bearer token
 * @param {string} uuid - Classroom UUID
 * @body {string[]} emails - Array of email addresses
 * @returns {Object} Summary of additions (added, pending, already members, errors)
 * @throws {AuthenticationError} 401 - Invalid or missing token
 * @throws {ValidationError} 400 - Invalid UUID format or missing emails
 * @throws {AuthorizationError} 403 - Only teachers can add students
 * @throws {NotFoundError} 404 - Classroom not found
 */
router.post(
  '/:uuid/students/bulk',
  decodeToken,
  validateUUID('uuid'),
  validateRequiredFields(['emails']),
  asyncHandler(async (req, res) => {
    const classroomService = container.get('classroomService');
    const classroomUuid = req.params.uuid;
    const userUuid = req.user.uuid;
    const { emails } = req.body;

    // Validate that emails is an array
    if (!Array.isArray(emails)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'emails must be an array'
      });
    }

    const result = await classroomService.addStudentsByEmail(classroomUuid, emails, userUuid);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      ...result,
      message: 'Students processed successfully'
    });
  })
);

/**
 * @route GET /classrooms/:uuid/pending
 * @description Get pending members for a classroom (teacher only)
 * @access Protected (Teacher only)
 * @headers {string} Authorization - Bearer token
 * @param {string} uuid - Classroom UUID
 * @returns {Array<Object>} Array of pending member objects
 * @throws {AuthenticationError} 401 - Invalid or missing token
 * @throws {ValidationError} 400 - Invalid UUID format
 * @throws {AuthorizationError} 403 - Only teachers can view pending members
 * @throws {NotFoundError} 404 - Classroom not found
 */
router.get(
  '/:uuid/pending',
  decodeToken,
  validateUUID('uuid'),
  asyncHandler(async (req, res) => {
    const classroomService = container.get('classroomService');
    const classroomUuid = req.params.uuid;
    const userUuid = req.user.uuid;

    const pendingMembers = await classroomService.getPendingMembers(classroomUuid, userUuid);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      pending: pendingMembers
    });
  })
);

/**
 * @route DELETE /classrooms/:uuid/pending/:email
 * @description Remove a pending member from classroom (teacher only)
 * @access Protected (Teacher only)
 * @headers {string} Authorization - Bearer token
 * @param {string} uuid - Classroom UUID
 * @param {string} email - Email address to remove
 * @returns {Object} Success message
 * @throws {AuthenticationError} 401 - Invalid or missing token
 * @throws {ValidationError} 400 - Invalid UUID format
 * @throws {AuthorizationError} 403 - Only teachers can remove pending members
 */
router.delete(
  '/:uuid/pending/:email',
  decodeToken,
  validateUUID('uuid'),
  asyncHandler(async (req, res) => {
    const classroomService = container.get('classroomService');
    const classroomUuid = req.params.uuid;
    const email = req.params.email;
    const userUuid = req.user.uuid;

    await classroomService.removePendingMember(classroomUuid, email, userUuid);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Pending member removed'
    });
  })
);

/**
 * @route POST /classrooms/:uuid/leave
 * @description Leave a classroom (student only)
 * @access Protected (Student only)
 * @headers {string} Authorization - Bearer token
 * @param {string} uuid - Classroom UUID
 * @returns {Object} Success message
 * @throws {AuthenticationError} 401 - Invalid or missing token
 * @throws {ValidationError} 400 - Invalid UUID format
 * @throws {AuthorizationError} 403 - Only students can leave classrooms
 * @throws {NotFoundError} 404 - Not a member of this classroom
 */
router.post(
  '/:uuid/leave',
  decodeToken,
  validateUUID('uuid'),
  asyncHandler(async (req, res) => {
    const classroomService = container.get('classroomService');
    const classroomUuid = req.params.uuid;
    const userUuid = req.user.uuid;

    await classroomService.leaveClassroom(classroomUuid, userUuid);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Successfully left classroom'
    });
  })
);

/**
 * @route POST /classrooms/:uuid/rejoin
 * @description Rejoin a classroom (reactivate inactive membership)
 * @access Protected
 * @headers {string} Authorization - Bearer token
 * @param {string} uuid - Classroom UUID
 * @returns {Object} Success message
 * @throws {AuthenticationError} 401 - Invalid or missing token
 * @throws {ValidationError} 400 - Invalid UUID format or already active member
 * @throws {NotFoundError} 404 - No membership found for this classroom
 */
router.post(
  '/:uuid/rejoin',
  decodeToken,
  validateUUID('uuid'),
  asyncHandler(async (req, res) => {
    const classroomService = container.get('classroomService');
    const classroomUuid = req.params.uuid;
    const userUuid = req.user.uuid;

    await classroomService.rejoinClassroom(classroomUuid, userUuid);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Successfully rejoined classroom',
      active: true
    });
  })
);

/**
 * @route POST /classrooms/:uuid/complete
 * @description Mark classroom as completed (teacher only)
 * @access Protected (Teacher only)
 * @headers {string} Authorization - Bearer token
 * @param {string} uuid - Classroom UUID
 * @returns {Object} Success message with completion status
 * @throws {AuthenticationError} 401 - Invalid or missing token
 * @throws {ValidationError} 400 - Invalid UUID format or classroom already completed
 * @throws {AuthorizationError} 403 - Only teachers can complete classrooms
 * @throws {NotFoundError} 404 - Classroom not found
 */
router.post(
  '/:uuid/complete',
  decodeToken,
  validateUUID('uuid'),
  asyncHandler(async (req, res) => {
    const classroomService = container.get('classroomService');
    const classroomUuid = req.params.uuid;
    const userUuid = req.user.uuid;

    await classroomService.completeClassroom(classroomUuid, userUuid);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Classroom marked as completed',
      completed: true
    });
  })
);

/**
 * @route GET /classrooms/:uuid/metrics
 * @description Get comprehensive classroom metrics
 * @access Protected
 * @headers {string} Authorization - Bearer token
 * @param {string} uuid - Classroom UUID
 * @returns {Object} Comprehensive metrics object
 * @throws {AuthenticationError} 401 - Invalid or missing token
 * @throws {ValidationError} 400 - Invalid UUID format
 * @throws {AuthorizationError} 403 - Not a member of this classroom
 * @throws {NotFoundError} 404 - Classroom not found
 */
router.get(
  '/:uuid/metrics',
  decodeToken,
  validateUUID('uuid'),
  asyncHandler(async (req, res) => {
    const classroomService = container.get('classroomService');
    const classroomUuid = req.params.uuid;
    const userUuid = req.user.uuid;

    const metrics = await classroomService.getClassroomMetrics(classroomUuid, userUuid);

    res.status(HTTP_STATUS.OK).json(metrics);
  })
);

/**
 * @route GET /classrooms/:uuid/metrics/basic
 * @description Get basic classroom metrics
 * @access Protected
 * @headers {string} Authorization - Bearer token
 * @param {string} uuid - Classroom UUID
 * @returns {Object} Basic metrics object
 * @throws {AuthenticationError} 401 - Invalid or missing token
 * @throws {ValidationError} 400 - Invalid UUID format
 * @throws {AuthorizationError} 403 - Not a member of this classroom
 * @throws {NotFoundError} 404 - Classroom not found
 */
router.get(
  '/:uuid/metrics/basic',
  decodeToken,
  validateUUID('uuid'),
  asyncHandler(async (req, res) => {
    const classroomService = container.get('classroomService');
    const classroomUuid = req.params.uuid;
    const userUuid = req.user.uuid;

    const metrics = await classroomService.getBasicMetrics(classroomUuid, userUuid);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      ...metrics
    });
  })
);

/**
 * @route GET /classrooms/:uuid/metrics/progress
 * @description Get progress metrics for a classroom
 * @access Protected
 * @headers {string} Authorization - Bearer token
 * @param {string} uuid - Classroom UUID
 * @returns {Object} Progress metrics object
 * @throws {AuthenticationError} 401 - Invalid or missing token
 * @throws {ValidationError} 400 - Invalid UUID format
 * @throws {AuthorizationError} 403 - Not a member of this classroom
 * @throws {NotFoundError} 404 - Classroom not found
 */
router.get(
  '/:uuid/metrics/progress',
  decodeToken,
  validateUUID('uuid'),
  asyncHandler(async (req, res) => {
    const classroomService = container.get('classroomService');
    const classroomUuid = req.params.uuid;
    const userUuid = req.user.uuid;

    const metrics = await classroomService.getProgressMetrics(classroomUuid, userUuid);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      ...metrics
    });
  })
);



/**
 * @route GET /classrooms/:uuid/metrics/students
 * @description Get student progress summary (teacher only)
 * @access Protected (Teacher only)
 * @headers {string} Authorization - Bearer token
 * @param {string} uuid - Classroom UUID
 * @returns {Array<Object>} Array of student progress objects
 * @throws {AuthenticationError} 401 - Invalid or missing token
 * @throws {ValidationError} 400 - Invalid UUID format
 * @throws {AuthorizationError} 403 - Only teachers can view student progress summary
 * @throws {NotFoundError} 404 - Classroom not found
 */
router.get(
  '/:uuid/metrics/students',
  decodeToken,
  validateUUID('uuid'),
  asyncHandler(async (req, res) => {
    const classroomService = container.get('classroomService');
    const classroomUuid = req.params.uuid;
    const userUuid = req.user.uuid;

    const studentProgress = await classroomService.getStudentProgressSummary(classroomUuid, userUuid);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      students: studentProgress
    });
  })
);

/**
 * @route GET /classrooms/:uuid/metrics/checkpoints
 * @description Get checkpoint completion distribution (teacher only)
 * @access Protected (Teacher only)
 * @headers {string} Authorization - Bearer token
 * @param {string} uuid - Classroom UUID
 * @returns {Array<Object>} Array of checkpoint completion objects
 * @throws {AuthenticationError} 401 - Invalid or missing token
 * @throws {ValidationError} 400 - Invalid UUID format
 * @throws {AuthorizationError} 403 - Only teachers can view checkpoint completion distribution
 * @throws {NotFoundError} 404 - Classroom not found
 */
router.get(
  '/:uuid/metrics/checkpoints',
  decodeToken,
  validateUUID('uuid'),
  asyncHandler(async (req, res) => {
    const classroomService = container.get('classroomService');
    const classroomUuid = req.params.uuid;
    const userUuid = req.user.uuid;

    const checkpointDistribution = await classroomService.getCheckpointCompletionDistribution(classroomUuid, userUuid);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      checkpoints: checkpointDistribution
    });
  })
);

/**
 * @route GET /classrooms/:uuid/metrics/engagement
 * @description Get detailed student engagement metrics (teacher only)
 * @access Protected (Teacher only)
 * @headers {string} Authorization - Bearer token
 * @param {string} uuid - Classroom UUID
 * @returns {Array<Object>} Array of student engagement objects sorted by engagement score
 * @throws {AuthenticationError} 401 - Invalid or missing token
 * @throws {ValidationError} 400 - Invalid UUID format
 * @throws {AuthorizationError} 403 - Only teachers can view student engagement metrics
 * @throws {NotFoundError} 404 - Classroom not found
 */
router.get(
  '/:uuid/metrics/engagement',
  decodeToken,
  validateUUID('uuid'),
  asyncHandler(async (req, res) => {
    const classroomService = container.get('classroomService');
    const classroomUuid = req.params.uuid;
    const userUuid = req.user.uuid;

    const engagementMetrics = await classroomService.getStudentEngagementMetrics(classroomUuid, userUuid);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      students: engagementMetrics
    });
  })
);

module.exports = router;
