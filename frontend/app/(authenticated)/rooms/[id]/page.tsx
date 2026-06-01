'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/app/lib/api-client';
import {
  RoomResponse,
  AvailabilityResponse,
  ReservationRequest,
  APIError,
} from '@/app/lib/types';
import {
  formatDateTimeDisplay,
  parseDateTimeFromInput,
  calculateDurationHours,
} from '@/app/lib/date-utils';
import { useAuth } from '@/app/context/auth-context';
import Link from 'next/link';

const ROOM_TYPES: { [key: string]: string } = {
  LECTURE: 'Wykładowa',
  LABORATORY: 'Laboratoryjna',
  COMPUTER: 'Komputerowa',
  CONFERENCE: 'Konferencyjna',
};

export default function RoomDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const roomId = params.id as string;

  const [room, setRoom] = useState<RoomResponse | null>(null);
  const [isLoadingRoom, setIsLoadingRoom] = useState(true);
  const [roomError, setRoomError] = useState('');

  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [purpose, setPurpose] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [availability, setAvailability] =
    useState<AvailabilityResponse | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  // =========================
  // FUNCTIONS FIRST (FIX HERE)
  // =========================

  const loadRoom = async () => {
    try {
      setIsLoadingRoom(true);
      setRoomError('');

      const data = await api.get<RoomResponse>(`/rooms/${roomId}`);
      setRoom(data);
    } catch (err) {
      if (err instanceof APIError) {
        setRoomError(err.message || 'Błąd podczas ładowania sali');
      } else {
        setRoomError('Błąd sieci');
      }
    } finally {
      setIsLoadingRoom(false);
    }
  };

  const checkAvailability = async () => {
    if (!startTime || !endTime) return;

    try {
      setIsCheckingAvailability(true);

      const params = new URLSearchParams({
        startTime: parseDateTimeFromInput(startTime),
        endTime: parseDateTimeFromInput(endTime),
      });

      const data = await api.get<AvailabilityResponse>(
        `/rooms/${roomId}/availability?${params.toString()}`
      );

      setAvailability(data);
    } catch (err) {
      console.error('Error checking availability:', err);
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  // =========================
  // EFFECTS
  // =========================

  useEffect(() => {
  const run = async () => {
    try {
      setIsLoadingRoom(true);
      setRoomError('');

      const data = await api.get<RoomResponse>(`/rooms/${roomId}`);
      setRoom(data);
    } catch (err) {
      if (err instanceof APIError) {
        setRoomError(err.message || 'Błąd podczas ładowania sali');
      } else {
        setRoomError('Błąd sieci');
      }
    } finally {
      setIsLoadingRoom(false);
    }
  };

  run();
}, [roomId]);

  useEffect(() => {
  const run = async () => {
    if (!startTime || !endTime) return;

    try {
      setIsCheckingAvailability(true);

      const params = new URLSearchParams({
        startTime: parseDateTimeFromInput(startTime),
        endTime: parseDateTimeFromInput(endTime),
      });

      const data = await api.get<AvailabilityResponse>(
        `/rooms/${roomId}/availability?${params.toString()}`
      );

      setAvailability(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  run();
}, [startTime, endTime, roomId]);

  // =========================
  // SUBMIT
  // =========================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitError('');
    setSubmitSuccess(false);

    if (!startTime || !endTime) {
      setSubmitError('Wypełnij datę i czas');
      return;
    }

    if (!availability?.available) {
      setSubmitError('Wybrana godzina nie jest dostępna');
      return;
    }

    try {
      setIsSubmitting(true);

      const reservation: ReservationRequest = {
        roomId,
        startTime: parseDateTimeFromInput(startTime),
        endTime: parseDateTimeFromInput(endTime),
        purpose: purpose || undefined,
      };

      await api.post('/reservations', reservation);

      setSubmitSuccess(true);
      setStartTime('');
      setEndTime('');
      setPurpose('');

      setTimeout(() => {
        router.push('/reservations');
      }, 2000);
    } catch (err) {
      if (err instanceof APIError) {
        setSubmitError(err.message);
      } else {
        setSubmitError('Błąd podczas tworzenia rezerwacji');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================
  // LOADING STATES
  // =========================

  if (isLoadingRoom) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-600 dark:text-slate-400">
          Ładowanie sali...
        </p>
      </div>
    );
  }

  if (roomError || !room) {
    return (
      <div>
        <Link href="/rooms" className="text-blue-500 hover:text-blue-600">
          ← Wróć do sal
        </Link>

        <div className="mt-4 text-red-600">{roomError || 'Brak sali'}</div>
      </div>
    );
  }

  const duration =
    startTime && endTime
      ? calculateDurationHours(
          parseDateTimeFromInput(startTime),
          parseDateTimeFromInput(endTime)
        )
      : 0;

  // =========================
  // JSX
  // =========================

  return (
  <div className="space-y-8">

    {/* Back */}
    <Link
      href="/rooms"
      className="inline-flex items-center text-sm text-slate-500 hover:text-blue-600 transition"
    >
      ← Powrót do sal
    </Link>

    {/* Header */}
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
          {room.name}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          📍 {room.buildingName}
        </p>
      </div>

      <span className="self-start md:self-auto px-3 py-1 text-sm rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
        {ROOM_TYPES[room.roomType] ?? room.roomType}
      </span>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

      {/* LEFT: Room info */}
      <div className="lg:col-span-2 space-y-6">

        {/* Stats card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="grid grid-cols-2 gap-6">

            <div>
              <p className="text-sm text-slate-500">Pojemność</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                👥 {room.capacity}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Typ sali</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white mt-2">
                {ROOM_TYPES[room.roomType] ?? room.roomType}
              </p>
            </div>

          </div>
        </div>

        {/* Description */}
        {room.description && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <h2 className="text-sm font-medium text-slate-500 mb-2">
              Opis
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              {room.description}
            </p>
          </div>
        )}

        {/* Availability panel */}
        {availability && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <h2 className="text-sm font-medium text-slate-500 mb-3">
              Dostępność
            </h2>

            {availability.available ? (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <span className="text-lg">●</span>
                <span className="font-medium">Dostępna</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <span className="text-lg">●</span>
                  <span className="font-medium">Zajęta</span>
                </div>

                {availability.conflicts?.length ? (
                  <div className="space-y-2">
                    {availability.conflicts.map((c, i) => (
                      <div
                        key={i}
                        className="text-sm px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      >
                        {formatDateTimeDisplay(c.startTime)} → {formatDateTimeDisplay(c.endTime)}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}

      </div>

      {/* RIGHT: Booking panel */}
      <div className="lg:col-span-1">
        <div className="sticky top-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">

          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
            Rezerwacja
          </h2>

          {/* success / error */}
          {submitSuccess && (
            <div className="mb-4 text-sm bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 p-3 rounded-lg">
              ✓ Rezerwacja utworzona
            </div>
          )}

          {submitError && (
            <div className="mb-4 text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-3 rounded-lg">
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* start */}
            <div>
              <label className="text-xs text-slate-500">Start</label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* end */}
            <div>
              <label className="text-xs text-slate-500">Koniec</label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* duration */}
            {duration > 0 && (
              <div className="text-sm text-slate-600 dark:text-slate-300">
                ⏱ {duration.toFixed(1)}h
              </div>
            )}

            {/* purpose */}
            <div>
              <label className="text-xs text-slate-500">Cel</label>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                rows={3}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500"
                placeholder="np. wykład, zajęcia..."
              />
            </div>

            {/* submit */}
            <button
              type="submit"
              disabled={isSubmitting || !availability?.available}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition disabled:opacity-50"
            >
              {isSubmitting ? 'Rezerwowanie...' : 'Zarezerwuj'}
            </button>

          </form>

        </div>
      </div>

    </div>
  </div>
);
}



