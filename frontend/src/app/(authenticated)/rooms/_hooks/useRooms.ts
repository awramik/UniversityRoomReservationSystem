"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/src/app/lib/api-client";
import { RoomResponse, APIError } from "@/src/app/lib/types";

type CacheKey = string;

export function useRooms(
  selectedType: string,
  selectedBuilding: string,
  minCapacity: string,
) {
  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState("");

  const cache = useRef(new Map<CacheKey, RoomResponse[]>());
  const requestId = useRef(0);

  const cacheKey = useMemo(() => {
    return JSON.stringify({ selectedType, selectedBuilding, minCapacity });
  }, [selectedType, selectedBuilding, minCapacity]);

  useEffect(() => {
    const currentRequest = ++requestId.current;
    const controller = new AbortController();

    const loadRooms = async () => {
      try {
        setError("");

        const cached = cache.current.get(cacheKey);
        if (cached) {
          setRooms(cached);
          setIsInitialLoading(false);
          return;
        }

        const params = new URLSearchParams();
        if (selectedType) params.append("type", selectedType);
        if (selectedBuilding) params.append("building", selectedBuilding);
        if (minCapacity) params.append("minCapacity", minCapacity);

        const endpoint = `/rooms${params.toString() ? `?${params}` : ""}`;

        const data = await api.get<RoomResponse[]>(endpoint, {
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;
        if (currentRequest !== requestId.current) return;

        const result = data || [];

        cache.current.set(cacheKey, result);

        setRooms(result);
        setIsInitialLoading(false);
      } catch (err) {
        if (controller.signal.aborted) return;

        if (err instanceof APIError) {
          setError(err.message);
        } else {
          setError("Błąd podczas ładowania sal");
        }

        setIsInitialLoading(false);
      }
    };

    loadRooms();
    return () => controller.abort();
  }, [cacheKey]);

  const uniqueBuildings = useMemo(() => {
    return [
      ...new Set(rooms.map((r) => r.buildingName).filter(Boolean)),
    ].sort();
  }, [rooms]);

  return {
    rooms,
    isInitialLoading,
    error,
    uniqueBuildings,
  };
}
