package com.university.room_reservation.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.university.room_reservation.model.Reservation;
import com.university.room_reservation.model.User;

import java.time.LocalDateTime;
import java.util.UUID;

public record ReservationDetailResponse(
        UUID id,
        RoomResponse room,
        LocalDateTime startTime,
        LocalDateTime endTime,
        @JsonInclude(JsonInclude.Include.NON_NULL) UserProfileResponse booker,
        String purpose
) {
    public static ReservationDetailResponse from(Reservation reservation, User booker) {
        return new ReservationDetailResponse(
                reservation.getId(),
                RoomResponse.from(reservation.getRoom()),
                reservation.getStartTime(),
                reservation.getEndTime(),
                UserProfileResponse.from(booker),
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
