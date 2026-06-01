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
  <div className="space-y-8">

    {/* Back */}
    <Link
      href="/reservations"
      className="inline-flex items-center text-sm text-slate-500 hover:text-blue-600 transition"
    >
      ← Powrót do rezerwacji
    </Link>

    {/* Header */}
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">

      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">

        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            🏫 {reservation.room.name}
          </h1>
          <p className="text-slate-500 mt-1">
            📍 {reservation.room.buildingName}
          </p>
        </div>

        <span
          className={`text-xs px-3 py-1 rounded-full font-medium ${
            STATUS_COLORS[reservation.status]
          }`}
        >
          {STATUS_NAMES[reservation.status]}
        </span>

      </div>

      {/* meta row */}
      <div className="mt-4 text-sm text-slate-500">
        ID: <span className="font-mono">{reservation.id}</span>
      </div>

    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

      {/* LEFT */}
      <div className="lg:col-span-2 space-y-6">

        {/* TIME CARD */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">

          <h2 className="text-sm font-medium text-slate-500 mb-4">
            Termin rezerwacji
          </h2>

          <div className="space-y-3 text-slate-900 dark:text-white">

            <div className="flex justify-between">
              <span className="text-slate-500">Start</span>
              <span>{formatDateTimeDisplay(reservation.startTime)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Koniec</span>
              <span>{formatDateTimeDisplay(reservation.endTime)}</span>
            </div>

            <div className="flex justify-between font-medium">
              <span className="text-slate-500">Czas</span>
              <span>{duration.toFixed(1)} h</span>
            </div>

          </div>
        </div>

        {/* ROOM DETAILS */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">

          <h2 className="text-sm font-medium text-slate-500 mb-4">
            Sala
          </h2>

          <div className="space-y-3">

            <div className="flex justify-between">
              <span className="text-slate-500">Typ</span>
              <span className="text-slate-900 dark:text-white">
                {ROOM_TYPES[reservation.room.roomType] ?? reservation.room.roomType}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Pojemność</span>
              <span className="text-slate-900 dark:text-white">
                {reservation.room.capacity} osób
              </span>
            </div>

          </div>

          {reservation.room.description && (
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
              {reservation.room.description}
            </p>
          )}

        </div>

        {/* PURPOSE */}
        {reservation.purpose && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">

            <h2 className="text-sm font-medium text-slate-500 mb-3">
              Cel rezerwacji
            </h2>

            <p className="text-slate-700 dark:text-slate-300">
              {reservation.purpose}
            </p>

          </div>
        )}

        {/* BOOKER */}
        {reservation.booker && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">

            <h2 className="text-sm font-medium text-slate-500 mb-3">
              Rezerwujący
            </h2>

            <p className="text-slate-900 dark:text-white font-medium">
              {reservation.booker.name} {reservation.booker.surname}
            </p>

            <p className="text-sm text-slate-500">
              @{reservation.booker.username} • {reservation.booker.email}
            </p>

          </div>
        )}

      </div>

      {/* RIGHT - ACTION PANEL */}
      <div className="lg:col-span-1">

        <div className="sticky top-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">

          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
            Akcje
          </h2>

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-3">

            <Link
              href="/reservations"
              className="block text-center w-full py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-700 transition"
            >
              Powrót
            </Link>

            {reservation.status === 'ACTIVE' && (
              <button
                onClick={handleCancel}
                disabled={isDeleting}
                className="w-full py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition disabled:opacity-50"
              >
                {isDeleting ? 'Anulowanie...' : 'Anuluj rezerwację'}
              </button>
            )}

          </div>

        </div>

      </div>

    </div>
  </div>
);
}
