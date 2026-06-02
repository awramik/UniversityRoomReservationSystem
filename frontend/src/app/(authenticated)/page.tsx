'use client';

import { useAuth } from '@/src/app/context/auth-context';
import Link from 'next/link';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
          Witaj, {user?.name}!
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          System do rezerwacji sal uniwersyteckich
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Browse Rooms */}
        <Link href="/rooms">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow hover:shadow-lg transition p-6 border-l-4 border-blue-500 cursor-pointer">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Przeglądaj sale</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Sprawdź dostępne sale i dokonaj rezerwacji
            </p>
            <button className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium">
              Przejdź do sal →
            </button>
          </div>
        </Link>

        {/* My Reservations */}
        <Link href="/reservations">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow hover:shadow-lg transition p-6 border-l-4 border-green-500 cursor-pointer">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Moje rezerwacje</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Przejrzyj i zarządzaj swoimi rezerwacjami
            </p>
            <button className="inline-block bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm font-medium">
              Moje rezerwacje →
            </button>
          </div>
        </Link>

        {/* Profile */}
        <Link href="/users/me">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow hover:shadow-lg transition p-6 border-l-4 border-purple-500 cursor-pointer">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Mój profil</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Edytuj swoje dane profilowe
            </p>
            <button className="inline-block bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded text-sm font-medium">
              Profil →
            </button>
          </div>
        </Link>
      </div>

      {/* Admin Section */}
      {user?.role === 'ADMIN' && (
        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Panel administracyjny</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/admin/rooms">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow hover:shadow-lg transition p-6 border-l-4 border-orange-500 cursor-pointer">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Zarządzaj salami</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Twórz, edytuj i usuwaj sale
                </p>
              </div>
            </Link>

            <Link href="/admin/users">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow hover:shadow-lg transition p-6 border-l-4 border-red-500 cursor-pointer">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Użytkownicy</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Przeglądaj listę użytkowników
                </p>
              </div>
            </Link>

            <Link href="/admin/reservations">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow hover:shadow-lg transition p-6 border-l-4 border-cyan-500 cursor-pointer">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Wszystkie rezerwacje</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Zarządzaj rezerwacjami i tworz bloki
                </p>
              </div>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
