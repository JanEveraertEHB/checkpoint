const { v4: uuidv4 } = require('uuid');

/**
 * FeedbackService - Business logic layer for feedback-related operations
 * Handles feedback CRUD, images, documents, requests, and demands
 * @class
 */
class FeedbackService {
  /**
   * Creates an instance of FeedbackService
   * @param {Object} feedbackRepository - FeedbackRepository instance
   * @param {Object} classroomRepository - ClassroomRepository instance
   * @param {Object} authorizationService - AuthorizationService instance
   * @param {Object} fileStorageService - FileStorageService instance
   */
  constructor(feedbackRepository, classroomRepository, authorizationService, fileStorageService) {
    this.feedbackRepository = feedbackRepository;
    this.classroomRepository = classroomRepository;
    this.authorizationService = authorizationService;
    this.fileStorageService = fileStorageService;
  }

  // Feedback CRUD Operations

  /**
   * Get feedback for a student in a classroom
   * @param {string} classroomUuid - Classroom's UUID
   * @param {string} studentUuid - Student's UUID
   * @param {string} userUuid - User's UUID (for authorization)
   * @returns {Promise<Array<Object>>} Array of feedback objects
   * @throws {Error} Authorization error
   */
  async getStudentFeedback(classroomUuid, studentUuid, userUuid) {
    // User must be a member
    await this.authorizationService.requireMember(classroomUuid, userUuid);

    // If viewing another student's feedback, must be teacher
    if (studentUuid !== userUuid) {
      await this.authorizationService.requireTeacher(classroomUuid, userUuid);
    }

    return await this.feedbackRepository.findByStudentAndClassroom(classroomUuid, studentUuid);
  }

  /**
   * Create new feedback
   * @param {Object} feedbackData - Feedback data
   * @param {string} feedbackData.classroom_uuid - Classroom's UUID
   * @param {string} feedbackData.student_uuid - Student's UUID
   * @param {string} feedbackData.content - Feedback content
   * @param {string} userUuid - User's UUID
   * @returns {Promise<Object>} Created feedback object
   * @throws {Error} Authorization or validation error
   */
  async createFeedback(feedbackData, userUuid) {
    const { classroom_uuid, student_uuid, content } = feedbackData;

    // User must be a member
    await this.authorizationService.requireMember(classroom_uuid, userUuid);

    // Check if classroom is completed
    const isCompleted = await this.classroomRepository.isCompleted(classroom_uuid);
    if (isCompleted) {
      const error = new Error('Cannot create feedback in a completed classroom');
      error.statusCode = 400;
      throw error;
    }

    // Verify student is an active member
    const isActiveMember = await this.authorizationService.isActiveMember(classroom_uuid, student_uuid);
    if (!isActiveMember) {
      const error = new Error('Student is not an active member of this classroom');
      error.statusCode = 400;
      throw error;
    }

    // Verify student role
    const isStudent = await this.authorizationService.isStudent(classroom_uuid, student_uuid);
    if (!isStudent) {
      const error = new Error('Cannot create feedback for non-student');
      error.statusCode = 400;
      throw error;
    }

    return await this.feedbackRepository.create({
      uuid: uuidv4(),
      classroom_uuid,
      student_uuid,
      created_by_uuid: userUuid,
      content,
      locked: false
    });
  }

  /**
   * Update feedback content
   * @param {string} feedbackUuid - Feedback's UUID
   * @param {string} content - New content
   * @param {string} userUuid - User's UUID
   * @returns {Promise<Object>} Updated feedback object
   * @throws {Error} Authorization or not found error
   */
  async updateFeedback(feedbackUuid, content, userUuid) {
    const feedback = await this.feedbackRepository.findByUuid(feedbackUuid);

    if (!feedback) {
      const error = new Error('Feedback not found');
      error.statusCode = 404;
      throw error;
    }

    // Check if locked
    if (feedback.locked) {
      const error = new Error('Cannot edit locked feedback');
      error.statusCode = 403;
      throw error;
    }

    // Check if classroom is completed
    const isCompleted = await this.classroomRepository.isCompleted(feedback.classroom_uuid);
    if (isCompleted) {
      const error = new Error('Cannot edit feedback in a completed classroom');
      error.statusCode = 400;
      throw error;
    }

    // User must be the creator or a teacher
    const isTeacher = await this.authorizationService.isTeacher(feedback.classroom_uuid, userUuid);
    const isCreator = feedback.created_by_uuid === userUuid;

    if (!isTeacher && !isCreator) {
      const error = new Error('You do not have permission to edit this feedback');
      error.statusCode = 403;
      throw error;
    }

    return await this.feedbackRepository.updateContent(feedbackUuid, content);
  }

  /**
   * Lock or unlock feedback (teacher only)
   * @param {string} feedbackUuid - Feedback's UUID
   * @param {boolean} locked - Lock status
   * @param {string} userUuid - User's UUID
   * @returns {Promise<Object>} Updated feedback object
   * @throws {Error} Authorization or not found error
   */
  async lockFeedback(feedbackUuid, locked, userUuid) {
    const feedback = await this.feedbackRepository.findByUuid(feedbackUuid);

    if (!feedback) {
      const error = new Error('Feedback not found');
      error.statusCode = 404;
      throw error;
    }

    // Only teachers can lock/unlock feedback
    await this.authorizationService.requireTeacher(feedback.classroom_uuid, userUuid);

    return await this.feedbackRepository.updateLockStatus(feedbackUuid, locked);
  }

  // Image Operations

  /**
   * Add images to feedback
   * @param {string} feedbackUuid - Feedback's UUID
   * @param {Array<Object>} files - Array of uploaded file objects (from multer)
   * @param {string} userUuid - User's UUID
   * @returns {Promise<Array<Object>>} Array of created image objects
   * @throws {Error} Authorization or validation error
   */
  async addImages(feedbackUuid, files, userUuid) {
    const feedback = await this.feedbackRepository.findByUuid(feedbackUuid);

    if (!feedback) {
      const error = new Error('Feedback not found');
      error.statusCode = 404;
      throw error;
    }

    // Check if locked
    if (feedback.locked) {
      const error = new Error('Cannot add images to locked feedback');
      error.statusCode = 403;
      throw error;
    }

    // Check if classroom is completed
    const isCompleted = await this.classroomRepository.isCompleted(feedback.classroom_uuid);
    if (isCompleted) {
      const error = new Error('Cannot add images in a completed classroom');
      error.statusCode = 400;
      throw error;
    }

    // User must be the creator or a teacher
    const isTeacher = await this.authorizationService.isTeacher(feedback.classroom_uuid, userUuid);
    const isCreator = feedback.created_by_uuid === userUuid;

    if (!isTeacher && !isCreator) {
      const error = new Error('You do not have permission to add images to this feedback');
      error.statusCode = 403;
      throw error;
    }

    // Create image records
    const images = [];
    for (const file of files) {
      const image = await this.feedbackRepository.addImage({
        uuid: uuidv4(),
        feedback_uuid: feedbackUuid,
        file_path: file.path,
        original_name: file.originalname,
        file_size: file.size,
        mime_type: file.mimetype
      });
      images.push(image);
    }

    return images;
  }

  /**
   * Delete an image
   * @param {string} imageUuid - Image's UUID
   * @param {string} userUuid - User's UUID
   * @returns {Promise<void>}
   * @throws {Error} Authorization or not found error
   */
  async deleteImage(imageUuid, userUuid) {
    const image = await this.feedbackRepository.findImageByUuid(imageUuid);

    if (!image) {
      const error = new Error('Image not found');
      error.statusCode = 404;
      throw error;
    }

    const feedback = await this.feedbackRepository.findByUuid(image.feedback_uuid);

    if (!feedback) {
      const error = new Error('Feedback not found');
      error.statusCode = 404;
      throw error;
    }

    // Check if locked
    if (feedback.locked) {
      const error = new Error('Cannot delete images from locked feedback');
      error.statusCode = 403;
      throw error;
    }

    // Check if classroom is completed
    const isCompleted = await this.classroomRepository.isCompleted(feedback.classroom_uuid);
    if (isCompleted) {
      const error = new Error('Cannot delete images in a completed classroom');
      error.statusCode = 400;
      throw error;
    }

    // User must be the creator or a teacher
    const isTeacher = await this.authorizationService.isTeacher(feedback.classroom_uuid, userUuid);
    const isCreator = feedback.created_by_uuid === userUuid;

    if (!isTeacher && !isCreator) {
      const error = new Error('You do not have permission to delete this image');
      error.statusCode = 403;
      throw error;
    }

    // Delete from database
    await this.feedbackRepository.deleteImage(imageUuid);

    // Delete file from storage
    await this.fileStorageService.deleteFile(image.file_path);
  }

  // Document Operations

  /**
   * Add documents to feedback
   * @param {string} feedbackUuid - Feedback's UUID
   * @param {Array<Object>} files - Array of uploaded file objects (from multer)
   * @param {string} userUuid - User's UUID
   * @returns {Promise<Array<Object>>} Array of created document objects
   * @throws {Error} Authorization or validation error
   */
  async addDocuments(feedbackUuid, files, userUuid) {
    const feedback = await this.feedbackRepository.findByUuid(feedbackUuid);

    if (!feedback) {
      const error = new Error('Feedback not found');
      error.statusCode = 404;
      throw error;
    }

    // Check if locked
    if (feedback.locked) {
      const error = new Error('Cannot add documents to locked feedback');
      error.statusCode = 403;
      throw error;
    }

    // Check if classroom is completed
    const isCompleted = await this.classroomRepository.isCompleted(feedback.classroom_uuid);
    if (isCompleted) {
      const error = new Error('Cannot add documents in a completed classroom');
      error.statusCode = 400;
      throw error;
    }

    // User must be the creator or a teacher
    const isTeacher = await this.authorizationService.isTeacher(feedback.classroom_uuid, userUuid);
    const isCreator = feedback.created_by_uuid === userUuid;

    if (!isTeacher && !isCreator) {
      const error = new Error('You do not have permission to add documents to this feedback');
      error.statusCode = 403;
      throw error;
    }

    // Create document records
    const documents = [];
    for (const file of files) {
      const document = await this.feedbackRepository.addDocument({
        uuid: uuidv4(),
        feedback_uuid: feedbackUuid,
        file_path: file.path,
        original_name: file.originalname,
        file_size: file.size,
        mime_type: file.mimetype
      });
      documents.push(document);
    }

    return documents;
  }

  /**
   * Delete a document
   * @param {string} documentUuid - Document's UUID
   * @param {string} userUuid - User's UUID
   * @returns {Promise<void>}
   * @throws {Error} Authorization or not found error
   */
  async deleteDocument(documentUuid, userUuid) {
    const document = await this.feedbackRepository.findDocumentByUuid(documentUuid);

    if (!document) {
      const error = new Error('Document not found');
      error.statusCode = 404;
      throw error;
    }

    const feedback = await this.feedbackRepository.findByUuid(document.feedback_uuid);

    if (!feedback) {
      const error = new Error('Feedback not found');
      error.statusCode = 404;
      throw error;
    }

    // Check if locked
    if (feedback.locked) {
      const error = new Error('Cannot delete documents from locked feedback');
      error.statusCode = 403;
      throw error;
    }

    // Check if classroom is completed
    const isCompleted = await this.classroomRepository.isCompleted(feedback.classroom_uuid);
    if (isCompleted) {
      const error = new Error('Cannot delete documents in a completed classroom');
      error.statusCode = 400;
      throw error;
    }

    // User must be the creator or a teacher
    const isTeacher = await this.authorizationService.isTeacher(feedback.classroom_uuid, userUuid);
    const isCreator = feedback.created_by_uuid === userUuid;

    if (!isTeacher && !isCreator) {
      const error = new Error('You do not have permission to delete this document');
      error.statusCode = 403;
      throw error;
    }

    // Delete from database
    await this.feedbackRepository.deleteDocument(documentUuid);

    // Delete file from storage
    await this.fileStorageService.deleteFile(document.file_path);
  }

  // Feedback Requests

  /**
   * Get all feedback requests for a classroom (teacher only)
   * @param {string} classroomUuid - Classroom's UUID
   * @param {string} userUuid - User's UUID
   * @returns {Promise<Array<Object>>} Array of feedback request objects
   * @throws {Error} Authorization error
   */
  async getClassroomRequests(classroomUuid, userUuid) {
    // Only teachers can view requests
    await this.authorizationService.requireTeacher(classroomUuid, userUuid);

    return await this.feedbackRepository.findRequestsByClassroom(classroomUuid);
  }

  /**
   * Get count of unresolved feedback requests (teacher only)
   * @param {string} userUuid - User's UUID
   * @returns {Promise<number>} Count of unresolved requests across all classrooms where user is teacher
   * @throws {Error} Database error
   */
  async getUnresolvedRequestCount(userUuid) {
    // Get all classrooms where user is a teacher
    const memberships = await this.classroomRepository.findByUserMembership(userUuid);
    const teacherClassrooms = memberships.filter(m => m.role === 'teacher');

    let totalCount = 0;
    for (const classroom of teacherClassrooms) {
      const count = await this.feedbackRepository.countUnresolvedRequests(classroom.uuid);
      totalCount += count;
    }

    return totalCount;
  }

  /**
   * Create a feedback request (student only)
   * @param {Object} requestData - Request data
   * @param {string} requestData.classroom_uuid - Classroom's UUID
   * @param {string} requestData.message - Request message
   * @param {string} userUuid - User's UUID
   * @returns {Promise<Object>} Created request object
   * @throws {Error} Authorization or validation error
   */
  async createFeedbackRequest(requestData, userUuid) {
    const { classroom_uuid, message } = requestData;

    // Only students can create feedback requests
    await this.authorizationService.requireStudent(classroom_uuid, userUuid, 'Only students can request feedback');

    // Check if classroom is completed
    const isCompleted = await this.classroomRepository.isCompleted(classroom_uuid);
    if (isCompleted) {
      const error = new Error('Cannot create feedback requests in a completed classroom');
      error.statusCode = 400;
      throw error;
    }

    return await this.feedbackRepository.createRequest({
      uuid: uuidv4(),
      classroom_uuid,
      student_uuid: userUuid,
      message,
      resolved: false
    });
  }

  /**
   * Resolve a feedback request (teacher only)
   * @param {string} requestUuid - Request's UUID
   * @param {string} userUuid - User's UUID
   * @returns {Promise<Object>} Updated request object
   * @throws {Error} Authorization or not found error
   */
  async resolveFeedbackRequest(requestUuid, userUuid) {
    const request = await this.feedbackRepository.findRequestByUuid(requestUuid);

    if (!request) {
      const error = new Error('Feedback request not found');
      error.statusCode = 404;
      throw error;
    }

    // Only teachers can resolve requests
    await this.authorizationService.requireTeacher(request.classroom_uuid, userUuid);

    return await this.feedbackRepository.resolveRequest(requestUuid);
  }

  /**
   * Delete a feedback request
   * @param {string} requestUuid - Request's UUID
   * @param {string} userUuid - User's UUID
   * @returns {Promise<void>}
   * @throws {Error} Authorization or not found error
   */
  async deleteFeedbackRequest(requestUuid, userUuid) {
    const request = await this.feedbackRepository.findRequestByUuid(requestUuid);

    if (!request) {
      const error = new Error('Feedback request not found');
      error.statusCode = 404;
      throw error;
    }

    // Only the creator or a teacher can delete
    const isTeacher = await this.authorizationService.isTeacher(request.classroom_uuid, userUuid);
    const isCreator = request.student_uuid === userUuid;

    if (!isTeacher && !isCreator) {
      const error = new Error('You do not have permission to delete this request');
      error.statusCode = 403;
      throw error;
    }

    await this.feedbackRepository.deleteRequest(requestUuid);
  }

  // Feedback Demands

  /**
   * Get all feedback demands for current student
   * @param {string} userUuid - User's UUID
   * @returns {Promise<Array<Object>>} Array of feedback demand objects
   * @throws {Error} Database error
   */
  async getStudentDemands(userUuid) {
    return await this.feedbackRepository.findDemandsByStudent(userUuid);
  }

  /**
   * Get count of unfulfilled feedback demands for current student
   * @param {string} userUuid - User's UUID
   * @returns {Promise<number>} Count of unfulfilled demands
   * @throws {Error} Database error
   */
  async getUnfulfilledDemandCount(userUuid) {
    return await this.feedbackRepository.countUnfulfilledDemands(userUuid);
  }

  /**
   * Get all feedback demands for a classroom (teacher only)
   * @param {string} classroomUuid - Classroom's UUID
   * @param {string} userUuid - User's UUID
   * @returns {Promise<Array<Object>>} Array of feedback demand objects
   * @throws {Error} Authorization error
   */
  async getClassroomDemands(classroomUuid, userUuid) {
    // Only teachers can view demands
    await this.authorizationService.requireTeacher(classroomUuid, userUuid);

    return await this.feedbackRepository.findDemandsByClassroom(classroomUuid);
  }

  /**
   * Create a feedback demand for single student (teacher only)
   * @param {Object} demandData - Demand data
   * @param {string} demandData.classroom_uuid - Classroom's UUID
   * @param {string} demandData.student_uuid - Student's UUID
   * @param {string} demandData.message - Demand message
   * @param {string} userUuid - User's UUID
   * @returns {Promise<Object>} Created demand object
   * @throws {Error} Authorization or validation error
   */
  async createFeedbackDemand(demandData, userUuid) {
    const { classroom_uuid, student_uuid, message } = demandData;

    // Only teachers can create demands
    await this.authorizationService.requireTeacher(classroom_uuid, userUuid);

    // Check if classroom is completed
    const isCompleted = await this.classroomRepository.isCompleted(classroom_uuid);
    if (isCompleted) {
      const error = new Error('Cannot create feedback demands in a completed classroom');
      error.statusCode = 400;
      throw error;
    }

    // Verify student is an active member
    const isActiveMember = await this.authorizationService.isActiveMember(classroom_uuid, student_uuid);
    if (!isActiveMember) {
      const error = new Error('Student is not an active member of this classroom');
      error.statusCode = 400;
      throw error;
    }

    return await this.feedbackRepository.createDemand({
      uuid: uuidv4(),
      classroom_uuid,
      student_uuid,
      teacher_uuid: userUuid,
      message,
      fulfilled: false
    });
  }

  /**
   * Create feedback demands for all active students in classroom (teacher only)
   * @param {string} classroomUuid - Classroom's UUID
   * @param {string} message - Demand message
   * @param {string} userUuid - User's UUID
   * @returns {Promise<Array<Object>>} Array of created demand objects
   * @throws {Error} Authorization or validation error
   */
  async createClassroomWideDemands(classroomUuid, message, userUuid) {
    // Only teachers can create demands
    await this.authorizationService.requireTeacher(classroomUuid, userUuid);

    // Check if classroom is completed
    const isCompleted = await this.classroomRepository.isCompleted(classroomUuid);
    if (isCompleted) {
      const error = new Error('Cannot create feedback demands in a completed classroom');
      error.statusCode = 400;
      throw error;
    }

    // Get all active students
    const students = await this.classroomRepository.getActiveStudents(classroomUuid);

    if (students.length === 0) {
      const error = new Error('No active students in this classroom');
      error.statusCode = 400;
      throw error;
    }

    // Create demands for all students
    const demandsData = students.map(student => ({
      uuid: uuidv4(),
      classroom_uuid: classroomUuid,
      student_uuid: student.user_uuid,
      teacher_uuid: userUuid,
      message,
      fulfilled: false
    }));

    return await this.feedbackRepository.createManyDemands(demandsData);
  }

  /**
   * Fulfill a feedback demand (student only)
   * @param {string} demandUuid - Demand's UUID
   * @param {string} userUuid - User's UUID
   * @returns {Promise<Object>} Updated demand object
   * @throws {Error} Authorization or not found error
   */
  async fulfillFeedbackDemand(demandUuid, userUuid) {
    const demand = await this.feedbackRepository.findDemandByUuid(demandUuid);

    if (!demand) {
      const error = new Error('Feedback demand not found');
      error.statusCode = 404;
      throw error;
    }

    // Only the student can fulfill their own demand
    if (demand.student_uuid !== userUuid) {
      const error = new Error('You can only fulfill your own feedback demands');
      error.statusCode = 403;
      throw error;
    }

    return await this.feedbackRepository.fulfillDemand(demandUuid);
  }

  /**
   * Delete a feedback demand (teacher only)
   * @param {string} demandUuid - Demand's UUID
   * @param {string} userUuid - User's UUID
   * @returns {Promise<void>}
   * @throws {Error} Authorization or not found error
   */
  async deleteFeedbackDemand(demandUuid, userUuid) {
    const demand = await this.feedbackRepository.findDemandByUuid(demandUuid);

    if (!demand) {
      const error = new Error('Feedback demand not found');
      error.statusCode = 404;
      throw error;
    }

    // Only teachers can delete demands
    await this.authorizationService.requireTeacher(demand.classroom_uuid, userUuid);

    await this.feedbackRepository.deleteDemand(demandUuid);
  }
}

module.exports = FeedbackService;
