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

  // Filters
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

        const endpoint =
          `/rooms${params.toString() ? `?${params.toString()}` : ''}`;

        const data = await api.get<RoomResponse[]>(endpoint);
        setRooms(data || []);

        if (!selectedBuilding && data) {
          const buildings = [...new Set(data.map((r) => r.buildingName))].sort();
          setUniqueBuildings(buildings);
        }
      } catch (err) {
        if (err instanceof APIError) {
          setError(`Błąd: ${err.message}`);
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Sale
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Przeglądaj dostępne sale i dokonaj rezerwacji
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Filtry
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Room Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Typ sali
            </label>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Wszystkie</option>
              <option value="LECTURE">Wykładowa</option>
              <option value="LABORATORY">Laboratoryjna</option>
              <option value="COMPUTER">Komputerowa</option>
              <option value="CONFERENCE">Konferencyjna</option>
            </select>
          </div>

          {/* Building */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Budynek
            </label>

            <select
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Wszystkie</option>
              {uniqueBuildings.map((building) => (
                <option key={building} value={building}>
                  {building}
                </option>
              ))}
            </select>
          </div>

          {/* Capacity */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Min. pojemność
            </label>

            <input
              type="number"
              min="1"
              value={minCapacity}
              onChange={(e) => setMinCapacity(e.target.value)}
              placeholder="Liczba miejsc"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Reset */}
          <div className="flex items-end">
            <button
              onClick={handleReset}
              className="w-full bg-slate-500 hover:bg-slate-600 text-white font-medium py-2 px-4 rounded-md transition"
            >
              Resetuj filtry
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Loading / empty / list */}
      {isLoading ? (
        <div className="text-center text-slate-600 dark:text-slate-400 py-8">
          Ładowanie sal...
        </div>
      ) : rooms.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-8 text-center">
          <p className="text-slate-600 dark:text-slate-400">
            Nie znaleziono sal spełniających kryteria filtru
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <Link key={room.id} href={`/rooms/${room.id}`}>
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow hover:shadow-lg transition p-6 border border-slate-200 dark:border-slate-700 cursor-pointer h-full">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {room.name}
                  </h3>

                  <span className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-semibold px-3 py-1 rounded-full">
                    {ROOM_TYPES[room.roomType] || room.roomType}
                  </span>
                </div>

                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  {room.buildingName}
                </p>

                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    👥 {room.capacity} miejsc
                  </span>
                </div>

                {room.description && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
                    {room.description}
                  </p>
                )}

                <button className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition">
                  Szczegóły i rezerwacja →
                </button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
