/**
 * FeedbackRepository - Data access layer for feedback-related database operations
 * Handles feedback entries, images, documents, requests, and demands
 * @class
 */
class FeedbackRepository {
  /**
   * Creates an instance of FeedbackRepository
   * @param {Object} db - Database connection instance (Knex)
   */
  constructor(db) {
    this.db = db;
  }

  /**
   * Find feedback by UUID
   * @param {string} uuid - Feedback's unique identifier
   * @returns {Promise<Object|null>} Feedback object or null if not found
   * @throws {Error} Database query error
   */
  async findByUuid(uuid) {
    return await this.db('feedback')
      .where({ uuid })
      .first();
  }

  /**
   * Get all feedback for a student in a classroom
   * @param {string} classroomUuid - Classroom's UUID
   * @param {string} studentUuid - Student's UUID
   * @returns {Promise<Array<Object>>} Array of feedback objects with images and documents
   * @throws {Error} Database query error
   */
  async findByStudentAndClassroom(classroomUuid, studentUuid) {
    const feedback = await this.db('feedback')
      .where({
        classroom_uuid: classroomUuid,
        student_uuid: studentUuid
      })
      .orderBy('created_at', 'desc');

    // Load images and documents for each feedback
    for (const item of feedback) {
      item.images = await this.getImages(item.uuid);
      item.documents = await this.getDocuments(item.uuid);
    }

    return feedback;
  }

  /**
   * Create new feedback
   * @param {Object} feedbackData - Feedback data object
   * @param {string} feedbackData.uuid - Feedback's UUID
   * @param {string} feedbackData.classroom_uuid - Classroom's UUID
   * @param {string} feedbackData.student_uuid - Student's UUID
   * @param {string} feedbackData.created_by_uuid - Creator's UUID
   * @param {string} feedbackData.content - Feedback content
   * @param {boolean} feedbackData.locked - Lock status
   * @returns {Promise<Object>} Created feedback object
   * @throws {Error} Database insertion error
   */
  async create(feedbackData) {
    const [feedback] = await this.db('feedback')
      .insert(feedbackData)
      .returning('*');

    return feedback;
  }

  /**
   * Update feedback content
   * @param {string} uuid - Feedback's UUID
   * @param {string} content - New content
   * @returns {Promise<Object>} Updated feedback object
   * @throws {Error} Database update error
   */
  async updateContent(uuid, content) {
    const [feedback] = await this.db('feedback')
      .where({ uuid })
      .update({
        content,
        updated_at: this.db.fn.now()
      })
      .returning('*');

    return feedback;
  }

  /**
   * Update feedback lock status
   * @param {string} uuid - Feedback's UUID
   * @param {boolean} locked - Lock status
   * @returns {Promise<Object>} Updated feedback object
   * @throws {Error} Database update error
   */
  async updateLockStatus(uuid, locked) {
    const [feedback] = await this.db('feedback')
      .where({ uuid })
      .update({
        locked,
        updated_at: this.db.fn.now()
      })
      .returning('*');

    return feedback;
  }

  /**
   * Get all images for a feedback entry
   * @param {string} feedbackUuid - Feedback's UUID
   * @returns {Promise<Array<Object>>} Array of image objects
   * @throws {Error} Database query error
   */
  async getImages(feedbackUuid) {
    return await this.db('feedback_images')
      .where({ feedback_uuid: feedbackUuid })
      .orderBy('uploaded_at', 'asc');
  }

  /**
   * Find image by UUID
   * @param {string} uuid - Image's unique identifier
   * @returns {Promise<Object|null>} Image object or null if not found
   * @throws {Error} Database query error
   */
  async findImageByUuid(uuid) {
    return await this.db('feedback_images')
      .where({ uuid })
      .first();
  }

  /**
   * Add image to feedback
   * @param {Object} imageData - Image data object
   * @param {string} imageData.uuid - Image's UUID
   * @param {string} imageData.feedback_uuid - Feedback's UUID
   * @param {string} imageData.file_path - File path on server
   * @param {string} imageData.original_name - Original filename
   * @param {number} imageData.file_size - File size in bytes
   * @param {string} imageData.mime_type - MIME type
   * @returns {Promise<Object>} Created image object
   * @throws {Error} Database insertion error
   */
  async addImage(imageData) {
    const [image] = await this.db('feedback_images')
      .insert(imageData)
      .returning('*');

    return image;
  }

  /**
   * Delete image
   * @param {string} uuid - Image's UUID
   * @returns {Promise<number>} Number of rows deleted
   * @throws {Error} Database deletion error
   */
  async deleteImage(uuid) {
    return await this.db('feedback_images')
      .where({ uuid })
      .del();
  }

  /**
   * Get all documents for a feedback entry
   * @param {string} feedbackUuid - Feedback's UUID
   * @returns {Promise<Array<Object>>} Array of document objects
   * @throws {Error} Database query error
   */
  async getDocuments(feedbackUuid) {
    return await this.db('feedback_documents')
      .where({ feedback_uuid: feedbackUuid })
      .orderBy('uploaded_at', 'asc');
  }

  /**
   * Find document by UUID
   * @param {string} uuid - Document's unique identifier
   * @returns {Promise<Object|null>} Document object or null if not found
   * @throws {Error} Database query error
   */
  async findDocumentByUuid(uuid) {
    return await this.db('feedback_documents')
      .where({ uuid })
      .first();
  }

  /**
   * Add document to feedback
   * @param {Object} documentData - Document data object
   * @param {string} documentData.uuid - Document's UUID
   * @param {string} documentData.feedback_uuid - Feedback's UUID
   * @param {string} documentData.file_path - File path on server
   * @param {string} documentData.original_name - Original filename
   * @param {number} documentData.file_size - File size in bytes
   * @param {string} documentData.mime_type - MIME type
   * @returns {Promise<Object>} Created document object
   * @throws {Error} Database insertion error
   */
  async addDocument(documentData) {
    const [document] = await this.db('feedback_documents')
      .insert(documentData)
      .returning('*');

    return document;
  }

  /**
   * Delete document
   * @param {string} uuid - Document's UUID
   * @returns {Promise<number>} Number of rows deleted
   * @throws {Error} Database deletion error
   */
  async deleteDocument(uuid) {
    return await this.db('feedback_documents')
      .where({ uuid })
      .del();
  }

  /**
   * Anonymize feedback content for a user (used during account deletion)
   * @param {string} studentUuid - Student's UUID
   * @param {Object} trx - Database transaction object
   * @returns {Promise<number>} Number of rows updated
   * @throws {Error} Database update error
   */
  async anonymizeFeedbackContent(studentUuid, trx) {
    const dbContext = trx || this.db;

    return await dbContext('feedback')
      .where({ student_uuid: studentUuid })
      .update({ content: '[Content removed - User account deleted]' });
  }

  // Feedback Requests

  /**
   * Get all feedback requests for a classroom
   * @param {string} classroomUuid - Classroom's UUID
   * @returns {Promise<Array<Object>>} Array of feedback request objects with user info
   * @throws {Error} Database query error
   */
  async findRequestsByClassroom(classroomUuid) {
    return await this.db('feedback_requests')
      .join('users', 'feedback_requests.student_uuid', 'users.uuid')
      .where('feedback_requests.classroom_uuid', classroomUuid)
      .select(
        'feedback_requests.*',
        'users.name as student_name'
      )
      .orderBy('feedback_requests.created_at', 'desc');
  }

  /**
   * Get count of unresolved feedback requests for a classroom
   * @param {string} classroomUuid - Classroom's UUID
   * @returns {Promise<number>} Count of unresolved requests
   * @throws {Error} Database query error
   */
  async countUnresolvedRequests(classroomUuid) {
    const result = await this.db('feedback_requests')
      .where({
        classroom_uuid: classroomUuid,
        resolved: false
      })
      .count('* as count')
      .first();

    return parseInt(result.count);
  }

  /**
   * Create a feedback request
   * @param {Object} requestData - Request data object
   * @param {string} requestData.uuid - Request's UUID
   * @param {string} requestData.classroom_uuid - Classroom's UUID
   * @param {string} requestData.student_uuid - Student's UUID
   * @param {string} requestData.message - Request message
   * @returns {Promise<Object>} Created request object
   * @throws {Error} Database insertion error
   */
  async createRequest(requestData) {
    const [request] = await this.db('feedback_requests')
      .insert(requestData)
      .returning('*');

    return request;
  }

  /**
   * Mark feedback request as resolved
   * @param {string} uuid - Request's UUID
   * @returns {Promise<Object>} Updated request object
   * @throws {Error} Database update error
   */
  async resolveRequest(uuid) {
    const [request] = await this.db('feedback_requests')
      .where({ uuid })
      .update({ resolved: true })
      .returning('*');

    return request;
  }

  /**
   * Delete feedback request
   * @param {string} uuid - Request's UUID
   * @returns {Promise<number>} Number of rows deleted
   * @throws {Error} Database deletion error
   */
  async deleteRequest(uuid) {
    return await this.db('feedback_requests')
      .where({ uuid })
      .del();
  }

  /**
   * Find feedback request by UUID
   * @param {string} uuid - Request's unique identifier
   * @returns {Promise<Object|null>} Request object or null if not found
   * @throws {Error} Database query error
   */
  async findRequestByUuid(uuid) {
    return await this.db('feedback_requests')
      .where({ uuid })
      .first();
  }

  /**
   * Delete all feedback requests for a student (used during account deletion)
   * @param {string} studentUuid - Student's UUID
   * @param {Object} trx - Database transaction object
   * @returns {Promise<number>} Number of rows deleted
   * @throws {Error} Database deletion error
   */
  async deleteStudentRequests(studentUuid, trx) {
    const dbContext = trx || this.db;

    return await dbContext('feedback_requests')
      .where({ student_uuid: studentUuid })
      .del();
  }

  // Feedback Demands

  /**
   * Get all feedback demands for a student
   * @param {string} studentUuid - Student's UUID
   * @returns {Promise<Array<Object>>} Array of feedback demand objects with classroom info
   * @throws {Error} Database query error
   */
  async findDemandsByStudent(studentUuid) {
    return await this.db('feedback_demands')
      .join('classrooms', 'feedback_demands.classroom_uuid', 'classrooms.uuid')
      .where('feedback_demands.student_uuid', studentUuid)
      .select(
        'feedback_demands.*',
        'classrooms.name as classroom_name'
      )
      .orderBy('feedback_demands.created_at', 'desc');
  }

  /**
   * Get count of unfulfilled feedback demands for a student
   * @param {string} studentUuid - Student's UUID
   * @returns {Promise<number>} Count of unfulfilled demands
   * @throws {Error} Database query error
   */
  async countUnfulfilledDemands(studentUuid) {
    const result = await this.db('feedback_demands')
      .where({
        student_uuid: studentUuid,
        fulfilled: false
      })
      .count('* as count')
      .first();

    return parseInt(result.count);
  }

  /**
   * Get all feedback demands for a classroom
   * @param {string} classroomUuid - Classroom's UUID
   * @returns {Promise<Array<Object>>} Array of feedback demand objects with user info
   * @throws {Error} Database query error
   */
  async findDemandsByClassroom(classroomUuid) {
    return await this.db('feedback_demands')
      .join('users', 'feedback_demands.student_uuid', 'users.uuid')
      .where('feedback_demands.classroom_uuid', classroomUuid)
      .select(
        'feedback_demands.*',
        'users.name as student_name'
      )
      .orderBy('feedback_demands.created_at', 'desc');
  }

  /**
   * Create a feedback demand
   * @param {Object} demandData - Demand data object
   * @param {string} demandData.uuid - Demand's UUID
   * @param {string} demandData.classroom_uuid - Classroom's UUID
   * @param {string} demandData.student_uuid - Student's UUID
   * @param {string} demandData.created_by_uuid - Teacher's UUID
   * @param {string} demandData.message - Demand message
   * @returns {Promise<Object>} Created demand object
   * @throws {Error} Database insertion error
   */
  async createDemand(demandData) {
    const [demand] = await this.db('feedback_demands')
      .insert(demandData)
      .returning('*');

    return demand;
  }

  /**
   * Create multiple feedback demands (bulk insert)
   * @param {Array<Object>} demandsData - Array of demand data objects
   * @returns {Promise<Array<Object>>} Array of created demand objects
   * @throws {Error} Database insertion error
   */
  async createManyDemands(demandsData) {
    return await this.db('feedback_demands')
      .insert(demandsData)
      .returning('*');
  }

  /**
   * Mark feedback demand as fulfilled
   * @param {string} uuid - Demand's UUID
   * @returns {Promise<Object>} Updated demand object
   * @throws {Error} Database update error
   */
  async fulfillDemand(uuid) {
    const [demand] = await this.db('feedback_demands')
      .where({ uuid })
      .update({ fulfilled: true })
      .returning('*');

    return demand;
  }

  /**
   * Delete feedback demand
   * @param {string} uuid - Demand's UUID
   * @returns {Promise<number>} Number of rows deleted
   * @throws {Error} Database deletion error
   */
  async deleteDemand(uuid) {
    return await this.db('feedback_demands')
      .where({ uuid })
      .del();
  }

  /**
   * Find feedback demand by UUID
   * @param {string} uuid - Demand's unique identifier
   * @returns {Promise<Object|null>} Demand object or null if not found
   * @throws {Error} Database query error
   */
  async findDemandByUuid(uuid) {
    return await this.db('feedback_demands')
      .where({ uuid })
      .first();
  }

  /**
   * Delete all feedback demands for a student (used during account deletion)
   * @param {string} studentUuid - Student's UUID
   * @param {Object} trx - Database transaction object
   * @returns {Promise<number>} Number of rows deleted
   * @throws {Error} Database deletion error
   */
  async deleteStudentDemands(studentUuid, trx) {
    const dbContext = trx || this.db;

    return await dbContext('feedback_demands')
      .where({ student_uuid: studentUuid })
      .del();
  }

  /**
   * Delete all images for a student's feedback (used during account deletion)
   * @param {string} studentUuid - Student's UUID
   * @param {Object} trx - Database transaction object
   * @returns {Promise<Array<Object>>} Array of deleted image objects with file paths
   * @throws {Error} Database query error
   */
  async deleteStudentFeedbackImages(studentUuid, trx) {
    const dbContext = trx || this.db;

    // Get image file paths before deletion for cleanup
    const images = await dbContext('feedback_images')
      .join('feedback', 'feedback_images.feedback_uuid', 'feedback.uuid')
      .where('feedback.student_uuid', studentUuid)
      .select('feedback_images.uuid', 'feedback_images.file_path');

    await dbContext('feedback_images')
      .join('feedback', 'feedback_images.feedback_uuid', 'feedback.uuid')
      .where('feedback.student_uuid', studentUuid)
      .delete();

    return images;
  }

  /**
   * Delete all documents for a student's feedback (used during account deletion)
   * @param {string} studentUuid - Student's UUID
   * @param {Object} trx - Database transaction object
   * @returns {Promise<Array<Object>>} Array of deleted document objects with file paths
   * @throws {Error} Database query error
   */
  async deleteStudentFeedbackDocuments(studentUuid, trx) {
    const dbContext = trx || this.db;

    // Get document file paths before deletion for cleanup
    const documents = await dbContext('feedback_documents')
      .join('feedback', 'feedback_documents.feedback_uuid', 'feedback.uuid')
      .where('feedback.student_uuid', studentUuid)
      .select('feedback_documents.uuid', 'feedback_documents.file_path');

    await dbContext('feedback_documents')
      .join('feedback', 'feedback_documents.feedback_uuid', 'feedback.uuid')
      .where('feedback.student_uuid', studentUuid)
      .delete();

    return documents;
  }
}

module.exports = FeedbackRepository;
