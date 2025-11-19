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
   * @param {string} membershipData.uuid - Membership UUID
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
   * @param {string} membershipUuid - Membership UUID
   * @param {boolean} active - New active status
   * @returns {Promise<Object>} Updated membership object
   * @throws {Error} Database update error
   */
  async updateMembershipStatus(membershipUuid, active) {
    const [membership] = await this.db('classroom_members')
      .where({ uuid: membershipUuid })
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
}

module.exports = ClassroomRepository;
