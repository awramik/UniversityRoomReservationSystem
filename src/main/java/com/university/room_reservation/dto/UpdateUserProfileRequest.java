package com.university.room_reservation.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record UpdateUserProfileRequest(
        @Email(message = "Invalid email format")
        @Size(max = 255)
        String email,

        @Size(max = 100)
        String name,

        @Size(max = 100)
        String surname
) {}
