"use client";

import { api } from "../../lib/api-client";
import { ApiError } from "next/dist/server/api-utils";
import { useState } from "react";
import { Button } from "@/src/design-system/atoms/Button";
import { P3 } from "@/src/design-system/typography/Paragraph";
import { WeeklyLimitNotice } from "../_components/WeeklyLimitNotice";
import { Header } from "../_components/Header";
import { useBookingLimits } from "../_hooks/useBookingLimits";
import { useReservations } from "./_hooks/useReservations";
import { useReservationTabs } from "./_hooks/useReservationTabs";
import { ReservationsTable } from "./_components/ReservationsTable";
import { ReservationsTabs } from "./_components/ReservationsTabs";

export default function ReservationsPage() {
  const { reservations, isLoading, error, setError, refetch } =
    useReservations();

  const { activeTab, setActiveTab, filteredReservations } =
    useReservationTabs(reservations);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { limits, weeklyLimitReached } = useBookingLimits();

  const handleCancel = async (id: string) => {
    if (!confirm("Na pewno chcesz anulować tę rezerwację?")) return;

    try {
      setDeletingId(id);

      await api.delete(`/reservations/${id}`);
      await refetch();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <Header
        title="Moje rezerwacje"
        details="Zarządzaj swoimi rezerwacjami sal"
      >
        <Button href="/rooms" outline>
          + Nowa rezerwacja
        </Button>
      </Header>

      {weeklyLimitReached && limits && (
        <WeeklyLimitNotice maxPerWeek={limits.maxPerWeek} />
      )}

      {error && (
        <div className="rounded-xl border border-error bg-errorSoft text-error px-4 py-3">
          {error}
        </div>
      )}

      <ReservationsTabs
        value={activeTab}
        onChange={setActiveTab}
        show={!isLoading && reservations.length > 0}
      />

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
        <ReservationsTable
          reservations={filteredReservations}
          deletingId={deletingId}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
