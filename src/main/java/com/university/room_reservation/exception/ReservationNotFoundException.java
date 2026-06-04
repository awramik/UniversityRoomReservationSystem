package com.university.room_reservation.exception;

import java.util.UUID;

public class ReservationNotFoundException extends RuntimeException {
    public ReservationNotFoundException(UUID id) {
        super("Rezerwacja nie znaleziona: " + id);
    }
}
