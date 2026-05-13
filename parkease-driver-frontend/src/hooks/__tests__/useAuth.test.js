import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

// Mock modules before importing useAuth
jest.mock('../../api/authApi', () => ({
  logout: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

// Now import useAuth after mocks are set up
import { useAuth } from '../useAuth';
import * as authApi from '../../api/authApi';

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    useAuthStore.setState({
      token: null,
      user: null,
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should return initial state when not authenticated', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should return isDriver as true when user role is DRIVER', () => {
    const user = { userId: 1, role: 'DRIVER' };
    useAuthStore.setState({ token: 'test-token', user });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isDriver).toBe(true);
  });

  it('should return isDriver as false when user role is not DRIVER', () => {
    const user = { userId: 1, role: 'ADMIN' };
    useAuthStore.setState({ token: 'test-token', user });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isDriver).toBe(false);
  });

  it('should return isDriver as false when user is null', () => {
    useAuthStore.setState({ token: null, user: null });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isDriver).toBe(false);
  });

  it('should return isAuthenticated as true when token exists', () => {
    const user = { userId: 1, role: 'DRIVER' };
    useAuthStore.setState({ token: 'valid-token', user });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should have setAuth function', () => {
    const { result } = renderHook(() => useAuth());

    expect(typeof result.current.setAuth).toBe('function');
  });

  it('should have handleLogout function', () => {
    const { result } = renderHook(() => useAuth());

    expect(typeof result.current.handleLogout).toBe('function');
  });

  describe('handleLogout', () => {
    it('should call logout API before clearing auth', async () => {
      authApi.logout.mockResolvedValueOnce(undefined);
      useAuthStore.setState({
        token: 'test-token',
        user: { userId: 1, fullName: 'Test User' },
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.handleLogout();
      });

      expect(authApi.logout).toHaveBeenCalled();
    });

    it('should clear auth state on successful logout', async () => {
      authApi.logout.mockResolvedValueOnce(undefined);
      useAuthStore.setState({
        token: 'test-token',
        user: { userId: 1, fullName: 'Test User' },
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.handleLogout();
      });

      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
      expect(state.user).toBeNull();
    });

    it('should clear auth state even if logout API fails', async () => {
      authApi.logout.mockRejectedValueOnce(new Error('API Error'));
      useAuthStore.setState({
        token: 'test-token',
        user: { userId: 1, fullName: 'Test User' },
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.handleLogout();
      });

      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
      expect(state.user).toBeNull();
    });

    it('should show success toast on logout', async () => {
      authApi.logout.mockResolvedValueOnce(undefined);
      useAuthStore.setState({
        token: 'test-token',
        user: { userId: 1, fullName: 'Test User' },
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.handleLogout();
      });

      expect(toast.success).toHaveBeenCalledWith('Logged out successfully');
    });

    it('should handle logout API errors silently', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      authApi.logout.mockRejectedValueOnce(new Error('Network error'));
      useAuthStore.setState({
        token: 'test-token',
        user: { userId: 1, fullName: 'Test User' },
      });

      const { result } = renderHook(() => useAuth());

      // Should not throw
      await act(async () => {
        await expect(result.current.handleLogout()).resolves.toBeUndefined();
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Hook reactivity', () => {
    it('should update when auth store changes', () => {
      const { result, rerender } = renderHook(() => useAuth());

      expect(result.current.isAuthenticated).toBe(false);

      act(() => {
        useAuthStore.setState({
          token: 'new-token',
          user: { userId: 1, role: 'DRIVER' },
        });
      });

      rerender();

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isDriver).toBe(true);
    });

    it('should update isDriver status when user role changes', () => {
      useAuthStore.setState({
        token: 'test-token',
        user: { userId: 1, role: 'ADMIN' },
      });

      const { result, rerender } = renderHook(() => useAuth());
      expect(result.current.isDriver).toBe(false);

      act(() => {
        useAuthStore.setState({
          user: { userId: 1, role: 'DRIVER' },
        });
      });

      rerender();

      expect(result.current.isDriver).toBe(true);
    });
  });

  describe('Multiple hook instances', () => {
    it('should return same values across multiple hook instances', () => {
      useAuthStore.setState({
        token: 'test-token',
        user: { userId: 1, fullName: 'Test User', role: 'DRIVER' },
      });

      const { result: result1 } = renderHook(() => useAuth());
      const { result: result2 } = renderHook(() => useAuth());

      expect(result1.current.token).toBe(result2.current.token);
      expect(result1.current.user).toEqual(result2.current.user);
      expect(result1.current.isAuthenticated).toBe(result2.current.isAuthenticated);
      expect(result1.current.isDriver).toBe(result2.current.isDriver);
    });
  });
});
