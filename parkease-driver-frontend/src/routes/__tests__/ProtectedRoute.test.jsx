import { render, screen } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';
import { useAuthStore } from '../../store/authStore';

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      token: null,
      user: null,
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should render Outlet when token exists', () => {
    useAuthStore.setState({
      token: 'valid-token',
      user: { userId: 1, fullName: 'Test User' },
    });

    render(
      <BrowserRouter>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route index element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should redirect to login when token is null', () => {
    useAuthStore.setState({ token: null, user: null });

    render(
      <BrowserRouter>
        <Routes>
          <Route path="/auth/login" element={<div>Login Page</div>} />
          <Route element={<ProtectedRoute />}>
            <Route index element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    );

    // When no token, ProtectedRoute redirects to /auth/login
    // So we should not see protected content
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should redirect to login when token is empty string', () => {
    useAuthStore.setState({ token: '', user: { userId: 1 } });

    render(
      <BrowserRouter>
        <Routes>
          <Route path="/auth/login" element={<div>Login Page</div>} />
          <Route element={<ProtectedRoute />}>
            <Route index element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should verify store token selector works', () => {
    useAuthStore.setState({ token: 'test-token-123' });

    const state = useAuthStore.getState();
    expect(state.token).toBe('test-token-123');
  });

  it('should handle token state transitions', () => {
    // First set token
    useAuthStore.setState({ token: 'initial-token' });
    expect(useAuthStore.getState().token).toBe('initial-token');

    // Then clear it
    useAuthStore.setState({ token: null });
    expect(useAuthStore.getState().token).toBeNull();
  });
});
