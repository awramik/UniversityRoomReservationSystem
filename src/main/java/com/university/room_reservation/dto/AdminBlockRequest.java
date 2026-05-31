package com.university.room_reservation.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public record AdminBlockRequest(
        @NotNull(message = "startTime is required") LocalDateTime startTime,
        @NotNull(message = "endTime is required") LocalDateTime endTime,
        String purpose
) {}
