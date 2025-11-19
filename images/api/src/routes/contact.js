const express = require('express');
const router = express.Router();
const container = require('../container');
const { asyncHandler, HTTP_STATUS } = require('../middleware/errorHandler');
const {
  validateRequiredFields,
  validateEmail,
  sanitizeText
} = require('../middleware/validation');

/**
 * @route POST /contact
 * @description Send contact form message via email
 * @access Public
 * @body {string} name - Sender's name
 * @body {string} email - Sender's email address
 * @body {string} subject - Message subject
 * @body {string} message - Message content
 * @returns {Object} Success message
 * @throws {ValidationError} 400 - Missing or invalid fields
 * @throws {Error} 500 - Email sending failed
 */
router.post(
  '/',
  validateRequiredFields(['name', 'email', 'subject', 'message']),
  validateEmail('email'),
  sanitizeText(['name', 'subject'], 200),
  sanitizeText(['message'], 5000),
  asyncHandler(async (req, res) => {
    const { name, email, subject, message } = req.body;

    const emailService = container.get('emailService');

    // Send email using EmailService
    await emailService.sendEmail({
      to: 'jan@tastbaar.studio',
      replyTo: email,
      subject: `[Checkpoint Contact] ${subject} - from ${name}`,
      text: `
Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}
      `,
      html: `
<h3>New Contact Form Submission</h3>
<p><strong>Name:</strong> ${name}</p>
<p><strong>Email:</strong> ${email}</p>
<p><strong>Subject:</strong> ${subject}</p>
<hr>
<p><strong>Message:</strong></p>
<p>${message.replace(/\n/g, '<br>')}</p>
      `
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Message sent successfully'
    });
  })
);

module.exports = router;
