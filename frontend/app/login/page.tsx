'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/app/lib/api-client';
import { LoginRequest, LoginResponse, APIError } from '@/app/lib/types';
import { useAuth } from '@/app/context/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { refreshUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const loginRequest: LoginRequest = { username, password };
      const response = await api.post<LoginResponse>('/auth/login', loginRequest);

      if (response?.token) {
        localStorage.setItem('token', response.token);

        // 🔥 WAŻNE: odśwież usera w kontekście
        await refreshUser();

        router.push('/rooms');
      } else {
        setError('Nie udało się zalogować. Spróbuj ponownie.');
      }
    } catch (err) {
      if (err instanceof APIError) {
        if (err.status === 401) {
          setError('Nieprawidłowa nazwa użytkownika lub hasło');
        } else {
          setError(err.message || 'Błąd podczas logowania');
        }
      } else {
        setError('Błąd sieci. Sprawdź połączenie z serwerem.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 shadow-md rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white text-center">
          Rezerwacja Sal
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username"
            className="w-full p-2 border rounded"
            required
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
            className="w-full p-2 border rounded"
            required
          />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white p-2 rounded"
          >
            {isLoading ? 'Logowanie...' : 'Zaloguj się'}
          </button>
        </form>
      </div>
    </div>
  );
}
