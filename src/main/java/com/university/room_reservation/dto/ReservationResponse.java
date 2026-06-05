package com.university.room_reservation.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.university.room_reservation.model.Reservation;
import com.university.room_reservation.model.ReservationStatus;
import com.university.room_reservation.model.ReservationType;

import java.time.LocalDateTime;
import java.util.UUID;

public record ReservationResponse(
        UUID id,
        UUID roomId,
        String roomName,
        LocalDateTime startTime,
        LocalDateTime endTime,
        @JsonInclude(JsonInclude.Include.NON_NULL) String bookerName,
        String purpose,
        ReservationStatus status,
        ReservationType type
) {
    public static ReservationResponse from(Reservation reservation) {
        var room = reservation.getRoom();
        return new ReservationResponse(
                reservation.getId(),
                room != null ? room.getId() : null,
                room != null ? room.getName() : null,
                reservation.getStartTime(),
                reservation.getEndTime(),
                reservation.getBookerName(),
                reservation.getPurpose(),
                reservation.getStatus(),
                reservation.getType()
        );
    }

    public static ReservationResponse fromPublic(Reservation reservation) {
        var room = reservation.getRoom();
        return new ReservationResponse(
                reservation.getId(),
                room != null ? room.getId() : null,
                room != null ? room.getName() : null,
                reservation.getStartTime(),
                reservation.getEndTime(),
                null,
                reservation.getPurpose(),
                reservation.getStatus(),
                reservation.getType()
        );
    }
}
