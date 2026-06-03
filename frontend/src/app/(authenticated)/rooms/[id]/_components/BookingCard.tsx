"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { format } from "date-fns";

import { LightCard } from "@/src/design-system/cards/LightCard";
import { Button } from "@/src/design-system/atoms/Button";
import { Input } from "@/src/design-system/forms/Input";

import {
  ReservationRequest,
  AvailabilityResponse,
  APIError,
} from "@/src/app/lib/types";

import {
  calculateDurationHours,
  formatDateTimeForAPI,
} from "@/src/app/lib/date-utils";

import { toDateTime } from "../_utils/date";
import { generateEndTimes, generateStartTimes } from "../_utils/timeSlots";
import { api } from "@/src/app/lib/api-client";

type FormValues = Omit<ReservationRequest, "roomId"> & {
  date: string;
};

export function BookingCard({
  roomId,
  date,
  startTime,
  endTime,
  availability,
  checking,
  setAvailability,
}: {
  roomId: string;
  date: string;
  startTime: string;
  endTime: string;
  availability: AvailabilityResponse | null;
  checking: boolean;
  setAvailability: (v: AvailabilityResponse | null) => void;
}) {
  const router = useRouter();

  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, setValue } = useForm<FormValues>({
    defaultValues: {
      date: "",
      startTime: "",
      endTime: "",
      purpose: "",
    },
  });

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

  useEffect(() => {
    setValue("endTime", "");
  }, [startTime, setValue]);

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

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    register("date").onChange(e);
    setValue("startTime", "");
    setValue("endTime", "");
    setAvailability(null);
  };

  const handleStartChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    register("startTime").onChange(e);
    setValue("endTime", "");
  };

  return (
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

      {submitError && <div className="text-red-500 text-sm">{submitError}</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <Input
          type="date"
          {...register("date")}
          min={format(new Date(), "yyyy-MM-dd")}
          className="w-full rounded-md border p-2"
          onChange={handleDateChange}
        />

        {date && (
          <select
            {...register("startTime")}
            className="w-full rounded-md border p-2"
            onChange={handleStartChange}
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
          <p className="text-xs text-gray-500">⏱ {duration.toFixed(1)}h</p>
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
  );
}
