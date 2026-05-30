package com.university.room_reservation.exception;

public class RoomNotAvailableException extends RuntimeException {
    public RoomNotAvailableException() {
        super("Room is not available");
    }
}
