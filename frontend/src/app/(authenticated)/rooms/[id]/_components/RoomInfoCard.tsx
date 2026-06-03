import { LightCard } from "@/src/design-system/cards";
import { RoomResponse, ROOM_TYPES } from "@/src/app/lib/types";

export function RoomInfoCard({ room }: { room: RoomResponse }) {
  return (
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
        <p className="text-gray-600 leading-relaxed">{room.description}</p>
      )}
    </LightCard>
  );
}
