import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

// Get frontend URL from environment
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || window.location.origin;

/**
 * OAuth Callback Page
 * URL: /oauth/callback?token=JWT&user=profile
 * 
 * This page:
 * 1. Extracts token and user from URL params
 * 2. Validates the data
 * 3. Sends postMessage to parent window (main window)
 * 4. Closes itself
 */
export default function OAuthCallback() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    try {
      // Extract token and user from URL parameters
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      const userJson = params.get('user');

      if (!token || !userJson) {
        const errorMsg = 'Missing token or user data in callback URL';
        
        if (window.opener) {
          window.opener.postMessage(
            {
              type: 'OAUTH_ERROR',
              message: errorMsg
            },
            FRONTEND_URL
          );
        }
        
        setTimeout(() => window.close(), 1000);
        return;
      }

      // Parse user data
      let user;
      try {
        user = JSON.parse(decodeURIComponent(userJson));
      } catch (e) {
        if (window.opener) {
          window.opener.postMessage(
            {
              type: 'OAUTH_ERROR',
              message: 'Invalid user data format: ' + e.message
            },
            FRONTEND_URL
          );
        }
        setTimeout(() => window.close(), 1000);
        return;
      }

      // Validate user role
      if (user.role !== 'DRIVER') {
        const errorMsg = `Only DRIVER role allowed. You have: ${user.role}`;
        
        if (window.opener) {
          window.opener.postMessage(
            {
              type: 'OAUTH_ERROR',
              message: errorMsg
            },
            FRONTEND_URL
          );
        }
        
        setTimeout(() => window.close(), 1000);
        return;
      }

      // Send auth data to parent window (main window)
      if (window.opener) {
        window.opener.postMessage(
          {
            type: 'OAUTH_SUCCESS',
            accessToken: token,
            user: user
          },
          FRONTEND_URL
        );
      }

      // Close popup after sending data
      setTimeout(() => {
        window.close();
      }, 500);

    } catch (error) {
      if (window.opener) {
        window.opener.postMessage(
          {
            type: 'OAUTH_ERROR',
            message: 'Callback processing error: ' + error.message
          },
          FRONTEND_URL
        );
      }
      
      setTimeout(() => window.close(), 1000);
    }
  }, []);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: '#f5f5f5',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '20px'
      }}>
        <h2>Processing OAuth login...</h2>
        <p style={{ color: '#666', marginTop: '10px' }}>
          Please wait while we authenticate you.
        </p>
        <p style={{ color: '#999', fontSize: '12px', marginTop: '20px' }}>
          ℹ️ Open browser console (F12) to see detailed logs
        </p>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #3498db',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '20px auto'
        }} />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
