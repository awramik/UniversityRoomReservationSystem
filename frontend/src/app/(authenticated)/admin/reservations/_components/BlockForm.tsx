"use client";

import { useMemo, useState } from "react";
import { RoomResponse, AdminBlockRequest } from "@/src/app/lib/types";
import {
  formatDateTimeForAPI,
  parseDateTimeFromInput,
} from "@/src/app/lib/date-utils";
import { Button } from "@/src/design-system/atoms/Button";
import { LightCard } from "@/src/design-system/cards/LightCard";
import { H2 } from "@/src/design-system/typography/Heading";
import { Input } from "@/src/design-system/forms/Input";
import { Select } from "@/src/design-system/forms/Select";
import { Field, Label, ErrorMessage } from "@/src/design-system/forms/Fieldset";

type Props = {
  rooms: RoomResponse[];
  onSubmit: (data: AdminBlockRequest) => void;
  onCancel: () => void;
};

function getTimeValue(dateStr: string): number {
  return new Date(dateStr).getTime();
}

export function BlockForm({ rooms, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState({
    roomId: "",
    startTime: "",
    endTime: "",
    purpose: "",
  });

  const [loading, setLoading] = useState(false);

  const validationError = useMemo(() => {
    if (!form.roomId || !form.startTime || !form.endTime) {
      return "Uzupełnij wszystkie wymagane pola";
    }

    const start = getTimeValue(form.startTime);
    const end = getTimeValue(form.endTime);

    if (end <= start) {
      return "Czas zakończenia musi być późniejszy niż start";
    }

    const diffMinutes = (end - start) / (1000 * 60);

    if (diffMinutes < 30) {
      return "Blok musi trwać minimum 30 minut";
    }

    return null;
  }, [form]);

  const isValid = !validationError;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);

    await onSubmit({
      roomId: form.roomId,
      startTime: formatDateTimeForAPI(parseDateTimeFromInput(form.startTime)),
      endTime: formatDateTimeForAPI(parseDateTimeFromInput(form.endTime)),
      purpose: form.purpose || undefined,
    });

    setLoading(false);
  };

  return (
    <LightCard>
      <H2 className="mb-4">Nowy blok</H2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <Field>
            <Label>Sala *</Label>
            <Select name="roomId" value={form.roomId} onChange={handleChange}>
              <option value="">Wybierz salę</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.buildingName})
                </option>
              ))}
            </Select>
          </Field>

          <Field>
            <Label>Od *</Label>
            <Input
              type="datetime-local"
              name="startTime"
              value={form.startTime}
              onChange={handleChange}
            />
          </Field>

          <Field>
            <Label>Do *</Label>
            <Input
              type="datetime-local"
              name="endTime"
              value={form.endTime}
              onChange={handleChange}
            />
          </Field>

          <Field>
            <Label>Powód</Label>
            <Input
              name="purpose"
              value={form.purpose}
              onChange={handleChange}
            />
          </Field>
        </div>

        {validationError && (
          <Field>
            <ErrorMessage>{validationError}</ErrorMessage>
          </Field>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" outline onClick={onCancel}>
            Anuluj
          </Button>

          <Button type="submit" disabled={!isValid || loading}>
            {loading ? "Tworzenie..." : "Utwórz blok"}
          </Button>
        </div>
      </form>
    </LightCard>
  );
}
