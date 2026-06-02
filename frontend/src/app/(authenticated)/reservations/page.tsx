'use client';

import { useState, useEffect } from 'react';
import { api } from '@/src/app/lib/api-client';
import { ReservationResponse, APIError } from '@/src/app/lib/types';
import { formatDateTimeDisplay } from '@/src/app/lib/date-utils';
import { Link } from '@/src/design-system/atoms/Link';
import { Button } from '@/src/design-system/atoms/Button';
import { LightCard } from '@/src/design-system/cards';
import { H1 } from '@/src/design-system/typography/Heading';
import { P2, P3 } from '@/src/design-system/typography/Paragraph';
import { RESERVATION_STATUS, ReservationStatus } from '@/src/app/lib/types';

const STATUS_COLORS: Record<ReservationStatus, string> = {
  ACTIVE: 'bg-successSoft text-success',
  PAST: 'bg-backgroundTertiary text-contentSecondary',
  CANCELLED: 'bg-errorSoft text-error',
};

function toReservationStatus(
  status: ReservationResponse['status']
): ReservationStatus | null {
  if (status === 'ACTIVE' || status === 'PAST' || status === 'CANCELLED') {
    return status;
  }
  return null;
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<ReservationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleCancel = async (reservationId: string) => {
    if (!confirm('Na pewno chcesz anulować tę rezerwację?')) return;

    try {
      setDeletingId(reservationId);

      await api.delete(`/reservations/${reservationId}`);

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
      <div className="flex items-end justify-between">
        <div>
          <H1>Moje rezerwacje</H1>
          <P2 className="text-contentSecondary mt-1">
            Zarządzaj swoimi rezerwacjami sal
          </P2>
        </div>

        <Button href="/rooms">+ Nowa rezerwacja</Button>
      </div>

      {error && (
        <div className="rounded-xl border border-error bg-errorSoft text-error px-4 py-3">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-24 bg-backgroundTertiary animate-pulse rounded-xl" />
          <div className="h-24 bg-backgroundTertiary animate-pulse rounded-xl" />
          <div className="h-24 bg-backgroundTertiary animate-pulse rounded-xl" />
        </div>
      ) : reservations.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-borderPrimary rounded-xl">
          <P3 className="text-contentTertiary mb-4">
            Nie masz jeszcze żadnych rezerwacji
          </P3>
          <Button href="/rooms">Przeglądaj sale</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map((r, index) => {
            const status = toReservationStatus(r.status);
            return (
            <LightCard key={r.id ?? index} className="hover:shadow-lg transition">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                  <Link href={`/reservations/${r.id}`}>
                    <h2 className="text-lg font-semibold text-contentPrimary hover:text-accentBase">
                      {r.roomName}
                    </h2>
                  </Link>

                  {r.startTime && r.endTime && (
                    <P3 className="text-contentSecondary">
                      {formatDateTimeDisplay(r.startTime)} →{' '}
                      {formatDateTimeDisplay(r.endTime)}
                    </P3>
                  )}

                  {r.purpose && (
                    <P3 className="text-contentSecondary">{r.purpose}</P3>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {status && (
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-medium ${STATUS_COLORS[status]}`}
                    >
                      {RESERVATION_STATUS[status]}
                    </span>
                  )}

                  {status === 'ACTIVE' && r.id && (
                    <Button
                      destructive
                      onClick={() => r.id && handleCancel(r.id)}
                      disabled={deletingId === r.id}
                      className="text-sm px-3! py-1!"
                    >
                      {deletingId === r.id ? 'Anulowanie...' : 'Anuluj'}
                    </Button>
                  )}
                </div>
              </div>
            </LightCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
