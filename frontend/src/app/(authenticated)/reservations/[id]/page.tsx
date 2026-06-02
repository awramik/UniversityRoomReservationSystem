'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/src/app/lib/api-client';
import {
  ReservationDetailResponse,
  APIError,
  RESERVATION_STATUS,
  ReservationStatus,
  ROOM_TYPES,
  RoomType,
} from '@/src/app/lib/types';
import { formatDateTimeDisplay, calculateDurationHours } from '@/src/app/lib/date-utils';
import { Link } from '@/src/design-system/atoms/Link';
import { Button } from '@/src/design-system/atoms/Button';
import { LightCard } from '@/src/design-system/cards';
import { H1, H2 } from '@/src/design-system/typography/Heading';
import { P2, P3 } from '@/src/design-system/typography/Paragraph';

const STATUS_COLORS: Record<ReservationStatus, string> = {
  ACTIVE: 'bg-successSoft text-success',
  PAST: 'bg-backgroundTertiary text-contentSecondary',
  CANCELLED: 'bg-errorSoft text-error',
};

function toReservationStatus(
  status: ReservationDetailResponse['status']
): ReservationStatus | null {
  if (status === 'ACTIVE' || status === 'PAST' || status === 'CANCELLED') {
    return status;
  }
  return null;
}

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
        <P2 className="text-contentSecondary">Ładowanie rezerwacji...</P2>
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div>
        <Link href="/reservations" className="text-accentBase hover:text-accentHover mb-4 inline-block">
          ← Wróć do rezerwacji
        </Link>
        <div className="border border-error bg-errorSoft text-error px-4 py-3 rounded-lg mt-4">
          {error || 'Rezerwacja nie znaleziona'}
        </div>
      </div>
    );
  }

  const status = toReservationStatus(reservation.status);
  const room = reservation.room;
  const duration =
    reservation.startTime && reservation.endTime
      ? calculateDurationHours(reservation.startTime, reservation.endTime)
      : null;

  return (
    <div className="space-y-8">
      <Link
        href="/reservations"
        className="inline-flex items-center text-sm text-contentSecondary hover:text-accentBase transition"
      >
        ← Powrót do rezerwacji
      </Link>

      <LightCard>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <H1>{room?.name ?? '—'}</H1>
            <P3 className="text-contentSecondary mt-1">
              {room?.buildingName ?? '—'}
            </P3>
          </div>

          {status && (
            <span
              className={`text-xs px-3 py-1 rounded-full font-medium h-fit ${STATUS_COLORS[status]}`}
            >
              {RESERVATION_STATUS[status]}
            </span>
          )}
        </div>

        <P3 className="mt-4 text-contentTertiary">
          ID: <span className="font-mono">{reservation.id}</span>
        </P3>
      </LightCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <LightCard>
            <H2 className="text-sm font-medium text-contentSecondary mb-4">
              Termin rezerwacji
            </H2>

            <div className="space-y-3 text-contentPrimary">
              <div className="flex justify-between">
                <span className="text-contentSecondary">Start</span>
                <span>
                  {reservation.startTime
                    ? formatDateTimeDisplay(reservation.startTime)
                    : '—'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-contentSecondary">Koniec</span>
                <span>
                  {reservation.endTime
                    ? formatDateTimeDisplay(reservation.endTime)
                    : '—'}
                </span>
              </div>

              {duration !== null && (
                <div className="flex justify-between font-medium">
                  <span className="text-contentSecondary">Czas</span>
                  <span>{duration.toFixed(1)} h</span>
                </div>
              )}
            </div>
          </LightCard>

          {room && (
            <LightCard>
              <H2 className="text-sm font-medium text-contentSecondary mb-4">
                Sala
              </H2>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-contentSecondary">Typ</span>
                  <span className="text-contentPrimary">
                    {room.roomType && room.roomType in ROOM_TYPES
                      ? ROOM_TYPES[room.roomType as RoomType]
                      : room.roomType ?? '—'}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-contentSecondary">Pojemność</span>
                  <span className="text-contentPrimary">
                    {room.capacity ?? '—'} osób
                  </span>
                </div>
              </div>

              {room.description && (
                <P3 className="mt-4 text-contentSecondary">
                  {room.description}
                </P3>
              )}
            </LightCard>
          )}

          {reservation.purpose && (
            <LightCard>
              <H2 className="text-sm font-medium text-contentSecondary mb-3">
                Cel rezerwacji
              </H2>
              <P2>{reservation.purpose}</P2>
            </LightCard>
          )}

          {reservation.booker && (
            <LightCard>
              <H2 className="text-sm font-medium text-contentSecondary mb-3">
                Rezerwujący
              </H2>

              <p className="text-contentPrimary font-medium">
                {reservation.booker.name} {reservation.booker.surname}
              </p>

              <P3 className="text-contentSecondary">
                @{reservation.booker.username} • {reservation.booker.email}
              </P3>
            </LightCard>
          )}
        </div>

        <div className="lg:col-span-1">
          <LightCard className="sticky top-24">
            <h2 className="text-lg font-bold text-contentPrimary mb-4">
              Akcje
            </h2>

            {error && (
              <div className="mb-4 text-sm border border-error bg-errorSoft text-error p-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <Button outline href="/reservations" className="w-full">
                Powrót
              </Button>

              {status === 'ACTIVE' && (
                <Button
                  destructive
                  onClick={handleCancel}
                  disabled={isDeleting}
                  className="w-full"
                >
                  {isDeleting ? 'Anulowanie...' : 'Anuluj rezerwację'}
                </Button>
              )}
            </div>
          </LightCard>
        </div>
      </div>
    </div>
  );
}
