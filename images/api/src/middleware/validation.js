const { ValidationError } = require('./errorHandler');

/**
 * Validation Middleware
 * Implements Interface Segregation Principle with focused validation functions
 * Provides input validation and sanitization
 */

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate UUID format
 * @param {string} uuid - UUID to validate
 * @returns {boolean} True if valid UUID format
 */
function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Sanitize string input (trim and limit length)
 * @param {string} str - String to sanitize
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} Sanitized string
 */
function sanitizeString(str, maxLength = 1000) {
  if (typeof str !== 'string') return '';
  return str.trim().substring(0, maxLength);
}

/**
 * Sanitize HTML/script content from string
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
}

/**
 * Validate required fields in request body
 * @param {Array<string>} requiredFields - Array of required field names
 * @returns {Function} Express middleware function
 */
function validateRequiredFields(requiredFields) {
  return (req, res, next) => {
    const errors = [];
    const body = req.body || {};

    for (const field of requiredFields) {
      if (!body[field] || (typeof body[field] === 'string' && body[field].trim() === '')) {
        errors.push({
          field,
          message: `${field} is required`
        });
      }
    }

    if (errors.length > 0) {
      throw new ValidationError('Validation failed', errors);
    }

    next();
  };
}

/**
 * Validate email field in request body
 * @param {string} fieldName - Name of the email field
 * @returns {Function} Express middleware function
 */
function validateEmail(fieldName = 'email') {
  return (req, res, next) => {
    const email = req.body[fieldName];

    if (!email) {
      throw new ValidationError(`${fieldName} is required`);
    }

    if (!isValidEmail(email)) {
      throw new ValidationError(`${fieldName} must be a valid email address`);
    }

    // Sanitize email (lowercase and trim)
    req.body[fieldName] = email.toLowerCase().trim();

    next();
  };
}

/**
 * Validate UUID parameter
 * @param {string} paramName - Name of the UUID parameter
 * @returns {Function} Express middleware function
 */
function validateUUID(paramName) {
  return (req, res, next) => {
    const uuid = req.params[paramName];

    if (!uuid) {
      throw new ValidationError(`${paramName} is required`);
    }

    if (!isValidUUID(uuid)) {
      throw new ValidationError(`${paramName} must be a valid UUID`);
    }

    next();
  };
}

/**
 * Validate password strength
 * @param {string} fieldName - Name of the password field
 * @param {number} minLength - Minimum password length
 * @returns {Function} Express middleware function
 */
function validatePassword(fieldName = 'password', minLength = 6) {
  return (req, res, next) => {
    const password = req.body[fieldName];

    if (!password) {
      throw new ValidationError(`${fieldName} is required`);
    }

    if (password.length < minLength) {
      throw new ValidationError(`${fieldName} must be at least ${minLength} characters long`);
    }

    next();
  };
}

/**
 * Validate user role
 * @param {string} fieldName - Name of the role field
 * @returns {Function} Express middleware function
 */
function validateRole(fieldName = 'role') {
  return (req, res, next) => {
    const role = req.body[fieldName];
    const validRoles = ['student', 'teacher'];

    if (!role) {
      throw new ValidationError(`${fieldName} is required`);
    }

    if (!validRoles.includes(role)) {
      throw new ValidationError(`${fieldName} must be either 'student' or 'teacher'`);
    }

    next();
  };
}

/**
 * Sanitize text content in request body
 * @param {Array<string>} fields - Array of field names to sanitize
 * @param {number} maxLength - Maximum allowed length
 * @returns {Function} Express middleware function
 */
function sanitizeText(fields, maxLength = 1000) {
  return (req, res, next) => {
    for (const field of fields) {
      if (req.body[field]) {
        req.body[field] = sanitizeString(req.body[field], maxLength);
      }
    }
    next();
  };
}

/**
 * Sanitize HTML content in request body
 * @param {Array<string>} fields - Array of field names to sanitize
 * @returns {Function} Express middleware function
 */
function sanitizeHtmlContent(fields) {
  return (req, res, next) => {
    for (const field of fields) {
      if (req.body[field]) {
        req.body[field] = sanitizeHtml(req.body[field]);
      }
    }
    next();
  };
}

/**
 * Validate string length
 * @param {string} fieldName - Name of the field
 * @param {number} minLength - Minimum length
 * @param {number} maxLength - Maximum length
 * @returns {Function} Express middleware function
 */
function validateLength(fieldName, minLength, maxLength) {
  return (req, res, next) => {
    const value = req.body[fieldName];

    if (!value) {
      throw new ValidationError(`${fieldName} is required`);
    }

    if (typeof value !== 'string') {
      throw new ValidationError(`${fieldName} must be a string`);
    }

    if (value.length < minLength) {
      throw new ValidationError(`${fieldName} must be at least ${minLength} characters long`);
    }

    if (value.length > maxLength) {
      throw new ValidationError(`${fieldName} must not exceed ${maxLength} characters`);
    }

    next();
  };
}

/**
 * Validate boolean field
 * @param {string} fieldName - Name of the field
 * @returns {Function} Express middleware function
 */
function validateBoolean(fieldName) {
  return (req, res, next) => {
    const value = req.body[fieldName];

    if (value === undefined || value === null) {
      throw new ValidationError(`${fieldName} is required`);
    }

    if (typeof value !== 'boolean') {
      throw new ValidationError(`${fieldName} must be a boolean`);
    }

    next();
  };
}

/**
 * Validate number field
 * @param {string} fieldName - Name of the field
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {Function} Express middleware function
 */
function validateNumber(fieldName, min, max) {
  return (req, res, next) => {
    const value = req.body[fieldName];

    if (value === undefined || value === null) {
      throw new ValidationError(`${fieldName} is required`);
    }

    const num = Number(value);

    if (isNaN(num)) {
      throw new ValidationError(`${fieldName} must be a valid number`);
    }

    if (min !== undefined && num < min) {
      throw new ValidationError(`${fieldName} must be at least ${min}`);
    }

    if (max !== undefined && num > max) {
      throw new ValidationError(`${fieldName} must not exceed ${max}`);
    }

    // Convert to number
    req.body[fieldName] = num;

    next();
  };
}

/**
 * Chain multiple validators together
 * @param {Array<Function>} validators - Array of validator functions
 * @returns {Function} Combined validator middleware
 */
function validateAll(...validators) {
  return (req, res, next) => {
    try {
      for (const validator of validators) {
        validator(req, res, () => {});
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = {
  // Validation helpers
  isValidEmail,
  isValidUUID,
  sanitizeString,
  sanitizeHtml,

  // Middleware functions
  validateRequiredFields,
  validateEmail,
  validateUUID,
  validatePassword,
  validateRole,
  validateLength,
  validateBoolean,
  validateNumber,
  sanitizeText,
  sanitizeHtmlContent,
  validateAll
};
