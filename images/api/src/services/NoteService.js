const { v4: uuidv4 } = require('uuid');

/**
 * NoteService - Business logic layer for note-related operations
 * Handles personal notes for teachers and students
 * @class
 */
class NoteService {
  /**
   * Creates an instance of NoteService
   * @param {Object} noteRepository - NoteRepository instance
   * @param {Object} authorizationService - AuthorizationService instance
   */
  constructor(noteRepository, authorizationService) {
    this.noteRepository = noteRepository;
    this.authorizationService = authorizationService;
  }

  /**
   * Get all notes for a classroom and user
   * @param {string} classroomUuid - Classroom's UUID
   * @param {string} userUuid - User's UUID
   * @returns {Promise<Array<Object>>} Array of note objects
   * @throws {Error} Authorization error
   */
  async getClassroomNotes(classroomUuid, userUuid) {
    // User must be a member to access notes
    await this.authorizationService.requireMember(classroomUuid, userUuid);

    return await this.noteRepository.findByClassroomAndUser(classroomUuid, userUuid);
  }

  /**
   * Create a new note
   * @param {Object} noteData - Note data
   * @param {string} noteData.classroom_uuid - Classroom's UUID
   * @param {string} noteData.content - Note content
   * @param {string} userUuid - User's UUID
   * @returns {Promise<Object>} Created note object
   * @throws {Error} Authorization error
   */
  async createNote(noteData, userUuid) {
    const { classroom_uuid, content } = noteData;

    // User must be a member
    await this.authorizationService.requireMember(classroom_uuid, userUuid);

    return await this.noteRepository.create({
      uuid: uuidv4(),
      classroom_uuid,
      user_uuid: userUuid,
      content
    });
  }

  /**
   * Update a note
   * @param {string} noteUuid - Note's UUID
   * @param {string} content - New content
   * @param {string} userUuid - User's UUID
   * @returns {Promise<Object>} Updated note object
   * @throws {Error} Authorization or not found error
   */
  async updateNote(noteUuid, content, userUuid) {
    const note = await this.noteRepository.findByUuid(noteUuid);

    if (!note) {
      const error = new Error('Note not found');
      error.statusCode = 404;
      throw error;
    }

    // Only the owner can update their note
    if (note.user_uuid !== userUuid) {
      const error = new Error('You can only edit your own notes');
      error.statusCode = 403;
      throw error;
    }

    return await this.noteRepository.update(noteUuid, content);
  }

  /**
   * Delete a note
   * @param {string} noteUuid - Note's UUID
   * @param {string} userUuid - User's UUID
   * @returns {Promise<void>}
   * @throws {Error} Authorization or not found error
   */
  async deleteNote(noteUuid, userUuid) {
    const note = await this.noteRepository.findByUuid(noteUuid);

    if (!note) {
      const error = new Error('Note not found');
      error.statusCode = 404;
      throw error;
    }

    // Only the owner can delete their note
    if (note.user_uuid !== userUuid) {
      const error = new Error('You can only delete your own notes');
      error.statusCode = 403;
      throw error;
    }

    await this.noteRepository.delete(noteUuid);
  }
}

module.exports = NoteService;
