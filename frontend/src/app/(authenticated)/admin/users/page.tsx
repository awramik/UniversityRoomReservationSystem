'use client';

import { useState, useEffect } from 'react';
import { api } from '@/src/app/lib/api-client';
import { UserProfileResponse, APIError } from '@/src/app/lib/types';
import { useAuth } from '@/src/app/auth/auth-context';
import { Link } from '@/src/design-system/atoms/Link';
import { LightCard } from '@/src/design-system/cards';
import { H1 } from '@/src/design-system/typography/Heading';
import { P2, P3 } from '@/src/design-system/typography/Paragraph';

const ROLE_NAMES: { [key: string]: string } = {
  ADMIN: 'Administrator',
  LECTURER: 'Wykładowca',
  STUDENT: 'Student',
};

const ROLE_COLORS: { [key: string]: string } = {
  ADMIN: 'bg-errorSoft text-error',
  LECTURER: 'bg-accentSoft text-contentPrimary',
  STUDENT: 'bg-successSoft text-success',
};

const selectClass =
  'px-3 py-2 border border-borderPrimary rounded-lg bg-backgroundPrimary text-contentPrimary focus:outline-none focus:ring-2 focus:ring-accentPrimary';

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
      <div>
        <Link href="/" className="text-accentBase hover:text-accentHover inline-block mb-4">
          ← Wróć
        </Link>

        <H1>Użytkownicy</H1>
        <P2 className="text-contentSecondary">
          Zarządzanie kontami w systemie
        </P2>
      </div>

      {error && (
        <div className="border border-error bg-errorSoft text-error px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <LightCard className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 !p-4">
        <div>
          <P3 className="text-contentSecondary">Sortowanie</P3>
          <p className="text-sm font-medium text-contentPrimary">
            Aktualnie: {sortBy === 'name' ? 'Imię i nazwisko' : 'Rola'}
          </p>
        </div>

        <select
          value={sortBy}
          onChange={(e) =>
            setSortBy(e.target.value as 'name' | 'role')
          }
          className={selectClass}
        >
          <option value="name">Imię i nazwisko</option>
          <option value="role">Rola</option>
        </select>
      </LightCard>

      {isLoading && (
        <div className="text-center py-10 text-contentSecondary">
          Ładowanie użytkowników...
        </div>
      )}

      {!isLoading && users.length === 0 && (
        <LightCard className="text-center">
          <P2 className="text-contentSecondary">
            Brak użytkowników w systemie
          </P2>
        </LightCard>
      )}

      {!isLoading && users.length > 0 && (
        <LightCard className="!p-0 overflow-hidden">
          <div className="divide-y divide-borderPrimary">
            {sortedUsers.map((u) => (
              <div
                key={u.id}
                className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 hover:bg-backgroundSecondary transition"
              >
                <div>
                  <p className="text-lg font-semibold text-contentPrimary">
                    {u.name} {u.surname}
                  </p>

                  <P3 className="text-contentSecondary">
                    @{u.username} · {u.email}
                  </P3>
                </div>

                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    ROLE_COLORS[u.role] ||
                    'bg-backgroundTertiary text-contentSecondary'
                  }`}
                >
                  {ROLE_NAMES[u.role] || u.role}
                </span>
              </div>
            ))}
          </div>
        </LightCard>
      )}
    </div>
  );
}
