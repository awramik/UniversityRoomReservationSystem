package com.university.room_reservation.exception;

import java.util.UUID;

public class RoomNotFoundException extends RuntimeException {
    public RoomNotFoundException(UUID id) {
        super("Room not found: " + id);
    }
}
