'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/app/lib/api-client';
import { ReservationDetailResponse, APIError } from '@/app/lib/types';
import { formatDateTimeDisplay, calculateDurationHours } from '@/app/lib/date-utils';
import Link from 'next/link';

const STATUS_COLORS: { [key: string]: string } = {
  ACTIVE: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
  PAST: 'bg-slate-100 dark:bg-slate-900/30 text-slate-800 dark:text-slate-300',
  CANCELLED: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
};

const STATUS_NAMES: { [key: string]: string } = {
  ACTIVE: 'Aktywna',
  PAST: 'Przeszła',
  CANCELLED: 'Anulowana',
};

const ROOM_TYPES: { [key: string]: string } = {
  LECTURE: 'Wykładowa',
  LABORATORY: 'Laboratoryjna',
  COMPUTER: 'Komputerowa',
  CONFERENCE: 'Konferencyjna',
};

export default function ReservationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const reservationId = params.id as string;

  const [reservation, setReservation] = useState<ReservationDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
  const loadReservation = async () => {
    try {
      setIsLoading(true);
      setError('');

      const data =
        await api.get<ReservationDetailResponse>(
          `/reservations/${reservationId}`
        );

      setReservation(data);
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

  loadReservation();
}, [reservationId]);

  const handleCancel = async () => {
    if (!confirm('Na pewno chcesz anulować tę rezerwację?')) return;

    try {
      setIsDeleting(true);
      await api.delete(`/reservations/${reservationId}`);
      router.push('/reservations');
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message || 'Błąd podczas anulowania rezerwacji');
      }
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-600 dark:text-slate-400">Ładowanie rezerwacji...</p>
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div>
        <Link href="/reservations" className="text-blue-500 hover:text-blue-600 mb-4 inline-block">
          ← Wróć do rezerwacji
        </Link>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded mt-4">
          {error || 'Rezerwacja nie znaleziona'}
        </div>
      </div>
    );
  }

  const duration = calculateDurationHours(reservation.startTime, reservation.endTime);

  return (
    <div className="space-y-6">
      <Link href="/reservations" className="text-blue-500 hover:text-blue-600 inline-block">
        ← Wróć do rezerwacji
      </Link>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-8 border border-slate-200 dark:border-slate-700">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
              {reservation.room.name}
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              {reservation.room.buildingName}
            </p>
          </div>
          <span className={`inline-block text-sm font-semibold px-4 py-2 rounded-full ${STATUS_COLORS[reservation.status]}`}>
            {STATUS_NAMES[reservation.status]}
          </span>
        </div>

        {/* Reservation ID */}
        <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            <strong>ID rezerwacji:</strong> {reservation.id}
          </p>
        </div>

        {/* Room Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Szczegóły sali
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Typ
                </p>
                <p className="text-slate-900 dark:text-white font-medium">
                  {ROOM_TYPES[reservation.room.roomType] || reservation.room.roomType}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Pojemność
                </p>
                <p className="text-slate-900 dark:text-white font-medium">
                  {reservation.room.capacity} osób
                </p>
              </div>
              {reservation.room.description && (
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Opis
                  </p>
                  <p className="text-slate-900 dark:text-white">
                    {reservation.room.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Time Details */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Szczegóły czasu
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Od
                </p>
                <p className="text-slate-900 dark:text-white font-medium">
                  {formatDateTimeDisplay(reservation.startTime)}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Do
                </p>
                <p className="text-slate-900 dark:text-white font-medium">
                  {formatDateTimeDisplay(reservation.endTime)}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Czas trwania
                </p>
                <p className="text-slate-900 dark:text-white font-medium">
                  {duration.toFixed(1)} godzin
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Purpose */}
        {reservation.purpose && (
          <div className="mb-8 p-4 bg-slate-50 dark:bg-slate-700/50 rounded">
            <p className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
              Cel rezerwacji
            </p>
            <p className="text-slate-900 dark:text-white">
              {reservation.purpose}
            </p>
          </div>
        )}

        {/* Booker Info (for admins) */}
        {reservation.booker && (
          <div className="mb-8 p-4 bg-slate-50 dark:bg-slate-700/50 rounded">
            <p className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
              Rezerwacja przez
            </p>
            <p className="text-slate-900 dark:text-white font-medium">
              {reservation.booker.name} {reservation.booker.surname} ({reservation.booker.username})
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {reservation.booker.email}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Link href="/reservations">
            <button className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-medium py-2 px-6 rounded transition">
              Wróć do listy
            </button>
          </Link>

          {reservation.status === 'ACTIVE' && (
            <button
              onClick={handleCancel}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-800 text-white font-medium py-2 px-6 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? 'Anulowanie...' : 'Anuluj rezerwację'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
