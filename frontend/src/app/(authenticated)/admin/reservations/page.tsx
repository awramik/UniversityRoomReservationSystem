"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "@/src/app/lib/api-client";
import {
  ReservationResponse,
  RoomResponse,
  AdminBlockRequest,
  APIError,
} from "@/src/app/lib/types";
import {
  formatDateTimeDisplay,
  formatDateTimeForAPI,
  parseDateTimeFromInput,
} from "@/src/app/lib/date-utils";
import { useAuth } from "@/src/app/auth/auth-context";
import { Button } from "@/src/design-system/atoms/Button";
import { LightCard } from "@/src/design-system/cards/LightCard";
import { H2 } from "@/src/design-system/typography/Heading";
import { P2 } from "@/src/design-system/typography/Paragraph";
import { Label, Field } from "@/src/design-system/forms/Fieldset";
import { Input } from "@/src/design-system/forms/Input";
import {
  RESERVATION_STATUS,
  ReservationStatus,
  ROOM_TYPES,
  RoomType,
} from "@/src/app/lib/types";
import { Header } from "../../_components/Header";
import { Badge, type BadgeColor } from "@/src/design-system/atoms/Badge";
import { Table } from "@/src/design-system/cards/Table";

const STATUS_COLORS: Record<ReservationStatus, string> = {
  ACTIVE: "lime",
  PAST: "stone",
  CANCELLED: "red",
};

function toReservationStatus(
  status: ReservationResponse["status"],
): ReservationStatus | null {
  if (status === "ACTIVE" || status === "PAST" || status === "CANCELLED") {
    return status;
  }
  return null;
}

const fieldClass =
  "w-full px-3 py-2 rounded-lg border border-borderPrimary bg-backgroundPrimary text-contentPrimary focus:outline-none focus:ring-2 focus:ring-accentPrimary";

export default function AdminReservationsPage() {
  const { user } = useAuth();

  const [reservations, setReservations] = useState<ReservationResponse[]>([]);
  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [showBlockForm, setShowBlockForm] = useState(false);
  const [blockFormData, setBlockFormData] = useState({
    roomId: "",
    startTime: "",
    endTime: "",
    purpose: "",
  });
  const [isSubmittingBlock, setIsSubmittingBlock] = useState(false);
  const [blockFormError, setBlockFormError] = useState("");
  const [blockSuccess, setBlockSuccess] = useState("");

  const [filterStatus, setFilterStatus] = useState<
    "ACTIVE" | "PAST" | "CANCELLED" | "ALL"
  >("ACTIVE");

  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 🔥 FIX: blokada wielokrotnego fetchowania (kluczowy fix pod cascade renders)
  const didInitRef = useRef(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const [reservationsData, roomsData] = await Promise.all([
        api.get<ReservationResponse[]>("/reservations"),
        api.get<RoomResponse[]>("/rooms"),
      ]);

      setReservations(reservationsData || []);
      setRooms(roomsData || []);
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message || "Błąd podczas ładowania danych");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user?.role) return;

    if (user.role !== "ADMIN") {
      window.location.replace("/");
      return;
    }

    if (didInitRef.current) return;
    didInitRef.current = true;

    loadData();
  }, [user?.role, loadData]);

  const handleBlockFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setBlockFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBlockFormError("");
    setIsSubmittingBlock(true);

    try {
      if (
        !blockFormData.roomId ||
        !blockFormData.startTime ||
        !blockFormData.endTime
      ) {
        setBlockFormError("Wypełnij wszystkie wymagane pola");
        setIsSubmittingBlock(false);
        return;
      }

      const blockRequest: AdminBlockRequest = {
        roomId: blockFormData.roomId,
        startTime: formatDateTimeForAPI(
          parseDateTimeFromInput(blockFormData.startTime),
        ),
        endTime: formatDateTimeForAPI(
          parseDateTimeFromInput(blockFormData.endTime),
        ),
        purpose: blockFormData.purpose || undefined,
      };

      await api.post("/reservations/blocks", blockRequest);

      setBlockSuccess("Blok został utworzony");
      setBlockFormData({
        roomId: "",
        startTime: "",
        endTime: "",
        purpose: "",
      });
      setShowBlockForm(false);

      loadData();

      setTimeout(() => setBlockSuccess(""), 3000);
    } catch (err) {
      if (err instanceof APIError) {
        setBlockFormError(err.message || "Błąd podczas tworzenia bloku");
      }
    } finally {
      setIsSubmittingBlock(false);
    }
  };

  const handleDeleteReservation = async (reservationId: string) => {
    if (!confirm("Na pewno chcesz usunąć tę rezerwację?")) return;

    try {
      setDeletingId(reservationId);
      await api.delete(`/reservations/${reservationId}`);
      loadData();
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message || "Błąd podczas usuwania rezerwacji");
      }
    } finally {
      setDeletingId(null);
    }
  };

  const filteredReservations =
    filterStatus === "ALL"
      ? reservations
      : reservations.filter((r) => r.status === filterStatus);

  return (
    <div className="space-y-6">
      <Header
        title="Wszystkie rezerwacje"
        details="Zarządzaj rezerwacjami i tworz bloki administracyjne"
      >
        {!showBlockForm && (
          <Button onClick={() => setShowBlockForm(true)}>+ Nowy blok</Button>
        )}
      </Header>

      {error && (
        <div className="border border-error bg-errorSoft text-error px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {blockSuccess && (
        <div className="border border-success bg-successSoft text-success px-4 py-3 rounded-lg">
          {blockSuccess}
        </div>
      )}

      {/* Block Form */}
      {showBlockForm && (
        <LightCard>
          <H2 className="mb-4">Utwórz nowy blok niedostępności</H2>

          {blockFormError && (
            <div className="border border-error bg-errorSoft text-error px-4 py-3 rounded-lg mb-4">
              {blockFormError}
            </div>
          )}

          <form onSubmit={handleBlockSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <Label className="mb-1">Sala *</Label>
                <select
                  name="roomId"
                  value={blockFormData.roomId}
                  onChange={handleBlockFormChange}
                  required
                  className={fieldClass}
                  disabled={isSubmittingBlock}
                >
                  <option value="">Wybierz salę</option>
                  {rooms.map((room) =>
                    room.id ? (
                      <option key={room.id} value={room.id}>
                        {room.name} ({room.buildingName})
                        {room.roomType && room.roomType in ROOM_TYPES
                          ? ` - ${ROOM_TYPES[room.roomType as RoomType]}`
                          : ""}
                      </option>
                    ) : null,
                  )}
                </select>
              </Field>

              <Field>
                <Label className="mb-1">Od *</Label>
                <Input
                  type="datetime-local"
                  name="startTime"
                  value={blockFormData.startTime}
                  onChange={handleBlockFormChange}
                  required
                  disabled={isSubmittingBlock}
                />
              </Field>

              <Field>
                <Label className="mb-1">Do *</Label>
                <Input
                  type="datetime-local"
                  name="endTime"
                  value={blockFormData.endTime}
                  onChange={handleBlockFormChange}
                  required
                  disabled={isSubmittingBlock}
                />
              </Field>

              <Field>
                <Label className="mb-1">Powód</Label>
                <Input
                  type="text"
                  name="purpose"
                  value={blockFormData.purpose}
                  onChange={handleBlockFormChange}
                  placeholder="Np. Konserwacja, sprzątnięcie"
                  disabled={isSubmittingBlock}
                />
              </Field>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                outline
                onClick={() => setShowBlockForm(false)}
                disabled={isSubmittingBlock}
              >
                Anuluj
              </Button>
              <Button type="submit" disabled={isSubmittingBlock}>
                {isSubmittingBlock ? "Tworzenie..." : "Utwórz blok"}
              </Button>
            </div>
          </form>
        </LightCard>
      )}

      <LightCard className="!p-4">
        <Field>
          <Label className="mb-2">Filtruj po statusie:</Label>
          <div className="flex flex-wrap gap-2">
            {(["ALL", "ACTIVE", "PAST", "CANCELLED"] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filterStatus === status
                    ? "bg-buttonColor text-buttonText"
                    : "bg-backgroundSecondary text-contentPrimary hover:bg-backgroundTertiary"
                }`}
              >
                {status === "ALL" ? "Wszystkie" : RESERVATION_STATUS[status]}
              </button>
            ))}
          </div>
        </Field>
      </LightCard>

      {isLoading ? (
        <div className="text-center text-contentSecondary py-8">
          Ładowanie rezerwacji...
        </div>
      ) : filteredReservations.length === 0 ? (
        <LightCard className="text-center">
          <P2 className="text-contentSecondary">
            Brak rezerwacji w tym statusie
          </P2>
        </LightCard>
      ) : (
        <Table>
          <Table.Head>
            <tr>
              <Table.HeadCell>Sala</Table.HeadCell>
              <Table.HeadCell>Rezerwujący</Table.HeadCell>
              <Table.HeadCell>Od</Table.HeadCell>
              <Table.HeadCell>Do</Table.HeadCell>
              <Table.HeadCell>Status</Table.HeadCell>
              <Table.HeadCell align="center">Akcje</Table.HeadCell>
            </tr>
          </Table.Head>

          <Table.Body>
            {filteredReservations.map((reservation, index) => {
              const status = toReservationStatus(reservation.status);

              return (
                <Table.Row key={reservation.id ?? index}>
                  <Table.Cell className="font-medium text-contentPrimary">
                    {reservation.roomName}
                  </Table.Cell>

                  <Table.Cell className="text-contentSecondary">
                    {reservation.bookerName || "—"}
                  </Table.Cell>

                  <Table.Cell className="text-contentSecondary text-sm">
                    {reservation.startTime
                      ? formatDateTimeDisplay(reservation.startTime)
                      : "—"}
                  </Table.Cell>

                  <Table.Cell className="text-contentSecondary text-sm">
                    {reservation.endTime
                      ? formatDateTimeDisplay(reservation.endTime)
                      : "—"}
                  </Table.Cell>

                  <Table.Cell>
                    {status && (
                      <Badge color={STATUS_COLORS[status] as BadgeColor}>
                        {RESERVATION_STATUS[status]}
                      </Badge>
                    )}
                  </Table.Cell>

                  <Table.Cell align="center">
                    {reservation.id && (
                      <Button
                        destructive
                        size="sm"
                        onClick={() => handleDeleteReservation(reservation.id!)}
                        disabled={deletingId === reservation.id}
                      >
                        {deletingId === reservation.id ? "Usuwanie..." : "Usuń"}
                      </Button>
                    )}
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table>
      )}
    </div>
  );
}
