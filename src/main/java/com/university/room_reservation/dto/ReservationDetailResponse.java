package com.university.room_reservation.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.university.room_reservation.model.Reservation;

import java.time.LocalDateTime;
import java.util.UUID;

public record ReservationDetailResponse(
        UUID id,
        RoomResponse room,
        LocalDateTime startTime,
        LocalDateTime endTime,
        @JsonInclude(JsonInclude.Include.NON_NULL) String bookerName,
        String purpose
) {
    public static ReservationDetailResponse from(Reservation reservation) {
        return new ReservationDetailResponse(
                reservation.getId(),
                RoomResponse.from(reservation.getRoom()),
                reservation.getStartTime(),
                reservation.getEndTime(),
                reservation.getBookerName(),
                reservation.getPurpose()
        );
    }

    public static ReservationDetailResponse fromPublic(Reservation reservation) {
        return new ReservationDetailResponse(
                reservation.getId(),
                RoomResponse.from(reservation.getRoom()),
                reservation.getStartTime(),
                reservation.getEndTime(),
                null,
                reservation.getPurpose()
        );
    }
}
