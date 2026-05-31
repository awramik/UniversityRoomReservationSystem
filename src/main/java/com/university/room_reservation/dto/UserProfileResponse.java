package com.university.room_reservation.dto;

import com.university.room_reservation.model.User;
import java.util.UUID;

public record UserProfileResponse(
        UUID id,
        String username,
        String name,
        String surname,
        String email,
        String role
) {
    public static UserProfileResponse from(User user) {
        return new UserProfileResponse(
                user.getId(),
                user.getUsername(),
                user.getName(),
                user.getSurname(),
                user.getEmail(),
                user.getRole().name()
        );
    }
}
