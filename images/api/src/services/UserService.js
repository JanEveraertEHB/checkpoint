const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

/**
 * UserService - Business logic layer for user-related operations
 * Implements Single Responsibility Principle by separating business logic from HTTP layer
 * @class
 */
class UserService {
  /**
   * Creates an instance of UserService
   * @param {Object} userRepository - UserRepository instance
   * @param {Object} classroomRepository - ClassroomRepository instance
   * @param {Object} feedbackRepository - FeedbackRepository instance
   * @param {Object} fileStorageService - FileStorageService instance
   * @param {Object} db - Database instance (for transactions)
   * @param {Object} config - Configuration object
   * @param {string} config.jwtSecret - JWT secret key
   * @param {number} config.saltRounds - Bcrypt salt rounds
   */
  constructor(userRepository, classroomRepository, feedbackRepository, fileStorageService, db, config) {
    this.userRepository = userRepository;
    this.classroomRepository = classroomRepository;
    this.feedbackRepository = feedbackRepository;
    this.fileStorageService = fileStorageService;
    this.db = db;
    this.config = config;
  }

  /**
   * Authenticate user and generate JWT token
   * @param {string} email - User's email
   * @param {string} password - User's password (plaintext)
   * @returns {Promise<Object>} Object containing user data and token
   * @throws {Error} Authentication error
   */
  async login(email, password) {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    if (user.deleted_at) {
      const error = new Error('This account has been deleted');
      error.statusCode = 403;
      throw error;
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    const token = jwt.sign(
      { uuid: user.uuid, email: user.email, user_type: user.user_type },
      this.config.jwtSecret,
      { expiresIn: '7d' }
    );

    // Don't return password
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token
    };
  }

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @param {string} userData.email - User's email
   * @param {string} userData.password - User's password (plaintext)
   * @param {string} userData.first_name - User's first name
   * @param {string} userData.last_name - User's last name
   * @param {string} [userData.user_type='student'] - User type (student or teacher)
   * @returns {Promise<Object>} Object containing created user and token
   * @throws {Error} Registration error
   */
  async register(userData) {
    const { email, password, first_name, last_name, user_type } = userData;

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(email);

    if (existingUser) {
      const error = new Error('User with this email already exists');
      error.statusCode = 409;
      throw error;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, this.config.saltRounds);

    // Create user
    const newUser = await this.userRepository.create({
      uuid: uuidv4(),
      email,
      password: hashedPassword,
      first_name,
      last_name,
      user_type: user_type || 'student'
    });

    // Generate token
    const token = jwt.sign(
      { uuid: newUser.uuid, email: newUser.email, first_name: newUser.first_name, last_name: newUser.last_name, user_type: newUser.user_type },
      this.config.jwtSecret,
      { expiresIn: '7d' }
    );

    // Don't return password
    const { password: _, ...userWithoutPassword } = newUser;

    return {
      user: userWithoutPassword,
      token
    };
  }

  /**
   * Get user profile
   * @param {string} uuid - User's UUID
   * @returns {Promise<Object>} User object without password
   * @throws {Error} User not found error
   */
  async getProfile(uuid) {
    const user = await this.userRepository.findByUuid(uuid);

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // Don't return password
    const { password: _, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }

  /**
   * Update user profile
   * @param {string} uuid - User's UUID
   * @param {Object} updates - Profile updates
   * @param {string} [updates.first_name] - Updated first name
   * @param {string} [updates.last_name] - Updated last name
   * @param {string} [updates.email] - Updated email
   * @param {string} [updates.date_of_birth] - Updated date of birth
   * @param {string} [updates.user_type] - Updated user type (student or teacher)
   * @returns {Promise<Object>} Updated user object without password and token
   * @throws {Error} Update error
   */
  async updateProfile(uuid, updates) {
    // If email is being updated, check if it's already taken
    if (updates.email) {
      const existingUser = await this.userRepository.findByEmail(updates.email);

      if (existingUser && existingUser.uuid !== uuid) {
        const error = new Error('Email is already taken');
        error.statusCode = 409;
        throw error;
      }
    }

    const updatedUser = await this.userRepository.updateProfile(uuid, updates);

    if (!updatedUser) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // Generate new token with updated info
    const token = jwt.sign(
      { uuid: updatedUser.uuid, email: updatedUser.email, first_name: updatedUser.first_name, last_name: updatedUser.last_name, user_type: updatedUser.user_type },
      this.config.jwtSecret,
      { expiresIn: '7d' }
    );

    // Don't return password
    const { password: _, ...userWithoutPassword } = updatedUser;

    return {
      user: userWithoutPassword,
      token
    };
  }

  /**
   * Change user password
   * @param {string} uuid - User's UUID
   * @param {string} currentPassword - Current password (plaintext)
   * @param {string} newPassword - New password (plaintext)
   * @returns {Promise<void>}
   * @throws {Error} Password change error
   */
  async changePassword(uuid, currentPassword, newPassword) {
    const user = await this.userRepository.findByUuid(uuid);

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.password);

    if (!validPassword) {
      const error = new Error('Current password is incorrect');
      error.statusCode = 401;
      throw error;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, this.config.saltRounds);

    // Update password
    await this.userRepository.updatePassword(uuid, hashedPassword);
  }

  /**
   * Delete user account (soft delete with anonymization)
   * @param {string} uuid - User's UUID
   * @returns {Promise<void>}
   * @throws {Error} Deletion error
   */
  async deleteAccount(uuid) {
    const user = await this.userRepository.findByUuid(uuid);

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    if (user.deleted_at) {
      const error = new Error('User not found or already deleted');
      error.statusCode = 404;
      throw error;
    }

    // Perform deletion in a transaction
    await this.db.transaction(async (trx) => {
      // Anonymize user data
      await this.userRepository.softDelete(uuid, trx);

      // Anonymize feedback content
      await this.feedbackRepository.anonymizeFeedbackContent(uuid, trx);

      // Get and delete feedback images
      const images = await this.feedbackRepository.deleteStudentFeedbackImages(uuid, trx);
      const imagePaths = images.map(img => img.file_path);

      // Get and delete feedback documents
      const documents = await this.feedbackRepository.deleteStudentFeedbackDocuments(uuid, trx);
      const documentPaths = documents.map(doc => doc.file_path);

      // Deactivate classroom memberships
      await this.classroomRepository.deactivateUserMemberships(uuid, trx);

      // Delete feedback requests
      await this.feedbackRepository.deleteStudentRequests(uuid, trx);

      // Delete feedback demands
      await this.feedbackRepository.deleteStudentDemands(uuid, trx);

      // Delete files from storage (outside transaction since it's filesystem operation)
      // We'll do this after transaction commits
      trx.afterCommit = async () => {
        if (imagePaths.length > 0 || documentPaths.length > 0) {
          await this.fileStorageService.deleteFiles([...imagePaths, ...documentPaths]);
        }
      };
    });
  }

  /**
   * Validate JWT token
   * @param {string} token - JWT token
   * @returns {Object} Decoded token payload
   * @throws {Error} Invalid token error
   */
  validateToken(token) {
    try {
      return jwt.verify(token, this.config.jwtSecret);
    } catch (error) {
      const err = new Error('Invalid or expired token');
      err.statusCode = 401;
      throw err;
    }
  }

  /**
   * Check if email is available
   * @param {string} email - Email to check
   * @returns {Promise<boolean>} True if email is available
   */
  async isEmailAvailable(email) {
    const exists = await this.userRepository.existsByEmail(email);
    return !exists;
  }

  /**
   * Check if user is deleted
   * @param {string} uuid - User's UUID
   * @returns {Promise<boolean>} True if user is deleted
   */
  async isDeleted(uuid) {
    return await this.userRepository.isDeleted(uuid);
  }
}

module.exports = UserService;
