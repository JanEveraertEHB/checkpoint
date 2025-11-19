const { v4: uuidv4 } = require('uuid');

/**
 * CheckpointService - Business logic layer for checkpoint-related operations
 * Handles checkpoint management and student progress tracking
 * @class
 */
class CheckpointService {
  /**
   * Creates an instance of CheckpointService
   * @param {Object} checkpointRepository - CheckpointRepository instance
   * @param {Object} classroomRepository - ClassroomRepository instance
   * @param {Object} authorizationService - AuthorizationService instance
   */
  constructor(checkpointRepository, classroomRepository, authorizationService) {
    this.checkpointRepository = checkpointRepository;
    this.classroomRepository = classroomRepository;
    this.authorizationService = authorizationService;
  }

  /**
   * Get all checkpoints for a classroom
   * @param {string} classroomUuid - Classroom's UUID
   * @param {string} userUuid - User's UUID (for authorization)
   * @returns {Promise<Array<Object>>} Array of checkpoint objects
   * @throws {Error} Authorization error
   */
  async getClassroomCheckpoints(classroomUuid, userUuid) {
    // User must be a member
    await this.authorizationService.requireMember(classroomUuid, userUuid);

    return await this.checkpointRepository.findByClassroom(classroomUuid);
  }

  /**
   * Check if any student has reached any checkpoint in a classroom
   * @param {string} classroomUuid - Classroom's UUID
   * @param {string} userUuid - User's UUID (for authorization)
   * @returns {Promise<boolean>} True if any progress exists
   * @throws {Error} Authorization error
   */
  async hasAnyProgress(classroomUuid, userUuid) {
    // User must be a member
    await this.authorizationService.requireMember(classroomUuid, userUuid);

    return await this.checkpointRepository.hasAnyProgress(classroomUuid);
  }

  /**
   * Create a new checkpoint (teacher only)
   * @param {Object} checkpointData - Checkpoint data
   * @param {string} checkpointData.classroom_uuid - Classroom's UUID
   * @param {string} checkpointData.title - Checkpoint title
   * @param {string} checkpointData.description - Checkpoint description
   * @param {string} userUuid - User's UUID
   * @returns {Promise<Object>} Created checkpoint object
   * @throws {Error} Authorization or validation error
   */
  async createCheckpoint(checkpointData, userUuid) {
    const { classroom_uuid, title, description } = checkpointData;

    // Only teachers can create checkpoints
    await this.authorizationService.requireTeacher(classroom_uuid, userUuid);

    // Check if classroom is completed
    const isCompleted = await this.classroomRepository.isCompleted(classroom_uuid);
    if (isCompleted) {
      const error = new Error('Cannot create checkpoints in a completed classroom');
      error.statusCode = 400;
      throw error;
    }

    // Get the next order index
    const maxOrderIndex = await this.checkpointRepository.getMaxOrderIndex(classroom_uuid);

    // Create checkpoint
    return await this.checkpointRepository.create({
      uuid: uuidv4(),
      classroom_uuid,
      title,
      description,
      order_index: maxOrderIndex + 1
    });
  }

  /**
   * Update a checkpoint (teacher only)
   * @param {string} checkpointUuid - Checkpoint's UUID
   * @param {Object} updates - Fields to update
   * @param {string} [updates.title] - Updated title
   * @param {string} [updates.description] - Updated description
   * @param {string} userUuid - User's UUID
   * @returns {Promise<Object>} Updated checkpoint object
   * @throws {Error} Authorization or not found error
   */
  async updateCheckpoint(checkpointUuid, updates, userUuid) {
    const checkpoint = await this.checkpointRepository.findByUuid(checkpointUuid);

    if (!checkpoint) {
      const error = new Error('Checkpoint not found');
      error.statusCode = 404;
      throw error;
    }

    // Only teachers can update checkpoints
    await this.authorizationService.requireTeacher(checkpoint.classroom_uuid, userUuid);

    // Check if classroom is completed
    const isCompleted = await this.classroomRepository.isCompleted(checkpoint.classroom_uuid);
    if (isCompleted) {
      const error = new Error('Cannot update checkpoints in a completed classroom');
      error.statusCode = 400;
      throw error;
    }

    return await this.checkpointRepository.update(checkpointUuid, updates);
  }

  /**
   * Delete a checkpoint (teacher only)
   * @param {string} checkpointUuid - Checkpoint's UUID
   * @param {string} userUuid - User's UUID
   * @returns {Promise<void>}
   * @throws {Error} Authorization or not found error
   */
  async deleteCheckpoint(checkpointUuid, userUuid) {
    const checkpoint = await this.checkpointRepository.findByUuid(checkpointUuid);

    if (!checkpoint) {
      const error = new Error('Checkpoint not found');
      error.statusCode = 404;
      throw error;
    }

    // Only teachers can delete checkpoints
    await this.authorizationService.requireTeacher(checkpoint.classroom_uuid, userUuid);

    // Check if classroom is completed
    const isCompleted = await this.classroomRepository.isCompleted(checkpoint.classroom_uuid);
    if (isCompleted) {
      const error = new Error('Cannot delete checkpoints in a completed classroom');
      error.statusCode = 400;
      throw error;
    }

    // Check if any student has reached this checkpoint
    const hasProgress = await this.checkpointRepository.hasAnyProgress(checkpoint.classroom_uuid);
    if (hasProgress) {
      const error = new Error('Cannot delete checkpoint that has student progress');
      error.statusCode = 400;
      throw error;
    }

    await this.checkpointRepository.delete(checkpointUuid);
  }

  /**
   * Reorder a checkpoint (teacher only)
   * @param {string} checkpointUuid - Checkpoint's UUID
   * @param {number} newOrderIndex - New order index
   * @param {string} userUuid - User's UUID
   * @returns {Promise<Object>} Updated checkpoint object
   * @throws {Error} Authorization or validation error
   */
  async reorderCheckpoint(checkpointUuid, newOrderIndex, userUuid) {
    const checkpoint = await this.checkpointRepository.findByUuid(checkpointUuid);

    if (!checkpoint) {
      const error = new Error('Checkpoint not found');
      error.statusCode = 404;
      throw error;
    }

    // Only teachers can reorder checkpoints
    await this.authorizationService.requireTeacher(checkpoint.classroom_uuid, userUuid);

    // Check if classroom is completed
    const isCompleted = await this.classroomRepository.isCompleted(checkpoint.classroom_uuid);
    if (isCompleted) {
      const error = new Error('Cannot reorder checkpoints in a completed classroom');
      error.statusCode = 400;
      throw error;
    }

    return await this.checkpointRepository.updateOrderIndex(checkpointUuid, newOrderIndex);
  }

  /**
   * Mark checkpoint as reached by student (teacher only)
   * @param {string} checkpointUuid - Checkpoint's UUID
   * @param {string} studentUuid - Student's UUID
   * @param {string} teacherUuid - Teacher's UUID
   * @returns {Promise<Object>} Created progress object
   * @throws {Error} Authorization or validation error
   */
  async markCheckpointReached(checkpointUuid, studentUuid, teacherUuid) {
    const checkpoint = await this.checkpointRepository.findByUuid(checkpointUuid);

    if (!checkpoint) {
      const error = new Error('Checkpoint not found');
      error.statusCode = 404;
      throw error;
    }

    // Only teachers can mark checkpoints
    await this.authorizationService.requireTeacher(checkpoint.classroom_uuid, teacherUuid);

    // Verify student is a member of the classroom
    const isStudent = await this.authorizationService.isStudent(checkpoint.classroom_uuid, studentUuid);
    if (!isStudent) {
      const error = new Error('Student is not a member of this classroom');
      error.statusCode = 400;
      throw error;
    }

    // Verify student is active
    const isActive = await this.authorizationService.isActiveMember(checkpoint.classroom_uuid, studentUuid);
    if (!isActive) {
      const error = new Error('Student is not an active member of this classroom');
      error.statusCode = 400;
      throw error;
    }

    // Check if already marked
    const existingProgress = await this.checkpointRepository.getStudentProgress(checkpointUuid, studentUuid);
    if (existingProgress) {
      const error = new Error('Student has already reached this checkpoint');
      error.statusCode = 400;
      throw error;
    }

    return await this.checkpointRepository.markAsReached({
      uuid: uuidv4(),
      checkpoint_uuid: checkpointUuid,
      student_uuid: studentUuid,
      marked_by_uuid: teacherUuid
    });
  }

  /**
   * Unmark checkpoint as reached (teacher only)
   * @param {string} checkpointUuid - Checkpoint's UUID
   * @param {string} studentUuid - Student's UUID
   * @param {string} teacherUuid - Teacher's UUID
   * @returns {Promise<void>}
   * @throws {Error} Authorization or not found error
   */
  async unmarkCheckpointReached(checkpointUuid, studentUuid, teacherUuid) {
    const checkpoint = await this.checkpointRepository.findByUuid(checkpointUuid);

    if (!checkpoint) {
      const error = new Error('Checkpoint not found');
      error.statusCode = 404;
      throw error;
    }

    // Only teachers can unmark checkpoints
    await this.authorizationService.requireTeacher(checkpoint.classroom_uuid, teacherUuid);

    // Check if marked
    const existingProgress = await this.checkpointRepository.getStudentProgress(checkpointUuid, studentUuid);
    if (!existingProgress) {
      const error = new Error('Student has not reached this checkpoint');
      error.statusCode = 404;
      throw error;
    }

    await this.checkpointRepository.unmarkAsReached(checkpointUuid, studentUuid);
  }

  /**
   * Get student progress in a classroom
   * @param {string} classroomUuid - Classroom's UUID
   * @param {string} studentUuid - Student's UUID
   * @param {string} userUuid - User's UUID (for authorization)
   * @returns {Promise<Array<Object>>} Array of checkpoint objects with progress info
   * @throws {Error} Authorization error
   */
  async getStudentProgress(classroomUuid, studentUuid, userUuid) {
    // User must be a member
    await this.authorizationService.requireMember(classroomUuid, userUuid);

    // If requesting own progress, allow students
    // If requesting another student's progress, must be teacher
    if (studentUuid !== userUuid) {
      await this.authorizationService.requireTeacher(classroomUuid, userUuid);
    }

    return await this.checkpointRepository.getStudentProgressByClassroom(classroomUuid, studentUuid);
  }

  /**
   * Get all progress for all students in a classroom (teacher only)
   * @param {string} classroomUuid - Classroom's UUID
   * @param {string} userUuid - User's UUID
   * @returns {Promise<Array<Object>>} Array of progress objects
   * @throws {Error} Authorization error
   */
  async getAllClassroomProgress(classroomUuid, userUuid) {
    // Only teachers can see all progress
    await this.authorizationService.requireTeacher(classroomUuid, userUuid);

    return await this.checkpointRepository.getAllProgressByClassroom(classroomUuid);
  }
}

module.exports = CheckpointService;
