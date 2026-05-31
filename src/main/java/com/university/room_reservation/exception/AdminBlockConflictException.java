package com.university.room_reservation.exception;

public class AdminBlockConflictException extends RuntimeException {
    public AdminBlockConflictException() {
        super("Room is blocked by admin for the requested time slot");
    }
}
