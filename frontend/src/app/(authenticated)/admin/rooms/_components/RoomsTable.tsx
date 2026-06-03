import { Table } from "@/src/design-system/cards/Table";
import { ROOM_TYPES } from "@/src/app/lib/types";
import { RoomResponse } from "@/src/app/lib/types";
import { Button } from "@/src/design-system/atoms/Button";
import { Badge, type BadgeColor } from "@/src/design-system/atoms/Badge";

type Props = {
  rooms: RoomResponse[];
  isLoading: boolean;
  onEdit: (room: RoomResponse) => void;
  onDelete: (id: string) => void;
};

function toRoomType(value: string | undefined) {
  return value && value in ROOM_TYPES ? value : undefined;
}

export const roomTypeColors: Record<string, BadgeColor> = {
  LECTURE: "indigo",
  LABORATORY: "pink",
  COMPUTER: "teal",
  CONFERENCE: "amber",
  OTHER: "zinc",
};

export function RoomsTable({ rooms, onEdit, onDelete }: Props) {
  return (
    <Table>
      <Table.Head>
        <tr>
          <Table.HeadCell>Nazwa</Table.HeadCell>
          <Table.HeadCell>Budynek</Table.HeadCell>
          <Table.HeadCell>Pojemność</Table.HeadCell>
          <Table.HeadCell>Typ</Table.HeadCell>
          <Table.HeadCell align="right">Akcje</Table.HeadCell>
        </tr>
      </Table.Head>

      <Table.Body>
        {rooms.map((room, index) => {
          const badgeColor =
            room.roomType && roomTypeColors[room.roomType]
              ? roomTypeColors[room.roomType]
              : "gray";
          return (
            <Table.Row key={room.id ?? index} href={`/rooms/${room.id}`}>
              <Table.Cell className="font-medium text-contentPrimary">
                {room.name}
              </Table.Cell>

              <Table.Cell className="text-contentSecondary">
                {room.buildingName}
              </Table.Cell>

              <Table.Cell className="text-contentSecondary">
                {room.capacity}
              </Table.Cell>

              <Table.Cell className="text-contentSecondary">
                {room.roomType && toRoomType(room.roomType) ? (
                  <Badge color={badgeColor}>{ROOM_TYPES[room.roomType]}</Badge>
                ) : (
                  "—"
                )}
              </Table.Cell>

              <Table.Cell align="right">
                <div className="flex justify-end gap-3">
                  <Button size="sm" outline onClick={() => onEdit(room)}>
                    Edytuj
                  </Button>

                  <Button
                    size="sm"
                    destructive
                    onClick={() => room.id && onDelete(room.id)}
                  >
                    Usuń
                  </Button>
                </div>
              </Table.Cell>
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table>
  );
}
