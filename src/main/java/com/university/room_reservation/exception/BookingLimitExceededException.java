package com.university.room_reservation.exception;

public class BookingLimitExceededException extends RuntimeException {
    public BookingLimitExceededException() {
        super("Booking limit exceeded");
    }
}
