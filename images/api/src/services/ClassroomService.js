const { v4: uuidv4 } = require('uuid');

/**
 * ClassroomService - Business logic layer for classroom-related operations
 * Handles classroom creation, management, invitations, and memberships
 * @class
 */
class ClassroomService {
  /**
   * Creates an instance of ClassroomService
   * @param {Object} classroomRepository - ClassroomRepository instance
   * @param {Object} authorizationService - AuthorizationService instance
   * @param {Object} pendingMemberRepository - PendingMemberRepository instance
   * @param {Object} userRepository - UserRepository instance
   */
  constructor(classroomRepository, authorizationService, pendingMemberRepository, userRepository) {
    this.classroomRepository = classroomRepository;
    this.authorizationService = authorizationService;
    this.pendingMemberRepository = pendingMemberRepository;
    this.userRepository = userRepository;
  }

  /**
   * Generate a unique invite code
   * @private
   * @returns {Promise<string>} Unique invite code
   */
  async generateUniqueInviteCode() {
    let inviteCode;
    let exists = true;

    while (exists) {
      inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      exists = await this.classroomRepository.inviteCodeExists(inviteCode);
    }

    return inviteCode;
  }

  /**
   * Get all classrooms for a user
   * @param {string} userUuid - User's UUID
   * @returns {Promise<Array<Object>>} Array of classroom objects with membership info
   * @throws {Error} Database query error
   */
  async getUserClassrooms(userUuid) {
    return await this.classroomRepository.findByUserMembership(userUuid);
  }

  /**
   * Get classroom details by UUID
   * @param {string} classroomUuid - Classroom's UUID
   * @param {string} userUuid - User's UUID (for authorization)
   * @returns {Promise<Object>} Classroom object with membership info
   * @throws {Error} Authorization or not found error
   */
  async getClassroom(classroomUuid, userUuid) {
    // Check if user is a member
    await this.authorizationService.requireMember(classroomUuid, userUuid);

    const classroom = await this.classroomRepository.findByUuid(classroomUuid);

    if (!classroom) {
      const error = new Error('Classroom not found');
      error.statusCode = 404;
      throw error;
    }

    // Get user's membership details
    const membership = await this.classroomRepository.getMembership(classroomUuid, userUuid);

    return {
      ...classroom,
      userRole: membership.role,
      userActive: membership.active
    };
  }

  /**
   * Create a new classroom
   * @param {Object} classroomData - Classroom data
   * @param {string} classroomData.name - Classroom name
   * @param {string} classroomData.academic_year - Academic year
   * @param {string} [classroomData.allowed_email_domain] - Optional email domain restriction
   * @param {string} creatorUuid - Creator's UUID
   * @returns {Promise<Object>} Created classroom object
   * @throws {Error} Creation error
   */
  async createClassroom(classroomData, creatorUuid) {
    const { name, academic_year, allowed_email_domain } = classroomData;

    // Generate unique invite code
    const inviteCode = await this.generateUniqueInviteCode();

    // Create classroom
    const classroom = await this.classroomRepository.create({
      uuid: uuidv4(),
      name,
      academic_year,
      teacher_uuid: creatorUuid,
      invite_code: inviteCode,
      allowed_email_domain: allowed_email_domain || null
    });

    // Add creator as teacher
    await this.classroomRepository.addMember({
      classroom_uuid: classroom.uuid,
      user_uuid: creatorUuid,
      role: 'teacher',
      active: true
    });

    return classroom;
  }

  /**
   * Update a classroom (teacher only)
   * @param {string} classroomUuid - Classroom's UUID
   * @param {Object} updates - Fields to update
   * @param {string} [updates.name] - Updated classroom name
   * @param {string} [updates.academic_year] - Updated academic year
   * @param {string} [updates.allowed_email_domain] - Updated allowed email domain (null to remove)
   * @param {string} userUuid - User's UUID
   * @returns {Promise<Object>} Updated classroom object
   * @throws {Error} Authorization or validation error
   */
  async updateClassroom(classroomUuid, updates, userUuid) {
    // Only teachers can update classroom
    await this.authorizationService.requireTeacher(classroomUuid, userUuid);

    const classroom = await this.classroomRepository.findByUuid(classroomUuid);

    if (!classroom) {
      const error = new Error('Classroom not found');
      error.statusCode = 404;
      throw error;
    }

    // Check if classroom is completed
    const isCompleted = await this.classroomRepository.isCompleted(classroomUuid);
    if (isCompleted) {
      const error = new Error('Cannot update a completed classroom');
      error.statusCode = 400;
      throw error;
    }

    // Filter out undefined values and only allow specific fields
    const allowedFields = ['name', 'academic_year', 'allowed_email_domain'];
    const filteredUpdates = {};

    for (const field of allowedFields) {
      if (updates.hasOwnProperty(field)) {
        filteredUpdates[field] = updates[field];
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      const error = new Error('No valid fields to update');
      error.statusCode = 400;
      throw error;
    }

    return await this.classroomRepository.update(classroomUuid, filteredUpdates);
  }

  /**
   * Join a classroom using invite code
   * @param {string} inviteCode - Invite code
   * @param {string} userUuid - User's UUID
   * @param {string} userRole - User's role
   * @param {string} userEmail - User's email (for domain validation)
   * @returns {Promise<Object>} Classroom object
   * @throws {Error} Join error
   */
  async joinClassroom(inviteCode, userUuid, userRole, userEmail) {
    // Find classroom by invite code
    const classroom = await this.classroomRepository.findByInviteCode(inviteCode);

    if (!classroom) {
      const error = new Error('Invalid invite code');
      error.statusCode = 404;
      throw error;
    }

    // Check if classroom is completed
    if (classroom.completed_at) {
      const error = new Error('This classroom has been completed');
      error.statusCode = 400;
      throw error;
    }

    // Check email domain restriction
    if (classroom.allowed_email_domain && userEmail) {
      const userEmailDomain = userEmail.split('@')[1];
      if (userEmailDomain !== classroom.allowed_email_domain) {
        const error = new Error(`Only users with @${classroom.allowed_email_domain} email addresses can join this classroom`);
        error.statusCode = 403;
        throw error;
      }
    }

    // Check if user is already a member
    const existingMembership = await this.classroomRepository.getMembership(classroom.uuid, userUuid);

    if (existingMembership) {
      // If inactive, reactivate
      if (!existingMembership.active) {
        await this.classroomRepository.updateMembershipStatus(classroom.uuid, userUuid, true);
        return classroom;
      }

      const error = new Error('You are already a member of this classroom');
      error.statusCode = 400;
      throw error;
    }

    // Add user as member
    await this.classroomRepository.addMember({
      classroom_uuid: classroom.uuid,
      user_uuid: userUuid,
      role: userRole,
      active: true
    });

    return classroom;
  }

  /**
   * Get classroom invite code (teacher only)
   * @param {string} classroomUuid - Classroom's UUID
   * @param {string} userUuid - User's UUID
   * @returns {Promise<string>} Invite code
   * @throws {Error} Authorization error
   */
  async getInviteCode(classroomUuid, userUuid) {
    // Only teachers can get invite code
    await this.authorizationService.requireTeacher(classroomUuid, userUuid);

    const classroom = await this.classroomRepository.findByUuid(classroomUuid);

    if (!classroom) {
      const error = new Error('Classroom not found');
      error.statusCode = 404;
      throw error;
    }

    return classroom.invite_code;
  }

  /**
   * Remove a student from classroom (teacher only)
   * @param {string} classroomUuid - Classroom's UUID
   * @param {string} studentUuid - Student's UUID to remove
   * @param {string} teacherUuid - Teacher's UUID
   * @returns {Promise<void>}
   * @throws {Error} Authorization error
   */
  async removeStudent(classroomUuid, studentUuid, teacherUuid) {
    // Only teachers can remove students
    await this.authorizationService.requireTeacher(classroomUuid, teacherUuid);

    // Verify the user being removed is a student
    const isStudent = await this.authorizationService.isStudent(classroomUuid, studentUuid);

    if (!isStudent) {
      const error = new Error('User is not a student in this classroom');
      error.statusCode = 400;
      throw error;
    }

    await this.classroomRepository.removeMember(classroomUuid, studentUuid);
  }

  /**
   * Leave a classroom (student only)
   * @param {string} classroomUuid - Classroom's UUID
   * @param {string} userUuid - User's UUID
   * @returns {Promise<void>}
   * @throws {Error} Authorization error
   */
  async leaveClassroom(classroomUuid, userUuid) {
    // Only students can leave
    await this.authorizationService.requireStudent(classroomUuid, userUuid, 'Only students can leave a classroom');

    const membership = await this.classroomRepository.getMembership(classroomUuid, userUuid);

    if (!membership) {
      const error = new Error('You are not a member of this classroom');
      error.statusCode = 404;
      throw error;
    }

    // Deactivate membership instead of deleting
    await this.classroomRepository.updateMembershipStatus(classroomUuid, userUuid, false);
  }

  /**
   * Rejoin a classroom (reactivate membership)
   * @param {string} classroomUuid - Classroom's UUID
   * @param {string} userUuid - User's UUID
   * @returns {Promise<void>}
   * @throws {Error} Rejoin error
   */
  async rejoinClassroom(classroomUuid, userUuid) {
    const membership = await this.classroomRepository.getMembership(classroomUuid, userUuid);

    if (!membership) {
      const error = new Error('You were never a member of this classroom');
      error.statusCode = 404;
      throw error;
    }

    if (membership.active) {
      const error = new Error('You are already an active member');
      error.statusCode = 400;
      throw error;
    }

    await this.classroomRepository.updateMembershipStatus(classroomUuid, userUuid, true);
  }

  /**
   * Mark classroom as completed (teacher only)
   * @param {string} classroomUuid - Classroom's UUID
   * @param {string} userUuid - User's UUID
   * @returns {Promise<Object>} Updated classroom object
   * @throws {Error} Authorization error
   */
  async completeClassroom(classroomUuid, userUuid) {
    // Only teachers can complete classrooms
    await this.authorizationService.requireTeacher(classroomUuid, userUuid);

    const classroom = await this.classroomRepository.findByUuid(classroomUuid);

    if (!classroom) {
      const error = new Error('Classroom not found');
      error.statusCode = 404;
      throw error;
    }

    if (classroom.completed_at) {
      const error = new Error('Classroom is already completed');
      error.statusCode = 400;
      throw error;
    }

    return await this.classroomRepository.markAsCompleted(classroomUuid);
  }

  /**
   * Get all members of a classroom
   * @param {string} classroomUuid - Classroom's UUID
   * @param {string} userUuid - User's UUID (for authorization)
   * @returns {Promise<Array<Object>>} Array of member objects
   * @throws {Error} Authorization error
   */
  async getClassroomMembers(classroomUuid, userUuid) {
    // User must be a member to see other members
    await this.authorizationService.requireMember(classroomUuid, userUuid);

    return await this.classroomRepository.getMembers(classroomUuid);
  }

  /**
   * Get all active students in a classroom
   * @param {string} classroomUuid - Classroom's UUID
   * @param {string} userUuid - User's UUID (for authorization)
   * @returns {Promise<Array<Object>>} Array of student objects
   * @throws {Error} Authorization error
   */
  async getActiveStudents(classroomUuid, userUuid) {
    // User must be a member
    await this.authorizationService.requireMember(classroomUuid, userUuid);

    return await this.classroomRepository.getActiveStudents(classroomUuid);
  }

  /**
   * Check if classroom is completed
   * @param {string} classroomUuid - Classroom's UUID
   * @returns {Promise<boolean>} True if classroom is completed
   */
  async isCompleted(classroomUuid) {
    return await this.classroomRepository.isCompleted(classroomUuid);
  }

  /**
   * Add students by email addresses (bulk invitation)
   * If a user with the email exists, add them immediately as a member
   * Otherwise, add them as pending members who will auto-join on registration
   * @param {string} classroomUuid - Classroom's UUID
   * @param {string[]} emails - Array of email addresses
   * @param {string} teacherUuid - Teacher's UUID
   * @returns {Promise<Object>} Summary of additions
   * @throws {Error} Authorization error
   */
  async addStudentsByEmail(classroomUuid, emails, teacherUuid) {
    // Only teachers can add students
    await this.authorizationService.requireTeacher(classroomUuid, teacherUuid);

    const classroom = await this.classroomRepository.findByUuid(classroomUuid);

    if (!classroom) {
      const error = new Error('Classroom not found');
      error.statusCode = 404;
      throw error;
    }

    // Check if classroom is completed
    if (classroom.completed_at) {
      const error = new Error('Cannot add students to a completed classroom');
      error.statusCode = 400;
      throw error;
    }

    const result = {
      added: [],
      pending: [],
      alreadyMembers: [],
      errors: []
    };

    // Process each email
    for (const email of emails) {
      const emailLower = email.toLowerCase();

      try {
        // Check email domain restriction
        if (classroom.allowed_email_domain) {
          const emailDomain = emailLower.split('@')[1];
          if (emailDomain !== classroom.allowed_email_domain) {
            result.errors.push({
              email: emailLower,
              reason: `Email domain must be @${classroom.allowed_email_domain}`
            });
            continue;
          }
        }

        // Check if user exists with this email
        const user = await this.userRepository.findByEmail(emailLower);

        if (user) {
          // Check if already a member
          const existingMembership = await this.classroomRepository.getMembership(classroomUuid, user.uuid);

          if (existingMembership) {
            if (existingMembership.active) {
              result.alreadyMembers.push({ email: emailLower, uuid: user.uuid });
            } else {
              // Reactivate inactive membership
              await this.classroomRepository.updateMembershipStatus(classroomUuid, user.uuid, true);
              result.added.push({ email: emailLower, uuid: user.uuid, reactivated: true });
            }
          } else {
            // Add as active member
            await this.classroomRepository.addMember({
              classroom_uuid: classroomUuid,
              user_uuid: user.uuid,
              role: 'student',
              active: true
            });
            result.added.push({ email: emailLower, uuid: user.uuid });
          }
        } else {
          // User doesn't exist yet, add as pending member
          await this.pendingMemberRepository.create(classroomUuid, emailLower);
          result.pending.push({ email: emailLower });
        }
      } catch (err) {
        // Handle duplicate pending member or other errors
        if (err.code === '23505') { // Unique constraint violation
          result.errors.push({
            email: emailLower,
            reason: 'Already pending invitation'
          });
        } else {
          result.errors.push({
            email: emailLower,
            reason: err.message
          });
        }
      }
    }

    return result;
  }

  /**
   * Get pending members for a classroom (teacher only)
   * @param {string} classroomUuid - Classroom's UUID
   * @param {string} teacherUuid - Teacher's UUID
   * @returns {Promise<Array<Object>>} Array of pending member objects
   * @throws {Error} Authorization error
   */
  async getPendingMembers(classroomUuid, teacherUuid) {
    // Only teachers can see pending members
    await this.authorizationService.requireTeacher(classroomUuid, teacherUuid);

    return await this.pendingMemberRepository.getByClassroom(classroomUuid);
  }

  /**
   * Remove a pending member (teacher only)
   * @param {string} classroomUuid - Classroom's UUID
   * @param {string} email - Email address to remove
   * @param {string} teacherUuid - Teacher's UUID
   * @returns {Promise<void>}
   * @throws {Error} Authorization error
   */
  async removePendingMember(classroomUuid, email, teacherUuid) {
    // Only teachers can remove pending members
    await this.authorizationService.requireTeacher(classroomUuid, teacherUuid);

    await this.pendingMemberRepository.remove(classroomUuid, email);
  }

  /**
   * Get basic classroom metrics
   * @param {string} classroomUuid - Classroom's UUID
   * @param {string} userUuid - User's UUID (for authorization)
   * @returns {Promise<Object>} Basic metrics object
   * @throws {Error} Authorization error
   */
  async getBasicMetrics(classroomUuid, userUuid) {
    // User must be a member
    await this.authorizationService.requireMember(classroomUuid, userUuid);

    return await this.classroomRepository.getBasicMetrics(classroomUuid);
  }

  /**
   * Get progress metrics for a classroom
   * @param {string} classroomUuid - Classroom's UUID
   * @param {string} userUuid - User's UUID (for authorization)
   * @returns {Promise<Object>} Progress metrics object
   * @throws {Error} Authorization error
   */
  async getProgressMetrics(classroomUuid, userUuid) {
    // User must be a member
    await this.authorizationService.requireMember(classroomUuid, userUuid);

    return await this.classroomRepository.getProgressMetrics(classroomUuid);
  }

  

  /**
   * Get comprehensive classroom metrics
   * @param {string} classroomUuid - Classroom's UUID
   * @param {string} userUuid - User's UUID (for authorization)
   * @returns {Promise<Object>} Comprehensive metrics object
   * @throws {Error} Authorization error
   */
  async getClassroomMetrics(classroomUuid, userUuid) {
    // User must be a member
    await this.authorizationService.requireMember(classroomUuid, userUuid);

    const [basicMetrics, progressMetrics, studentEngagementMetrics, checkpointDistribution] = await Promise.all([
      this.classroomRepository.getBasicMetrics(classroomUuid),
      this.classroomRepository.getProgressMetrics(classroomUuid),
      this.classroomRepository.getStudentEngagementMetrics(classroomUuid),
      this.classroomRepository.getCheckpointCompletionDistribution(classroomUuid)
    ]);

    // Transform checkpoint distribution to match frontend expectations
    const checkpointAchievements = checkpointDistribution.map(checkpoint => ({
      checkpoint_name: checkpoint.name,
      achieved_count: checkpoint.students_reached,
      total_count: checkpoint.total_students
    }));

    // Calculate overall participation based on student engagement metrics
    const engagedStudents = studentEngagementMetrics.filter(s => s.is_engaged).length;
    const overallParticipation = basicMetrics.active_students > 0 
      ? Math.round((engagedStudents / basicMetrics.active_students) * 100)
      : 0;

    return {
      total_students: basicMetrics.total_students,
      active_students: basicMetrics.active_students,
      checkpoint_achievements: checkpointAchievements,
      overall_participation: overallParticipation
    };
  }

  /**
   * Get student progress summary (teacher only)
   * @param {string} classroomUuid - Classroom's UUID
   * @param {string} userUuid - User's UUID (for authorization)
   * @returns {Promise<Array<Object>>} Array of student progress objects
   * @throws {Error} Authorization error
   */
  async getStudentProgressSummary(classroomUuid, userUuid) {
    // Only teachers can see detailed student progress
    await this.authorizationService.requireTeacher(classroomUuid, userUuid);

    return await this.classroomRepository.getStudentProgressSummary(classroomUuid);
  }

  /**
   * Get checkpoint completion distribution (teacher only)
   * @param {string} classroomUuid - Classroom's UUID
   * @param {string} userUuid - User's UUID (for authorization)
   * @returns {Promise<Array<Object>>} Array of checkpoint completion objects
   * @throws {Error} Authorization error
   */
  async getCheckpointCompletionDistribution(classroomUuid, userUuid) {
    // Only teachers can see detailed completion distribution
    await this.authorizationService.requireTeacher(classroomUuid, userUuid);

    return await this.classroomRepository.getCheckpointCompletionDistribution(classroomUuid);
  }

  /**
   * Get detailed student engagement metrics (teacher only)
   * @param {string} classroomUuid - Classroom's UUID
   * @param {string} userUuid - User's UUID (for authorization)
   * @returns {Promise<Array<Object>>} Array of student engagement objects
   * @throws {Error} Authorization error
   */
  async getStudentEngagementMetrics(classroomUuid, userUuid) {
    // Only teachers can see detailed student engagement metrics
    await this.authorizationService.requireTeacher(classroomUuid, userUuid);

    return await this.classroomRepository.getStudentEngagementMetrics(classroomUuid);
  }
}

module.exports = ClassroomService;
