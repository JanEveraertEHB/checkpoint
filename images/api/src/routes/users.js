const express = require('express');
const router = express.Router();
const container = require('../container');
const { decodeToken } = require('../helpers/authHelpers');
const { asyncHandler, HTTP_STATUS } = require('../middleware/errorHandler');
const {
  validateRequiredFields,
  validateEmail,
  validatePassword,
  sanitizeText
} = require('../middleware/validation');
const pg = require('../db/db.js');

/**
 * @route GET /users/validate_token
 * @description Validate JWT token and return user data
 * @access Protected
 * @headers {string} Authorization - Bearer token
 * @returns {Object} User object without password
 * @throws {AuthenticationError} 401 - Invalid or missing token
 */
router.get('/validate_token', decodeToken, asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'Invalid token'
    });
  }

  const userService = container.get('userService');
  const user = await userService.getProfile(req.user.uuid);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    ...user
  });
}))

/**
 * @route POST /users/login
 * @description Authenticate user and generate JWT token
 * @access Public
 * @body {string} email - User's email address
 * @body {string} password - User's password
 * @returns {Object} User object with token
 * @throws {ValidationError} 400 - Missing or invalid fields
 * @throws {AuthenticationError} 401 - Invalid credentials
 * @throws {AuthorizationError} 403 - Account deleted
 */
router.post(
  '/login',
  validateRequiredFields(['email', 'password']),
  validateEmail('email'),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const userService = container.get('userService');

    const { user, token } = await userService.login(email, password);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      ...user,
      token,
      message: 'Login successful'
    });
  })
)

/**
 * @route POST /users/register
 * @description Register a new user account
 * @access Public
 * @body {string} first_name - User's first name
 * @body {string} last_name - User's last name
 * @body {string} email - User's email address
 * @body {string} password - User's password (min 6 characters)
 * @body {string} [user_type='student'] - User type (student or teacher)
 * @returns {Object} Created user object with token
 * @throws {ValidationError} 400 - Missing or invalid fields
 * @throws {ConflictError} 409 - Email already in use
 */
router.post(
  '/register',
  validateRequiredFields(['first_name', 'last_name', 'email', 'password']),
  validateEmail('email'),
  validatePassword('password', 6),
  sanitizeText(['first_name', 'last_name'], 100),
  asyncHandler(async (req, res) => {
    const { first_name, last_name, email, password, user_type } = req.body;

    // Validate user_type if provided
    if (user_type && !['student', 'teacher'].includes(user_type)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'user_type must be either "student" or "teacher"'
      });
    }

    const userService = container.get('userService');

    const { user, token } = await userService.register({
      first_name,
      last_name,
      email,
      password,
      user_type
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      ...user,
      token,
      message: 'Registration successful'
    });
  })
)

/**
 * @route GET /users/profile
 * @description Get authenticated user's profile
 * @access Protected
 * @headers {string} Authorization - Bearer token
 * @returns {Object} User profile without password
 * @throws {AuthenticationError} 401 - Invalid or missing token
 * @throws {NotFoundError} 404 - User not found
 */
router.get('/profile', decodeToken, asyncHandler(async (req, res) => {
  const userService = container.get('userService');
  const user = await userService.getProfile(req.user.uuid);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    ...user
  });
}))

/**
 * @route PUT /users/profile
 * @description Update authenticated user's profile
 * @access Protected
 * @headers {string} Authorization - Bearer token
 * @body {string} [first_name] - Updated first name
 * @body {string} [last_name] - Updated last name
 * @body {string} [email] - Updated email address
 * @body {string} [date_of_birth] - Updated date of birth
 * @returns {Object} Updated user profile with new token
 * @throws {AuthenticationError} 401 - Invalid or missing token
 * @throws {ValidationError} 400 - Invalid fields
 * @throws {ConflictError} 409 - Email already in use
 */
router.put(
  '/profile',
  decodeToken,
  sanitizeText(['first_name', 'last_name'], 100),
  asyncHandler(async (req, res) => {
    const { first_name, last_name, email, date_of_birth } = req.body;
    const updateData = {};

    if (first_name) updateData.first_name = first_name;
    if (last_name) updateData.last_name = last_name;
    if (email) updateData.email = email;
    if (date_of_birth !== undefined) updateData.date_of_birth = date_of_birth || null;

    if (Object.keys(updateData).length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'No fields to update'
      });
    }

    const userService = container.get('userService');
    const { user, token } = await userService.updateProfile(req.user.uuid, updateData);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      ...user,
      token,
      message: 'Profile updated successfully'
    });
  })
)

/**
 * @route PUT /users/password
 * @description Change authenticated user's password
 * @access Protected
 * @headers {string} Authorization - Bearer token
 * @body {string} current_password - Current password for verification
 * @body {string} new_password - New password (min 6 characters)
 * @returns {Object} Success message
 * @throws {AuthenticationError} 401 - Invalid or missing token / Incorrect current password
 * @throws {ValidationError} 400 - Missing or invalid fields
 * @throws {NotFoundError} 404 - User not found
 */
router.put(
  '/password',
  decodeToken,
  validateRequiredFields(['current_password', 'new_password']),
  validatePassword('new_password', 6),
  asyncHandler(async (req, res) => {
    const { current_password, new_password } = req.body;
    const userService = container.get('userService');

    await userService.changePassword(req.user.uuid, current_password, new_password);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Password updated successfully'
    });
  })
)

/**
 * @route DELETE /users/account
 * @description Delete authenticated user's account (soft delete with anonymization)
 * @access Protected
 * @headers {string} Authorization - Bearer token
 * @returns {Object} Success message
 * @throws {AuthenticationError} 401 - Invalid or missing token
 * @throws {NotFoundError} 404 - User not found or already deleted
 */
router.delete('/account', decodeToken, asyncHandler(async (req, res) => {
  const userService = container.get('userService');
  await userService.deleteAccount(req.user.uuid);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Account deleted successfully'
  });
}))

module.exports = router
