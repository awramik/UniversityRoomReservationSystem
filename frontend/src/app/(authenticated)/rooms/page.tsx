'use client';

import { useState, useEffect } from 'react';
import { api } from '@/src/app/lib/api-client';
import { RoomResponse, APIError } from '@/src/app/lib/types';
import { useAuth } from '@/src/app/context/auth-context';
import { LightCard } from '@/src/design-system/cards';
import { Link } from '@/src/design-system/atoms/Link';

const ROOM_TYPES: { [key: string]: string } = {
  LECTURE: 'Wykładowa',
  LABORATORY: 'Laboratoryjna',
  COMPUTER: 'Komputerowa',
  CONFERENCE: 'Konferencyjna',
};

export default function RoomsPage() {
  const { user } = useAuth();

  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedType, setSelectedType] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [minCapacity, setMinCapacity] = useState('');
  const [uniqueBuildings, setUniqueBuildings] = useState<string[]>([]);

  useEffect(() => {
    const loadRooms = async () => {
      try {
        setIsLoading(true);
        setError('');

        const params = new URLSearchParams();

        if (selectedType) params.append('type', selectedType);
        if (selectedBuilding) params.append('building', selectedBuilding);
        if (minCapacity) params.append('minCapacity', minCapacity);

        const endpoint = `/rooms${params.toString() ? `?${params}` : ''}`;
        const data = await api.get<RoomResponse[]>(endpoint);

        setRooms(data || []);

        if (!selectedBuilding && data) {
          const buildings = [...new Set(data.map((r) => r.buildingName))].sort();
          setUniqueBuildings(buildings);
        }
      } catch (err) {
        if (err instanceof APIError) {
          setError(err.message);
        } else {
          setError('Błąd podczas ładowania sal');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadRooms();
  }, [selectedType, selectedBuilding, minCapacity]);

  const handleReset = () => {
    setSelectedType('');
    setSelectedBuilding('');
    setMinCapacity('');
  };

  return (
    <div className="space-y-8">

      {/* HEADER */}
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

      {/* FILTERS */}
      <LightCard>

        <div className="flex flex-col lg:flex-row gap-3 lg:items-end">

          {/* TYPE */}
          <div className="flex-1">
            <label className="text-xs text-contentTertiary">
              Typ sali
            </label>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-borderPrimary bg-backgroundPrimary text-contentPrimary focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Wszystkie</option>
              <option value="LECTURE">Wykładowa</option>
              <option value="LABORATORY">Laboratoryjna</option>
              <option value="COMPUTER">Komputerowa</option>
              <option value="CONFERENCE">Konferencyjna</option>
            </select>
          </div>

          {/* BUILDING */}
          <div className="flex-1">
            <label className="text-xs text-contentTertiary">
              Budynek
            </label>

            <select
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-borderPrimary bg-backgroundPrimary text-contentPrimary focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Wszystkie</option>
              {uniqueBuildings.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* CAPACITY */}
          <div className="flex-1">
            <label className="text-xs text-contentTertiary">
              Min. pojemność
            </label>

            <input
              type="number"
              min="1"
              value={minCapacity}
              onChange={(e) => setMinCapacity(e.target.value)}
              placeholder="np. 30"
              className="w-full mt-1 px-3 py-2 rounded-lg border border-borderPrimary bg-backgroundPrimary text-contentPrimary focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {/* RESET */}
          <button
            onClick={handleReset}
            className="h-[42px] px-4 rounded-lg bg-buttonSecondary text-buttonSecondaryText hover:bg-backgroundTertiary transition"
          >
            Reset
          </button>

        </div>
      </LightCard>

      {/* ERROR */}
      {error && (
        <div className="rounded-xl border border-error bg-errorSoft px-4 py-3 text-error">
          {error}
        </div>
      )}

      {/* LOADING */}
      {isLoading ? (
        <div className="grid gap-4">
          <div className="h-24 bg-backgroundSecondary animate-pulse rounded-xl" />
          <div className="h-24 bg-backgroundSecondary animate-pulse rounded-xl" />
          <div className="h-24 bg-backgroundSecondary animate-pulse rounded-xl" />
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-borderPrimary rounded-xl">
          <p className="text-contentTertiary">
            Brak sal dla wybranych filtrów
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

          {rooms.map((room) => (
            <Link key={room.id} href={`/rooms/${room.id}`}>
              <LightCard className="group hover:border-accentPrimary transition">
                <div className="flex items-start justify-between">

                  <h3 className="text-lg font-semibold text-contentPrimary group-hover:text-accent transition">
                    {room.name}
                  </h3>

                  <span className="text-xs px-2 py-1 rounded-full bg-accentSoft text-contentPrimary">
                    {ROOM_TYPES[room.roomType] ?? room.roomType}
                  </span>

                </div>

                <p className="text-sm text-contentSecondary mt-1">
                  {room.buildingName}
                </p>

                <div className="mt-3 text-sm text-contentSecondary">
                  {room.capacity} miejsc
                </div>

                {room.description && (
                  <p className="mt-3 text-sm text-contentTertiary line-clamp-3">
                    {room.description}
                  </p>
                )}

                <div className="mt-auto pt-4">
                  <div className="text-sm text-accent font-medium transition">
                    Zobacz szczegóły →
                  </div>
                </div>

              </LightCard>
            </Link>
          ))}

        </div>
      )}
    </div>
  );
}
