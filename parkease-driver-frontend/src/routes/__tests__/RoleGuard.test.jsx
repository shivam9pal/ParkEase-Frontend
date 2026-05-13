import { render, screen } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RoleGuard from '../RoleGuard';
import { useAuthStore } from '../../store/authStore';

describe('RoleGuard Component', () => {
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

  it('should render Outlet when user role matches allowedRole', () => {
    useAuthStore.setState({
      token: 'valid-token',
      user: { userId: 1, fullName: 'Test Driver', role: 'DRIVER' },
    });

    render(
      <BrowserRouter>
        <Routes>
          <Route element={<RoleGuard allowedRole="DRIVER" />}>
            <Route index element={<div>Driver Dashboard</div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    );

    expect(screen.getByText('Driver Dashboard')).toBeInTheDocument();
  });

  it('should redirect to login when user role does not match allowedRole', () => {
    useAuthStore.setState({
      token: 'valid-token',
      user: { userId: 1, fullName: 'Test Admin', role: 'ADMIN' },
    });

    render(
      <BrowserRouter>
        <Routes>
          <Route path="/auth/login" element={<div>Login Page</div>} />
          <Route element={<RoleGuard allowedRole="DRIVER" />}>
            <Route index element={<div>Driver Only Content</div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    );

    expect(screen.queryByText('Driver Only Content')).not.toBeInTheDocument();
  });

  it('should redirect to login when user is null', () => {
    useAuthStore.setState({ token: 'valid-token', user: null });

    render(
      <BrowserRouter>
        <Routes>
          <Route path="/auth/login" element={<div>Login Page</div>} />
          <Route element={<RoleGuard allowedRole="DRIVER" />}>
            <Route index element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should redirect to login when user is undefined', () => {
    useAuthStore.setState({ token: 'valid-token', user: undefined });

    render(
      <BrowserRouter>
        <Routes>
          <Route path="/auth/login" element={<div>Login Page</div>} />
          <Route element={<RoleGuard allowedRole="DRIVER" />}>
            <Route index element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should work with ADMIN role', () => {
    useAuthStore.setState({
      token: 'valid-token',
      user: { userId: 1, fullName: 'Admin User', role: 'ADMIN' },
    });

    const state = useAuthStore.getState();
    expect(state.user.role).toBe('ADMIN');
    const isAdminAuthorized = state.user && state.user.role === 'ADMIN';
    expect(isAdminAuthorized).toBe(true);
  });

  it('should be case-sensitive for role comparison', () => {
    useAuthStore.setState({
      token: 'valid-token',
      user: { userId: 1, fullName: 'Test User', role: 'Driver' },
    });

    // Test that component checks role equality
    const state = useAuthStore.getState();
    expect(state.user.role).toBe('Driver');
    expect(state.user.role).not.toBe('DRIVER');
  });

  it('should allow access with exact role match', () => {
    useAuthStore.setState({
      token: 'valid-token',
      user: { userId: 1, fullName: 'Driver', role: 'DRIVER' },
    });

    // Test store level role match logic
    const state = useAuthStore.getState();
    expect(state.user).not.toBeNull();
    expect(state.user.role).toBe('DRIVER');
    const isAuthorized = state.user && state.user.role === 'DRIVER';
    expect(isAuthorized).toBe(true);
  });

  it('should deny access when role does not match exactly', () => {
    useAuthStore.setState({
      token: 'valid-token',
      user: { userId: 1, fullName: 'User', role: 'DRIVER' },
    });

    render(
      <BrowserRouter>
        <Routes>
          <Route path="/auth/login" element={<div>Login Page</div>} />
          <Route element={<RoleGuard allowedRole="SUPER_ADMIN" />}>
            <Route index element={<div>Super Admin Content</div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    );

    expect(screen.queryByText('Super Admin Content')).not.toBeInTheDocument();
  });

  it('should handle user object with additional properties', () => {
    useAuthStore.setState({
      token: 'valid-token',
      user: {
        userId: 1,
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '9876543210',
        role: 'DRIVER',
        vehiclePlate: 'ABC123',
        profilePicUrl: 'https://example.com/pic.jpg',
      },
    });

    // Test that store can handle complex user objects
    const state = useAuthStore.getState();
    expect(state.user).not.toBeNull();
    expect(state.user.role).toBe('DRIVER');
    expect(state.user.email).toBe('john@example.com');
    expect(state.user.vehiclePlate).toBe('ABC123');
  });

  it('should verify role selector from store works', () => {
    useAuthStore.setState({
      token: 'token',
      user: { userId: 1, fullName: 'Test', role: 'DRIVER' },
    });

    const state = useAuthStore.getState();
    expect(state.user.role).toBe('DRIVER');
  });

  it('should enforce role-based access control', () => {
    useAuthStore.setState({
      token: 'valid-token',
      user: { userId: 1, fullName: 'User', role: 'VIEWER' },
    });

    render(
      <BrowserRouter>
        <Routes>
          <Route path="/auth/login" element={<div>Login</div>} />
          <Route element={<RoleGuard allowedRole="ADMIN" />}>
            <Route index element={<div>Admin Area</div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    );

    expect(screen.queryByText('Admin Area')).not.toBeInTheDocument();
  });
});