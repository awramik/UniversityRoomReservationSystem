'use client';

import { useState, useEffect } from 'react';
import { api } from '@/src/app/lib/api-client';
import { ReservationResponse, RoomResponse, AdminBlockRequest, APIError } from '@/src/app/lib/types';
import { formatDateTimeDisplay, parseDateTimeFromInput, getCurrentDateTimeISO } from '@/src/app/lib/date-utils';
import { useAuth } from '@/src/app/context/auth-context';
import Link from 'next/link';

const STATUS_COLORS: { [key: string]: string } = {
  ACTIVE: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
  PAST: 'bg-slate-100 dark:bg-slate-900/30 text-slate-800 dark:text-slate-300',
  CANCELLED: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
};

const STATUS_NAMES: { [key: string]: string } = {
  ACTIVE: 'Aktywna',
  PAST: 'Przeszła',
  CANCELLED: 'Anulowana',
};

const ROOM_TYPES: { [key: string]: string } = {
  LECTURE: 'Wykładowa',
  LABORATORY: 'Laboratoryjna',
  COMPUTER: 'Komputerowa',
  CONFERENCE: 'Konferencyjna',
};

export default function AdminReservationsPage() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<ReservationResponse[]>([]);
  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Block form state
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [blockFormData, setBlockFormData] = useState({
    roomId: '',
    startTime: '',
    endTime: '',
    purpose: '',
  });
  const [isSubmittingBlock, setIsSubmittingBlock] = useState(false);
  const [blockFormError, setBlockFormError] = useState('');
  const [blockSuccess, setBlockSuccess] = useState('');

  // Filter state
  const [filterStatus, setFilterStatus] = useState<'ACTIVE' | 'PAST' | 'CANCELLED' | 'ALL'>('ACTIVE');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      window.location.href = '/';
    } else {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError('');
      const [reservationsData, roomsData] = await Promise.all([
        api.get<ReservationResponse[]>('/reservations'),
        api.get<RoomResponse[]>('/rooms'),
      ]);
      setReservations(reservationsData || []);
      setRooms(roomsData || []);
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message || 'Błąd podczas ładowania danych');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlockFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBlockFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBlockFormError('');
    setIsSubmittingBlock(true);

    try {
      if (!blockFormData.roomId || !blockFormData.startTime || !blockFormData.endTime) {
        setBlockFormError('Wypełnij wszystkie wymagane pola');
        setIsSubmittingBlock(false);
        return;
      }

      const blockRequest: AdminBlockRequest = {
        roomId: blockFormData.roomId,
        startTime: parseDateTimeFromInput(blockFormData.startTime),
        endTime: parseDateTimeFromInput(blockFormData.endTime),
        purpose: blockFormData.purpose || undefined,
      };

      await api.post('/reservations/blocks', blockRequest);
      setBlockSuccess('Blok został utworzony');
      setBlockFormData({ roomId: '', startTime: '', endTime: '', purpose: '' });
      setShowBlockForm(false);
      
      // Reload reservations
      loadData();

      setTimeout(() => setBlockSuccess(''), 3000);
    } catch (err) {
      if (err instanceof APIError) {
        setBlockFormError(err.message || 'Błąd podczas tworzenia bloku');
      }
    } finally {
      setIsSubmittingBlock(false);
    }
  };

  const handleDeleteReservation = async (reservationId: string) => {
    if (!confirm('Na pewno chcesz usunąć tę rezerwację?')) return;

    try {
      setDeletingId(reservationId);
      await api.delete(`/reservations/${reservationId}`);
      loadData();
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message || 'Błąd podczas usuwania rezerwacji');
      }
    } finally {
      setDeletingId(null);
    }
  };

  const filteredReservations =
    filterStatus === 'ALL'
      ? reservations
      : reservations.filter((r) => r.status === filterStatus);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/" className="text-blue-500 hover:text-blue-600 inline-block mb-4">
            ← Wróć
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Wszystkie rezerwacje</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Zarządzaj rezerwacjami i tworz bloki
          </p>
        </div>
        {!showBlockForm && (
          <button
            onClick={() => setShowBlockForm(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-6 rounded transition"
          >
            + Nowy blok
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {blockSuccess && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-200 px-4 py-3 rounded">
          ✓ {blockSuccess}
        </div>
      )}

      {/* Block Form */}
      {showBlockForm && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            Utwórz nowy blok niedostępności
          </h2>

          {blockFormError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-4">
              {blockFormError}
            </div>
          )}

          <form onSubmit={handleBlockSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Room */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Sala *
                </label>
                <select
                  name="roomId"
                  value={blockFormData.roomId}
                  onChange={handleBlockFormChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmittingBlock}
                >
                  <option value="">Wybierz salę</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name} ({room.buildingName}) - {ROOM_TYPES[room.roomType]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Time */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Od *
                </label>
                <input
                  type="datetime-local"
                  name="startTime"
                  value={blockFormData.startTime}
                  onChange={handleBlockFormChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmittingBlock}
                />
              </div>

              {/* End Time */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Do *
                </label>
                <input
                  type="datetime-local"
                  name="endTime"
                  value={blockFormData.endTime}
                  onChange={handleBlockFormChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmittingBlock}
                />
              </div>

              {/* Purpose */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Powód
                </label>
                <input
                  type="text"
                  name="purpose"
                  value={blockFormData.purpose}
                  onChange={handleBlockFormChange}
                  placeholder="Np. Konserwacja, sprzątnięcie"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmittingBlock}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowBlockForm(false)}
                disabled={isSubmittingBlock}
                className="bg-slate-300 hover:bg-slate-400 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-medium py-2 px-4 rounded transition disabled:opacity-50"
              >
                Anuluj
              </button>
              <button
                type="submit"
                disabled={isSubmittingBlock}
                className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded transition disabled:opacity-50"
              >
                {isSubmittingBlock ? 'Tworzenie...' : 'Utwórz blok'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-slate-200 dark:border-slate-700">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Filtruj po statusie:
        </label>
        <div className="flex gap-2">
          {(['ALL', 'ACTIVE', 'PAST', 'CANCELLED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded font-medium transition ${
                filterStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600'
              }`}
            >
              {status === 'ALL' ? 'Wszystkie' : STATUS_NAMES[status]}
            </button>
          ))}
        </div>
      </div>

      {/* Reservations */}
      {isLoading ? (
        <div className="text-center text-slate-600 dark:text-slate-400 py-8">
          Ładowanie rezerwacji...
        </div>
      ) : filteredReservations.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-8 text-center border border-slate-200 dark:border-slate-700">
          <p className="text-slate-600 dark:text-slate-400">
            Brak rezerwacji w tym statusie
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                  Sala
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                  Rezerwujący
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                  Od
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                  Do
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                  Status
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-slate-900 dark:text-white">
                  Akcje
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredReservations.map((reservation) => (
                <tr key={reservation.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                  <td className="px-6 py-4 text-slate-900 dark:text-white font-medium">
                    {reservation.roomName}
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                    {reservation.bookerName || '—'}
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-sm">
                    {formatDateTimeDisplay(reservation.startTime)}
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-sm">
                    {formatDateTimeDisplay(reservation.endTime)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${STATUS_COLORS[reservation.status]}`}>
                      {STATUS_NAMES[reservation.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleDeleteReservation(reservation.id)}
                      disabled={deletingId === reservation.id}
                      className="text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                    >
                      {deletingId === reservation.id ? 'Usuwanie...' : 'Usuń'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
