"use client";

import { useState } from "react";
import { useAuth } from "@/src/app/auth/auth-context";
import { canBookRoomType } from "@/src/app/lib/booking-limits";
import { RoomType } from "@/src/app/lib/types";
import { useRooms } from "./_hooks/useRooms";
import { RoomCard } from "./_components/RoomCard";
import { FilterBar } from "./_components/FilterBar";
import { P2 } from "@/src/design-system/typography/Paragraph";
import { Header } from "../_components/Header";

function SkeletonGrid() {
  return (
    <div className="grid gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="h-24 animate-pulse rounded-xl bg-backgroundSecondary"
        />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <P2 className="text-center py-16 border border-dashed rounded-xl">
      Brak sal dla wybranych filtrów
    </P2>
  );
}

export default function RoomsPage() {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<RoomType | "">("");
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [minCapacity, setMinCapacity] = useState("");

  const { rooms, isInitialLoading, error, uniqueBuildings } = useRooms(
    selectedType,
    selectedBuilding,
    minCapacity,
  );

  const visibleRooms = rooms.filter(
    (r) => !user?.role || canBookRoomType(user.role, r.roomType),
  );

  const handleReset = (): void => {
    setSelectedType("");
    setSelectedBuilding("");
    setMinCapacity("");
  };

  return (
    <div className="space-y-8">
      <Header
        title="Dostępne sale"
        details="Przeglądaj, filtruj i rezerwuj sale w systemie"
      />

      {/* FILTERS */}
      <FilterBar
        selectedType={selectedType}
        selectedBuilding={selectedBuilding}
        minCapacity={minCapacity}
        uniqueBuildings={uniqueBuildings}
        userRole={user?.role}
        onTypeChange={(e) => setSelectedType(e.target.value as RoomType | "")}
        onBuildingChange={(e) => setSelectedBuilding(e.target.value)}
        onCapacityChange={(e) => setMinCapacity(e.target.value)}
        onReset={handleReset}
      />

      {/* ERROR */}
      {error && (
        <div className="rounded-xl border border-error bg-errorSoft px-4 py-3 text-error">
          {error}
        </div>
      )}

      {/* CONTENT */}
      {isInitialLoading ? (
        <SkeletonGrid />
      ) : visibleRooms.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {visibleRooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      )}
    </div>
  );
}
