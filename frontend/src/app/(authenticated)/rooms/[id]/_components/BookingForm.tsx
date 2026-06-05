import { LightCard } from "@/src/design-system/cards/LightCard";
import { Button } from "@/src/design-system/atoms/Button";
import { Input } from "@/src/design-system/forms/Input";
import { Select } from "@/src/design-system/forms/Select";
import { Textarea } from "@/src/design-system/forms/Textarea";
import { Fieldset, Field, Label } from "@/src/design-system/forms/Fieldset";
import { ClockIcon } from "@heroicons/react/24/outline";
import { P3 } from "@/src/design-system/typography/Paragraph";
import { cn } from "@/src/design-system/utils";
import { generateStartTimes, generateEndTimes } from "../_utils/time";
import { getDurationParts } from "../_utils/duration";
import { FormValues } from "../_hooks/useRoomForm";
import { UseFormReturn } from "react-hook-form";
import { AvailabilityResponse } from "@/src/app/lib/types";

type Props = {
  form: UseFormReturn<FormValues>;
  onSubmit: (data: FormValues) => Promise<void> | void;

  date?: string;
  startTime?: string;
  endTime?: string;

  availability: AvailabilityResponse | null;
  checking: boolean;

  submitting: boolean;
  submitError: string;
  success: boolean;
};

export function BookingForm({
  form,
  onSubmit,
  date,
  startTime,
  endTime,
  availability,
  checking,
  submitting,
  submitError,
  success,
}: Props) {
  const startOptions = date ? generateStartTimes(date) : [];
  const endOptions = date && startTime ? generateEndTimes(date, startTime) : [];

  const duration = getDurationParts(date, startTime, endTime);
  const noSlotsToday = date && startOptions.length === 0;

  const { register, handleSubmit, watch } = form;

  const today = new Date().toLocaleDateString("en-CA");

  const dateVal = watch("date");
  const startVal = watch("startTime");
  const endVal = watch("endTime");

  const isPastDate = !!dateVal && dateVal < today;
  const isFormComplete = !!dateVal && !!startVal && !!endVal;
  const isSubmitDisabled = submitting || !isFormComplete || isPastDate;

  return (
    <LightCard className="space-y-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Fieldset>
          <Field>
            <Label>Data rezerwacji</Label>
            <Input type="date" min={today} {...register("date")} />
            {isPastDate && (
              <P3 className="text-error mt-2">
                Data nie może być z przeszłości
              </P3>
            )}
          </Field>

          {date && !isPastDate && (
            <>
              {noSlotsToday ? (
                <P3 className="text-error">
                  Brak możliwości rezerwacji na wybrany dzień
                </P3>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Field>
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

                  <Field>
                    <Label>Godzina końca</Label>
                    <Select {...register("endTime")} disabled={!startTime}>
                      <option value="">
                        {startTime ? "Wybierz" : "Najpierw start"}
                      </option>
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

          {duration && (
            <P3 className="flex gap-2 text-contentTertiary">
              <ClockIcon className="h-4 w-4" />
              Czas: {duration.hours > 0 && `${duration.hours}h `}
              {duration.mins > 0 && `${duration.mins}min`}
            </P3>
          )}

          <Field>
            <Label>Cel rezerwacji</Label>
            <Textarea
              {...register("purpose")}
              placeholder="Cel rezerwacji..."
            />
          </Field>
        </Fieldset>

        <Button type="submit" className="w-full" disabled={isSubmitDisabled}>
          Zarezerwuj
        </Button>

        {submitError && <P3 className="text-error">{submitError}</P3>}
        {success && <P3 className="text-success">✓ Utworzono rezerwację</P3>}
      </form>
    </LightCard>
  );
}
