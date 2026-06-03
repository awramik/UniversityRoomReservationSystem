"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "@/src/app/lib/api-client";
import {
  ReservationResponse,
  RoomResponse,
  AdminBlockRequest,
  APIError,
} from "@/src/app/lib/types";
import { useAuth } from "@/src/app/auth/auth-context";
import { Button } from "@/src/design-system/atoms/Button";
import { LightCard } from "@/src/design-system/cards/LightCard";
import { P2 } from "@/src/design-system/typography/Paragraph";
import { Header } from "../../_components/Header";

import { ReservationsTable } from "./_components/ReservationsTable";
import { BlockForm } from "./_components/BlockForm";
import { ReservationsTabs } from "../../reservations/_components/ReservationsTabs";
import { useReservationTabs } from "../../reservations/_hooks/useReservationTabs";

const STATUS_COLORS = {
  ACTIVE: "lime",
  PAST: "stone",
  CANCELLED: "red",
};

export default function AdminReservationsPage() {
  const { user } = useAuth();

  const [reservations, setReservations] = useState<ReservationResponse[]>([]);
  const [rooms, setRooms] = useState<RoomResponse[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [blockSuccess, setBlockSuccess] = useState("");

  const [showBlockForm, setShowBlockForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const didInitRef = useRef(false);

  const { activeTab, setActiveTab, filteredReservations } =
    useReservationTabs(reservations);

  const loadData = useCallback(async () => {
    try {
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

  const handleBlockSubmit = async (data: AdminBlockRequest) => {
    await api.post("/reservations/blocks", data);
    setBlockSuccess("Blok został utworzony");
    setShowBlockForm(false);
    loadData();

    setTimeout(() => setBlockSuccess(""), 3000);
  };

  return (
    <div className="space-y-6">
      <Header
        title="Wszystkie rezerwacje"
        details="Zarządzaj rezerwacjami i blokami"
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

      {showBlockForm && (
        <BlockForm
          rooms={rooms}
          onCancel={() => setShowBlockForm(false)}
          onSubmit={handleBlockSubmit}
        />
      )}

      <ReservationsTabs
        value={activeTab}
        onChange={setActiveTab}
        show={!isLoading && reservations.length > 0}
      />

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
        <>
          <ReservationsTable
            reservations={filteredReservations}
            onDelete={handleDeleteReservation}
            deletingId={deletingId}
            statusColors={STATUS_COLORS}
          />
        </>
      )}
    </div>
  );
}
