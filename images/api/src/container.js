/**
 * Service Container
 * Implements Dependency Inversion Principle by managing service instantiation
 * Provides centralized dependency injection
 */

const config = require('./config');
const pg = require('./db/db.js');

// Repositories
const UserRepository = require('./repositories/UserRepository');
const ClassroomRepository = require('./repositories/ClassroomRepository');
const CheckpointRepository = require('./repositories/CheckpointRepository');
const FeedbackRepository = require('./repositories/FeedbackRepository');
const NoteRepository = require('./repositories/NoteRepository');
const PendingMemberRepository = require('./repositories/PendingMemberRepository');

// Services
const AuthorizationService = require('./services/AuthorizationService');
const FileStorageService = require('./services/FileStorageService');
const EmailService = require('./services/EmailService');
const UserService = require('./services/UserService');
const ClassroomService = require('./services/ClassroomService');
const CheckpointService = require('./services/CheckpointService');
const FeedbackService = require('./services/FeedbackService');
const NoteService = require('./services/NoteService');

/**
 * Service Container Class
 * Manages service lifecycle and dependency injection
 */
class Container {
  constructor() {
    this.services = {};
    this.initialized = false;
  }

  /**
   * Initialize all services with proper dependencies
   */
  initialize() {
    if (this.initialized) {
      return;
    }

    const db = pg.get();

    // Initialize Repositories
    this.services.userRepository = new UserRepository(db);
    this.services.classroomRepository = new ClassroomRepository(db);
    this.services.checkpointRepository = new CheckpointRepository(db);
    this.services.feedbackRepository = new FeedbackRepository(db);
    this.services.noteRepository = new NoteRepository(db);
    this.services.pendingMemberRepository = new PendingMemberRepository(db);

    // Initialize Infrastructure Services
    this.services.authorizationService = new AuthorizationService(
      this.services.classroomRepository
    );

    this.services.fileStorageService = new FileStorageService(
      config.upload.directory
    );

    this.services.emailService = new EmailService({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: config.email.auth,
      from: config.email.from
    });

    // Initialize Domain Services
    this.services.userService = new UserService(
      this.services.userRepository,
      this.services.classroomRepository,
      this.services.feedbackRepository,
      this.services.fileStorageService,
      this.services.pendingMemberRepository,
      db,
      {
        jwtSecret: config.auth.jwtSecret,
        saltRounds: config.auth.saltRounds
      }
    );

    this.services.classroomService = new ClassroomService(
      this.services.classroomRepository,
      this.services.authorizationService,
      this.services.pendingMemberRepository,
      this.services.userRepository
    );

    this.services.checkpointService = new CheckpointService(
      this.services.checkpointRepository,
      this.services.classroomRepository,
      this.services.authorizationService
    );

    this.services.feedbackService = new FeedbackService(
      this.services.feedbackRepository,
      this.services.classroomRepository,
      this.services.authorizationService,
      this.services.fileStorageService
    );

    this.services.noteService = new NoteService(
      this.services.noteRepository,
      this.services.authorizationService
    );

    this.initialized = true;
  }

  /**
   * Get a service by name
   * @param {string} serviceName - Name of the service
   * @returns {Object} Service instance
   * @throws {Error} If service not found
   */
  get(serviceName) {
    if (!this.initialized) {
      this.initialize();
    }

    if (!this.services[serviceName]) {
      throw new Error(`Service '${serviceName}' not found in container`);
    }

    return this.services[serviceName];
  }

  /**
   * Get all services
   * @returns {Object} Object containing all services
   */
  getAll() {
    if (!this.initialized) {
      this.initialize();
    }

    return { ...this.services };
  }

  /**
   * Check if container has a service
   * @param {string} serviceName - Name of the service
   * @returns {boolean} True if service exists
   */
  has(serviceName) {
    if (!this.initialized) {
      this.initialize();
    }

    return !!this.services[serviceName];
  }

  /**
   * Reset container (mainly for testing)
   */
  reset() {
    this.services = {};
    this.initialized = false;
  }
}

// Create singleton instance
const container = new Container();

module.exports = container;
