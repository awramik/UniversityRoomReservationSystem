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
import { Button } from "@/src/design-system/atoms/Button";
import { LightCard } from "@/src/design-system/cards/LightCard";
import { H1, H2, H3 } from "@/src/design-system/typography/Heading";
import { P1, P2, P3 } from "@/src/design-system/typography/Paragraph";
import { Badge, type BadgeColor } from "@/src/design-system/atoms/Badge";
import { STATUS_COLORS } from "../_utils/constants";
import { Breadcrumb } from "@/src/design-system/navigation/Breadcrumb";
import { Header } from "../../_components/Header";

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

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <P3 className="text-contentSecondary">{label}</P3>
      <P2 className="text-contentPrimary text-right">{value}</P2>
    </div>
  );
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
      <div className="py-10 text-center">
        <P2 className="text-contentSecondary">Ładowanie rezerwacji...</P2>
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div className="space-y-4">
        <Breadcrumb href="/reservations">Wróć do listy rezerwacji</Breadcrumb>

        <div className="border border-error bg-errorSoft text-error px-4 py-3 rounded-xl">
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
    <div className="w-full flex flex-col gap-6">
      <Header title="Szczegóły rezerwacji" />

      <Breadcrumb href="/reservations">Wróć do listy rezerwacji</Breadcrumb>

      {/* CARD */}
      <div className="flex justify-center">
        <LightCard className="w-full max-w-5xl space-y-10">
          {/* HEADER */}
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <H1>{room?.name ?? "Sala"}</H1>

                {status && (
                  <Badge color={STATUS_COLORS[status] as BadgeColor}>
                    {RESERVATION_STATUS[status]}
                  </Badge>
                )}
              </div>

              <P3 className="text-contentTertiary font-mono">
                ID: {reservation.id}
              </P3>
            </div>

            {canCancel && (
              <Button
                destructive
                onClick={handleCancel}
                disabled={isCancelling}
                className="w-full md:w-auto"
              >
                {isCancelling ? "Anulowanie..." : "Anuluj"}
              </Button>
            )}
          </div>

          {/* TERMIN */}
          <section className="space-y-4">
            <H2>Termin</H2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-24 gap-y-2">
              <Row
                label="Start"
                value={
                  reservation.startTime
                    ? formatDateTimeDisplay(reservation.startTime)
                    : "—"
                }
              />
              <Row
                label="Koniec"
                value={
                  reservation.endTime
                    ? formatDateTimeDisplay(reservation.endTime)
                    : "—"
                }
              />
              {duration !== null && (
                <Row label="Czas trwania" value={formatDuration(duration)} />
              )}
            </div>
          </section>

          {/* SALA */}
          {room && (
            <section className="space-y-4">
              <H2>Sala</H2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-24 gap-y-2">
                <Row label="Nazwa" value={room.name ?? "—"} />
                <Row label="Budynek" value={room.buildingName ?? "—"} />
                <Row
                  label="Typ"
                  value={
                    room.roomType && room.roomType in ROOM_TYPES
                      ? ROOM_TYPES[room.roomType as RoomType]
                      : (room.roomType ?? "—")
                  }
                />
                <Row label="Pojemność" value={`${room.capacity ?? "—"} osób`} />
              </div>

              {room.description && (
                <div className="space-y-2 pt-4">
                  <H3>Opis sali</H3>
                  <P2 className="text-contentSecondary">{room.description}</P2>
                </div>
              )}
            </section>
          )}

          {/* CEL */}
          {reservation.purpose && (
            <section className="space-y-2">
              <H3>Cel rezerwacji</H3>
              <P2 className="text-contentSecondary">{reservation.purpose}</P2>
            </section>
          )}

          {/* REZERWUJĄCY */}
          {reservation.booker && (
            <section className="space-y-2">
              <H2>Rezerwujący</H2>

              <P1>
                {reservation.booker.name} {reservation.booker.surname}
              </P1>

              <P3 className="text-contentSecondary">
                @{reservation.booker.username} • {reservation.booker.email}
              </P3>
            </section>
          )}
        </LightCard>
      </div>
    </div>
  );
}
