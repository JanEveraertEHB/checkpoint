/**
 * CheckpointRepository - Data access layer for checkpoint-related database operations
 * Handles checkpoints and student progress tracking
 * @class
 */
class CheckpointRepository {
  /**
   * Creates an instance of CheckpointRepository
   * @param {Object} db - Database connection instance (Knex)
   */
  constructor(db) {
    this.db = db;
  }

  /**
   * Find checkpoint by UUID
   * @param {string} uuid - Checkpoint's unique identifier
   * @returns {Promise<Object|null>} Checkpoint object or null if not found
   * @throws {Error} Database query error
   */
  async findByUuid(uuid) {
    return await this.db('checkpoints')
      .where({ uuid })
      .first();
  }

  /**
   * Get all checkpoints for a classroom
   * @param {string} classroomUuid - Classroom's UUID
   * @returns {Promise<Array<Object>>} Array of checkpoint objects ordered by order_index
   * @throws {Error} Database query error
   */
  async findByClassroom(classroomUuid) {
    return await this.db('checkpoints')
      .where({ classroom_uuid: classroomUuid })
      .orderBy('order_index', 'asc');
  }

  /**
   * Create a new checkpoint
   * @param {Object} checkpointData - Checkpoint data object
   * @param {string} checkpointData.uuid - Checkpoint's UUID
   * @param {string} checkpointData.classroom_uuid - Classroom's UUID
   * @param {string} checkpointData.title - Checkpoint title
   * @param {string} checkpointData.description - Checkpoint description
   * @param {number} checkpointData.order_index - Order index for sorting
   * @returns {Promise<Object>} Created checkpoint object
   * @throws {Error} Database insertion error
   */
  async create(checkpointData) {
    const [checkpoint] = await this.db('checkpoints')
      .insert(checkpointData)
      .returning('*');

    return checkpoint;
  }

  /**
   * Update a checkpoint
   * @param {string} uuid - Checkpoint's UUID
   * @param {Object} updates - Fields to update
   * @param {string} [updates.title] - Updated title
   * @param {string} [updates.description] - Updated description
   * @param {number} [updates.order_index] - Updated order index
   * @returns {Promise<Object>} Updated checkpoint object
   * @throws {Error} Database update error
   */
  async update(uuid, updates) {
    const [checkpoint] = await this.db('checkpoints')
      .where({ uuid })
      .update({
        ...updates,
        updated_at: this.db.fn.now()
      })
      .returning('*');

    return checkpoint;
  }

  /**
   * Delete a checkpoint
   * @param {string} uuid - Checkpoint's UUID
   * @returns {Promise<number>} Number of rows deleted
   * @throws {Error} Database deletion error
   */
  async delete(uuid) {
    return await this.db('checkpoints')
      .where({ uuid })
      .del();
  }

  /**
   * Update order index for a checkpoint
   * @param {string} uuid - Checkpoint's UUID
   * @param {number} newOrderIndex - New order index
   * @returns {Promise<Object>} Updated checkpoint object
   * @throws {Error} Database update error
   */
  async updateOrderIndex(uuid, newOrderIndex) {
    const [checkpoint] = await this.db('checkpoints')
      .where({ uuid })
      .update({
        order_index: newOrderIndex,
        updated_at: this.db.fn.now()
      })
      .returning('*');

    return checkpoint;
  }

  /**
   * Get student progress entry for a checkpoint
   * @param {string} checkpointUuid - Checkpoint's UUID
   * @param {string} studentUuid - Student's UUID
   * @returns {Promise<Object|null>} Progress object or null if not found
   * @throws {Error} Database query error
   */
  async getStudentProgress(checkpointUuid, studentUuid) {
    return await this.db('checkpoint_progress')
      .where({
        checkpoint_uuid: checkpointUuid,
        student_uuid: studentUuid
      })
      .first();
  }

  /**
   * Mark checkpoint as reached by student
   * @param {Object} progressData - Progress data object
   * @param {string} progressData.uuid - Progress entry UUID
   * @param {string} progressData.checkpoint_uuid - Checkpoint's UUID
   * @param {string} progressData.student_uuid - Student's UUID
   * @param {string} progressData.marked_by_uuid - Teacher's UUID who marked it
   * @returns {Promise<Object>} Created progress object
   * @throws {Error} Database insertion error
   */
  async markAsReached(progressData) {
    const [progress] = await this.db('checkpoint_progress')
      .insert(progressData)
      .returning('*');

    return progress;
  }

  /**
   * Unmark checkpoint as reached (delete progress entry)
   * @param {string} checkpointUuid - Checkpoint's UUID
   * @param {string} studentUuid - Student's UUID
   * @returns {Promise<number>} Number of rows deleted
   * @throws {Error} Database deletion error
   */
  async unmarkAsReached(checkpointUuid, studentUuid) {
    return await this.db('checkpoint_progress')
      .where({
        checkpoint_uuid: checkpointUuid,
        student_uuid: studentUuid
      })
      .del();
  }

  /**
   * Get all progress for a student in a classroom
   * @param {string} classroomUuid - Classroom's UUID
   * @param {string} studentUuid - Student's UUID
   * @returns {Promise<Array<Object>>} Array of checkpoint objects with progress info
   * @throws {Error} Database query error
   */
  async getStudentProgressByClassroom(classroomUuid, studentUuid) {
    return await this.db('checkpoints')
      .leftJoin('checkpoint_progress', function() {
        this.on('checkpoints.uuid', '=', 'checkpoint_progress.checkpoint_uuid')
          .andOn('checkpoint_progress.student_uuid', '=', this.db.raw('?', [studentUuid]));
      })
      .where('checkpoints.classroom_uuid', classroomUuid)
      .select(
        'checkpoints.*',
        'checkpoint_progress.reached_at',
        'checkpoint_progress.marked_by_uuid'
      )
      .orderBy('checkpoints.order_index', 'asc');
  }

  /**
   * Check if any student has reached any checkpoint in a classroom
   * @param {string} classroomUuid - Classroom's UUID
   * @returns {Promise<boolean>} True if any progress exists
   * @throws {Error} Database query error
   */
  async hasAnyProgress(classroomUuid) {
    const count = await this.db('checkpoint_progress')
      .join('checkpoints', 'checkpoint_progress.checkpoint_uuid', 'checkpoints.uuid')
      .where('checkpoints.classroom_uuid', classroomUuid)
      .count('* as count')
      .first();

    return parseInt(count.count) > 0;
  }

  /**
   * Get all progress entries for checkpoints in a classroom
   * @param {string} classroomUuid - Classroom's UUID
   * @returns {Promise<Array<Object>>} Array of progress objects
   * @throws {Error} Database query error
   */
  async getAllProgressByClassroom(classroomUuid) {
    return await this.db('checkpoint_progress')
      .join('checkpoints', 'checkpoint_progress.checkpoint_uuid', 'checkpoints.uuid')
      .where('checkpoints.classroom_uuid', classroomUuid)
      .select('checkpoint_progress.*');
  }

  /**
   * Get the maximum order index in a classroom
   * @param {string} classroomUuid - Classroom's UUID
   * @returns {Promise<number>} Maximum order index (or 0 if no checkpoints)
   * @throws {Error} Database query error
   */
  async getMaxOrderIndex(classroomUuid) {
    const result = await this.db('checkpoints')
      .where({ classroom_uuid: classroomUuid })
      .max('order_index as maxIndex')
      .first();

    return result.maxIndex || 0;
  }

  /**
   * Delete all progress entries for a checkpoint
   * @param {string} checkpointUuid - Checkpoint's UUID
   * @returns {Promise<number>} Number of rows deleted
   * @throws {Error} Database deletion error
   */
  async deleteAllProgress(checkpointUuid) {
    return await this.db('checkpoint_progress')
      .where({ checkpoint_uuid: checkpointUuid })
      .del();
  }
}

module.exports = CheckpointRepository;
