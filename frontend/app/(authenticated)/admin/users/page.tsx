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

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfileResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'role'>('name');

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      window.location.href = '/';
    } else {
      loadUsers();
    }
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
      }
    } finally {
      setIsLoading(false);
    }
  };

  const sortedUsers = [...users].sort((a, b) => {
    if (sortBy === 'name') {
      return `${a.name} ${a.surname}`.localeCompare(`${b.name} ${b.surname}`);
    } else {
      return a.role.localeCompare(b.role);
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-blue-500 hover:text-blue-600 inline-block mb-4">
          ← Wróć
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Użytkownicy</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Lista wszystkich użytkowników systemu
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Sort Options */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-slate-200 dark:border-slate-700">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Sortuj po:
        </label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'name' | 'role')}
          className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="name">Imię i nazwisko</option>
          <option value="role">Rola</option>
        </select>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <div className="text-center text-slate-600 dark:text-slate-400 py-8">
          Ładowanie użytkowników...
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-8 text-center border border-slate-200 dark:border-slate-700">
          <p className="text-slate-600 dark:text-slate-400">Brak użytkowników</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                  Imię i nazwisko
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                  Nazwa użytkownika
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                  Rola
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {sortedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                  <td className="px-6 py-4 text-slate-900 dark:text-white font-medium">
                    {user.name} {user.surname}
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                    {user.username}
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                    {user.email}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-semibold px-3 py-1 rounded-full">
                      {ROLE_NAMES[user.role] || user.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
