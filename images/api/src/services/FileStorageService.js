const fs = require('fs').promises;
const path = require('path');

/**
 * FileStorageService - Abstracts file storage operations
 * Implements Dependency Inversion Principle by providing an interface for file operations
 * Makes it easy to swap implementations (local storage, S3, etc.)
 * @class
 */
class FileStorageService {
  /**
   * Creates an instance of FileStorageService
   * @param {string} uploadDir - Base directory for file uploads
   */
  constructor(uploadDir) {
    this.uploadDir = uploadDir;
    this.ensureUploadDirExists();
  }

  /**
   * Ensure upload directory exists
   * @private
   * @returns {Promise<void>}
   * @throws {Error} File system error
   */
  async ensureUploadDirExists() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Get full file path
   * @param {string} filename - Filename
   * @returns {string} Full file path
   */
  getFilePath(filename) {
    return path.join(this.uploadDir, filename);
  }

  /**
   * Check if file exists
   * @param {string} filename - Filename
   * @returns {Promise<boolean>} True if file exists
   */
  async fileExists(filename) {
    try {
      await fs.access(this.getFilePath(filename));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delete a file
   * @param {string} filename - Filename or full path
   * @returns {Promise<boolean>} True if file was deleted, false if file didn't exist
   * @throws {Error} File system error
   */
  async deleteFile(filename) {
    try {
      // Handle both full paths and just filenames
      const filePath = path.isAbsolute(filename) ? filename : this.getFilePath(filename);
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, return false
        return false;
      }
      throw error;
    }
  }

  /**
   * Delete multiple files
   * @param {Array<string>} filenames - Array of filenames or full paths
   * @returns {Promise<Object>} Object with deleted count and failed count
   * @throws {Error} File system error for unexpected errors
   */
  async deleteFiles(filenames) {
    const results = {
      deleted: 0,
      failed: 0,
      errors: []
    };

    for (const filename of filenames) {
      try {
        const wasDeleted = await this.deleteFile(filename);
        if (wasDeleted) {
          results.deleted++;
        } else {
          results.failed++;
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          filename,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Get file stats
   * @param {string} filename - Filename
   * @returns {Promise<Object>} File stats object
   * @throws {Error} File system error
   */
  async getFileStats(filename) {
    const filePath = this.getFilePath(filename);
    return await fs.stat(filePath);
  }

  /**
   * Read file content
   * @param {string} filename - Filename
   * @param {string} [encoding='utf8'] - File encoding
   * @returns {Promise<string|Buffer>} File content
   * @throws {Error} File system error
   */
  async readFile(filename, encoding = 'utf8') {
    const filePath = this.getFilePath(filename);
    return await fs.readFile(filePath, encoding);
  }

  /**
   * Write file content
   * @param {string} filename - Filename
   * @param {string|Buffer} content - File content
   * @returns {Promise<void>}
   * @throws {Error} File system error
   */
  async writeFile(filename, content) {
    const filePath = this.getFilePath(filename);
    await fs.writeFile(filePath, content);
  }

  /**
   * Copy file
   * @param {string} source - Source filename
   * @param {string} destination - Destination filename
   * @returns {Promise<void>}
   * @throws {Error} File system error
   */
  async copyFile(source, destination) {
    const sourcePath = this.getFilePath(source);
    const destPath = this.getFilePath(destination);
    await fs.copyFile(sourcePath, destPath);
  }

  /**
   * Move file
   * @param {string} source - Source filename
   * @param {string} destination - Destination filename
   * @returns {Promise<void>}
   * @throws {Error} File system error
   */
  async moveFile(source, destination) {
    const sourcePath = this.getFilePath(source);
    const destPath = this.getFilePath(destination);
    await fs.rename(sourcePath, destPath);
  }

  /**
   * List files in upload directory
   * @param {string} [subdir=''] - Subdirectory to list
   * @returns {Promise<Array<string>>} Array of filenames
   * @throws {Error} File system error
   */
  async listFiles(subdir = '') {
    const dirPath = subdir ? path.join(this.uploadDir, subdir) : this.uploadDir;
    return await fs.readdir(dirPath);
  }

  /**
   * Get upload directory path
   * @returns {string} Upload directory path
   */
  getUploadDir() {
    return this.uploadDir;
  }

  /**
   * Create subdirectory in upload directory
   * @param {string} subdir - Subdirectory name
   * @returns {Promise<void>}
   * @throws {Error} File system error
   */
  async createSubdirectory(subdir) {
    const dirPath = path.join(this.uploadDir, subdir);
    await fs.mkdir(dirPath, { recursive: true });
  }

  /**
   * Validate file type
   * @param {string} mimetype - MIME type to validate
   * @param {Array<string>} allowedTypes - Array of allowed MIME types
   * @returns {boolean} True if file type is allowed
   */
  isAllowedFileType(mimetype, allowedTypes) {
    return allowedTypes.includes(mimetype);
  }

  /**
   * Validate file size
   * @param {number} fileSize - File size in bytes
   * @param {number} maxSize - Maximum allowed size in bytes
   * @returns {boolean} True if file size is within limit
   */
  isWithinSizeLimit(fileSize, maxSize) {
    return fileSize <= maxSize;
  }

  /**
   * Generate safe filename
   * @param {string} originalName - Original filename
   * @returns {string} Safe filename with timestamp
   */
  generateSafeFilename(originalName) {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext)
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 50);

    return `${timestamp}_${randomString}_${baseName}${ext}`;
  }
}

module.exports = FileStorageService;
