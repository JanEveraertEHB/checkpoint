const nodemailer = require('nodemailer');

/**
 * EmailService - Abstracts email sending functionality
 * Implements Dependency Inversion Principle by providing an interface for email operations
 * Makes it easy to swap email providers or configurations
 * @class
 */
class EmailService {
  /**
   * Creates an instance of EmailService
   * @param {Object} config - Email configuration
   * @param {string} config.host - SMTP host
   * @param {number} config.port - SMTP port
   * @param {boolean} config.secure - Use TLS
   * @param {Object} config.auth - Authentication credentials
   * @param {string} config.auth.user - SMTP username
   * @param {string} config.auth.pass - SMTP password
   * @param {string} config.from - Default sender email address
   */
  constructor(config) {
    this.config = config;
    this.transporter = this.createTransporter();
  }

  /**
   * Create nodemailer transporter
   * @private
   * @returns {Object} Nodemailer transporter
   */
  createTransporter() {
    return nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth: {
        user: this.config.auth.user,
        pass: this.config.auth.pass
      }
    });
  }

  /**
   * Send an email
   * @param {Object} emailData - Email data
   * @param {string} emailData.to - Recipient email address
   * @param {string} emailData.subject - Email subject
   * @param {string} [emailData.text] - Plain text body
   * @param {string} [emailData.html] - HTML body
   * @param {string} [emailData.from] - Sender email (overrides default)
   * @param {string} [emailData.replyTo] - Reply-to email address
   * @returns {Promise<Object>} Nodemailer send result
   * @throws {Error} Email sending error
   */
  async sendEmail(emailData) {
    const mailOptions = {
      from: emailData.from || this.config.from,
      to: emailData.to,
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html,
      replyTo: emailData.replyTo
    };

    return await this.transporter.sendMail(mailOptions);
  }

  /**
   * Send contact form email
   * @param {Object} contactData - Contact form data
   * @param {string} contactData.name - Sender's name
   * @param {string} contactData.email - Sender's email
   * @param {string} contactData.message - Message content
   * @param {string} recipientEmail - Email address to send to
   * @returns {Promise<Object>} Nodemailer send result
   * @throws {Error} Email sending error
   */
  async sendContactForm(contactData, recipientEmail) {
    const { name, email, message } = contactData;

    const emailData = {
      to: recipientEmail,
      subject: `Contact Form Submission from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      html: `
        <h2>Contact Form Submission</h2>
        <p><strong>Name:</strong> ${this.escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${this.escapeHtml(email)}</p>
        <p><strong>Message:</strong></p>
        <p>${this.escapeHtml(message).replace(/\n/g, '<br>')}</p>
      `,
      replyTo: email
    };

    return await this.sendEmail(emailData);
  }

  /**
   * Send welcome email to new user
   * @param {string} recipientEmail - User's email address
   * @param {string} recipientName - User's name
   * @returns {Promise<Object>} Nodemailer send result
   * @throws {Error} Email sending error
   */
  async sendWelcomeEmail(recipientEmail, recipientName) {
    const emailData = {
      to: recipientEmail,
      subject: 'Welcome to Checkpoint!',
      text: `Hello ${recipientName},\n\nWelcome to Checkpoint! We're glad to have you here.\n\nBest regards,\nThe Checkpoint Team`,
      html: `
        <h2>Welcome to Checkpoint!</h2>
        <p>Hello ${this.escapeHtml(recipientName)},</p>
        <p>Welcome to Checkpoint! We're glad to have you here.</p>
        <p>Best regards,<br>The Checkpoint Team</p>
      `
    };

    return await this.sendEmail(emailData);
  }

  /**
   * Send password reset email
   * @param {string} recipientEmail - User's email address
   * @param {string} recipientName - User's name
   * @param {string} resetLink - Password reset link
   * @returns {Promise<Object>} Nodemailer send result
   * @throws {Error} Email sending error
   */
  async sendPasswordResetEmail(recipientEmail, recipientName, resetLink) {
    const emailData = {
      to: recipientEmail,
      subject: 'Password Reset Request',
      text: `Hello ${recipientName},\n\nYou requested to reset your password. Click the link below to reset it:\n\n${resetLink}\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nThe Checkpoint Team`,
      html: `
        <h2>Password Reset Request</h2>
        <p>Hello ${this.escapeHtml(recipientName)},</p>
        <p>You requested to reset your password. Click the button below to reset it:</p>
        <p><a href="${this.escapeHtml(resetLink)}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a></p>
        <p>Or copy and paste this link into your browser:<br>${this.escapeHtml(resetLink)}</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>The Checkpoint Team</p>
      `
    };

    return await this.sendEmail(emailData);
  }

  /**
   * Verify email configuration
   * @returns {Promise<boolean>} True if configuration is valid
   * @throws {Error} Configuration verification error
   */
  async verifyConfiguration() {
    return await this.transporter.verify();
  }

  /**
   * Escape HTML special characters
   * @private
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  /**
   * Close the email transporter
   * @returns {void}
   */
  close() {
    this.transporter.close();
  }
}

module.exports = EmailService;
