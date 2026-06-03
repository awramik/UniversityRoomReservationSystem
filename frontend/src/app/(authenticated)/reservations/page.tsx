"use client";

import { useState, useEffect, useMemo } from "react";
import { api } from "@/src/app/lib/api-client";
import { ReservationResponse, APIError } from "@/src/app/lib/types";
import { formatDateTimeDisplay } from "@/src/app/lib/date-utils";
import { Button } from "@/src/design-system/atoms/Button";
import { H1 } from "@/src/design-system/typography/Heading";
import { P1, P2, P3 } from "@/src/design-system/typography/Paragraph";
import { RESERVATION_STATUS, ReservationStatus } from "@/src/app/lib/types";
import { Badge, type BadgeColor } from "@/src/design-system/atoms/Badge";
import { Table } from "@/src/design-system/cards/Table";
import { cn } from "@/src/design-system/utils";
import { Header } from "../_components/Header";
import { Tabs } from "@/src/design-system/navigation/Tabs";
import { Link } from "@/src/design-system/atoms/Link";

const STATUS_COLORS: Record<ReservationStatus, string> = {
  ACTIVE: "lime",
  PAST: "stone",
  CANCELLED: "red",
};

type Tab = "ALL" | ReservationStatus;

const TABS: { key: Tab; label: string }[] = [
  { key: "ALL", label: "Wszystkie" },
  { key: "ACTIVE", label: "Aktywne" },
  { key: "PAST", label: "Przeszłe" },
  { key: "CANCELLED", label: "Anulowane" },
];

function toReservationStatus(
  status: ReservationResponse["status"],
): ReservationStatus | null {
  if (status === "ACTIVE" || status === "PAST" || status === "CANCELLED") {
    return status;
  }
  return null;
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<ReservationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<Tab>("ALL");

  useEffect(() => {
    const loadReservations = async () => {
      try {
        setIsLoading(true);
        setError("");

        const data = await api.get<ReservationResponse[]>("/reservations/my");
        setReservations(data || []);
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

    loadReservations();
  }, []);

  const handleCancel = async (reservationId: string) => {
    if (!confirm("Na pewno chcesz anulować tę rezerwację?")) return;

    try {
      setDeletingId(reservationId);

      await api.delete(`/reservations/${reservationId}`);

      const data = await api.get<ReservationResponse[]>("/reservations/my");
      setReservations(data || []);
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message || "Błąd podczas anulowania rezerwacji");
      }
    } finally {
      setDeletingId(null);
    }
  };

  const filteredReservations = useMemo(() => {
    if (activeTab === "ALL") return reservations;

    return reservations.filter((r) => r.status === activeTab);
  }, [reservations, activeTab]);

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <Header
        title="Moje rezerwacje"
        details="Zarządzaj swoimi rezerwacjami sal"
      >
        <Button href="/rooms" outline>
          + Nowa rezerwacja
        </Button>
      </Header>

      {/* ERROR */}
      {error && (
        <div className="rounded-xl border border-error bg-errorSoft text-error px-4 py-3">
          {error}
        </div>
      )}

      {/* TABS */}
      {!isLoading && reservations.length > 0 && (
        <Tabs items={TABS} value={activeTab} onChange={setActiveTab} />
      )}

      {/* LOADING */}
      {isLoading ? (
        <div className="space-y-3">
          <div className="h-12 bg-backgroundTertiary animate-pulse rounded-xl" />
          <div className="h-12 bg-backgroundTertiary animate-pulse rounded-xl" />
          <div className="h-12 bg-backgroundTertiary animate-pulse rounded-xl" />
        </div>
      ) : filteredReservations.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-borderPrimary rounded-xl">
          <P3 className="text-contentTertiary mb-4">
            Brak rezerwacji w tym widoku
          </P3>
          <Button href="/rooms">Przeglądaj sale</Button>
        </div>
      ) : (
        <Table>
          <Table.Head>
            <tr>
              <Table.HeadCell>Sala</Table.HeadCell>
              <Table.HeadCell>Od</Table.HeadCell>
              <Table.HeadCell>Do</Table.HeadCell>
              <Table.HeadCell>Cel</Table.HeadCell>
              <Table.HeadCell>Status</Table.HeadCell>
              <Table.HeadCell align="center">Akcje</Table.HeadCell>
            </tr>
          </Table.Head>

          <Table.Body>
            {filteredReservations.map((r, index) => {
              const status = toReservationStatus(r.status);

              return (
                <Table.Row key={r.id ?? index} href={`/reservations/${r.id}`}>
                  <Table.Cell>
                    <P1 className="font-medium text-contentPrimary">
                      {r.roomName}
                    </P1>
                  </Table.Cell>

                  <Table.Cell>
                    <P2 className="text-contentSecondary">
                      {r.startTime ? formatDateTimeDisplay(r.startTime) : "—"}
                    </P2>
                  </Table.Cell>

                  <Table.Cell>
                    <P2 className="text-contentSecondary">
                      {r.endTime ? formatDateTimeDisplay(r.endTime) : "—"}
                    </P2>
                  </Table.Cell>

                  <Table.Cell>
                    <P2 className="text-contentSecondary">
                      {r.purpose || "—"}
                    </P2>
                  </Table.Cell>

                  <Table.Cell>
                    {status && (
                      <Badge color={STATUS_COLORS[status] as BadgeColor}>
                        {RESERVATION_STATUS[status]}
                      </Badge>
                    )}
                  </Table.Cell>

                  <Table.Cell align="center">
                    {status === "ACTIVE" && r.id ? (
                      <Button
                        destructive
                        size="sm"
                        onClick={() => handleCancel(r.id!)}
                        disabled={deletingId === r.id}
                      >
                        {deletingId === r.id ? "Anulowanie..." : "Anuluj"}
                      </Button>
                    ) : (
                      "—"
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
