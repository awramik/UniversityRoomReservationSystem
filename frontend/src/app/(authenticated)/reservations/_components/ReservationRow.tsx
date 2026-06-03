"use client";

import { ReservationResponse } from "@/src/app/lib/types";
import { formatDateTimeDisplay } from "@/src/app/lib/date-utils";
import { Table } from "@/src/design-system/cards/Table";
import { P1, P2 } from "@/src/design-system/typography/Paragraph";
import { Badge, type BadgeColor } from "@/src/design-system/atoms/Badge";
import { Button } from "@/src/design-system/atoms/Button";
import { toReservationStatus } from "../_utils/status";
import { STATUS_COLORS } from "../_utils/constants";
import { RESERVATION_STATUS } from "@/src/app/lib/types";

type Props = {
  reservation: ReservationResponse;
  deleting: boolean;
  onCancel: (id: string) => void;
};

export function ReservationRow({ reservation, deleting, onCancel }: Props) {
  const status = toReservationStatus(reservation.status);

  return (
    <Table.Row href={`/reservations/${reservation.id}`}>
      <Table.Cell>
        <P1 className="font-medium text-contentPrimary">
          {reservation.roomName}
        </P1>
      </Table.Cell>

      <Table.Cell>
        <P2 className="text-contentSecondary">
          {reservation.startTime
            ? formatDateTimeDisplay(reservation.startTime)
            : "—"}
        </P2>
      </Table.Cell>

      <Table.Cell>
        <P2 className="text-contentSecondary">
          {reservation.endTime
            ? formatDateTimeDisplay(reservation.endTime)
            : "—"}
        </P2>
      </Table.Cell>

      <Table.Cell>
        <P2 className="text-contentSecondary">{reservation.purpose || "—"}</P2>
      </Table.Cell>

      <Table.Cell>
        {status && (
          <Badge color={STATUS_COLORS[status] as BadgeColor}>
            {RESERVATION_STATUS[status]}
          </Badge>
        )}
      </Table.Cell>

      <Table.Cell align="center">
        {status === "ACTIVE" && reservation.id ? (
          <Button
            destructive
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onCancel(reservation.id!);
            }}
            disabled={deleting}
          >
            {deleting ? "Anulowanie..." : "Anuluj"}
          </Button>
        ) : (
          "—"
        )}
      </Table.Cell>
    </Table.Row>
  );
}
