'use client';

import { useState, useEffect } from 'react';
import { api } from '@/app/lib/api-client';
import { RoomResponse, RoomRequest, UpdateRoomRequest, APIError } from '@/app/lib/types';
import { useAuth } from '@/app/context/auth-context';
import Link from 'next/link';

const ROOM_TYPES: { [key: string]: string } = {
  LECTURE: 'Wykładowa',
  LABORATORY: 'Laboratoryjna',
  COMPUTER: 'Komputerowa',
  CONFERENCE: 'Konferencyjna',
};

const ROOM_TYPE_OPTIONS = ['LECTURE', 'LABORATORY', 'COMPUTER', 'CONFERENCE'];

export default function AdminRoomsPage() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<RoomRequest>({
    name: '',
    buildingName: '',
    capacity: 1,
    roomType: 'LECTURE',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      // Redirect non-admins
      window.location.href = '/';
    } else {
      loadRooms();
    }
  }, [user]);

  const loadRooms = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await api.get<RoomResponse[]>('/rooms');
      setRooms(data || []);
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message || 'Błąd podczas ładowania sal');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'capacity' ? parseInt(value) || 1 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      if (editingId) {
        // Update existing room
        const updateData: UpdateRoomRequest = {
          name: formData.name || undefined,
          buildingName: formData.buildingName || undefined,
          capacity: formData.capacity || undefined,
          description: formData.description || undefined,
        };
        await api.patch(`/rooms/${editingId}`, updateData);
      } else {
        // Create new room
        await api.post('/rooms', formData);
      }

      // Reload rooms
      loadRooms();
      handleFormClose();
    } catch (err) {
      if (err instanceof APIError) {
        setFormError(err.message || 'Błąd podczas zapisywania sali');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (room: RoomResponse) => {
    setEditingId(room.id);
    setFormData({
      name: room.name,
      buildingName: room.buildingName,
      capacity: room.capacity,
      roomType: room.roomType,
      description: room.description || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (roomId: string) => {
    if (!confirm('Na pewno chcesz usunąć tę salę?')) return;

    try {
      await api.delete(`/rooms/${roomId}`);
      loadRooms();
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message || 'Błąd podczas usuwania sali');
      }
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      name: '',
      buildingName: '',
      capacity: 1,
      roomType: 'LECTURE',
      description: '',
    });
    setFormError('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/" className="text-blue-500 hover:text-blue-600 inline-block mb-4">
            ← Wróć
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Zarządzaj salami</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Twórz, edytuj i usuwaj sale
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded transition"
          >
            + Nowa sala
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            {editingId ? 'Edytuj salę' : 'Nowa sala'}
          </h2>

          {formError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-4">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nazwa sali *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="Np. Sala 101"
                  required
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                />
              </div>

              {/* Building */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Budynek *
                </label>
                <input
                  type="text"
                  name="buildingName"
                  value={formData.buildingName}
                  onChange={handleFormChange}
                  placeholder="Np. Budynek A"
                  required
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                />
              </div>

              {/* Capacity */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Pojemność *
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleFormChange}
                  min="1"
                  required
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Typ *
                </label>
                <select
                  name="roomType"
                  value={formData.roomType}
                  onChange={handleFormChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                >
                  {ROOM_TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>
                      {ROOM_TYPES[type]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Opis
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                placeholder="Dodatkowe informacje o sali..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={handleFormClose}
                disabled={isSubmitting}
                className="bg-slate-300 hover:bg-slate-400 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-medium py-2 px-4 rounded transition disabled:opacity-50"
              >
                Anuluj
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition disabled:opacity-50"
              >
                {isSubmitting ? 'Zapisywanie...' : 'Zapisz'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rooms Table */}
      {isLoading ? (
        <div className="text-center text-slate-600 dark:text-slate-400 py-8">
          Ładowanie sal...
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                  Nazwa
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                  Budynek
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                  Pojemność
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                  Typ
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-slate-900 dark:text-white">
                  Akcje
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {rooms.map((room) => (
                <tr key={room.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                  <td className="px-6 py-4 text-slate-900 dark:text-white font-medium">
                    {room.name}
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                    {room.buildingName}
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                    {room.capacity}
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                    {ROOM_TYPES[room.roomType]}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => handleEdit(room)}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Edytuj
                      </button>
                      <button
                        onClick={() => handleDelete(room.id)}
                        className="text-red-600 hover:text-red-700 font-medium"
                      >
                        Usuń
                      </button>
                    </div>
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
