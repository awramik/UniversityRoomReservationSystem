"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/src/app/lib/api-client";
import {
  ReservationDetailResponse,
  APIError,
  RESERVATION_STATUS,
  ReservationStatus,
  ROOM_TYPES,
  RoomType,
} from "@/src/app/lib/types";
import { formatDateTimeDisplay } from "@/src/app/lib/date-utils";
import { Link } from "@/src/design-system/atoms/Link";
import { Button } from "@/src/design-system/atoms/Button";
import { LightCard } from "@/src/design-system/cards";
import { H1, H2 } from "@/src/design-system/typography/Heading";
import { P2, P3 } from "@/src/design-system/typography/Paragraph";

const STATUS_COLORS: Record<ReservationStatus, string> = {
  ACTIVE: "bg-successSoft text-success",
  PAST: "bg-backgroundTertiary text-contentSecondary",
  CANCELLED: "bg-errorSoft text-error",
};

function toReservationStatus(
  status: ReservationDetailResponse["status"],
): ReservationStatus | null {
  if (status === "ACTIVE" || status === "PAST" || status === "CANCELLED") {
    return status;
  }
  return null;
}

function formatDuration(hours: number): string {
  const totalMinutes = Math.round((hours * 60) / 15) * 15;

  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} godz`;

  return `${h} godz ${m} min`;
}

export default function ReservationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const reservationId = params.id as string;

  const [reservation, setReservation] =
    useState<ReservationDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    const loadReservation = async () => {
      try {
        setIsLoading(true);
        setError("");

        const data = await api.get<ReservationDetailResponse>(
          `/reservations/${reservationId}`,
        );

        setReservation(data);
      } catch (err) {
        if (err instanceof APIError) {
          setError(err.message || "Błąd podczas ładowania rezerwacji");
        } else {
          setError("Błąd sieci");
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadReservation();
  }, [reservationId]);

  const handleCancel = async () => {
    if (!confirm("Na pewno chcesz anulować tę rezerwację?")) return;

    try {
      setIsCancelling(true);
      await api.delete(`/reservations/${reservationId}`);
      router.push("/reservations");
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message || "Błąd podczas anulowania rezerwacji");
      } else {
        setError("Błąd sieci");
      }
      setIsCancelling(false);
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
        <Link
          href="/reservations"
          className="text-accentBase hover:text-accentHover mb-4 inline-block"
        >
          ← Wróć do rezerwacji
        </Link>
        <div className="border border-error bg-errorSoft text-error px-4 py-3 rounded-lg mt-4">
          {error || "Rezerwacja nie znaleziona"}
        </div>
      </div>
    );
  }

  const status = toReservationStatus(reservation.status);
  const room = reservation.room;

  const duration =
    reservation.startTime && reservation.endTime
      ? (new Date(reservation.endTime).getTime() -
          new Date(reservation.startTime).getTime()) /
        (1000 * 60 * 60)
      : null;

  const canCancel = status === "ACTIVE";

  return (
    <div className="space-y-6">
      <Link
        href="/reservations"
        className="inline-flex items-center text-sm text-contentSecondary hover:text-accentBase transition"
      >
        ← Powrót do rezerwacji
      </Link>

      <LightCard>
        {/* HEADER */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <H1>{room?.name ?? "—"}</H1>
            <P3 className="text-contentSecondary mt-1">
              {room?.buildingName ?? "—"}
            </P3>
          </div>

          <div className="flex items-center gap-3">
            {status && (
              <span
                className={`text-xs px-3 py-1 rounded-full font-medium ${STATUS_COLORS[status]}`}
              >
                {RESERVATION_STATUS[status]}
              </span>
            )}

            {canCancel && (
              <Button
                destructive
                onClick={handleCancel}
                disabled={isCancelling}
              >
                {isCancelling ? "Anulowanie..." : "Anuluj"}
              </Button>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 text-sm border border-error bg-errorSoft text-error p-3 rounded-lg">
            {error}
          </div>
        )}

        <P3 className="mt-4 text-contentTertiary">
          ID: <span className="font-mono">{reservation.id}</span>
        </P3>

        {/* CONTENT */}
        <div className="mt-6 space-y-6">
          <div>
            <H2 className="text-sm font-medium text-contentSecondary mb-3">
              Termin rezerwacji
            </H2>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-contentSecondary">Start</span>
                <span>
                  {reservation.startTime
                    ? formatDateTimeDisplay(reservation.startTime)
                    : "—"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-contentSecondary">Koniec</span>
                <span>
                  {reservation.endTime
                    ? formatDateTimeDisplay(reservation.endTime)
                    : "—"}
                </span>
              </div>

              {duration !== null && (
                <div className="flex justify-between font-medium">
                  <span className="text-contentSecondary">Czas trwania</span>
                  <span>{formatDuration(duration)}</span>
                </div>
              )}
            </div>
          </div>

          {room && (
            <div>
              <H2 className="text-sm font-medium text-contentSecondary mb-3">
                Sala
              </H2>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-contentSecondary">Typ</span>
                  <span>
                    {room.roomType && room.roomType in ROOM_TYPES
                      ? ROOM_TYPES[room.roomType as RoomType]
                      : (room.roomType ?? "—")}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-contentSecondary">Pojemność</span>
                  <span>{room.capacity ?? "—"} osób</span>
                </div>
              </div>

              {room.description && (
                <P3 className="mt-3 text-contentSecondary">
                  {room.description}
                </P3>
              )}
            </div>
          )}

          {reservation.purpose && (
            <div>
              <H2 className="text-sm font-medium text-contentSecondary mb-2">
                Cel rezerwacji
              </H2>
              <P2>{reservation.purpose}</P2>
            </div>
          )}

          {reservation.booker && (
            <div>
              <H2 className="text-sm font-medium text-contentSecondary mb-2">
                Rezerwujący
              </H2>

              <p className="font-medium">
                {reservation.booker.name} {reservation.booker.surname}
              </p>

              <P3 className="text-contentSecondary">
                @{reservation.booker.username} • {reservation.booker.email}
              </P3>
            </div>
          )}
        </div>
      </LightCard>
    </div>
  );
}
