package com.university.room_reservation.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;
import java.util.List;

public record AvailabilityResponse(
        boolean available,
        @JsonInclude(JsonInclude.Include.NON_NULL) List<ConflictInterval> conflicts
) {
    public record ConflictInterval(LocalDateTime startTime, LocalDateTime endTime) {}
}
