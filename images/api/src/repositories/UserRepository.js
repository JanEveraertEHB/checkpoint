/**
 * UserRepository - Data access layer for user-related database operations
 * Implements the Repository pattern to abstract database operations
 * @class
 */
class UserRepository {
  /**
   * Creates an instance of UserRepository
   * @param {Object} db - Database connection instance (Knex)
   */
  constructor(db) {
    this.db = db;
  }

  /**
   * Find a user by email address
   * @param {string} email - User's email address
   * @returns {Promise<Object|null>} User object or null if not found
   * @throws {Error} Database query error
   */
  async findByEmail(email) {
    const users = await this.db('users')
      .select('*')
      .where({ email });

    return users.length > 0 ? users[0] : null;
  }

  /**
   * Find a user by UUID
   * @param {string} uuid - User's unique identifier
   * @returns {Promise<Object|null>} User object or null if not found
   * @throws {Error} Database query error
   */
  async findByUuid(uuid) {
    return await this.db('users')
      .where({ uuid })
      .first();
  }

  /**
   * Create a new user
   * @param {Object} userData - User data object
   * @param {string} userData.uuid - User's UUID
   * @param {string} userData.email - User's email
   * @param {string} userData.password - Hashed password
   * @param {string} userData.first_name - User's first name
   * @param {string} userData.last_name - User's last name
   * @param {string} [userData.user_type='student'] - User type (student or teacher)
   * @returns {Promise<Object>} Created user object
   * @throws {Error} Database insertion error
   */
  async create(userData) {
    const [user] = await this.db('users')
      .insert(userData)
      .returning('*');

    return user;
  }

  /**
   * Update user profile information
   * @param {string} uuid - User's UUID
   * @param {Object} updates - Fields to update
   * @param {string} [updates.first_name] - Updated first name
   * @param {string} [updates.last_name] - Updated last name
   * @param {string} [updates.email] - Updated email
   * @param {string} [updates.date_of_birth] - Updated date of birth
   * @param {string} [updates.user_type] - Updated user type (student or teacher)
   * @returns {Promise<Object>} Updated user object
   * @throws {Error} Database update error
   */
  async updateProfile(uuid, updates) {
    const [user] = await this.db('users')
      .where({ uuid })
      .update({
        ...updates,
        updated_at: this.db.fn.now()
      })
      .returning('*');

    return user;
  }

  /**
   * Update user password
   * @param {string} uuid - User's UUID
   * @param {string} hashedPassword - New hashed password
   * @returns {Promise<Object>} Updated user object
   * @throws {Error} Database update error
   */
  async updatePassword(uuid, hashedPassword) {
    const [user] = await this.db('users')
      .where({ uuid })
      .update({
        password: hashedPassword,
        updated_at: this.db.fn.now()
      })
      .returning('*');

    return user;
  }

  /**
   * Soft delete a user account (anonymize data)
   * @param {string} uuid - User's UUID
   * @param {Object} trx - Database transaction object
   * @returns {Promise<void>}
   * @throws {Error} Database update error
   */
  async softDelete(uuid, trx) {
    const dbContext = trx || this.db;
    const { v4: uuidv4 } = require('uuid');

    await dbContext('users')
      .where({ uuid })
      .update({
        first_name: '[Deleted]',
        last_name: 'User',
        email: `deleted_${uuid}@deleted.local`,
        password: await require('bcrypt').hash(uuidv4(), 10),
        deleted_at: dbContext.fn.now(),
        date_of_birth: null
      });
  }

  /**
   * Check if user exists by email
   * @param {string} email - Email to check
   * @returns {Promise<boolean>} True if user exists
   * @throws {Error} Database query error
   */
  async existsByEmail(email) {
    const count = await this.db('users')
      .where({ email })
      .count('* as count')
      .first();

    return parseInt(count.count) > 0;
  }

  /**
   * Check if user is deleted
   * @param {string} uuid - User's UUID
   * @returns {Promise<boolean>} True if user is deleted
   * @throws {Error} Database query error
   */
  async isDeleted(uuid) {
    const user = await this.db('users')
      .where({ uuid })
      .select('deleted_at')
      .first();

    return user && user.deleted_at !== null;
  }

  /**
   * Get all feedback for a user
   * @param {string} uuid - User's UUID
   * @returns {Promise<Array<Object>>} Array of feedback objects
   * @throws {Error} Database query error
   */
  async getUserFeedback(uuid) {
    return await this.db('feedback')
      .where({ student_uuid: uuid });
  }

  /**
   * Get all classroom memberships for a user
   * @param {string} uuid - User's UUID
   * @returns {Promise<Array<Object>>} Array of membership objects
   * @throws {Error} Database query error
   */
  async getUserMemberships(uuid) {
    return await this.db('classroom_members')
      .where({ user_uuid: uuid });
  }
}

module.exports = UserRepository;
