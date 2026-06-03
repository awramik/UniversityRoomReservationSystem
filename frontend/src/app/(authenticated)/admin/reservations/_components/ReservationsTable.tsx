"use client";

import { ReservationResponse, RESERVATION_STATUS } from "@/src/app/lib/types";
import { formatDateTimeDisplay } from "@/src/app/lib/date-utils";
import { Button } from "@/src/design-system/atoms/Button";
import { Table } from "@/src/design-system/cards/Table";
import { Badge, type BadgeColor } from "@/src/design-system/atoms/Badge";

type Props = {
  reservations: ReservationResponse[];
  onDelete: (id: string) => void;
  deletingId: string | null;
  statusColors: Record<string, string>;
};

function toStatus(
  status: ReservationResponse["status"],
): status is keyof typeof RESERVATION_STATUS {
  if (!status) return false;
  return (["ACTIVE", "PAST", "CANCELLED"] as const).includes(status);
}

export function ReservationsTable({
  reservations,
  onDelete,
  deletingId,
  statusColors,
}: Props) {
  return (
    <Table>
      <Table.Head>
        <tr>
          <Table.HeadCell>Sala</Table.HeadCell>
          <Table.HeadCell>Rezerwujący</Table.HeadCell>
          <Table.HeadCell>Od</Table.HeadCell>
          <Table.HeadCell>Do</Table.HeadCell>
          <Table.HeadCell>Status</Table.HeadCell>
          <Table.HeadCell align="center">Akcje</Table.HeadCell>
        </tr>
      </Table.Head>

      <Table.Body>
        {reservations.map((r, index) => {
          const status = toStatus(r.status) ? r.status : null;

          return (
            <Table.Row key={r.id ?? index}>
              <Table.Cell className="font-medium text-contentPrimary">
                {r.roomName}
              </Table.Cell>

              <Table.Cell className="text-contentSecondary">
                {r.bookerName || "—"}
              </Table.Cell>

              <Table.Cell className="text-contentSecondary text-sm">
                {r.startTime ? formatDateTimeDisplay(r.startTime) : "—"}
              </Table.Cell>

              <Table.Cell className="text-contentSecondary text-sm">
                {r.endTime ? formatDateTimeDisplay(r.endTime) : "—"}
              </Table.Cell>

              <Table.Cell>
                {status && (
                  <Badge color={statusColors[status] as BadgeColor}>
                    {RESERVATION_STATUS[status]}
                  </Badge>
                )}
              </Table.Cell>

              <Table.Cell align="center">
                {status === "ACTIVE" && r.id ? (
                  <Button
                    destructive
                    size="sm"
                    onClick={() => onDelete(r.id!)}
                    disabled={deletingId === r.id}
                  >
                    {deletingId === r.id ? "Usuwanie..." : "Usuń"}
                  </Button>
                ) : (
                  "—"
                )}
              </Table.Cell>
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table>
  );
}
