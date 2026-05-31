package com.university.room_reservation.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.university.room_reservation.model.Reservation;
import java.time.LocalDateTime;
import java.util.UUID;

public record ReservationResponse(
        UUID id,
        UUID roomId,
        String roomName,
        LocalDateTime startTime,
        LocalDateTime endTime,
        @JsonInclude(JsonInclude.Include.NON_NULL) String bookerName,
        String purpose
) {
    public static ReservationResponse from(Reservation reservation) {
        return new ReservationResponse(
                reservation.getId(),
                reservation.getRoom().getId(),
                reservation.getRoom().getName(),
                reservation.getStartTime(),
                reservation.getEndTime(),
                reservation.getBookerName(),
                reservation.getPurpose()
        );
    }

    public static ReservationResponse fromPublic(Reservation reservation) {
        return new ReservationResponse(
                reservation.getId(),
                reservation.getRoom().getId(),
                reservation.getRoom().getName(),
                reservation.getStartTime(),
                reservation.getEndTime(),
                null,
                reservation.getPurpose()
        );
    }
}
