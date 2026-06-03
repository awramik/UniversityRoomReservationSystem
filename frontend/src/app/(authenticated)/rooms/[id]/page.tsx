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
import { LightCard } from "@/src/design-system/cards/LightCard";
import { Button } from "@/src/design-system/atoms/Button";
import { Input } from "@/src/design-system/forms/Input";
import { Select } from "@/src/design-system/forms/Select";
import { Textarea } from "@/src/design-system/forms/Textarea";
import { cn } from "@/src/design-system/utils";
import { Header } from "../../_components/Header";
import { H1, H3, H2 } from "@/src/design-system/typography/Heading";
import { P1, P3 } from "@/src/design-system/typography/Paragraph";
import { ClockIcon } from "@heroicons/react/24/outline";
import { Breadcrumb } from "../../_components/Breadcrumb";
import { Fieldset, Field, Label } from "@/src/design-system/forms/Fieldset";

type FormValues = {
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
};

const WORK_START = 6;
const WORK_END = 22;
const SLOT_STEP = 15;
const MIN_DURATION = 30;

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

function generateStartTimes(date: string) {
  const parsed = parseISO(date);

  const startBase = set(parsed, { hours: WORK_START, minutes: 0 });
  const lastStart = set(parsed, { hours: 21, minutes: 30 });

  let cursor = startBase;

  if (isToday(parsed)) {
    const now = new Date();
    const rounded = roundUpToStep(now, SLOT_STEP);
    cursor = isBefore(rounded, startBase) ? startBase : rounded;
  }

  const result: string[] = [];

  while (cursor <= lastStart) {
    result.push(formatTime(cursor));
    cursor = addMinutes(cursor, SLOT_STEP);
  }

  return result;
}

function generateEndTimes(date: string, startTime: string) {
  const start = toDateTime(date, startTime);
  const limit = set(parseISO(date), { hours: WORK_END, minutes: 0 });

  const result: string[] = [];
  let cursor = addMinutes(start, MIN_DURATION);

  while (cursor <= limit) {
    result.push(formatTime(cursor));
    cursor = addMinutes(cursor, SLOT_STEP);
  }

  return result;
}

export default function RoomDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;

  const [room, setRoom] = useState<RoomResponse | null>(null);
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(
    null,
  );

  const [loadingRoom, setLoadingRoom] = useState(true);
  const [checking, setChecking] = useState(false);

  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, watch, setValue } = useForm<FormValues>();

  const date = watch("date");
  const startTime = watch("startTime");
  const endTime = watch("endTime");

  /* reset end when start changes */
  useEffect(() => {
    setValue("endTime", "");
  }, [startTime, setValue]);

  useEffect(() => {
    (async () => {
      try {
        setLoadingRoom(true);
        const data = await api.get<RoomResponse>(`/rooms/${roomId}`);
        setRoom(data);
      } catch (e) {
        setError(e instanceof APIError ? e.message : "Błąd");
      } finally {
        setLoadingRoom(false);
      }
    })();
  }, [roomId]);

  useEffect(() => {
    (async () => {
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
    })();
  }, [date, startTime, endTime, roomId]);

  const startOptions = useMemo(
    () => (date ? generateStartTimes(date) : []),
    [date],
  );

  const endOptions = useMemo(
    () => (date && startTime ? generateEndTimes(date, startTime) : []),
    [date, startTime],
  );

  const noSlotsToday =
    date && isToday(parseISO(date)) && startOptions.length === 0;

  const duration =
    date && startTime && endTime
      ? (
          (toDateTime(date, endTime).getTime() -
            toDateTime(date, startTime).getTime()) /
          3600000
        ).toFixed(1)
      : null;

  const onSubmit = async (data: FormValues) => {
    setSubmitError("");
    setSuccess(false);

    if (!availability?.available) {
      setSubmitError("Termin zajęty");
      return;
    }

    try {
      setSubmitting(true);

      await api.post("/reservations", {
        roomId,
        startTime: toDateTime(data.date, data.startTime).toISOString(),
        endTime: toDateTime(data.date, data.endTime).toISOString(),
        purpose: data.purpose || undefined,
      } satisfies ReservationRequest);

      setSuccess(true);
      setTimeout(() => router.push("/reservations"), 1000);
    } catch (e) {
      setSubmitError(e instanceof APIError ? e.message : "Błąd");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingRoom) {
    return <div className="p-10 text-center">Ładowanie...</div>;
  }

  if (!room || error) {
    return <div className="p-10 text-error">{error || "Brak sali"}</div>;
  }

  const durationMinutes =
    date && startTime && endTime
      ? Math.round(
          (toDateTime(date, endTime).getTime() -
            toDateTime(date, startTime).getTime()) /
            60000,
        )
      : null;

  const durationHours = durationMinutes ? Math.floor(durationMinutes / 60) : 0;

  const durationMins = durationMinutes ? durationMinutes % 60 : 0;

  return (
    <div className="flex flex-col gap-6">
      <Header title="Rezerwacja sali" />
      <Breadcrumb href="/rooms" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ROOM */}
        <LightCard className="lg:col-span-2 space-y-6">
          <header className="space-y-3">
            <H1 className="font-bold border-b border-borderPrimary pb-2">
              Sala {room.name}
            </H1>
            <H3 className="text-contentSecondary">
              Budynek: {room.buildingName}
            </H3>
          </header>

          <div className="flex gap-8 text-sm">
            <div>
              <P3 className="text-contentTertiary">Pojemność</P3>
              <P1 className="font-semibold">{room.capacity}</P1>
            </div>

            {room.roomType && (
              <div>
                <P3 className="text-contentTertiary">Typ</P3>
                <P1 className="font-semibold">{ROOM_TYPES[room.roomType]}</P1>
              </div>
            )}
          </div>

          {room.description && (
            <div>
              <P3 className="text-contentTertiary">Opis</P3>
              <P1>{room.description}</P1>
            </div>
          )}
        </LightCard>

        {/* BOOKING */}
        <LightCard className="space-y-4">
          <H2 className="font-bold">Rezerwacja</H2>

          {success && <P3 className="text-success">✓ Utworzono rezerwację</P3>}
          {submitError && <P3 className="text-error">{submitError}</P3>}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Fieldset>
              <Field>
                <Label>Data rezerwacji</Label>
                <Input type="date" {...register("date")} />
              </Field>

              {/* TIME ROW */}
              {date && (
                <>
                  {noSlotsToday ? (
                    <P3 className="text-error">
                      Brak możliwości rezerwacji na wybrany dzień
                    </P3>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <Field className="space-y-1">
                        <Label>Godzina startu</Label>
                        <Select {...register("startTime")}>
                          <option value="">Wybierz</option>
                          {startOptions.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </Select>
                      </Field>

                      <Field className="space-y-1">
                        <Label>Godzina końca</Label>
                        <Select {...register("endTime")} disabled={!startTime}>
                          <option value="">{"Wybierz"}</option>
                          {endOptions.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </Select>
                      </Field>
                    </div>
                  )}
                </>
              )}

              {availability && (
                <div
                  className={cn(
                    "text-base px-2 rounded-lg",
                    availability.available ? "text-success" : "text-error",
                  )}
                >
                  {checking
                    ? "Sprawdzanie..."
                    : availability.available
                      ? "Dostępna"
                      : "Zajęta"}
                </div>
              )}

              {durationMinutes !== null && (
                <P3 className="flex gap-2 text-contentTertiary">
                  <ClockIcon className="h-4 w-4" />
                  Czas rezerwacji: {durationHours > 0 && `${durationHours}h `}
                  {durationMins > 0 ? `${durationMins}min` : ""}
                </P3>
              )}

              <Field>
                <Label>Cel rezerwacji</Label>
                <Textarea
                  {...register("purpose")}
                  placeholder="Cel rezerwacji"
                />
              </Field>
            </Fieldset>

            <Button
              type="submit"
              disabled={
                submitting ||
                !availability?.available ||
                !date ||
                !startTime ||
                !endTime
              }
              className="w-full"
            >
              {submitting ? "Rezerwuję..." : "Zarezerwuj"}
            </Button>
          </form>
        </LightCard>
      </div>
    </div>
  );
}
