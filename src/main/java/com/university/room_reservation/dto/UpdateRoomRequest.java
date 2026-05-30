package com.university.room_reservation.dto;

import jakarta.validation.constraints.Min;

public record UpdateRoomRequest(
        String name,
        String buildingName,
        @Min(1) Integer capacity,
        String description
) {}
