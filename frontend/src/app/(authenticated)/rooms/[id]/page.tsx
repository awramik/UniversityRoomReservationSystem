"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/src/app/auth/auth-context";
import { canBookRoomType } from "@/src/app/lib/booking-limits";
import { WeeklyLimitNotice } from "../../_components/WeeklyLimitNotice";
import { useBookingLimits } from "../../_hooks/useBookingLimits";
import { Breadcrumb } from "../../../../design-system/navigation/Breadcrumb";
import { useRoom } from "./_hooks/useRoom";
import { useAvailability } from "./_hooks/useAvailability";
import { useRoomForm } from "./_hooks/useRoomForm";
import { BookingForm } from "./_components/BookingForm";
import { RoomInfo } from "./_components/RoomInfo";
import { api } from "@/src/app/lib/api-client";
import { APIError, ReservationRequest } from "@/src/app/lib/types";
import { toApiDateTime } from "./_utils/time";
import { Header } from "../../_components/Header";
import { P2 } from "@/src/design-system/typography/Paragraph";

import { FormValues } from "./_hooks/useRoomForm";

export default function RoomDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  const { user } = useAuth();

  const { room, loading, error } = useRoom(roomId);

  const form = useRoomForm();
  const { watch } = form;

  const date = watch("date");
  const startTime = watch("startTime");
  const endTime = watch("endTime");

  const { limits, weeklyLimitReached } = useBookingLimits(date);

  const { availability, checking } = useAvailability(
    roomId,
    date,
    startTime,
    endTime,
  );

  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
        startTime: toApiDateTime(data.date, data.startTime),
        endTime: toApiDateTime(data.date, data.endTime),
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

  if (loading) return <div className="p-10 text-center">Ładowanie...</div>;
  if (!room || error) return <div className="p-10 text-error">{error}</div>;

  if (user?.role && !canBookRoomType(user.role, room.roomType)) {
    return (
      <div className="flex flex-col gap-6">
        <Header title="Rezerwacja sali" />
        <Breadcrumb href="/rooms">Wróć do listy sal</Breadcrumb>
        <div className="rounded-xl border border-error bg-errorSoft px-4 py-6 text-error">
          <P2 className="text-error">
            Nie masz dostępu do tej sali. Studenci nie mogą rezerwować sal
            wykładowych i laboratoryjnych.
          </P2>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Header title="Rezerwacja sali" />
      <Breadcrumb href="/rooms">Wróć do listy sal</Breadcrumb>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <RoomInfo room={room} />

        {weeklyLimitReached && limits ? (
          <WeeklyLimitNotice maxPerWeek={limits.maxPerWeek} />
        ) : (
          <BookingForm
            form={form}
            onSubmit={onSubmit}
            date={date}
            startTime={startTime}
            endTime={endTime}
            availability={availability}
            checking={checking}
            submitting={submitting}
            submitError={submitError}
            success={success}
            maxDurationHours={limits?.maxDurationHours}
          />
        )}
      </div>
    </div>
  );
}
