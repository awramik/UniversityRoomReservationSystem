"use client";

import { ReservationResponse } from "@/src/app/lib/types";
import { Table } from "@/src/design-system/cards/Table";
import { ReservationRow } from "./ReservationRow";

type Props = {
  reservations: ReservationResponse[];
  deletingId: string | null;
  onCancel: (id: string) => void;
};

export function ReservationsTable({
  reservations,
  deletingId,
  onCancel,
}: Props) {
  return (
    <Table>
      <Table.Head>
        <tr>
          <Table.HeadCell>Sala</Table.HeadCell>
          <Table.HeadCell>Od</Table.HeadCell>
          <Table.HeadCell>Do</Table.HeadCell>
          <Table.HeadCell>Cel</Table.HeadCell>
          <Table.HeadCell>Status</Table.HeadCell>
          <Table.HeadCell align="center">Akcje</Table.HeadCell>
        </tr>
      </Table.Head>

      <Table.Body>
        {reservations.map((r, index) => (
          <ReservationRow
            key={r.id ?? index}
            reservation={r}
            deleting={deletingId === r.id}
            onCancel={onCancel}
          />
        ))}
      </Table.Body>
    </Table>
  );
}
