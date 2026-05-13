/**
 * ErrorResponse DTO shape based on backend GlobalExceptionHandler
 * @typedef {Object} ValidationError
 * @property {string} field - Field name that failed validation
 * @property {string} message - Validation error message
 */

/**
 * @typedef {Object} ErrorResponse
 * @property {string} timestamp - ISO 8601 timestamp when error occurred
 * @property {number} status - HTTP status code (400, 401, 403, 404, 500, etc.)
 * @property {string} error - HTTP status reason phrase (e.g., "Bad Request", "Forbidden")
 * @property {string} message - Detailed error message
 * @property {string} path - Request URL path (e.g., "/api/v1/analytics/occupancy/uuid")
 * @property {string} method - HTTP method (GET, POST, PUT, DELETE)
 * @property {string} requestId - Unique request ID for tracking/debugging
 * @property {ValidationError[]} [validationErrors] - Array of validation errors (if status 400)
 * @property {string} [traceId] - Optional trace ID for distributed tracing
 */

/**
 * HTTP Status codes that backend returns
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
  BAD_GATEWAY: 502,
};

/**
 * Error type mappings based on HTTP status
 */
export const ERROR_TYPE = {
  VALIDATION: 'VALIDATION',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  EXTERNAL_SERVICE: 'EXTERNAL_SERVICE',
  AUTHENTICATION: 'AUTHENTICATION',
  UNKNOWN: 'UNKNOWN',
};

/**
 * Map HTTP status to error type
 * @param {number} status - HTTP status code
 * @returns {string} Error type
 */
export const getErrorType = (status) => {
  switch (status) {
    case 400:
      return ERROR_TYPE.VALIDATION;
    case 401:
      return ERROR_TYPE.AUTHENTICATION;
    case 403:
      return ERROR_TYPE.FORBIDDEN;
    case 404:
      return ERROR_TYPE.NOT_FOUND;
    case 409:
      return ERROR_TYPE.CONFLICT;
    case 502:
    case 503:
      return ERROR_TYPE.EXTERNAL_SERVICE;
    default:
      return ERROR_TYPE.UNKNOWN;
  }
};

/**
 * Extract error response data from axios error
 * @param {Object} error - Axios error object
 * @returns {ErrorResponse|null} Parsed error response or null
 */
export const parseErrorResponse = (error) => {
  if (!error?.response?.data) {
    return null;
  }
  return error.response.data;
};
