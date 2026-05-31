package com.university.room_reservation.service;

import com.university.room_reservation.model.Reservation;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface ReservationService {

    Reservation createReservation(UUID roomId, LocalDateTime start, LocalDateTime end, String bookerName, String purpose);

    Reservation createAdminBlock(UUID roomId, LocalDateTime start, LocalDateTime end, String adminUsername, String purpose);

    void deleteAdminBlock(UUID blockId);

    void cancelReservation(UUID reservationId, String callerUsername, boolean isAdmin);

    List<Reservation> listReservations();

    List<Reservation> listMyReservations(String username);

    Reservation getReservation(UUID reservationId);
}
