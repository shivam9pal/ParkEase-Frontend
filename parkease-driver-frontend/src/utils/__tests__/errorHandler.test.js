import {
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
} from '../errorHandler';

describe('errorHandler utility', () => {
  describe('getErrorMessage', () => {
    it('should return error message for known error code', () => {
      const message = getErrorMessage('INVALID_CREDENTIALS');
      expect(message).toBe('Invalid email or password.');
    });

    it('should return fallback message for unknown error code', () => {
      const fallback = 'Custom fallback';
      const message = getErrorMessage('UNKNOWN_CODE', fallback);
      expect(message).toBe(fallback);
    });

    it('should return default message when no fallback provided', () => {
      const message = getErrorMessage('UNKNOWN_CODE');
      expect(message).toBe('Something went wrong. Please try again.');
    });

    it('should handle OTP errors', () => {
      expect(getErrorMessage('OTP_EXPIRED')).toContain('expired');
      expect(getErrorMessage('OTP_NOT_FOUND')).toContain('OTP not found');
      expect(getErrorMessage('OTP_RATE_LIMITED')).toContain('Too many');
    });

    it('should handle authentication errors', () => {
      expect(getErrorMessage('ACCOUNT_INACTIVE')).toContain('deactivated');
      expect(getErrorMessage('TOKEN_EXPIRED')).toContain('expired');
      expect(getErrorMessage('EMAIL_NOT_VERIFIED')).toContain('verified');
    });
  });

  describe('getErrorMessageByStatus', () => {
    it('should return error message for known HTTP status', () => {
      expect(getErrorMessageByStatus(401)).toBe('Your session has expired. Please login again.');
      expect(getErrorMessageByStatus(403)).toContain("don't have permission");
      expect(getErrorMessageByStatus(404)).toContain('not found');
    });

    it('should return fallback message for unknown status', () => {
      const fallback = 'Custom fallback';
      const message = getErrorMessageByStatus(599, fallback);
      expect(message).toBe(fallback);
    });

    it('should return default message when no fallback provided', () => {
      const message = getErrorMessageByStatus(599);
      expect(message).toBe('An error occurred. Please try again.');
    });
  });

  describe('getNotificationErrorMessage', () => {
    it('should return notification-specific error message', () => {
      expect(getNotificationErrorMessage(404)).toBe('Notification not found.');
      expect(getNotificationErrorMessage(403)).toBe('You can only access your own notifications.');
    });

    it('should fall back to status error message', () => {
      const message = getNotificationErrorMessage(503);
      expect(message).toContain('Notification service');
    });
  });

  describe('Error extraction functions', () => {
    const mockError = {
      response: {
        status: 400,
        data: {
          errorCode: 'INVALID_CREDENTIALS',
          message: 'Custom error message',
          correlationId: 'ABC123',
          fieldErrors: { email: 'Invalid email format' },
        },
      },
    };

    it('getStatusCode should extract HTTP status', () => {
      expect(getStatusCode(mockError)).toBe(400);
    });

    it('getErrorCode should extract error code', () => {
      expect(getErrorCode(mockError)).toBe('INVALID_CREDENTIALS');
    });

    it('getCorrelationId should extract correlation ID', () => {
      expect(getCorrelationId(mockError)).toBe('ABC123');
    });

    it('getErrorMessageFromResponse should extract message', () => {
      expect(getErrorMessageFromResponse(mockError)).toBe('Custom error message');
    });

    it('getValidationErrors should extract field errors', () => {
      const errors = getValidationErrors(mockError);
      expect(errors).toEqual({ email: 'Invalid email format' });
    });

    it('should handle missing response gracefully', () => {
      const errorWithoutResponse = { message: 'Network error' };
      expect(getStatusCode(errorWithoutResponse)).toBeUndefined();
      expect(getErrorCode(errorWithoutResponse)).toBeUndefined();
      expect(getValidationErrors(errorWithoutResponse)).toEqual({});
    });
  });

  describe('hasValidationErrors', () => {
    it('should return true when validation errors exist', () => {
      const errorWithValidationErrors = {
        response: {
          data: {
            fieldErrors: { email: 'Invalid', password: 'Too short' },
          },
        },
      };
      expect(hasValidationErrors(errorWithValidationErrors)).toBe(true);
    });

    it('should return false when no validation errors', () => {
      const errorWithoutValidationErrors = {
        response: {
          data: {},
        },
      };
      expect(hasValidationErrors(errorWithoutValidationErrors)).toBe(false);
    });

    it('should return false for undefined response', () => {
      expect(hasValidationErrors({})).toBe(false);
    });
  });

  describe('buildErrorDisplay', () => {
    it('should use message from response if available', () => {
      const error = {
        response: {
          status: 400,
          data: {
            message: 'Response message',
            errorCode: 'SOME_CODE',
          },
        },
      };
      expect(buildErrorDisplay(error)).toBe('Response message');
    });

    it('should fall back to error code map', () => {
      const error = {
        response: {
          status: 400,
          data: {
            errorCode: 'INVALID_CREDENTIALS',
          },
        },
      };
      expect(buildErrorDisplay(error)).toBe('Invalid email or password.');
    });

    it('should fall back to status map', () => {
      const error = {
        response: {
          status: 401,
        },
      };
      expect(buildErrorDisplay(error)).toContain('session');
    });

    it('should include correlation ID when requested', () => {
      const error = {
        response: {
          status: 400,
          data: {
            message: 'Error',
            correlationId: 'XYZ789',
          },
        },
      };
      const display = buildErrorDisplay(error, true);
      expect(display).toContain('XYZ789');
      expect(display).toContain('Reference');
    });

    it('should return default message as last resort', () => {
      const error = {
        response: {
          status: 999,
          data: {},
        },
      };
      expect(buildErrorDisplay(error)).toBe('An error occurred. Please try again.');
    });
  });

  describe('buildNotificationErrorDisplay', () => {
    it('should use message from response if available', () => {
      const error = {
        response: {
          status: 404,
          data: {
            message: 'Custom notification message',
          },
        },
      };
      expect(buildNotificationErrorDisplay(error)).toBe('Custom notification message');
    });

    it('should use notification-specific message', () => {
      const error = {
        response: {
          status: 403,
          data: {},
        },
      };
      expect(buildNotificationErrorDisplay(error)).toBe('You can only access your own notifications.');
    });

    it('should include correlation ID when requested', () => {
      const error = {
        response: {
          status: 404,
          data: {
            correlationId: 'NOTIF123',
          },
        },
      };
      const display = buildNotificationErrorDisplay(error, true);
      expect(display).toContain('NOTIF123');
    });
  });

  describe('isErrorCode', () => {
    it('should return true when error code matches', () => {
      const error = {
        response: {
          data: {
            errorCode: 'INVALID_CREDENTIALS',
          },
        },
      };
      expect(isErrorCode(error, 'INVALID_CREDENTIALS')).toBe(true);
    });

    it('should return false when error code does not match', () => {
      const error = {
        response: {
          data: {
            errorCode: 'SOMETHING_ELSE',
          },
        },
      };
      expect(isErrorCode(error, 'INVALID_CREDENTIALS')).toBe(false);
    });
  });

  describe('isErrorCodeOneOf', () => {
    it('should return true when error code is in the list', () => {
      const error = {
        response: {
          data: {
            errorCode: 'TOKEN_EXPIRED',
          },
        },
      };
      expect(isErrorCodeOneOf(error, ['INVALID_CREDENTIALS', 'TOKEN_EXPIRED'])).toBe(true);
    });

    it('should return false when error code is not in the list', () => {
      const error = {
        response: {
          data: {
            errorCode: 'UNKNOWN_CODE',
          },
        },
      };
      expect(isErrorCodeOneOf(error, ['INVALID_CREDENTIALS', 'TOKEN_EXPIRED'])).toBe(false);
    });

    it('should handle empty list', () => {
      const error = {
        response: {
          data: {
            errorCode: 'ANY_CODE',
          },
        },
      };
      expect(isErrorCodeOneOf(error, [])).toBe(false);
    });
  });
});
