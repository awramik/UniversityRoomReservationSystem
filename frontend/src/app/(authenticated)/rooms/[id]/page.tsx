"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { addMinutes, format, isBefore, isToday, parseISO, set } from "date-fns";
import { api } from "@/src/app/lib/api-client";
import {
  RoomResponse,
  AvailabilityResponse,
  ReservationRequest,
  APIError,
  ROOM_TYPES,
} from "@/src/app/lib/types";
import { Link } from "@/src/design-system/atoms/Link";
import { LightCard } from "@/src/design-system/cards/LightCard";
import {
  calculateDurationHours,
  formatDateTimeForAPI,
} from "@/src/app/lib/date-utils";
import { Button } from "@/src/design-system/atoms/Button";
import { Input } from "@/src/design-system/forms/Input";

type FormValues = Omit<ReservationRequest, "roomId"> & {
  date: string;
};

const WORK_START = 6;
const WORK_END = 22;
const SLOT_STEP = 15;
const MIN_DURATION = 30;

// ----------------------
// utils
// ----------------------

function toDateTime(date: string, time: string) {
  return parseISO(`${date}T${time}:00`);
}

function formatTime(date: Date) {
  return format(date, "HH:mm");
}

function roundUpToStep(date: Date, step: number) {
  const ms = step * 60 * 1000;
  return new Date(Math.ceil(date.getTime() / ms) * ms);
}

// ----------------------
// SLOT LOGIC (FIXED)
// ----------------------

function generateStartTimes(date: string) {
  const parsedDate = parseISO(date);

  const startBase = set(parsedDate, {
    hours: WORK_START,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
  });

  const lastStart = set(parsedDate, {
    hours: 21,
    minutes: 30,
    seconds: 0,
    milliseconds: 0,
  });

  let cursor = startBase;

  if (isToday(parsedDate)) {
    const now = new Date();
    const rounded = roundUpToStep(now, SLOT_STEP);
    cursor = isBefore(rounded, startBase) ? startBase : rounded;
  }

  const result: string[] = [];

  while (
    isBefore(cursor, lastStart) ||
    cursor.getTime() === lastStart.getTime()
  ) {
    result.push(formatTime(cursor));
    cursor = addMinutes(cursor, SLOT_STEP);
  }

  return result;
}

function generateEndTimes(date: string, startTime: string) {
  if (!date || !startTime) return [];

  const parsedDate = parseISO(date);

  const start = toDateTime(date, startTime);

  const endLimit = set(parsedDate, {
    hours: WORK_END,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
  });

  const result: string[] = [];

  let cursor = addMinutes(start, MIN_DURATION);

  while (
    isBefore(cursor, endLimit) ||
    cursor.getTime() === endLimit.getTime()
  ) {
    result.push(formatTime(cursor));
    cursor = addMinutes(cursor, SLOT_STEP);
  }

  return result;
}

// ----------------------
// PAGE
// ----------------------

export default function RoomDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;

  const [room, setRoom] = useState<RoomResponse | null>(null);
  const [loadingRoom, setLoadingRoom] = useState(true);
  const [roomError, setRoomError] = useState("");

  const [availability, setAvailability] = useState<AvailabilityResponse | null>(
    null,
  );
  const [checking, setChecking] = useState(false);

  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, watch, setValue } = useForm<FormValues>({
    defaultValues: {
      date: "",
      startTime: "",
      endTime: "",
      purpose: "",
    },
  });

  const date = watch("date");
  const startTime = watch("startTime");
  const endTime = watch("endTime");

  // reset endTime when startTime changes
  useEffect(() => {
    setValue("endTime", "");
  }, [startTime, setValue]);

  // ----------------------
  // LOAD ROOM
  // ----------------------

  useEffect(() => {
    const run = async () => {
      try {
        setLoadingRoom(true);
        const data = await api.get<RoomResponse>(`/rooms/${roomId}`);
        setRoom(data);
      } catch (e) {
        setRoomError(e instanceof APIError ? e.message : "Błąd sieci");
      } finally {
        setLoadingRoom(false);
      }
    };

    run();
  }, [roomId]);

  // ----------------------
  // AVAILABILITY
  // ----------------------

  useEffect(() => {
    const run = async () => {
      if (!date || !startTime || !endTime) return;

      try {
        setChecking(true);

        const params = new URLSearchParams({
          startTime: toDateTime(date, startTime).toISOString(),
          endTime: toDateTime(date, endTime).toISOString(),
        });

        const data = await api.get<AvailabilityResponse>(
          `/rooms/${roomId}/availability?${params.toString()}`,
        );

        setAvailability(data);
      } catch {
        setAvailability(null);
      } finally {
        setChecking(false);
      }
    };

    run();
  }, [date, startTime, endTime, roomId]);

  // ----------------------
  // OPTIONS
  // ----------------------

  const startOptions = useMemo(
    () => (date ? generateStartTimes(date) : []),
    [date],
  );

  const endOptions = useMemo(
    () => (date && startTime ? generateEndTimes(date, startTime) : []),
    [date, startTime],
  );

  const duration =
    date && startTime && endTime
      ? calculateDurationHours(
          toDateTime(date, startTime).toISOString(),
          toDateTime(date, endTime).toISOString(),
        )
      : 0;

  // ----------------------
  // SUBMIT
  // ----------------------

  const onSubmit = async (data: FormValues) => {
    setSubmitError("");
    setSubmitSuccess(false);

    if (!availability?.available) {
      setSubmitError("Ten termin jest niedostępny");
      return;
    }

    try {
      setSubmitting(true);

      const payload: ReservationRequest = {
        roomId,
        startTime: formatDateTimeForAPI(toDateTime(data.date, data.startTime)),
        endTime: formatDateTimeForAPI(toDateTime(data.date, data.endTime)),
        purpose: data.purpose || undefined,
      };

      await api.post("/reservations", payload);

      setSubmitSuccess(true);
      setTimeout(() => router.push("/reservations"), 1200);
    } catch (e) {
      setSubmitError(e instanceof APIError ? e.message : "Błąd");
    } finally {
      setSubmitting(false);
    }
  };

  // ----------------------
  // LOADING
  // ----------------------

  if (loadingRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Ładowanie...
      </div>
    );
  }

  if (roomError || !room) {
    return (
      <div className="space-y-4">
        <Link href="/rooms">← Wróć</Link>
        <p className="text-red-500">{roomError || "Brak sali"}</p>
      </div>
    );
  }

  // ----------------------
  // UI
  // ----------------------

  return (
    <div className="space-y-8">
      <Link href="/rooms" className="text-sm text-gray-500 hover:text-black">
        ← Powrót do sal
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ROOM INFO */}
        <div className="lg:col-span-2">
          <LightCard className="space-y-5">
            <div>
              <h1 className="text-3xl font-bold">{room.name}</h1>
              <p className="text-gray-500">{room.buildingName}</p>
            </div>

            <div className="flex gap-8">
              <div>
                <p className="text-xs text-gray-400">Pojemność</p>
                <p className="text-xl font-semibold">{room.capacity}</p>
              </div>

              <div>
                <p className="text-xs text-gray-400">Typ</p>
                <p className="text-xl font-semibold">
                  {ROOM_TYPES[room.roomType as keyof typeof ROOM_TYPES] ??
                    room.roomType}
                </p>
              </div>
            </div>

            {room.description && (
              <p className="text-gray-600 leading-relaxed">
                {room.description}
              </p>
            )}
          </LightCard>
        </div>

        {/* BOOKING */}
        <div className="lg:col-span-1">
          <LightCard className="space-y-5">
            <h2 className="text-xl font-bold">Rezerwacja</h2>

            {date && startTime && endTime && (
              <div className="rounded-lg border p-3 text-sm">
                {checking ? (
                  <span className="text-gray-500">Sprawdzanie...</span>
                ) : availability?.available ? (
                  <span className="text-green-600 font-medium">✓ Dostępna</span>
                ) : (
                  <span className="text-red-500 font-medium">✗ Zajęta</span>
                )}
              </div>
            )}

            {submitSuccess && (
              <div className="text-green-600 text-sm font-medium">
                ✓ Rezerwacja utworzona
              </div>
            )}

            {submitError && (
              <div className="text-red-500 text-sm">{submitError}</div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <Input
                type="date"
                {...register("date")}
                min={format(new Date(), "yyyy-MM-dd")}
                className="w-full rounded-md border p-2"
                onChange={(e) => {
                  register("date").onChange(e);
                  setValue("startTime", "");
                  setValue("endTime", "");
                  setAvailability(null);
                }}
              />

              {date && (
                <select
                  {...register("startTime")}
                  className="w-full rounded-md border p-2"
                  onChange={(e) => {
                    register("startTime").onChange(e);
                    setValue("endTime", "");
                  }}
                >
                  <option value="">Wybierz start</option>
                  {startOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              )}

              {startTime && (
                <select
                  {...register("endTime")}
                  className="w-full rounded-md border p-2"
                >
                  <option value="">Wybierz koniec</option>
                  {endOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              )}

              {duration > 0 && (
                <p className="text-xs text-gray-500">
                  ⏱ {duration.toFixed(1)}h
                </p>
              )}

              <textarea
                {...register("purpose")}
                className="w-full rounded-md border p-2"
                placeholder="Cel rezerwacji (opcjonalnie)"
              />

              <Button
                type="submit"
                disabled={
                  submitting ||
                  !availability?.available ||
                  !date ||
                  !startTime ||
                  !endTime
                }
              >
                {submitting ? "Rezerwuję..." : "Zarezerwuj"}
              </Button>
            </form>
          </LightCard>
        </div>
      </div>
    </div>
  );
}
