import { LightCard } from "@/src/design-system/cards/LightCard";
import { H1, H3 } from "@/src/design-system/typography/Heading";
import { P1, P3 } from "@/src/design-system/typography/Paragraph";
import { ROOM_TYPES, RoomResponse } from "@/src/app/lib/types";

export function RoomInfo({ room }: { room: RoomResponse }) {
  return (
    <LightCard className="lg:col-span-2 space-y-6">
      <header className="space-y-3">
        <H1 className="font-bold border-b border-borderPrimary pb-2">
          Sala {room.name}
        </H1>
        <H3 className="text-contentSecondary">Budynek: {room.buildingName}</H3>
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
  );
}
