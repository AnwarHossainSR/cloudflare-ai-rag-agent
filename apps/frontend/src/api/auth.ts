import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { AuthUser, useAuthStore } from '../stores/auth';

export interface AuthCredentials {
  email: string;
  password: string;
}

interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

function useAuthMutation(path: string) {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: async (credentials: AuthCredentials) => {
      const { data } = await api.post<AuthResponse>(path, credentials);
      return data;
    },
    onSuccess: ({ accessToken, user }) => setAuth(accessToken, user),
  });
}

export function useLogin() {
  return useAuthMutation('/auth/login');
}

export function useRegister() {
  return useAuthMutation('/auth/register');
}
