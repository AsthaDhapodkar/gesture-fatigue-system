import { body, validationResult } from 'express-validator';

/**
 * Middleware to handle validation errors
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * Validation rules for user registration
 */
export const validateSignup = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/\d/)
    .withMessage('Password must contain a number'),
  handleValidationErrors
];

/**
 * Validation rules for user login
 */
export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

/**
 * Validation rules for session start
 */
export const validateSessionStart = [
  body('sessionType')
    .isIn(['guest', 'authenticated'])
    .withMessage('Invalid session type'),
  body('adaptiveMode')
    .optional()
    .isBoolean()
    .withMessage('Adaptive mode must be boolean'),
  handleValidationErrors
];

/**
 * Validation rules for analytics logging
 */
export const validateAnalyticsLog = [
  body('sessionId')
    .isInt()
    .withMessage('Valid session ID required'),
  body('gestureType')
    .optional()
    .isString()
    .withMessage('Gesture type must be string'),
  body('fatigueLevel')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Invalid fatigue level'),
  handleValidationErrors
];
