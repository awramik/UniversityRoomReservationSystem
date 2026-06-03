"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/src/app/lib/api-client";
import {
  RoomResponse,
  RoomRequest,
  UpdateRoomRequest,
  APIError,
  ROOM_TYPES,
  RoomType,
} from "@/src/app/lib/types";
import { useAuth } from "@/src/app/auth/auth-context";
import { Button } from "@/src/design-system/atoms/Button";
import { LightCard } from "@/src/design-system/cards/LightCard";
import { H2 } from "@/src/design-system/typography/Heading";
import { Input } from "@/src/design-system/forms/Input";
import { Fieldset, Field, Label } from "@headlessui/react";
import { Header } from "../../_components/Header";
import { Table } from "@/src/design-system/cards/Table";

const fieldClass =
  "w-full px-3 py-2 rounded-lg border border-borderPrimary bg-backgroundPrimary text-contentPrimary focus:outline-none focus:ring-2 focus:ring-accentPrimary";

const ROOM_TYPE_OPTIONS = Object.keys(ROOM_TYPES) as RoomType[];

function toRoomType(value: string | undefined): RoomType {
  return value && value in ROOM_TYPES ? (value as RoomType) : "LECTURE";
}

export default function AdminRoomsPage() {
  const { user } = useAuth();

  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<RoomRequest>({
    name: "",
    buildingName: "",
    capacity: 1,
    roomType: "LECTURE",
    description: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

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

  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      if (name === "capacity") {
        return {
          ...prev,
          capacity: value === "" ? 1 : Number(value),
        };
      }

      if (name === "roomType") {
        return {
          ...prev,
          roomType: toRoomType(value),
        };
      }

      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
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
        await api.post("/rooms", formData);
      }

      await loadRooms();
      handleFormClose();
    } catch (err) {
      if (err instanceof APIError) {
        setFormError(err.message || "Błąd podczas zapisywania sali");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (room: RoomResponse) => {
    if (!room.id) return;

    setEditingId(room.id);
    setFormData({
      name: room.name ?? "",
      buildingName: room.buildingName ?? "",
      capacity: room.capacity ?? 1,
      roomType: toRoomType(room.roomType),
      description: room.description ?? "",
    });

    setShowForm(true);
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

  const handleFormClose = () => {
    setShowForm(false);
    setEditingId(null);

    setFormData({
      name: "",
      buildingName: "",
      capacity: 1,
      roomType: "LECTURE",
      description: "",
    });

    setFormError("");
  };

  return (
    <div className="space-y-8">
      <Header
        title="Zarządzanie salami"
        details="Twórz i edytuj sale w systemie"
      >
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>+ Nowa sala</Button>
        )}
      </Header>

      {error && (
        <div className="rounded-xl border border-error bg-errorSoft text-error px-4 py-3">
          {error}
        </div>
      )}

      {showForm && (
        <LightCard>
          <div className="flex items-center justify-between mb-6">
            <H2>{editingId ? "Edytuj salę" : "Nowa sala"}</H2>
          </div>

          {formError && (
            <div className="mb-4 text-sm border border-error bg-errorSoft text-error p-3 rounded-lg">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <Label htmlFor="name">Nazwa sali</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                />
              </Field>

              <Field>
                <Label htmlFor="buildingName">Budynek</Label>
                <Input
                  id="buildingName"
                  name="buildingName"
                  value={formData.buildingName}
                  onChange={handleFormChange}
                />
              </Field>

              <Field>
                <Label htmlFor="capacity">Pojemność</Label>
                <Input
                  id="capacity"
                  name="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={handleFormChange}
                />
              </Field>

              <Field>
                <Label htmlFor="roomType">Typ sali</Label>
                <select
                  id="roomType"
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
              </Field>
            </Fieldset>

            <Field>
              <Label htmlFor="description">Opis</Label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                rows={3}
                className={fieldClass}
              />
            </Field>

            <div className="flex justify-end gap-2">
              <Button type="button" outline onClick={handleFormClose}>
                Anuluj
              </Button>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Zapisywanie..." : "Zapisz"}
              </Button>
            </div>
          </form>
        </LightCard>
      )}

      {!showForm && (
        <Table>
          <Table.Head>
            <tr>
              <Table.HeadCell>Nazwa</Table.HeadCell>
              <Table.HeadCell>Budynek</Table.HeadCell>
              <Table.HeadCell>Pojemność</Table.HeadCell>
              <Table.HeadCell>Typ</Table.HeadCell>
              <Table.HeadCell align="right">Akcje</Table.HeadCell>
            </tr>
          </Table.Head>

          <Table.Body>
            {rooms.map((room, index) => (
              <Table.Row key={room.id ?? index}>
                <Table.Cell className="font-medium text-contentPrimary">
                  {room.name}
                </Table.Cell>

                <Table.Cell className="text-contentSecondary">
                  {room.buildingName}
                </Table.Cell>

                <Table.Cell className="text-contentSecondary">
                  {room.capacity}
                </Table.Cell>

                <Table.Cell className="text-contentSecondary">
                  {room.roomType && room.roomType in ROOM_TYPES
                    ? ROOM_TYPES[toRoomType(room.roomType)]
                    : "—"}
                </Table.Cell>

                <Table.Cell align="right">
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => handleEdit(room)}
                      className="font-medium text-accentBase hover:text-accentHover"
                    >
                      Edytuj
                    </button>

                    <button
                      onClick={() => room.id && handleDelete(room.id)}
                      className="font-medium text-error hover:opacity-80"
                    >
                      Usuń
                    </button>
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </div>
  );
}
