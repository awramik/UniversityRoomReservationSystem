package com.university.room_reservation.dto;

import com.university.room_reservation.model.Reservation;
import java.time.LocalDateTime;

public record ReservationResponse(
        Long id,
        Long roomId,
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
