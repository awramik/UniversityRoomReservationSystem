package com.university.room_reservation.exception;

public class RoomNotFoundException extends RuntimeException {
    public RoomNotFoundException(Long id) {
        super("Room not found: " + id);
    }
}
