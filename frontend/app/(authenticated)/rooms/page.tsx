'use client';

import { useState, useEffect } from 'react';
import { api } from '@/app/lib/api-client';
import { RoomResponse, APIError } from '@/app/lib/types';
import Link from 'next/link';
import { useAuth } from '@/app/context/auth-context';

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

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Dostępne sale
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Przeglądaj, filtruj i rezerwuj sale w systemie
          </p>
        </div>

        <div className="text-xs px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          {rooms.length} wyników
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-end">

          {/* Type */}
          <div className="flex-1">
            <label className="text-xs text-slate-500">Typ sali</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Wszystkie</option>
              <option value="LECTURE">Wykładowa</option>
              <option value="LABORATORY">Laboratoryjna</option>
              <option value="COMPUTER">Komputerowa</option>
              <option value="CONFERENCE">Konferencyjna</option>
            </select>
          </div>

          {/* Building */}
          <div className="flex-1">
            <label className="text-xs text-slate-500">Budynek</label>
            <select
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Wszystkie</option>
              {uniqueBuildings.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Capacity */}
          <div className="flex-1">
            <label className="text-xs text-slate-500">Min. pojemność</label>
            <input
              type="number"
              min="1"
              value={minCapacity}
              onChange={(e) => setMinCapacity(e.target.value)}
              placeholder="np. 30"
              className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Reset */}
          <button
            onClick={handleReset}
            className="h-[42px] px-4 rounded-lg bg-slate-600 hover:bg-slate-700 text-white transition"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-900/40 px-4 py-3 text-red-700 dark:text-red-200">
          {error}
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="grid gap-4">
          <div className="h-24 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl" />
          <div className="h-24 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl" />
          <div className="h-24 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl" />
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
          <p className="text-slate-500">Brak sal dla wybranych filtrów</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

          {rooms.map((room) => (
            <Link key={room.id} href={`/rooms/${room.id}`}>
              <div className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:shadow-lg hover:border-blue-500 transition cursor-pointer h-full flex flex-col">

                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-blue-500 transition">
                    {room.name}
                  </h3>

                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                    {ROOM_TYPES[room.roomType] ?? room.roomType}
                  </span>
                </div>

                <p className="text-sm text-slate-500 mt-1">
                  📍 {room.buildingName}
                </p>

                <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                  👥 {room.capacity} miejsc
                </div>

                {room.description && (
                  <p className="mt-3 text-sm text-slate-500 line-clamp-3">
                    {room.description}
                  </p>
                )}

                <div className="mt-auto pt-4">
                  <div className="text-sm text-blue-600 dark:text-blue-400 font-medium group-hover:translate-x-1 transition">
                    Zobacz szczegóły →
                  </div>
                </div>

              </div>
            </Link>
          ))}

        </div>
      )}
    </div>
  );
}
