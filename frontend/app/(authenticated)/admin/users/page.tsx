'use client';

import { useState, useEffect } from 'react';
import { api } from '@/app/lib/api-client';
import { UserProfileResponse, APIError } from '@/app/lib/types';
import { useAuth } from '@/app/context/auth-context';
import Link from 'next/link';

const ROLE_NAMES: { [key: string]: string } = {
  ADMIN: 'Administrator',
  LECTURER: 'Wykładowca',
  STUDENT: 'Student',
};

const ROLE_COLORS: { [key: string]: string } = {
  ADMIN: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  LECTURER: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  STUDENT: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
};

export default function AdminUsersPage() {
  const { user } = useAuth();

  const [users, setUsers] = useState<UserProfileResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'role'>('name');

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      window.location.href = '/';
      return;
    }

    loadUsers();
  }, [user]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError('');

      const data = await api.get<UserProfileResponse[]>('/users');
      setUsers(data || []);
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message || 'Błąd podczas ładowania użytkowników');
      } else {
        setError('Błąd sieci');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const sortedUsers = [...users].sort((a, b) => {
    if (sortBy === 'name') {
      return `${a.name} ${a.surname}`.localeCompare(
        `${b.name} ${b.surname}`
      );
    }
    return a.role.localeCompare(b.role);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/"
          className="text-blue-500 hover:text-blue-600 inline-block mb-4"
        >
          ← Wróć
        </Link>

        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Użytkownicy
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Zarządzanie kontami w systemie
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Controls */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Sortowanie
          </p>
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            Aktualnie: {sortBy === 'name' ? 'Imię i nazwisko' : 'Rola'}
          </p>
        </div>

        <select
          value={sortBy}
          onChange={(e) =>
            setSortBy(e.target.value as 'name' | 'role')
          }
          className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="name">Imię i nazwisko</option>
          <option value="role">Rola</option>
        </select>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-10 text-slate-600 dark:text-slate-400">
          Ładowanie użytkowników...
        </div>
      )}

      {/* Empty */}
      {!isLoading && users.length === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-8 text-center border border-slate-200 dark:border-slate-700">
          <p className="text-slate-600 dark:text-slate-400">
            Brak użytkowników w systemie
          </p>
        </div>
      )}

      {/* Users Grid (better than raw table) */}
      {!isLoading && users.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {sortedUsers.map((u) => (
              <div
                key={u.id}
                className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition"
              >
                {/* Left */}
                <div>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    {u.name} {u.surname}
                  </p>

                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    @{u.username} · {u.email}
                  </p>
                </div>

                {/* Right */}
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      ROLE_COLORS[u.role] ||
                      'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {ROLE_NAMES[u.role] || u.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
