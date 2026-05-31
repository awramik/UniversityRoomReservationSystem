package com.university.room_reservation.dto;

import com.university.room_reservation.model.Reservation;
import java.time.LocalDateTime;

public record AdminBlockResponse(
        Long id,
        Long roomId,
        LocalDateTime startTime,
        LocalDateTime endTime,
        String purpose
) {
    public static AdminBlockResponse from(Reservation reservation) {
        return new AdminBlockResponse(
                reservation.getId(),
                reservation.getRoom().getId(),
                reservation.getStartTime(),
                reservation.getEndTime(),
                reservation.getPurpose()
        );
    }
}
