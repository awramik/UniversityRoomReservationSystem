'use client';

import { useState } from 'react';
import { api } from '@/src/app/lib/api-client';
import {
  UserProfileResponse,
  UpdateUserProfileRequest,
  APIError,
} from '@/src/app/lib/types';
import { useAuth } from '@/src/app/context/auth-context';
import { Link } from '@/src/design-system/atoms/Link';
import { LightCard } from '@/src/design-system/cards';

export default function UserProfilePage() {
  const { user, refreshUser } = useAuth();

  const [formData, setFormData] = useState<UpdateUserProfileRequest>({
    name: user?.name || '',
    surname: user?.surname || '',
    email: user?.email || '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!user) {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const updateData: UpdateUserProfileRequest = {
        email: formData.email || undefined,
        name: formData.name || undefined,
        surname: formData.surname || undefined,
      };

      const updatedUser = await api.patch<UserProfileResponse>(
        '/users/me',
        updateData
      );

      if (updatedUser) {
        setFormData({
          name: updatedUser.name || '',
          surname: updatedUser.surname || '',
          email: updatedUser.email || '',
        });
      }

await refreshUser();

      // update auth context
      await refreshUser();

      setSuccess('Profil został zaktualizowany');

      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message || 'Błąd podczas aktualizacji profilu');
      } else {
        setError('Błąd sieci');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Mój profil
        </h1>

        <p className="text-slate-600 dark:text-slate-400">
          Edytuj swoje dane profilowe
        </p>
      </div>

      <div className="max-w-2xl">
        <LightCard>
          {/* User info */}
          <div className="mb-8 p-4 rounded">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Nazwa użytkownika
                </p>

                <p className="text-slate-900 dark:text-white font-medium">
                  {user.username}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Rola
                </p>

                <p className="text-slate-900 dark:text-white font-medium">
                  {user.role === 'ADMIN'
                    ? 'Administrator'
                    : user.role === 'LECTURER'
                    ? 'Wykładowca'
                    : 'Student'}
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-200 px-4 py-3 rounded mb-6">
              ✓ {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              >
                Imię
              </label>

              <input
                type="text"
                id="name"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                placeholder="Wpisz imię"
                disabled={isLoading}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="surname"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              >
                Nazwisko
              </label>

              <input
                type="text"
                id="surname"
                name="surname"
                value={formData.surname || ''}
                onChange={handleChange}
                placeholder="Wpisz nazwisko"
                disabled={isLoading}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              >
                Email
              </label>

              <input
                type="email"
                id="email"
                name="email"
                value={formData.email || ''}
                onChange={handleChange}
                placeholder="Wpisz email"
                disabled={isLoading}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-medium py-2 px-4 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Aktualizowanie...' : 'Zapisz zmiany'}
              </button>

              <Link href="/" className="flex-1">
                <button
                  type="button"
                  className="w-full text-center bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-medium py-2 px-4 rounded-md transition"
                >
                  Anuluj
                </button>
              </Link>
            </div>
          </form>
        </LightCard>
      </div>
    </div>
  );
}
