/**
 * ClassroomRepository - Data access layer for classroom-related database operations
 * Handles classrooms, memberships, and invite codes
 * @class
 */
class ClassroomRepository {
  /**
   * Creates an instance of ClassroomRepository
   * @param {Object} db - Database connection instance (Knex)
   */
  constructor(db) {
    this.db = db;
  }

  /**
   * Find classroom by UUID
   * @param {string} uuid - Classroom's unique identifier
   * @returns {Promise<Object|null>} Classroom object or null if not found
   * @throws {Error} Database query error
   */
  async findByUuid(uuid) {
    return await this.db('classrooms')
      .join('users', 'classrooms.teacher_uuid', 'users.uuid')
      .where('classrooms.uuid', uuid)
      .select(
        'classrooms.*',
        'users.first_name as teacher_first_name',
        'users.last_name as teacher_last_name'
      )
      .first();
  }

  /**
   * Find classroom by invite code
   * @param {string} inviteCode - Classroom invite code
   * @returns {Promise<Object|null>} Classroom object or null if not found
   * @throws {Error} Database query error
   */
  async findByInviteCode(inviteCode) {
    return await this.db('classrooms')
      .where({ invite_code: inviteCode })
      .first();
  }

  /**
   * Get all classrooms where user is a member
   * @param {string} userUuid - User's UUID
   * @returns {Promise<Array<Object>>} Array of classroom objects with membership info
   * @throws {Error} Database query error
   */
  async findByUserMembership(userUuid) {
    return await this.db('classroom_members')
      .join('classrooms', 'classroom_members.classroom_uuid', 'classrooms.uuid')
      .join('users', 'classrooms.teacher_uuid', 'users.uuid')
      .where('classroom_members.user_uuid', userUuid)
      .select(
        'classrooms.*',
        'classroom_members.role',
        'classroom_members.active',
        'classroom_members.created_at as joined_at',
        'users.first_name as teacher_first_name',
        'users.last_name as teacher_last_name'
      )
      .orderBy('classroom_members.created_at', 'desc');
  }

  /**
   * Create a new classroom
   * @param {Object} classroomData - Classroom data object
   * @param {string} classroomData.uuid - Classroom's UUID
   * @param {string} classroomData.name - Classroom name
   * @param {string} classroomData.description - Classroom description
   * @param {string} classroomData.invite_code - Invite code
   * @param {string} classroomData.created_by_uuid - Creator's UUID
   * @returns {Promise<Object>} Created classroom object
   * @throws {Error} Database insertion error
   */
  async create(classroomData) {
    const [classroom] = await this.db('classrooms')
      .insert(classroomData)
      .returning('*');

    return classroom;
  }

  /**
   * Update a classroom
   * @param {string} uuid - Classroom's UUID
   * @param {Object} updates - Fields to update
   * @param {string} [updates.name] - Updated classroom name
   * @param {string} [updates.academic_year] - Updated academic year
   * @param {string} [updates.allowed_email_domain] - Updated allowed email domain
   * @returns {Promise<Object>} Updated classroom object
   * @throws {Error} Database update error
   */
  async update(uuid, updates) {
    const [classroom] = await this.db('classrooms')
      .where({ uuid })
      .update({
        ...updates,
        updated_at: this.db.fn.now()
      })
      .returning('*');

    return classroom;
  }

  /**
   * Mark classroom as completed
   * @param {string} uuid - Classroom's UUID
   * @returns {Promise<Object>} Updated classroom object
   * @throws {Error} Database update error
   */
  async markAsCompleted(uuid) {
    const [classroom] = await this.db('classrooms')
      .where({ uuid })
      .update({
        completed_at: this.db.fn.now(),
        updated_at: this.db.fn.now()
      })
      .returning('*');

    return classroom;
  }

  /**
   * Check if classroom is completed
   * @param {string} uuid - Classroom's UUID
   * @returns {Promise<boolean>} True if classroom is completed
   * @throws {Error} Database query error
   */
  async isCompleted(uuid) {
    const classroom = await this.db('classrooms')
      .where({ uuid })
      .select('completed_at')
      .first();

    return classroom && classroom.completed_at !== null;
  }

  /**
   * Get classroom member by user and classroom UUID
   * @param {string} classroomUuid - Classroom's UUID
   * @param {string} userUuid - User's UUID
   * @returns {Promise<Object|null>} Membership object or null if not found
   * @throws {Error} Database query error
   */
  async getMembership(classroomUuid, userUuid) {
    return await this.db('classroom_members')
      .where({
        classroom_uuid: classroomUuid,
        user_uuid: userUuid
      })
      .first();
  }

  /**
   * Get all members of a classroom
   * @param {string} classroomUuid - Classroom's UUID
   * @returns {Promise<Array<Object>>} Array of membership objects with user info
   * @throws {Error} Database query error
   */
  async getMembers(classroomUuid) {
    return await this.db('classroom_members')
      .join('users', 'classroom_members.user_uuid', 'users.uuid')
      .where('classroom_members.classroom_uuid', classroomUuid)
      .select(
        'classroom_members.*',
        'users.first_name',
        'users.last_name',
        'users.email'
      )
      .orderBy('classroom_members.created_at', 'asc');
  }

  /**
   * Get all active students in a classroom
   * @param {string} classroomUuid - Classroom's UUID
   * @returns {Promise<Array<Object>>} Array of student membership objects
   * @throws {Error} Database query error
   */
  async getActiveStudents(classroomUuid) {
    return await this.db('classroom_members')
      .where({
        classroom_uuid: classroomUuid,
        role: 'student',
        active: true
      })
      .select('*');
  }

  /**
   * Add a member to a classroom
   * @param {Object} membershipData - Membership data object
   * @param {string} membershipData.classroom_uuid - Classroom's UUID
   * @param {string} membershipData.user_uuid - User's UUID
   * @param {string} membershipData.role - Role (teacher/student)
   * @param {boolean} membershipData.active - Active status
   * @returns {Promise<Object>} Created membership object
   * @throws {Error} Database insertion error
   */
  async addMember(membershipData) {
    const [membership] = await this.db('classroom_members')
      .insert(membershipData)
      .returning('*');

    return membership;
  }

  /**
   * Update membership active status
   * @param {string} classroomUuid - Classroom's UUID
   * @param {string} userUuid - User's UUID
   * @param {boolean} active - New active status
   * @returns {Promise<Object>} Updated membership object
   * @throws {Error} Database update error
   */
  async updateMembershipStatus(classroomUuid, userUuid, active) {
    const [membership] = await this.db('classroom_members')
      .where({
        classroom_uuid: classroomUuid,
        user_uuid: userUuid
      })
      .update({ active })
      .returning('*');

    return membership;
  }

  /**
   * Remove a member from a classroom
   * @param {string} classroomUuid - Classroom's UUID
   * @param {string} studentUuid - Student's UUID
   * @returns {Promise<number>} Number of rows deleted
   * @throws {Error} Database deletion error
   */
  async removeMember(classroomUuid, studentUuid) {
    return await this.db('classroom_members')
      .where({
        classroom_uuid: classroomUuid,
        user_uuid: studentUuid,
        role: 'student'
      })
      .del();
  }

  /**
   * Check if user is a teacher in a classroom
   * @param {string} classroomUuid - Classroom's UUID
   * @param {string} userUuid - User's UUID
   * @returns {Promise<boolean>} True if user is a teacher
   * @throws {Error} Database query error
   */
  async isTeacher(classroomUuid, userUuid) {
    const membership = await this.db('classroom_members')
      .where({
        classroom_uuid: classroomUuid,
        user_uuid: userUuid,
        role: 'teacher'
      })
      .first();

    return membership !== undefined;
  }

  /**
   * Check if user is a student in a classroom
   * @param {string} classroomUuid - Classroom's UUID
   * @param {string} userUuid - User's UUID
   * @returns {Promise<boolean>} True if user is a student
   * @throws {Error} Database query error
   */
  async isStudent(classroomUuid, userUuid) {
    const membership = await this.db('classroom_members')
      .where({
        classroom_uuid: classroomUuid,
        user_uuid: userUuid,
        role: 'student'
      })
      .first();

    return membership !== undefined;
  }

  /**
   * Check if user is an active member of a classroom
   * @param {string} classroomUuid - Classroom's UUID
   * @param {string} userUuid - User's UUID
   * @returns {Promise<boolean>} True if user is an active member
   * @throws {Error} Database query error
   */
  async isActiveMember(classroomUuid, userUuid) {
    const membership = await this.db('classroom_members')
      .where({
        classroom_uuid: classroomUuid,
        user_uuid: userUuid,
        active: true
      })
      .first();

    return membership !== undefined;
  }

  /**
   * Check if invite code exists
   * @param {string} inviteCode - Invite code to check
   * @returns {Promise<boolean>} True if invite code exists
   * @throws {Error} Database query error
   */
  async inviteCodeExists(inviteCode) {
    const classroom = await this.db('classrooms')
      .where({ invite_code: inviteCode })
      .first();

    return classroom !== undefined;
  }

  /**
   * Deactivate all memberships for a user (used during account deletion)
   * @param {string} userUuid - User's UUID
   * @param {Object} trx - Database transaction object
   * @returns {Promise<number>} Number of rows updated
   * @throws {Error} Database update error
   */
  async deactivateUserMemberships(userUuid, trx) {
    const dbContext = trx || this.db;

    return await dbContext('classroom_members')
      .where({ user_uuid: userUuid })
      .update({ active: false });
  }

  /**
   * Get basic classroom metrics
   * @param {string} classroomUuid - Classroom's UUID
   * @returns {Promise<Object>} Basic metrics object
   * @throws {Error} Database query error
   */
  async getBasicMetrics(classroomUuid) {
    const totalMembers = await this.db('classroom_members')
      .where({ classroom_uuid: classroomUuid })
      .count('* as count')
      .first();

    const activeMembers = await this.db('classroom_members')
      .where({ classroom_uuid: classroomUuid, active: true })
      .count('* as count')
      .first();

    const students = await this.db('classroom_members')
      .where({ classroom_uuid: classroomUuid, role: 'student' })
      .count('* as count')
      .first();

    const activeStudents = await this.db('classroom_members')
      .where({ classroom_uuid: classroomUuid, role: 'student', active: true })
      .count('* as count')
      .first();

    const checkpoints = await this.db('checkpoints')
      .where({ classroom_uuid: classroomUuid })
      .count('* as count')
      .first();

    return {
      total_members: parseInt(totalMembers.count),
      active_members: parseInt(activeMembers.count),
      total_students: parseInt(students.count),
      active_students: parseInt(activeStudents.count),
      total_checkpoints: parseInt(checkpoints.count)
    };
  }

  /**
   * Get progress metrics for a classroom
   * @param {string} classroomUuid - Classroom's UUID
   * @returns {Promise<Object>} Progress metrics object
   * @throws {Error} Database query error
   */
  async getProgressMetrics(classroomUuid) {
    // Get total checkpoints and students
    const totalCheckpoints = await this.db('checkpoints')
      .where({ classroom_uuid: classroomUuid })
      .count('* as count')
      .first();

    const totalStudents = await this.db('classroom_members')
      .where({ classroom_uuid: classroomUuid, role: 'student', active: true })
      .count('* as count')
      .first();

    if (parseInt(totalCheckpoints.count) === 0 || parseInt(totalStudents.count) === 0) {
      return {
        total_checkpoints: parseInt(totalCheckpoints.count),
        total_students: parseInt(totalStudents.count),
        average_completion_rate: 0,
        students_no_progress: 0,
        students_completed_all: 0,
        total_progress_entries: 0
      };
    }

    // Get progress completion rates per student
    const studentProgress = await this.db('classroom_members')
      .where({ classroom_uuid: classroomUuid, role: 'student', active: true })
      .select('classroom_members.user_uuid');

    // Get completion counts for each student
    const completionCounts = await this.db('student_checkpoints')
      .join('checkpoints', 'student_checkpoints.checkpoint_uuid', 'checkpoints.uuid')
      .where('checkpoints.classroom_uuid', classroomUuid)
      .select(
        'student_checkpoints.student_uuid',
        this.db.raw('COUNT(*) as completed_checkpoints')
      )
      .groupBy('student_checkpoints.student_uuid');

    // Calculate metrics
    const totalProgressEntries = await this.db('student_checkpoints')
      .join('checkpoints', 'student_checkpoints.checkpoint_uuid', 'checkpoints.uuid')
      .where('checkpoints.classroom_uuid', classroomUuid)
      .count('* as count')
      .first();

    const studentsWithProgress = new Set(completionCounts.map(c => c.student_uuid));
    const studentsNoProgress = parseInt(totalStudents.count) - studentsWithProgress.size;

    const studentsCompletedAll = completionCounts
      .filter(c => parseInt(c.completed_checkpoints) === parseInt(totalCheckpoints.count))
      .length;

    const averageCompletionRate = completionCounts.length > 0
      ? completionCounts.reduce((sum, c) => sum + (parseInt(c.completed_checkpoints) / parseInt(totalCheckpoints.count)), 0) / completionCounts.length
      : 0;

    return {
      total_checkpoints: parseInt(totalCheckpoints.count),
      total_students: parseInt(totalStudents.count),
      average_completion_rate: Math.round(averageCompletionRate * 100) / 100,
      students_no_progress: studentsNoProgress,
      students_completed_all: studentsCompletedAll,
      total_progress_entries: parseInt(totalProgressEntries.count)
    };
  }

  

  /**
   * Get student progress summary for all students in a classroom
   * @param {string} classroomUuid - Classroom's UUID
   * @returns {Promise<Array<Object>>} Array of student progress objects
   * @throws {Error} Database query error
   */
  async getStudentProgressSummary(classroomUuid) {
    const totalCheckpoints = await this.db('checkpoints')
      .where({ classroom_uuid: classroomUuid })
      .count('* as count')
      .first();

    return await this.db('classroom_members')
      .leftJoin('users', 'classroom_members.user_uuid', 'users.uuid')
      .leftJoin(
        this.db.raw('(SELECT student_uuid, COUNT(*) as completed_checkpoints FROM student_checkpoints JOIN checkpoints ON student_checkpoints.checkpoint_uuid = checkpoints.uuid WHERE checkpoints.classroom_uuid = ? GROUP BY student_uuid) as progress', [classroomUuid]),
        'classroom_members.user_uuid',
        'progress.student_uuid'
      )
      .where({
        'classroom_members.classroom_uuid': classroomUuid,
        'classroom_members.role': 'student',
        'classroom_members.active': true
      })
      .select(
        'classroom_members.user_uuid',
        'users.first_name',
        'users.last_name',
        'users.email',
        this.db.raw('COALESCE(progress.completed_checkpoints, 0) as completed_checkpoints'),
        this.db.raw('CASE WHEN COALESCE(progress.completed_checkpoints, 0) = 0 THEN 0 ELSE ROUND((COALESCE(progress.completed_checkpoints, 0) * 100.0 / ?), 2) END as completion_percentage', [parseInt(totalCheckpoints.count)])
      )
      .orderBy('users.last_name', 'asc')
      .orderBy('users.first_name', 'asc');
  }

  /**
   * Get checkpoint completion distribution
   * @param {string} classroomUuid - Classroom's UUID
   * @returns {Promise<Array<Object>>} Array of checkpoint completion objects
   * @throws {Error} Database query error
   */
  async getCheckpointCompletionDistribution(classroomUuid) {
    const activeStudents = await this.db('classroom_members')
      .where({ classroom_uuid: classroomUuid, role: 'student', active: true })
      .count('* as count')
      .first();

    const totalStudents = parseInt(activeStudents.count);

    return await this.db('checkpoints')
      .leftJoin('student_checkpoints', 'checkpoints.uuid', 'student_checkpoints.checkpoint_uuid')
      .where('checkpoints.classroom_uuid', classroomUuid)
      .select(
        'checkpoints.uuid',
        'checkpoints.name',
        'checkpoints.order_index',
        this.db.raw('COUNT(DISTINCT student_checkpoints.student_uuid) as students_reached'),
        this.db.raw('? as total_students', [totalStudents])
      )
      .groupBy('checkpoints.uuid', 'checkpoints.name', 'checkpoints.order_index')
      .orderBy('checkpoints.order_index', 'asc');
  }

  /**
   * Get detailed student engagement metrics for a classroom
   * @param {string} classroomUuid - Classroom's UUID
   * @returns {Promise<Array<Object>>} Array of student engagement objects
   * @throws {Error} Database query error
   */
  async getStudentEngagementMetrics(classroomUuid) {
    // Get all active students with their basic info
    const students = await this.db('classroom_members')
      .join('users', 'classroom_members.user_uuid', 'users.uuid')
      .where({
        'classroom_members.classroom_uuid': classroomUuid,
        'classroom_members.role': 'student',
        'classroom_members.active': true
      })
      .select(
        'classroom_members.user_uuid',
        'users.first_name',
        'users.last_name',
        'users.email'
      )
      .orderBy('users.last_name', 'asc')
      .orderBy('users.first_name', 'asc');

    const engagementMetrics = [];

    for (const student of students) {
      // Check if student is engaged (activity in last week)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const recentActivity = await this.db('feedback')
        .join('checkpoints', 'feedback.classroom_uuid', 'checkpoints.classroom_uuid')
        .where({
          'feedback.student_uuid': student.user_uuid,
          'feedback.classroom_uuid': classroomUuid
        })
        .where('feedback.created_at', '>=', oneWeekAgo)
        .count('* as count')
        .first();

      const recentFeedbackRequests = await this.db('feedback_requests')
        .where({
          'student_uuid': student.user_uuid,
          'classroom_uuid': classroomUuid
        })
        .where('created_at', '>=', oneWeekAgo)
        .count('* as count')
        .first();

      const isEngaged = (parseInt(recentActivity.count) + parseInt(recentFeedbackRequests.count)) > 0;

      // Get current checkpoint (highest order_index reached)
      const currentCheckpoint = await this.db('student_checkpoints')
        .join('checkpoints', 'student_checkpoints.checkpoint_uuid', 'checkpoints.uuid')
        .where({
          'student_checkpoints.student_uuid': student.user_uuid,
          'checkpoints.classroom_uuid': classroomUuid
        })
        .select(
          'checkpoints.name as checkpoint_name',
          'checkpoints.order_index'
        )
        .orderBy('checkpoints.order_index', 'desc')
        .first();

      // Calculate student reactivity (average time to respond to feedback requests)
      const feedbackRequestResponses = await this.db('feedback_requests')
        .leftJoin('feedback', function() {
          this.on('feedback_requests.student_uuid', '=', 'feedback.student_uuid')
            .andOn('feedback_requests.classroom_uuid', '=', 'feedback.classroom_uuid')
            .andOn('feedback.created_at', '>', 'feedback_requests.created_at');
        })
        .where({
          'feedback_requests.student_uuid': student.user_uuid,
          'feedback_requests.classroom_uuid': classroomUuid,
          'feedback_requests.resolved': true
        })
        .select(
          'feedback_requests.created_at as request_time',
          'feedback.created_at as response_time'
        )
        .orderBy('feedback_requests.created_at', 'desc')
        .limit(10);

      let reactivityScore = 0;
      if (feedbackRequestResponses.length > 0) {
        const responseTimes = feedbackRequestResponses
          .filter(fr => fr.response_time)
          .map(fr => {
            const requestTime = new Date(fr.request_time);
            const responseTime = new Date(fr.response_time);
            return (responseTime - requestTime) / (1000 * 60 * 60); // hours
          });

        if (responseTimes.length > 0) {
          const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
          // Convert to score: faster response = higher score (0-100)
          reactivityScore = Math.max(0, Math.min(100, 100 - (avgResponseTime / 24) * 100));
        }
      }

      // Calculate student dedication (based on feedback content length and elaboration)
      const feedbackContent = await this.db('feedback')
        .where({
          'student_uuid': student.user_uuid,
          'classroom_uuid': classroomUuid
        })
        .select('content');

      let dedicationScore = 0;
      if (feedbackContent.length > 0) {
        const totalLength = feedbackContent.reduce((sum, fb) => sum + fb.content.length, 0);
        const avgLength = totalLength / feedbackContent.length;
        
        // Score based on average content length
        // < 50 chars = 0 points, 50-100 = 25 points, 100-200 = 50 points, 200-500 = 75 points, >500 = 100 points
        if (avgLength < 50) dedicationScore = 0;
        else if (avgLength < 100) dedicationScore = 25;
        else if (avgLength < 200) dedicationScore = 50;
        else if (avgLength < 500) dedicationScore = 75;
        else dedicationScore = 100;
      }

      // Calculate overall engagement score (0-100)
      const engagementScore = (
        (isEngaged ? 30 : 0) + // 30% for recent activity
        (currentCheckpoint ? (currentCheckpoint.order_index * 10) : 0) + // 20% for checkpoint progress
        (reactivityScore * 0.3) + // 30% for reactivity
        (dedicationScore * 0.2) // 20% for dedication
      );

      engagementMetrics.push({
        student_uuid: student.user_uuid,
        first_name: student.first_name,
        last_name: student.last_name,
        email: student.email,
        is_engaged: isEngaged,
        current_checkpoint: currentCheckpoint ? currentCheckpoint.checkpoint_name : 'No checkpoints reached',
        current_checkpoint_order: currentCheckpoint ? currentCheckpoint.order_index : 0,
        reactivity_score: Math.round(reactivityScore),
        dedication_score: Math.round(dedicationScore),
        engagement_score: Math.round(engagementScore)
      });
    }

    // Sort by engagement score (lowest first)
    return engagementMetrics.sort((a, b) => a.engagement_score - b.engagement_score);
  }
}

module.exports = ClassroomRepository;
