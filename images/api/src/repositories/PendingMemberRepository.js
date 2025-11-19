/**
 * PendingMemberRepository - Data access layer for pending classroom member operations
 * Handles pre-registered students who haven't created accounts yet
 * @class
 */
class PendingMemberRepository {
  /**
   * Creates an instance of PendingMemberRepository
   * @param {Object} db - Database connection instance (Knex)
   */
  constructor(db) {
    this.db = db;
  }

  /**
   * Add a pending member to a classroom
   * @param {string} classroom_uuid - Classroom UUID
   * @param {string} email - Student email address
   * @returns {Promise<Object>} Created pending member object
   * @throws {Error} Database insertion error
   */
  async create(classroom_uuid, email) {
    const [pendingMember] = await this.db('pending_classroom_members')
      .insert({ classroom_uuid, email: email.toLowerCase() })
      .returning('*');

    return pendingMember;
  }

  /**
   * Add multiple pending members to a classroom
   * @param {string} classroom_uuid - Classroom UUID
   * @param {string[]} emails - Array of student email addresses
   * @param {Object} trx - Optional transaction object
   * @returns {Promise<Object[]>} Array of created pending member objects
   * @throws {Error} Database insertion error
   */
  async createBulk(classroom_uuid, emails, trx) {
    const dbContext = trx || this.db;

    const pendingMembers = emails.map(email => ({
      classroom_uuid,
      email: email.toLowerCase()
    }));

    const inserted = await dbContext('pending_classroom_members')
      .insert(pendingMembers)
      .onConflict(['classroom_uuid', 'email'])
      .ignore() // Ignore duplicates
      .returning('*');

    return inserted;
  }

  /**
   * Get all pending members for a classroom
   * @param {string} classroom_uuid - Classroom UUID
   * @returns {Promise<Object[]>} Array of pending member objects
   * @throws {Error} Database query error
   */
  async getByClassroom(classroom_uuid) {
    return await this.db('pending_classroom_members')
      .where({ classroom_uuid })
      .orderBy('created_at', 'asc');
  }

  /**
   * Get all pending classroom memberships for an email
   * @param {string} email - Email address
   * @returns {Promise<Object[]>} Array of pending member objects with classroom info
   * @throws {Error} Database query error
   */
  async getByEmail(email) {
    return await this.db('pending_classroom_members')
      .where({ email: email.toLowerCase() })
      .select('*');
  }

  /**
   * Remove a pending member
   * @param {string} classroom_uuid - Classroom UUID
   * @param {string} email - Student email address
   * @param {Object} trx - Optional transaction object
   * @returns {Promise<number>} Number of rows deleted
   * @throws {Error} Database deletion error
   */
  async remove(classroom_uuid, email, trx) {
    const dbContext = trx || this.db;

    return await dbContext('pending_classroom_members')
      .where({ classroom_uuid, email: email.toLowerCase() })
      .delete();
  }

  /**
   * Remove all pending memberships for an email (used after successful registration)
   * @param {string} email - Email address
   * @param {Object} trx - Optional transaction object
   * @returns {Promise<number>} Number of rows deleted
   * @throws {Error} Database deletion error
   */
  async removeByEmail(email, trx) {
    const dbContext = trx || this.db;

    return await dbContext('pending_classroom_members')
      .where({ email: email.toLowerCase() })
      .delete();
  }

  /**
   * Check if an email is pending in a classroom
   * @param {string} classroom_uuid - Classroom UUID
   * @param {string} email - Email address
   * @returns {Promise<boolean>} True if pending
   * @throws {Error} Database query error
   */
  async exists(classroom_uuid, email) {
    const result = await this.db('pending_classroom_members')
      .where({ classroom_uuid, email: email.toLowerCase() })
      .count('* as count')
      .first();

    return parseInt(result.count) > 0;
  }
}

module.exports = PendingMemberRepository;
