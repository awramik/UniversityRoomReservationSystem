"use client";

import { useState } from "react";
import { ROOM_TYPES, RoomType } from "@/src/app/lib/types";
import { LightCard } from "@/src/design-system/cards";
import { Link } from "@/src/design-system/atoms/Link";
import { useRooms } from "./_hooks/useRooms";

export default function RoomsPage() {
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedBuilding, setSelectedBuilding] = useState<string>("");
  const [minCapacity, setMinCapacity] = useState<string>("");

  const { rooms, isInitialLoading, error, uniqueBuildings } = useRooms(
    selectedType,
    selectedBuilding,
    minCapacity,
  );

  const handleReset = () => {
    setSelectedType("");
    setSelectedBuilding("");
    setMinCapacity("");
  };

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-contentPrimary">
            Dostępne sale
          </h1>
          <p className="text-contentSecondary mt-1">
            Przeglądaj, filtruj i rezerwuj sale w systemie
          </p>
        </div>
      </div>

      <LightCard>
        <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
          <div className="flex-1">
            <label className="text-xs text-contentTertiary">Typ sali</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg border"
            >
              <option value="">Wszystkie</option>
              <option value="LECTURE">Wykładowa</option>
              <option value="LABORATORY">Laboratoryjna</option>
              <option value="COMPUTER">Komputerowa</option>
              <option value="CONFERENCE">Konferencyjna</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="text-xs text-contentTertiary">Budynek</label>
            <select
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg border"
            >
              <option value="">Wszystkie</option>
              {uniqueBuildings.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="text-xs text-contentTertiary">
              Min. pojemność
            </label>
            <input
              type="number"
              min="1"
              value={minCapacity}
              onChange={(e) => setMinCapacity(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg border"
            />
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="h-[42px] px-4 rounded-lg border"
          >
            Reset
          </button>
        </div>
      </LightCard>

      {error && (
        <div className="rounded-xl border border-error bg-errorSoft px-4 py-3 text-error">
          {error}
        </div>
      )}

      {isInitialLoading ? (
        <div className="grid gap-4">
          <div className="h-24 animate-pulse rounded-xl bg-backgroundSecondary" />
          <div className="h-24 animate-pulse rounded-xl bg-backgroundSecondary" />
          <div className="h-24 animate-pulse rounded-xl bg-backgroundSecondary" />
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-xl">
          Brak sal dla wybranych filtrów
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <Link key={room.id} href={`/rooms/${room.id}`}>
              <LightCard className="group hover:border-accentPrimary transition">
                <h3 className="text-lg font-semibold">{room.name}</h3>

                {room.roomType && (
                  <span className="text-xs px-2 py-1 rounded-full bg-accentSoft">
                    {ROOM_TYPES[room.roomType as RoomType]}
                  </span>
                )}

                <p className="text-sm mt-1">{room.buildingName}</p>
                <div className="text-sm">{room.capacity} miejsc</div>

                {room.description && (
                  <p className="mt-3 text-sm line-clamp-3">
                    {room.description}
                  </p>
                )}
              </LightCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
