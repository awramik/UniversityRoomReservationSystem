import { LightCard } from "@/src/design-system/cards/LightCard";
import { P2 } from "@/src/design-system/typography/Paragraph";

type Props = { maxPerWeek: number };

export function WeeklyLimitNotice({ maxPerWeek }: Props) {
  return (
    <LightCard className="border-error bg-errorSoft">
      <P2 className="text-error">
        Osiągnięto tygodniowy limit rezerwacji ({maxPerWeek}). Nie możesz
        utworzyć kolejnej rezerwacji w tym tygodniu.
      </P2>
    </LightCard>
  );
}
