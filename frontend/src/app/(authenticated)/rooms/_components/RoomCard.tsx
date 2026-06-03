import { LightCard } from "@/src/design-system/cards/LightCard";
import { Link } from "@/src/design-system/atoms/Link";
import { RoomResponse, ROOM_TYPES } from "@/src/app/lib/types";
import { H3 } from "@/src/design-system/typography/Heading";
import { P2, P3 } from "@/src/design-system/typography/Paragraph";
import { Badge, type BadgeColor } from "@/src/design-system/atoms/Badge";
import { ArrowLongRightIcon } from "@heroicons/react/24/outline";

type RoomCardProps = {
  room: RoomResponse;
};

export const roomTypeColors: Record<string, BadgeColor> = {
  LECTURE: "indigo",
  LABORATORY: "pink",
  COMPUTER: "teal",
  CONFERENCE: "amber",
  OTHER: "zinc",
};

export function RoomCard({ room }: RoomCardProps) {
  const badgeColor =
    room.roomType && roomTypeColors[room.roomType]
      ? roomTypeColors[room.roomType]
      : "gray";

  return (
    <Link href={`/rooms/${room.id}`}>
      <LightCard
        className="
          group p-5 border border-borderPrimary rounded-xl
          transition-transform duration-200
          hover:scale-[1.02] hover:shadow-md
        "
      >
        {/* HEADER */}
        <div className="flex items-start justify-between gap-4">
          <H3 className="font-semibold text-contentPrimary">{room.name}</H3>

          {room.roomType && (
            <Badge color={badgeColor}>{ROOM_TYPES[room.roomType]}</Badge>
          )}
        </div>

        {/* META */}
        <div className="mt-3 space-y-1">
          <P2 className="text-contentSecondary">{room.buildingName}</P2>

          <P3 className="text-contentSecondary">{room.capacity} miejsc</P3>
        </div>

        {/* DESCRIPTION */}
        {room.description && (
          <p className="mt-4 text-sm text-contentSecondary line-clamp-3">
            {room.description}
          </p>
        )}

        <div className="mt-4 flex justify-end">
          <P3 className="flex text-contentTertiary gap-2">
            Rezerwuj sale <ArrowLongRightIcon className="h-4 w-4" />
          </P3>
        </div>
      </LightCard>
    </Link>
  );
}
