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
  <div className="space-y-8">

    {/* Header */}
    <div className="flex items-end justify-between">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Zarządzanie salami
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Twórz i edytuj sale w systemie
        </p>
      </div>

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition"
        >
          + Nowa sala
        </button>
      )}
    </div>

    {/* ERROR */}
    {error && (
      <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3">
        {error}
      </div>
    )}

    {/* FORM (more modal-like) */}
    {showForm && (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {editingId ? 'Edytuj salę' : 'Nowa sala'}
          </h2>

          <button
            onClick={handleFormClose}
            className="text-sm text-slate-500 hover:text-red-500"
          >
            Zamknij
          </button>
        </div>

        {formError && (
          <div className="mb-4 text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-3 rounded-lg">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <input
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              placeholder="Nazwa sali"
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500"
            />

            <input
              name="buildingName"
              value={formData.buildingName}
              onChange={handleFormChange}
              placeholder="Budynek"
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500"
            />

            <input
              type="number"
              name="capacity"
              value={formData.capacity}
              onChange={handleFormChange}
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500"
            />

            <select
              name="roomType"
              value={formData.roomType}
              onChange={handleFormChange}
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500"
            >
              {ROOM_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {ROOM_TYPES[t]}
                </option>
              ))}
            </select>

          </div>

          <textarea
            name="description"
            value={formData.description}
            onChange={handleFormChange}
            rows={3}
            placeholder="Opis (opcjonalnie)"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500"
          />

          <div className="flex justify-end gap-2">

            <button
              type="button"
              onClick={handleFormClose}
              className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition"
            >
              Anuluj
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50"
            >
              {isSubmitting ? 'Zapisywanie...' : 'Zapisz'}
            </button>

          </div>

        </form>

      </div>
    )}

    {/* TABLE */}
    {!showForm && (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">

        <table className="w-full text-sm">

          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500">
            <tr>
              <th className="text-left p-4">Nazwa</th>
              <th className="text-left p-4">Budynek</th>
              <th className="text-left p-4">Pojemność</th>
              <th className="text-left p-4">Typ</th>
              <th className="text-right p-4">Akcje</th>
            </tr>
          </thead>

          <tbody>

            {rooms.map((room) => (
              <tr
                key={room.id}
                className="border-t border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >

                <td className="p-4 font-medium text-slate-900 dark:text-white">
                  {room.name}
                </td>

                <td className="p-4 text-slate-500">
                  {room.buildingName}
                </td>

                <td className="p-4 text-slate-500">
                  {room.capacity}
                </td>

                <td className="p-4 text-slate-500">
                  {ROOM_TYPES[room.roomType]}
                </td>

                <td className="p-4 text-right">

                  <div className="flex justify-end gap-3">

                    <button
                      onClick={() => handleEdit(room)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Edytuj
                    </button>

                    <button
                      onClick={() => handleDelete(room.id)}
                      className="text-red-600 hover:text-red-800 font-medium"
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
