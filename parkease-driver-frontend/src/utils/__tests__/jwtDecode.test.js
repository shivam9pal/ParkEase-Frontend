import { decodeJwt, isTokenExpired } from '../jwtDecode';

describe('jwtDecode utility', () => {
  describe('decodeJwt', () => {
    it('should decode a valid JWT token', () => {
      // Valid JWT with payload: { userId: 123, email: "test@example.com", exp: 9999999999 }
      const token =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEyMywiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZXhwIjo5OTk5OTk5OTk5fQ.test';

      const decoded = decodeJwt(token);

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(123);
      expect(decoded.email).toBe('test@example.com');
      expect(decoded.exp).toBe(9999999999);
    });

    it('should handle URL-safe base64 characters', () => {
      // JWT with URL-safe base64: no + or /, using - and _
      const token =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZXN0IjoiZGF0YS13aXRoLWRhc2hlcyIsImV4cCI6OTk5OTk5OTk5OX0.test';

      const decoded = decodeJwt(token);

      expect(decoded).toBeDefined();
      expect(decoded.test).toBe('data-with-dashes');
    });

    it('should return null for invalid JWT format', () => {
      const invalidToken = 'not-a-valid-token';
      const decoded = decodeJwt(invalidToken);
      expect(decoded).toBeNull();
    });

    it('should return null for malformed base64', () => {
      const invalidToken = 'header.invalid!!!.signature';
      const decoded = decodeJwt(invalidToken);
      expect(decoded).toBeNull();
    });

    it('should return null for non-JSON payload', () => {
      const token = 'header.notjson.signature';
      const decoded = decodeJwt(token);
      expect(decoded).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for non-expired token', () => {
      // Future expiration time
      const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const token =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
        Buffer.from(JSON.stringify({ exp: futureExp })).toString('base64') +
        '.signature';

      expect(isTokenExpired(token)).toBe(false);
    });

    it('should return true for expired token', () => {
      // Past expiration time
      const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const token =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
        Buffer.from(JSON.stringify({ exp: pastExp })).toString('base64') +
        '.signature';

      expect(isTokenExpired(token)).toBe(true);
    });

    it('should return true if exp claim is missing', () => {
      const token =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
        Buffer.from(JSON.stringify({ userId: 123 })).toString('base64') +
        '.signature';

      expect(isTokenExpired(token)).toBe(true);
    });

    it('should return true for invalid token format', () => {
      const invalidToken = 'invalid.format';
      expect(isTokenExpired(invalidToken)).toBe(true);
    });

    it('should correctly compare expiration at boundary', () => {
      const nowInSeconds = Math.floor(Date.now() / 1000);
      const token =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
        Buffer.from(JSON.stringify({ exp: nowInSeconds })).toString('base64') +
        '.signature';

      // At exact expiration boundary, token should be considered expired
      expect(isTokenExpired(token)).toBe(true);
    });
  });
});
