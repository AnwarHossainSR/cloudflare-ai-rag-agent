import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../lib/axios';
import { useAuthStore } from '../stores/auth';
import { useLogin } from './auth';

function LoginProbe() {
  const login = useLogin();
  return (
    <button
      type="button"
      onClick={() => login.mutate({ email: 'dev@example.com', password: 'password123' })}
    >
      Login
    </button>
  );
}

describe('useLogin', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
    vi.restoreAllMocks();
  });

  it('stores the token and user after login succeeds', async () => {
    vi.spyOn(api, 'post').mockResolvedValue({
      data: { accessToken: 'jwt-token', user: { id: 'u1', email: 'dev@example.com' } },
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={client}>
        <LoginProbe />
      </QueryClientProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => expect(useAuthStore.getState().token).toBe('jwt-token'));
    expect(useAuthStore.getState().user).toEqual({ id: 'u1', email: 'dev@example.com' });
  });
});
