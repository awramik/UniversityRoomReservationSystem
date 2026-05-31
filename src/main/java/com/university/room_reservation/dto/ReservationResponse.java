package com.university.room_reservation.dto;

import com.university.room_reservation.model.Reservation;
import java.time.LocalDateTime;
import java.util.UUID;

public record ReservationResponse(
        UUID id,
        UUID roomId,
        LocalDateTime startTime,
        LocalDateTime endTime,
        String bookerName,
        String purpose
) {
    public static ReservationResponse from(Reservation reservation) {
        return new ReservationResponse(
                reservation.getId(),
                reservation.getRoom().getId(),
                reservation.getStartTime(),
                reservation.getEndTime(),
                reservation.getBookerName(),
                reservation.getPurpose()
        );
    }
}
