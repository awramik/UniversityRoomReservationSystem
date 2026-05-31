package com.university.room_reservation.exception;

public class InvalidTimeRangeException extends RuntimeException {
    public InvalidTimeRangeException(String message) {
        super(message);
    }
}
