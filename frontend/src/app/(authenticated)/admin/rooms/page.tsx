'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/src/app/lib/api-client';
import { RoomResponse, RoomRequest, UpdateRoomRequest, APIError } from '@/src/app/lib/types';
import { useAuth } from '@/src/app/auth/auth-context';
import { Button } from '@/src/design-system/atoms/Button';
import { LightCard } from '@/src/design-system/cards';
import { H1, H2 } from '@/src/design-system/typography/Heading';
import { P2 } from '@/src/design-system/typography/Paragraph';
import { Input } from '@/src/design-system/forms/Input';
import { ROOM_TYPES, RoomType } from '@/src/app/lib/types';

const fieldClass =
  'w-full px-3 py-2 rounded-lg border border-borderPrimary bg-backgroundPrimary text-contentPrimary focus:outline-none focus:ring-2 focus:ring-accentPrimary';

const ROOM_TYPE_OPTIONS = Object.keys(ROOM_TYPES) as RoomType[];

function toRoomType(value: string | undefined): RoomType {
  if (value && value in ROOM_TYPES) return value as RoomType;
  return 'LECTURE';
}

export default function AdminRoomsPage() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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

  const didFetch = useRef(false);

  const loadRooms = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    if (!user) return;

    if (user.role !== 'ADMIN') {
      window.location.replace('/');
      return;
    }

    // 🔥 blokada cascading renders
    if (didFetch.current) return;
    didFetch.current = true;

    loadRooms();
  }, [user?.role, loadRooms]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'capacity'
          ? parseInt(value) || 1
          : name === 'roomType'
            ? toRoomType(value)
            : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      if (editingId) {
        const updateData: UpdateRoomRequest = {
          name: formData.name || undefined,
          buildingName: formData.buildingName || undefined,
          capacity: formData.capacity || undefined,
          description: formData.description || undefined,
        };
        await api.patch(`/rooms/${editingId}`, updateData);
      } else {
        await api.post('/rooms', formData);
      }

      await loadRooms();
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
    if (!room.id) return;

    setEditingId(room.id);
    setFormData({
      name: room.name ?? '',
      buildingName: room.buildingName ?? '',
      capacity: room.capacity ?? 1,
      roomType: toRoomType(room.roomType),
      description: room.description ?? '',
    });

    setShowForm(true);
  };

  const handleDelete = async (roomId: string) => {
    if (!confirm('Na pewno chcesz usunąć tę salę?')) return;

    try {
      await api.delete(`/rooms/${roomId}`);
      await loadRooms();
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

      <div className="flex items-end justify-between">
        <div>
          <H1>Zarządzanie salami</H1>
          <P2 className="text-contentSecondary mt-1">
            Twórz i edytuj sale w systemie
          </P2>
        </div>

        {!showForm && (
          <Button onClick={() => setShowForm(true)}>+ Nowa sala</Button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-error bg-errorSoft text-error px-4 py-3">
          {error}
        </div>
      )}

      {showForm && (
        <LightCard>
          <div className="flex items-center justify-between mb-6">
            <H2>{editingId ? 'Edytuj salę' : 'Nowa sala'}</H2>

            <button
              type="button"
              onClick={handleFormClose}
              className="text-sm text-contentSecondary hover:text-error"
            >
              Zamknij
            </button>
          </div>

          {formError && (
            <div className="mb-4 text-sm border border-error bg-errorSoft text-error p-3 rounded-lg">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input name="name" value={formData.name} onChange={handleFormChange} placeholder="Nazwa sali" />
              <Input name="buildingName" value={formData.buildingName} onChange={handleFormChange} placeholder="Budynek" />
              <Input type="number" name="capacity" value={formData.capacity} onChange={handleFormChange} />

              <select
                name="roomType"
                value={formData.roomType}
                onChange={handleFormChange}
                className={fieldClass}
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
              className={fieldClass}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" outline onClick={handleFormClose}>
                Anuluj
              </Button>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Zapisywanie...' : 'Zapisz'}
              </Button>
            </div>
          </form>
        </LightCard>
      )}

      {!showForm && (
        <LightCard className="p-0! overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-backgroundSecondary text-contentSecondary">
              <tr>
                <th className="text-left p-4">Nazwa</th>
                <th className="text-left p-4">Budynek</th>
                <th className="text-left p-4">Pojemność</th>
                <th className="text-left p-4">Typ</th>
                <th className="text-right p-4">Akcje</th>
              </tr>
            </thead>

            <tbody>
              {rooms.map((room, index) => (
                <tr key={room.id ?? index} className="border-t border-borderPrimary hover:bg-backgroundSecondary transition">
                  <td className="p-4 font-medium text-contentPrimary">{room.name}</td>
                  <td className="p-4 text-contentSecondary">{room.buildingName}</td>
                  <td className="p-4 text-contentSecondary">{room.capacity}</td>
                  <td className="p-4 text-contentSecondary">
                    {room.roomType && room.roomType in ROOM_TYPES
                      ? ROOM_TYPES[toRoomType(room.roomType)]
                      : '—'}
                  </td>

                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-3">
                      <button onClick={() => handleEdit(room)} className="text-accentBase hover:text-accentHover font-medium">
                        Edytuj
                      </button>

                      <button
                        onClick={() => room.id && handleDelete(room.id)}
                        className="text-error hover:opacity-80 font-medium"
                      >
                        Usuń
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </LightCard>
      )}
    </div>
  );
}
