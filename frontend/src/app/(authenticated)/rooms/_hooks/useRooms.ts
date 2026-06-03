"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/src/app/lib/api-client";
import { RoomResponse, APIError, RoomType } from "@/src/app/lib/types";

type CacheKey = string;
type RoomsCache = Map<CacheKey, RoomResponse[]>;

type UseRoomsParams = {
  selectedType: RoomType | "";
  selectedBuilding: string;
  minCapacity: string;
};

export function useRooms(
  selectedType: UseRoomsParams["selectedType"],
  selectedBuilding: UseRoomsParams["selectedBuilding"],
  minCapacity: UseRoomsParams["minCapacity"],
) {
  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const cache = useRef<RoomsCache>(new Map());
  const requestId = useRef<number>(0);

  const cacheKey = useMemo<CacheKey>(() => {
    return JSON.stringify({
      selectedType,
      selectedBuilding,
      minCapacity,
    });
  }, [selectedType, selectedBuilding, minCapacity]);

  useEffect(() => {
    const currentRequest: number = ++requestId.current;
    const controller: AbortController = new AbortController();

    const loadRooms = async (): Promise<void> => {
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

        const endpoint: string = `/rooms${
          params.toString() ? `?${params.toString()}` : ""
        }`;

        const data = await api.get<RoomResponse[]>(endpoint, {
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;
        if (currentRequest !== requestId.current) return;

        const result: RoomResponse[] = data ?? [];

        cache.current.set(cacheKey, result);

        setRooms(result);
        setIsInitialLoading(false);
      } catch (err: unknown) {
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

    return () => {
      controller.abort();
    };
  }, [cacheKey, selectedType, selectedBuilding, minCapacity]);

  const uniqueBuildings = useMemo<string[]>(() => {
    return Array.from(
      new Set(
        rooms
          .map((r: RoomResponse) => r.buildingName)
          .filter((b): b is string => Boolean(b)),
      ),
    ).sort();
  }, [rooms]);

  return {
    rooms,
    isInitialLoading,
    error,
    uniqueBuildings,
  };
}
