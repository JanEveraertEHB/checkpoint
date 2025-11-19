/**
 * AuthorizationService - Centralizes authorization logic for role-based access control
 * Implements Single Responsibility Principle by separating authorization concerns
 * @class
 */
class AuthorizationService {
  /**
   * Creates an instance of AuthorizationService
   * @param {Object} classroomRepository - ClassroomRepository instance
   */
  constructor(classroomRepository) {
    this.classroomRepository = classroomRepository;
  }

  /**
   * Check if user is a teacher in a classroom
   * @param {string} classroomUuid - Classroom's UUID
   * @param {string} userUuid - User's UUID
   * @returns {Promise<boolean>} True if user is a teacher
   * @throws {Error} Database query error
   */
  async isTeacher(classroomUuid, userUuid) {
    return await this.classroomRepository.isTeacher(classroomUuid, userUuid);
  }

  /**
   * Check if user is a student in a classroom
   * @param {string} classroomUuid - Classroom's UUID
   * @param {string} userUuid - User's UUID
   * @returns {Promise<boolean>} True if user is a student
   * @throws {Error} Database query error
   */
  async isStudent(classroomUuid, userUuid) {
    return await this.classroomRepository.isStudent(classroomUuid, userUuid);
  }

  /**
   * Check if user is an active member of a classroom
   * @param {string} classroomUuid - Classroom's UUID
   * @param {string} userUuid - User's UUID
   * @returns {Promise<boolean>} True if user is an active member
   * @throws {Error} Database query error
   */
  async isActiveMember(classroomUuid, userUuid) {
    return await this.classroomRepository.isActiveMember(classroomUuid, userUuid);
  }

  /**
   * Check if user is a member (teacher or student) of a classroom
   * @param {string} classroomUuid - Classroom's UUID
   * @param {string} userUuid - User's UUID
   * @returns {Promise<boolean>} True if user is a member
   * @throws {Error} Database query error
   */
  async isMember(classroomUuid, userUuid) {
    const membership = await this.classroomRepository.getMembership(classroomUuid, userUuid);
    return membership !== null && membership !== undefined;
  }

  /**
   * Require user to be a teacher in a classroom (throws error if not)
   * @param {string} classroomUuid - Classroom's UUID
   * @param {string} userUuid - User's UUID
   * @param {string} [message='Only teachers can perform this action'] - Custom error message
   * @returns {Promise<void>}
   * @throws {AuthorizationError} If user is not a teacher
   */
  async requireTeacher(classroomUuid, userUuid, message = 'Only teachers can perform this action') {
    const isTeacher = await this.isTeacher(classroomUuid, userUuid);
    if (!isTeacher) {
      const error = new Error(message);
      error.name = 'AuthorizationError';
      error.statusCode = 403;
      throw error;
    }
  }

  /**
   * Require user to be a student in a classroom (throws error if not)
   * @param {string} classroomUuid - Classroom's UUID
   * @param {string} userUuid - User's UUID
   * @param {string} [message='Only students can perform this action'] - Custom error message
   * @returns {Promise<void>}
   * @throws {AuthorizationError} If user is not a student
   */
  async requireStudent(classroomUuid, userUuid, message = 'Only students can perform this action') {
    const isStudent = await this.isStudent(classroomUuid, userUuid);
    if (!isStudent) {
      const error = new Error(message);
      error.name = 'AuthorizationError';
      error.statusCode = 403;
      throw error;
    }
  }

  /**
   * Require user to be an active member of a classroom (throws error if not)
   * @param {string} classroomUuid - Classroom's UUID
   * @param {string} userUuid - User's UUID
   * @param {string} [message='You must be an active member of this classroom'] - Custom error message
   * @returns {Promise<void>}
   * @throws {AuthorizationError} If user is not an active member
   */
  async requireActiveMember(classroomUuid, userUuid, message = 'You must be an active member of this classroom') {
    const isActive = await this.isActiveMember(classroomUuid, userUuid);
    if (!isActive) {
      const error = new Error(message);
      error.name = 'AuthorizationError';
      error.statusCode = 403;
      throw error;
    }
  }

  /**
   * Require user to be a member of a classroom (throws error if not)
   * @param {string} classroomUuid - Classroom's UUID
   * @param {string} userUuid - User's UUID
   * @param {string} [message='You must be a member of this classroom'] - Custom error message
   * @returns {Promise<void>}
   * @throws {AuthorizationError} If user is not a member
   */
  async requireMember(classroomUuid, userUuid, message = 'You must be a member of this classroom') {
    const isMember = await this.isMember(classroomUuid, userUuid);
    if (!isMember) {
      const error = new Error(message);
      error.name = 'AuthorizationError';
      error.statusCode = 403;
      throw error;
    }
  }

  /**
   * Get user's role in a classroom
   * @param {string} classroomUuid - Classroom's UUID
   * @param {string} userUuid - User's UUID
   * @returns {Promise<string|null>} User's role ('teacher' or 'student') or null if not a member
   * @throws {Error} Database query error
   */
  async getUserRole(classroomUuid, userUuid) {
    const membership = await this.classroomRepository.getMembership(classroomUuid, userUuid);
    return membership ? membership.role : null;
  }

  /**
   * Get user's membership details in a classroom
   * @param {string} classroomUuid - Classroom's UUID
   * @param {string} userUuid - User's UUID
   * @returns {Promise<Object|null>} Membership object or null if not a member
   * @throws {Error} Database query error
   */
  async getMembership(classroomUuid, userUuid) {
    return await this.classroomRepository.getMembership(classroomUuid, userUuid);
  }

  /**
   * Check if user owns a resource
   * @param {string} resourceOwnerUuid - UUID of the resource owner
   * @param {string} userUuid - Current user's UUID
   * @returns {boolean} True if user owns the resource
   */
  isOwner(resourceOwnerUuid, userUuid) {
    return resourceOwnerUuid === userUuid;
  }

  /**
   * Require user to own a resource (throws error if not)
   * @param {string} resourceOwnerUuid - UUID of the resource owner
   * @param {string} userUuid - Current user's UUID
   * @param {string} [message='You do not have permission to access this resource'] - Custom error message
   * @returns {void}
   * @throws {AuthorizationError} If user does not own the resource
   */
  requireOwnership(resourceOwnerUuid, userUuid, message = 'You do not have permission to access this resource') {
    if (!this.isOwner(resourceOwnerUuid, userUuid)) {
      const error = new Error(message);
      error.name = 'AuthorizationError';
      error.statusCode = 403;
      throw error;
    }
  }
}

module.exports = AuthorizationService;
