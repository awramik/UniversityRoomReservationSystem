"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/src/app/lib/api-client";
import {
  RoomResponse,
  RoomRequest,
  UpdateRoomRequest,
  APIError,
} from "@/src/app/lib/types";
import { useAuth } from "@/src/app/auth/auth-context";
import { Header } from "../../_components/Header";
import { Button } from "@/src/design-system/atoms/Button";
import { LightCard } from "@/src/design-system/cards/LightCard";
import { RoomsTable } from "./_components/RoomsTable";
import { RoomForm } from "./_components/RoomForm";

export default function AdminRoomsPage() {
  const { user } = useAuth();

  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomResponse | null>(null);

  const didFetch = useRef(false);

  const loadRooms = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const data = await api.get<RoomResponse[]>("/rooms");
      setRooms(data || []);
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message || "Błąd podczas ładowania sal");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    if (user.role !== "ADMIN") {
      window.location.replace("/");
      return;
    }

    if (didFetch.current) return;
    didFetch.current = true;

    loadRooms();
  }, [user?.role, loadRooms]);

  const handleEdit = (room: RoomResponse) => {
    setEditingRoom(room);
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingRoom(null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingRoom(null);
  };

  const handleDelete = async (roomId: string) => {
    if (!confirm("Na pewno chcesz usunąć tę salę?")) return;

    try {
      await api.delete(`/rooms/${roomId}`);
      await loadRooms();
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message || "Błąd podczas usuwania sali");
      }
    }
  };

  const handleSubmit = async (
    data: RoomRequest | UpdateRoomRequest,
    id?: string,
  ) => {
    try {
      if (id) {
        await api.patch(`/rooms/${id}`, data);
      } else {
        await api.post("/rooms", data);
      }

      await loadRooms();
      handleCloseForm();
    } catch (err) {
      if (err instanceof APIError) {
        throw err;
      }
    }
  };

  return (
    <div className="space-y-8">
      <Header
        title="Zarządzanie salami"
        details="Twórz i edytuj sale w systemie"
      >
        {!showForm && <Button onClick={handleCreate}>+ Nowa sala</Button>}
      </Header>

      {error && (
        <div className="rounded-xl border border-error bg-errorSoft text-error px-4 py-3">
          {error}
        </div>
      )}

      {showForm ? (
        <LightCard>
          <RoomForm
            editingRoom={editingRoom}
            onSubmit={handleSubmit}
            onCancel={handleCloseForm}
          />
        </LightCard>
      ) : (
        <RoomsTable
          rooms={rooms}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
