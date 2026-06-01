'use client';

import { useState, useEffect } from 'react';
import { api } from '@/app/lib/api-client';
import { ReservationResponse, APIError } from '@/app/lib/types';
import { formatDateTimeDisplay } from '@/app/lib/date-utils';
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

  // =========================
  // UI
  // =========================
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
        Moje rezerwacje
      </h1>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded">
          {error}
        </div>
      )}

      {isLoading ? (
        <div>Ładowanie...</div>
      ) : reservations.length === 0 ? (
        <div>
          Brak rezerwacji
          <Link href="/rooms">Zarezerwuj salę</Link>
        </div>
      ) : (
        reservations.map((r) => (
          <div key={r.id}>
            <div>{r.roomName}</div>

            <span className={STATUS_COLORS[r.status]}>
              {STATUS_NAMES[r.status]}
            </span>

            {r.status === 'ACTIVE' && (
              <button
                onClick={() => handleCancel(r.id)}
                disabled={deletingId === r.id}
              >
                Anuluj
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}
