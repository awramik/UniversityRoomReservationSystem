package com.university.room_reservation.exception;

public class RoomBookingNotAllowedException extends RuntimeException {
    public RoomBookingNotAllowedException(String role, String roomType) {
        super("Role " + role + " is not allowed to book rooms of type: " + roomType);
    }
}
