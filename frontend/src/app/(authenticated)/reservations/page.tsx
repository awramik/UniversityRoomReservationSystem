'use client';

import { useState, useEffect } from 'react';
import { api } from '@/src/app/lib/api-client';
import { ReservationResponse, APIError } from '@/src/app/lib/types';
import { formatDateTimeDisplay } from '@/src/app/lib/date-utils';
import Link from 'next/link';

const STATUS_COLORS: { [key: string]: string } = {
  ACTIVE:
    'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
  PAST: 'bg-slate-100 dark:bg-slate-900/30 text-slate-800 dark:text-slate-300',
  CANCELLED:
    'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
};

const STATUS_NAMES: { [key: string]: string } = {
  ACTIVE: 'Aktywna',
  PAST: 'Przeszła',
  CANCELLED: 'Anulowana',
};

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<ReservationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // =========================
  // LOAD DATA (FIX)
  // =========================
  useEffect(() => {
    const loadReservations = async () => {
      try {
        setIsLoading(true);
        setError('');

        const data =
          await api.get<ReservationResponse[]>('/reservations/my');

        setReservations(data || []);
      } catch (err) {
        if (err instanceof APIError) {
          setError(err.message || 'Błąd podczas ładowania rezerwacji');
        } else {
          setError('Błąd sieci');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadReservations();
  }, []);

  // =========================
  // CANCEL
  // =========================
  const handleCancel = async (reservationId: string) => {
    if (!confirm('Na pewno chcesz anulować tę rezerwację?')) return;

    try {
      setDeletingId(reservationId);

      await api.delete(`/reservations/${reservationId}`);

      // reload inline (bez osobnej funkcji)
      const data =
        await api.get<ReservationResponse[]>('/reservations/my');

      setReservations(data || []);
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message || 'Błąd podczas anulowania rezerwacji');
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
  <div className="space-y-8">

    {/* Header */}
    <div className="flex items-end justify-between">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Moje rezerwacje
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Zarządzaj swoimi rezerwacjami sal
        </p>
      </div>

      <Link
        href="/rooms"
        className="text-sm px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition"
      >
        + Nowa rezerwacja
      </Link>
    </div>

    {/* Error */}
    {error && (
      <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3">
        {error}
      </div>
    )}

    {/* Loading */}
    {isLoading ? (
      <div className="space-y-3">
        <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
        <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
        <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
      </div>
    ) : reservations.length === 0 ? (
      <div className="text-center py-20 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">
        <p className="text-slate-500 mb-4">
          Nie masz jeszcze żadnych rezerwacji
        </p>

        <Link
          href="/rooms"
          className="inline-flex px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition"
        >
          Przeglądaj sale
        </Link>
      </div>
    ) : (
      <div className="space-y-4">

        {reservations.map((r) => (
          <div
            key={r.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-md transition"
          >

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

              {/* LEFT */}
              <div className="space-y-1">
                <Link
                href={`/reservations/${r.id}`}>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  🏫 {r.roomName}
                </h2>
                </Link>

                <p className="text-sm text-slate-500">
                  📅 {formatDateTimeDisplay(r.startTime)} → {formatDateTimeDisplay(r.endTime)}
                </p>

                {r.purpose && (
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {r.purpose}
                  </p>
                )}
              </div>

              {/* RIGHT */}
              <div className="flex items-center gap-3">

                {/* STATUS */}
                <span
                  className={`text-xs px-3 py-1 rounded-full font-medium ${
                    STATUS_COLORS[r.status]
                  }`}
                >
                  {STATUS_NAMES[r.status]}
                </span>

                {/* ACTION */}
                {r.status === 'ACTIVE' && (
                  <button
                    onClick={() => handleCancel(r.id)}
                    disabled={deletingId === r.id}
                    className="text-sm px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white transition disabled:opacity-50"
                  >
                    {deletingId === r.id ? 'Anulowanie...' : 'Anuluj'}
                  </button>
                )}

              </div>
            </div>

          </div>
        ))}

      </div>
    )}

  </div>
);
}
