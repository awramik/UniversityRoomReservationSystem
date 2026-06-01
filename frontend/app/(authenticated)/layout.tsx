'use client';

import { useAuth } from '@/app/context/auth-context';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user === null) {
      router.replace('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-600 dark:text-slate-400">
          Ładowanie...
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isAdmin = user.role === 'ADMIN';
  const isLecturer = user.role === 'LECTURER';

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* Navbar */}
      <nav className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link
              href="/rooms"
              className="font-bold text-xl text-slate-900 dark:text-white"
            >
              Rezerwacja Sal
            </Link>

            {/* Navigation */}
            <div className="flex items-center gap-8">
              <div className="flex gap-6">
                <Link
                  href="/rooms"
                  className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition font-medium"
                >
                  Sale
                </Link>

                <Link
                  href="/reservations"
                  className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition font-medium"
                >
                  Moje rezerwacje
                </Link>

                {/* Admin */}
                {isAdmin && (
                  <div className="relative group">
                    <button className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition font-medium">
                      Admin
                    </button>

                    <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-slate-800 shadow-lg rounded-md py-2 hidden group-hover:block z-50 border border-slate-200 dark:border-slate-700">
                      <Link
                        href="/admin/rooms"
                        className="block px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        Zarządzaj salami
                      </Link>

                      <Link
                        href="/admin/users"
                        className="block px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        Użytkownicy
                      </Link>

                      <Link
                        href="/admin/reservations"
                        className="block px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        Wszystkie rezerwacje
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* User menu */}
              <div className="flex items-center gap-4 border-l border-slate-200 dark:border-slate-700 pl-6">
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {user.name} {user.surname}
                  </p>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {user.role === 'ADMIN'
                      ? 'Administrator'
                      : user.role === 'LECTURER'
                      ? 'Wykładowca'
                      : 'Student'}
                  </p>
                </div>

                <div className="relative group">
                  <button className="w-8 h-8 bg-blue-500 text-white rounded-full font-bold hover:bg-blue-600">
                    {user?.name?.charAt(0) ?? '?'}
                  </button>

                  <div className="absolute right-0 mt-0 w-40 bg-white dark:bg-slate-800 shadow-lg rounded-md py-2 hidden group-hover:block z-50 border border-slate-200 dark:border-slate-700">
                    <Link
                      href="/users/me"
                      className="block px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      Mój profil
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border-t border-slate-200 dark:border-slate-700"
                    >
                      Wyloguj się
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
