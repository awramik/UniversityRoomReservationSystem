package com.university.room_reservation.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.UUID;

public record AdminBlockRequest(
        @NotNull(message = "roomId is required") UUID roomId,
        @NotNull(message = "startTime is required") LocalDateTime startTime,
        @NotNull(message = "endTime is required") LocalDateTime endTime,
        String purpose
) {}
