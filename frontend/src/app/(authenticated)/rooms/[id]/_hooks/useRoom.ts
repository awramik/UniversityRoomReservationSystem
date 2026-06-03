"use client";

import { useEffect, useState } from "react";
import { api } from "@/src/app/lib/api-client";
import { APIError, RoomResponse } from "@/src/app/lib/types";

export function useRoom(roomId: string) {
  const [room, setRoom] = useState<RoomResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await api.get<RoomResponse>(`/rooms/${roomId}`);
        setRoom(data);
      } catch (e) {
        setError(e instanceof APIError ? e.message : "Błąd");
      } finally {
        setLoading(false);
      }
    })();
  }, [roomId]);

  return { room, loading, error };
}
