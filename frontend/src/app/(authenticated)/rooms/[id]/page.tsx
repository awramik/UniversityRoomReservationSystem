'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/src/app/lib/api-client';
import {
  RoomResponse,
  AvailabilityResponse,
  ReservationRequest,
  APIError,
} from '@/src/app/lib/types';
import {
  formatDateTimeDisplay,
  parseDateTimeFromInput,
  calculateDurationHours,
  formatDateTimeForAPI,
} from '@/src/app/lib/date-utils';
import { Link } from '@/src/design-system/atoms/Link';
import { LightCard } from '@/src/design-system/cards';
import { ROOM_TYPES } from '@/src/app/lib/types';

export default function RoomDetailsPage() {
  const params = useParams();
  const router = useRouter();

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

  // =========================
  // CHECK AVAILABILITY
  // =========================

  useEffect(() => {
    const run = async () => {
      if (!startTime || !endTime) return;

      try {
        setIsCheckingAvailability(true);

        const params = new URLSearchParams({
          startTime: parseDateTimeFromInput(startTime).toISOString(),
          endTime: parseDateTimeFromInput(endTime).toISOString(),
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
        startTime: formatDateTimeForAPI(parseDateTimeFromInput(startTime)),
        endTime: formatDateTimeForAPI(parseDateTimeFromInput(endTime)),
        purpose: purpose || undefined,
      };

      await api.post('/reservations', reservation);

      setSubmitSuccess(true);
      setStartTime('');
      setEndTime('');
      setPurpose('');

      setTimeout(() => router.push('/reservations'), 2000);
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

  if (isLoadingRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-contentSecondary">Ładowanie sali...</p>
      </div>
    );
  }

  if (roomError || !room) {
    return (
      <div className="space-y-4">
        <Link href="/rooms" className="text-accent hover:underline">
          ← Wróć do sal
        </Link>

        <div className="text-error">{roomError || 'Brak sali'}</div>
      </div>
    );
  }

  const duration =
    startTime && endTime
      ? calculateDurationHours(
          parseDateTimeFromInput(startTime).toISOString(),
          parseDateTimeFromInput(endTime).toISOString()
        )
      : 0;

  return (
    <div className="space-y-8">

      {/* BACK */}
      <Link
        href="/rooms"
        className="text-sm text-contentSecondary hover:text-accent transition"
      >
        ← Powrót do sal
      </Link>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">

        <div>
          <h1 className="text-4xl font-bold text-contentPrimary">
            {room.name}
          </h1>

          <p className="text-contentSecondary mt-1">
            {room.buildingName}
          </p>
        </div>

        <span className="px-3 py-1 text-sm rounded-full bg-accentSoft text-contentPrimary">
          {ROOM_TYPES[room.roomType as keyof typeof ROOM_TYPES] ?? room.roomType}
        </span>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">

          <LightCard className='space-y-4'>

            <div className="grid grid-cols-2 gap-6">

              <div>
                <p className="text-contentTertiary text-sm">Pojemność</p>
                <p className="text-3xl font-bold text-contentPrimary mt-1">
                  {room.capacity}
                </p>
              </div>

              <div>
                <p className="text-contentTertiary text-sm">Typ</p>
                <p className="text-contentPrimary mt-2 font-medium">
                  {ROOM_TYPES[room.roomType as keyof typeof ROOM_TYPES] ?? room.roomType}
                </p>
              </div>

            </div>

            {room.description && (
            <div>
              <h2 className="text-sm text-contentTertiary mb-2">Opis</h2>
              <p className="text-contentSecondary leading-relaxed">
                {room.description}
              </p>
            </div>
          )}
          </LightCard>

          {/* AVAILABILITY */}
          {availability && (
            <div className="bg-backgroundSecondary border border-borderPrimary rounded-2xl p-6">

              <h2 className="text-sm text-contentTertiary mb-3">
                Dostępność
              </h2>

              {availability.available ? (
                <p className="text-success font-medium">
                  ● Dostępna
                </p>
              ) : (
                <div className="space-y-2">

                  <p className="text-error font-medium">
                    ● Zajęta
                  </p>

                  {availability.conflicts?.map((c, i) => (
                    <div
                      key={i}
                      className="text-sm px-3 py-2 rounded-lg bg-backgroundTertiary text-contentSecondary"
                    >
                      {formatDateTimeDisplay(c.startTime ?? '')} →{' '}
                      {formatDateTimeDisplay(c.endTime ?? '')}
                    </div>
                  ))}

                </div>
              )}

            </div>
          )}

        </div>

        {/* RIGHT */}
        <div className="lg:col-span-1">

          <LightCard className="sticky top-24">

            <h2 className="text-xl font-bold text-contentPrimary mb-6">
              Rezerwacja
            </h2>

            {submitSuccess && (
              <div className="mb-4 text-success bg-successSoft p-3 rounded-lg">
                ✓ Rezerwacja utworzona
              </div>
            )}

            {submitError && (
              <div className="mb-4 text-error bg-errorSoft p-3 rounded-lg">
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-borderPrimary bg-backgroundPrimary text-contentPrimary focus:ring-2 focus:ring-accent"
              />

              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-borderPrimary bg-backgroundPrimary text-contentPrimary focus:ring-2 focus:ring-accent"
              />

              {duration > 0 && (
                <p className="text-sm text-contentSecondary">
                  ⏱ {duration.toFixed(1)}h
                </p>
              )}

              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                rows={3}
                placeholder="Cel rezerwacji..."
                className="w-full px-3 py-2 rounded-lg border border-borderPrimary bg-backgroundPrimary text-contentPrimary focus:ring-2 focus:ring-accent"
              />

              <button
                type="submit"
                disabled={isSubmitting || !availability?.available}
                className="w-full py-2.5 rounded-lg bg-buttonPrimary text-buttonPrimaryText hover:bg-buttonPrimaryHover transition disabled:opacity-50"
              >
                {isSubmitting ? 'Rezerwowanie...' : 'Zarezerwuj'}
              </button>

            </form>

          </LightCard>

        </div>

      </div>
    </div>
  );
}
