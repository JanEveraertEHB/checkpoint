const path = require('path');

/**
 * Application Configuration
 * Centralizes all configuration values to follow Open/Closed Principle
 * All configuration should be loaded from environment variables with sensible defaults
 */

const config = {
  // Server Configuration
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || '*'
  },

  // Database Configuration
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/checkpoint',
    client: 'pg'
  },

  // Authentication Configuration
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10)
  },

  // File Upload Configuration
  upload: {
    directory: process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads'),
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || (10 * 1024 * 1024).toString(), 10), // 10MB default
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedDocumentTypes: ['text/plain', 'application/pdf'],
    get allowedTypes() {
      return [...this.allowedImageTypes, ...this.allowedDocumentTypes];
    }
  },

  // Email Configuration
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: process.env.SMTP_SECURE === 'true' || true,
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASSWORD || ''
    },
    from: process.env.SMTP_FROM || 'noreply@checkpoint.com',
    contactRecipient: process.env.CONTACT_EMAIL || 'jan@tastbaar.studio'
  },

  // Classroom Configuration
  classroom: {
    inviteCodeLength: 8,
    inviteCodeCharset: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  },

  // Pagination Configuration
  pagination: {
    defaultLimit: 50,
    maxLimit: 100
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableConsole: process.env.LOG_CONSOLE !== 'false'
  }
};

/**
 * Validate required environment variables
 * @throws {Error} If required environment variables are missing
 */
function validateConfig() {
  const required = [];

  // Check for required environment variables in production
  if (config.server.env === 'production') {
    if (!process.env.JWT_SECRET) {
      required.push('JWT_SECRET');
    }
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      required.push('SMTP_USER and SMTP_PASSWORD');
    }
  }

  if (required.length > 0) {
    throw new Error(`Missing required environment variables: ${required.join(', ')}`);
  }
}

// Validate on load
validateConfig();

module.exports = config;
