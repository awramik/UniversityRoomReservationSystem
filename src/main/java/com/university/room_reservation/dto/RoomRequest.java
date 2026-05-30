package com.university.room_reservation.dto;

import com.university.room_reservation.model.RoomType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RoomRequest(
        @NotBlank String name,
        @NotBlank String buildingName,
        @NotNull @Min(1) Integer capacity,
        @NotNull RoomType roomType
) {}
