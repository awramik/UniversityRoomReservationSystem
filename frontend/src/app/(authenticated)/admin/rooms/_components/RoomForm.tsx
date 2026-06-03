import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { RoomRequest, RoomResponse, ROOM_TYPES } from "@/src/app/lib/types";
import { Button } from "@/src/design-system/atoms/Button";
import { Input } from "@/src/design-system/forms/Input";
import { Textarea } from "@/src/design-system/forms/Textarea";
import { Select } from "@/src/design-system/forms/Select";
import { Field, Label, ErrorMessage } from "@/src/design-system/forms/Fieldset";
import { H2 } from "@/src/design-system/typography/Heading";

type Props = {
  editingRoom: RoomResponse | null;
  onSubmit: (data: RoomRequest, id?: string) => Promise<void>;
  onCancel: () => void;
};

type FormValues = RoomRequest;

export function RoomForm({ editingRoom, onSubmit, onCancel }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, isValid, errors },
  } = useForm<FormValues>({
    mode: "onChange",
    defaultValues: {
      name: "",
      buildingName: "",
      capacity: 1,
      roomType: "LECTURE",
      description: "",
    },
  });

  useEffect(() => {
    if (editingRoom) {
      reset({
        name: editingRoom.name ?? "",
        buildingName: editingRoom.buildingName ?? "",
        capacity: editingRoom.capacity ?? 1,
        roomType: editingRoom.roomType ?? "LECTURE",
        description: editingRoom.description ?? "",
      });
    } else {
      reset({
        name: "",
        buildingName: "",
        capacity: 1,
        roomType: "LECTURE",
        description: "",
      });
    }
  }, [editingRoom, reset]);

  const submit = async (data: FormValues) => {
    await onSubmit(data, editingRoom?.id);
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <H2>{editingRoom ? "Edytuj salę" : "Nowa sala"}</H2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field>
          <Label>Nazwa sali</Label>
          <Input
            {...register("name", { required: true })}
            placeholder="np. Sala 101"
          />
        </Field>

        <Field>
          <Label>Budynek</Label>
          <Input
            {...register("buildingName", { required: true })}
            placeholder="np. A"
          />
        </Field>

        <Field>
          <Label>Pojemność</Label>
          <Input
            type="number"
            step={1}
            min={1}
            {...register("capacity", {
              required: true,
              valueAsNumber: true,
              min: {
                value: 1,
                message: "Pojemność musi być większa od 0",
              },
              validate: {
                integer: (v) =>
                  Number.isInteger(v) || "Pojemność musi być liczbą całkowitą",
              },
            })}
          />
          <ErrorMessage>{errors.capacity?.message}</ErrorMessage>
        </Field>

        <Field>
          <Label>Typ sali</Label>
          <Select {...register("roomType", { required: true })}>
            {Object.keys(ROOM_TYPES).map((key) => (
              <option key={key} value={key}>
                {ROOM_TYPES[key as keyof typeof ROOM_TYPES]}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field>
        <Label>Opis</Label>
        <Textarea rows={3} {...register("description")} />
      </Field>

      <div className="flex justify-end gap-2">
        <Button type="button" outline onClick={onCancel}>
          Anuluj
        </Button>

        <Button type="submit" disabled={isSubmitting || !isValid}>
          {isSubmitting ? "Zapisywanie..." : "Zapisz"}
        </Button>
      </div>
    </form>
  );
}
