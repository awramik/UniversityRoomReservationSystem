import { ChangeEvent } from "react";
import { ROOM_TYPES, RoomType } from "@/src/app/lib/types";
import { LightCard } from "@/src/design-system/cards/LightCard";
import { Fieldset, Field, Label } from "@/src/design-system/forms/Fieldset";
import { Input } from "@/src/design-system/forms/Input";
import { Select } from "@/src/design-system/forms/Select";
import { Button } from "@/src/design-system/atoms/Button";
import { H3 } from "@/src/design-system/typography/Heading";

type FilterBarProps = {
  selectedType: RoomType | "";
  selectedBuilding: string;
  minCapacity: string;
  uniqueBuildings: string[];

  onTypeChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  onBuildingChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  onCapacityChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
};

export function FilterBar({
  selectedType,
  selectedBuilding,
  minCapacity,
  uniqueBuildings,
  onTypeChange,
  onBuildingChange,
  onCapacityChange,
  onReset,
}: FilterBarProps) {
  return (
    <LightCard className="space-y-3">
      <H3>Filtry</H3>
      <Fieldset className="flex flex-col lg:flex-row gap-4 lg:items-end">
        <Field className="flex-1">
          <Label className="text-contentTertiary">Typ sali</Label>
          <Select value={selectedType} onChange={onTypeChange}>
            <option value="">Dowolna</option>
            {Object.entries(ROOM_TYPES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>

        <Field className="flex-1">
          <Label className="text-contentTertiary">Budynek</Label>
          <Select value={selectedBuilding} onChange={onBuildingChange}>
            <option value="">Dowolny</option>
            {uniqueBuildings.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </Select>
        </Field>

        <Field className="flex-1">
          <Label className="text-contentTertiary">Min. pojemność</Label>
          <Input
            type="number"
            min={1}
            value={minCapacity}
            onChange={onCapacityChange}
            placeholder="25"
          />
        </Field>

        <Button outline size="sm" onClick={onReset} className="mb-1.5">
          Wyczyść filtry
        </Button>
      </Fieldset>
    </LightCard>
  );
}
