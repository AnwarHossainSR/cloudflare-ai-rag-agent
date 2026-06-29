import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogin, useRegister } from '../api/auth';
import { LoadingState } from '../components/LoadingState';

export function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useLogin();
  const register = useRegister();
  const navigate = useNavigate();
  const mutation = mode === 'login' ? login : register;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await mutation.mutateAsync({ email, password });
    navigate('/');
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#eef3f1] px-4 py-10 text-slate-950">
      <section className="w-full max-w-md rounded-lg border border-slate-300 bg-white p-6 shadow-sm">
        <p className="font-mono text-xs uppercase tracking-wider text-cyan-700">DevDocs AI</p>
        <h1 className="mt-2 text-2xl font-semibold">
          {mode === 'login' ? 'Sign in to your copilot' : 'Create your copilot account'}
        </h1>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-950 focus:border-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Password
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-950 focus:border-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
            />
          </label>
          {mutation.isError ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              Could not {mode}. Check your details and try again.
            </p>
          ) : null}
          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {mutation.isPending ? (
              <LoadingState
                className="justify-center text-white"
                label={mode === 'login' ? 'Signing in' : 'Creating account'}
              />
            ) : mode === 'login' ? (
              'Sign in'
            ) : (
              'Create account'
            )}
          </button>
        </form>
        <button
          type="button"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          className="mt-4 text-sm font-medium text-cyan-800 hover:text-cyan-950 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          {mode === 'login' ? 'Need an account? Create one' : 'Already have an account? Sign in'}
        </button>
      </section>
    </main>
  );
}
