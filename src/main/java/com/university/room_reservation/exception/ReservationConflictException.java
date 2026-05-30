package com.university.room_reservation.exception;

public class ReservationConflictException extends RuntimeException {
    public ReservationConflictException() {
        super("Room is already reserved for the requested time slot");
    }
}
