/**
 * NoteRepository - Data access layer for note-related database operations
 * Handles personal notes for teachers and students
 * @class
 */
class NoteRepository {
  /**
   * Creates an instance of NoteRepository
   * @param {Object} db - Database connection instance (Knex)
   */
  constructor(db) {
    this.db = db;
  }

  /**
   * Find note by UUID
   * @param {string} uuid - Note's unique identifier
   * @returns {Promise<Object|null>} Note object or null if not found
   * @throws {Error} Database query error
   */
  async findByUuid(uuid) {
    return await this.db('notes')
      .where({ uuid })
      .first();
  }

  /**
   * Get all notes for a classroom and user
   * @param {string} classroomUuid - Classroom's UUID
   * @param {string} userUuid - User's UUID
   * @returns {Promise<Array<Object>>} Array of note objects ordered by creation date
   * @throws {Error} Database query error
   */
  async findByClassroomAndUser(classroomUuid, userUuid) {
    return await this.db('notes')
      .where({
        classroom_uuid: classroomUuid,
        user_uuid: userUuid
      })
      .orderBy('created_at', 'desc');
  }

  /**
   * Create a new note
   * @param {Object} noteData - Note data object
   * @param {string} noteData.uuid - Note's UUID
   * @param {string} noteData.classroom_uuid - Classroom's UUID
   * @param {string} noteData.user_uuid - User's UUID
   * @param {string} noteData.content - Note content
   * @returns {Promise<Object>} Created note object
   * @throws {Error} Database insertion error
   */
  async create(noteData) {
    const [note] = await this.db('notes')
      .insert(noteData)
      .returning('*');

    return note;
  }

  /**
   * Update note content
   * @param {string} uuid - Note's UUID
   * @param {string} content - New content
   * @returns {Promise<Object>} Updated note object
   * @throws {Error} Database update error
   */
  async update(uuid, content) {
    const [note] = await this.db('notes')
      .where({ uuid })
      .update({
        content,
        updated_at: this.db.fn.now()
      })
      .returning('*');

    return note;
  }

  /**
   * Delete a note
   * @param {string} uuid - Note's UUID
   * @returns {Promise<number>} Number of rows deleted
   * @throws {Error} Database deletion error
   */
  async delete(uuid) {
    return await this.db('notes')
      .where({ uuid })
      .del();
  }

  /**
   * Check if note belongs to user
   * @param {string} noteUuid - Note's UUID
   * @param {string} userUuid - User's UUID
   * @returns {Promise<boolean>} True if note belongs to user
   * @throws {Error} Database query error
   */
  async belongsToUser(noteUuid, userUuid) {
    const note = await this.db('notes')
      .where({
        uuid: noteUuid,
        user_uuid: userUuid
      })
      .first();

    return note !== undefined;
  }

  /**
   * Get count of notes for a classroom
   * @param {string} classroomUuid - Classroom's UUID
   * @param {string} userUuid - User's UUID
   * @returns {Promise<number>} Count of notes
   * @throws {Error} Database query error
   */
  async countByClassroomAndUser(classroomUuid, userUuid) {
    const result = await this.db('notes')
      .where({
        classroom_uuid: classroomUuid,
        user_uuid: userUuid
      })
      .count('* as count')
      .first();

    return parseInt(result.count);
  }
}

module.exports = NoteRepository;
