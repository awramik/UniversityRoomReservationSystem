package com.university.room_reservation.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.university.room_reservation.model.Reservation;
import com.university.room_reservation.model.ReservationStatus;
import com.university.room_reservation.model.User;

import java.time.LocalDateTime;
import java.util.UUID;

public record ReservationDetailResponse(
        UUID id,
        RoomResponse room,
        LocalDateTime startTime,
        LocalDateTime endTime,
        @JsonInclude(JsonInclude.Include.NON_NULL) UserProfileResponse booker,
        String purpose,
        ReservationStatus status
) {
    public static ReservationDetailResponse from(Reservation reservation, User booker) {
        var room = reservation.getRoom();
        return new ReservationDetailResponse(
                reservation.getId(),
                room != null ? RoomResponse.from(room) : null,
                reservation.getStartTime(),
                reservation.getEndTime(),
                UserProfileResponse.from(booker),
                reservation.getPurpose(),
                reservation.getStatus()
        );
    }

    public static ReservationDetailResponse fromPublic(Reservation reservation) {
        var room = reservation.getRoom();
        return new ReservationDetailResponse(
                reservation.getId(),
                room != null ? RoomResponse.from(room) : null,
                reservation.getStartTime(),
                reservation.getEndTime(),
                null,
                reservation.getPurpose(),
                reservation.getStatus()
        );
    }
}
