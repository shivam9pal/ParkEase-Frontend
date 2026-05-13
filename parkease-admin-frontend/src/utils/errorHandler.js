/**
 * Error Handler Utility
 * Maps backend error codes/statuses to user-friendly messages
 * Provides utilities for error extraction and correlation tracking
 * Supports both new (HTTP status) and old (errorCode) response formats
 */

// Map HTTP status codes to user-friendly messages
const httpStatusErrorMap = {
  400: "Invalid request. Please check your input.",
  401: "Your session has expired. Please login again.",
  403: "You don't have permission to perform this action.",
  404: "The requested resource was not found.",
  405: "This operation is not allowed.",
  409: "This action conflicts with existing data.",
  422: "Unable to process your request. Please check the data.",
  500: "Internal server error. Please try again later.",
  502: "Service temporarily unavailable. Please try again in a moment.",
  503: "Service is temporarily unavailable. Please try again later.",
};

// Map error codes to user-friendly messages (backward compatibility)
const errorCodeMap = {
  // OTP Errors
  OTP_NOT_FOUND: "OTP not found. Please request a new one.",
  OTP_EXPIRED: "OTP has expired. Please request a new one.",
  OTP_USED: "OTP has already been used. Please request a new one.",
  OTP_RATE_LIMITED: "Too many OTP requests. Please try again later.",
  OTP_COOLDOWN_ACTIVE: "Please wait before requesting another OTP.",
  TOO_MANY_ATTEMPTS: "Too many failed attempts. Please request a new OTP.",
  OTP_NOT_VERIFIED: "Email not verified. Please complete OTP verification first.",
  
  // Authentication Errors
  INVALID_CREDENTIALS: "Invalid email or password.",
  ACCOUNT_INACTIVE: "Your account has been deactivated. Please contact support.",
  TOKEN_EXPIRED: "Session expired. Please login again.",
  EMAIL_NOT_VERIFIED: "Email not verified. Please complete OTP verification first.",
  
  // User Management Errors
  USER_NOT_FOUND: "User not found.",
  EMAIL_EXISTS: "Email is already registered. Please use a different email.",
  USER_ALREADY_ACTIVE: "User is already active.",
  USER_ALREADY_INACTIVE: "User is already deactivated.",
  
  // Admin Errors
  FORBIDDEN: "Only Super Admin can perform this action.",
  ADMIN_EXISTS: "Admin with this email already exists.",
  ADMIN_NOT_FOUND: "Admin account not found.",
  INVALID_ADMIN_PASSWORD: "Invalid admin password.",
  ADMIN_INACTIVE: "Admin account is deactivated.",
  
  // Password Errors
  INCORRECT_PASSWORD: "Current password is incorrect.",
  PASSWORD_RESET_UNAVAILABLE: "Password reset not available for this account.",
  
  // External Service Errors
  MEDIA_SERVICE_ERROR: "Image upload failed. Please try again.",
  EMAIL_SERVICE_ERROR: "Email service unavailable. Please try again later.",
  S3_UPLOAD_ERROR: "File upload failed. Please try again.",
  
  // Validation
  VALIDATION_ERROR: "Please check your input and try again.",
  INTERNAL_ERROR: "An unexpected error occurred. Please try again.",
};

// Notification-specific error messages
const notificationErrorMap = {
  404: "Notification not found.",
  403: "You can only access your own notifications.",
  503: "Notification service temporarily unavailable.",
};

export const getErrorMessage = (errorCode, fallbackMessage = null) => {
  return errorCodeMap[errorCode] || fallbackMessage || "Something went wrong. Please try again.";
};

export const getErrorMessageByStatus = (status, fallbackMessage = null) => {
  return httpStatusErrorMap[status] || fallbackMessage || "An error occurred. Please try again.";
};

export const getNotificationErrorMessage = (status) => {
  return notificationErrorMap[status] || getErrorMessageByStatus(status);
};

/**
 * Extract HTTP status code from error response
 */
export const getStatusCode = (error) => {
  return error?.response?.status;
};

/**
 * Extract error code from response (backward compatibility)
 */
export const getErrorCode = (error) => {
  return error?.response?.data?.errorCode;
};

/**
 * Extract correlation ID from response (for debugging/support)
 */
export const getCorrelationId = (error) => {
  return error?.response?.data?.correlationId;
};

/**
 * Extract error message from response
 */
export const getErrorMessageFromResponse = (error) => {
  return error?.response?.data?.message;
};

/**
 * Extract field-level validation errors from response
 */
export const getValidationErrors = (error) => {
  return error?.response?.data?.fieldErrors || {};
};

/**
 * Check if response has validation errors
 */
export const hasValidationErrors = (error) => {
  const errors = getValidationErrors(error);
  return Object.keys(errors).length > 0;
};

/**
 * Build full error display string with optional correlation ID
 */
export const buildErrorDisplay = (error, includeCorrelationId = false) => {
  const status = getStatusCode(error);
  const errorCode = getErrorCode(error);
  const messageFromResponse = getErrorMessageFromResponse(error);
  const correlationId = getCorrelationId(error);
  
  // Try to get specific message from response first
  let userMessage = messageFromResponse;
  
  // Fall back to error code map (old format)
  if (!userMessage && errorCode) {
    userMessage = getErrorMessage(errorCode);
  }
  
  // Fall back to status code map (new format)
  if (!userMessage && status) {
    userMessage = getErrorMessageByStatus(status);
  }
  
  // Last resort
  if (!userMessage) {
    userMessage = "Something went wrong. Please try again.";
  }
  
  if (includeCorrelationId && correlationId) {
    return `${userMessage}\n(Reference: ${correlationId})`;
  }
  
  return userMessage;
};

/**
 * Build notification-specific error display
 */
export const buildNotificationErrorDisplay = (error, includeCorrelationId = false) => {
  const status = getStatusCode(error);
  const messageFromResponse = getErrorMessageFromResponse(error);
  const correlationId = getCorrelationId(error);
  
  let userMessage = messageFromResponse || getNotificationErrorMessage(status);
  
  if (includeCorrelationId && correlationId) {
    return `${userMessage}\n(Reference: ${correlationId})`;
  }
  
  return userMessage;
};

/**
 * Check if error is due to specific error code
 */
export const isErrorCode = (error, code) => {
  return getErrorCode(error) === code;
};

/**
 * Check if error is one of multiple error codes
 */
export const isErrorCodeOneOf = (error, codes) => {
  const errorCode = getErrorCode(error);
  return codes.includes(errorCode);
};

/**
 * Log error with correlation ID for debugging
 */
export const logErrorWithCorrelation = (context, error) => {
  const correlationId = getCorrelationId(error);
  const errorCode = getErrorCode(error);
  const message = getErrorMessageFromResponse(error);
  
  console.error(`[${context}] Error:`, {
    errorCode,
    message,
    correlationId,
    status: error?.response?.status,
  });
  
  if (correlationId) {
    console.log(`📍 Reference ID: ${correlationId}`);
  }
};

/**
 * NEW: Extract requestId from new analytics error format
 * Used for tracking and support reference
 */
export const getRequestId = (error) => {
  return error?.response?.data?.requestId;
};

/**
 * NEW: Extract validation errors array from new analytics error format
 * Each error has {field, message} structure
 */
export const getAnalyticsValidationErrors = (error) => {
  return error?.response?.data?.validationErrors || [];
};

/**
 * NEW: Check if error has validation errors in new format
 */
export const hasAnalyticsValidationErrors = (error) => {
  const errors = getAnalyticsValidationErrors(error);
  return Array.isArray(errors) && errors.length > 0;
};

/**
 * NEW: Format validation errors for display
 * Returns formatted string of all field errors
 */
export const formatAnalyticsValidationErrors = (error) => {
  const errors = getAnalyticsValidationErrors(error);
  if (!Array.isArray(errors) || errors.length === 0) return '';
  
  return errors.map((err) => `• ${err.field}: ${err.message}`).join('\n');
};

/**
 * NEW: Build enhanced error message with request ID
 * Used for new analytics error response format
 */
export const buildAnalyticsErrorDisplay = (error) => {
  const status = getStatusCode(error);
  const messageFromResponse = getErrorMessageFromResponse(error);
  const requestId = getRequestId(error);
  const validationErrors = getAnalyticsValidationErrors(error);

  let userMessage = messageFromResponse || getErrorMessageByStatus(status);

  // If there are validation errors, show the first one prominently
  if (validationErrors.length > 0 && validationErrors[0]?.field) {
    userMessage = `${validationErrors[0].field}: ${validationErrors[0].message}`;
  }

  // Add request ID for support
  if (requestId) {
    userMessage += `\n(Reference ID: ${requestId})`;
  }

  return userMessage;
};

/**
 * NEW: Check if error is a service availability issue
 */
export const isServiceUnavailable = (error) => {
  const status = getStatusCode(error);
  return status === 502 || status === 503;
};

/**
 * NEW: Check if error is authentication/authorization related
 */
export const isAuthError = (error) => {
  const status = getStatusCode(error);
  return status === 401 || status === 403;
};

/**
 * NEW: Log analytics error with full context
 */
export const logAnalyticsError = (context, error) => {
  const status = getStatusCode(error);
  const message = getErrorMessageFromResponse(error);
  const requestId = getRequestId(error);
  const validationErrors = getAnalyticsValidationErrors(error);
  const path = error?.config?.url;
  const method = error?.config?.method?.toUpperCase();

  console.error(`❌ [${context}] Error: ${message}`);
  console.error(`   Type: Status ${status} | Path: ${method} ${path}`);

  if (requestId) {
    console.error(`   Request ID: ${requestId}`);
  }

  if (validationErrors.length > 0) {
    console.error(`   Validation Errors:`);
    validationErrors.forEach((err) => {
      console.error(`     • ${err.field}: ${err.message}`);
    });
  }
};

/**
 * NEW: Extract support information from error
 * Returns support message with request ID
 */
export const getSupportMessage = (errorData) => {
  if (!errorData?.requestId) return '';
  return `Reference ID: ${errorData.requestId}`;
};

export default {
  getErrorMessage,
  getErrorMessageByStatus,
  getNotificationErrorMessage,
  getStatusCode,
  getErrorCode,
  getCorrelationId,
  getErrorMessageFromResponse,
  getValidationErrors,
  hasValidationErrors,
  buildErrorDisplay,
  buildNotificationErrorDisplay,
  isErrorCode,
  isErrorCodeOneOf,
  logErrorWithCorrelation,
  getRequestId,
  getAnalyticsValidationErrors,
  hasAnalyticsValidationErrors,
  formatAnalyticsValidationErrors,
  buildAnalyticsErrorDisplay,
  isServiceUnavailable,
  isAuthError,
  logAnalyticsError,
  getSupportMessage,
};
