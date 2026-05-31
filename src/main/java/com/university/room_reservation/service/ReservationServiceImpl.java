package com.university.room_reservation.service;

import com.university.room_reservation.exception.*;
import com.university.room_reservation.model.Reservation;
import com.university.room_reservation.model.ReservationStatus;
import com.university.room_reservation.model.ReservationType;
import com.university.room_reservation.repository.ReservationRepository;
import com.university.room_reservation.repository.RoomRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class ReservationServiceImpl implements ReservationService {

    private final ReservationRepository reservationRepository;
    private final RoomRepository roomRepository;

    public ReservationServiceImpl(ReservationRepository reservationRepository, RoomRepository roomRepository) {
        this.reservationRepository = reservationRepository;
        this.roomRepository = roomRepository;
    }

    @Override
    @Transactional
    public Reservation createReservation(UUID roomId, LocalDateTime start, LocalDateTime end, String bookerName, String purpose) {
        if (!start.isAfter(LocalDateTime.now())) {
            throw new InvalidTimeRangeException("Reservation start time must be in the future");
        }
        if (!end.isAfter(start)) {
            throw new InvalidTimeRangeException("End time must be after start time");
        }
        var room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RoomNotFoundException(roomId));

        if (reservationRepository.existsByRoomIdAndTypeAndStatusAndStartTimeLessThanAndEndTimeGreaterThan(
                roomId, ReservationType.BOOKING, ReservationStatus.ACTIVE, end, start)) {
            throw new ReservationConflictException();
        }
        if (reservationRepository.existsByRoomIdAndTypeAndStatusAndStartTimeLessThanAndEndTimeGreaterThan(
                roomId, ReservationType.ADMIN_BLOCK, ReservationStatus.ACTIVE, end, start)) {
            throw new AdminBlockConflictException();
        }

        return reservationRepository.save(new Reservation(room, start, end, bookerName, ReservationType.BOOKING, purpose));
    }

    @Override
    @Transactional
    public Reservation createAdminBlock(UUID roomId, LocalDateTime start, LocalDateTime end, String adminUsername, String purpose) {
        if (!end.isAfter(start)) {
            throw new InvalidTimeRangeException("End time must be after start time");
        }
        var room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RoomNotFoundException(roomId));

        var block = reservationRepository.save(new Reservation(room, start, end, adminUsername, ReservationType.ADMIN_BLOCK, purpose));

        var affected = reservationRepository.findAllByRoomIdAndTypeAndStatusAndStartTimeLessThanAndEndTimeGreaterThan(
                roomId, ReservationType.BOOKING, ReservationStatus.ACTIVE, end, start);
        affected.forEach(r -> r.setStatus(ReservationStatus.CANCELLED));
        reservationRepository.saveAll(affected);

        return block;
    }

    @Override
    @Transactional
    public void deleteAdminBlock(UUID blockId) {
        Reservation block = reservationRepository.findByIdAndType(blockId, ReservationType.ADMIN_BLOCK)
                .orElseThrow(() -> new ReservationNotFoundException(blockId));
        reservationRepository.delete(block);
    }

    @Override
    @Transactional
    public void cancelReservation(UUID reservationId, String callerUsername, boolean isAdmin) {
        Reservation reservation = reservationRepository.findByIdAndType(reservationId, ReservationType.BOOKING)
                .orElseThrow(() -> new ReservationNotFoundException(reservationId));

        if (reservation.getStatus() != ReservationStatus.ACTIVE) {
            throw new ReservationNotFoundException(reservationId);
        }

        if (!isAdmin && !reservation.getBookerName().equals(callerUsername)) {
            throw new org.springframework.security.access.AccessDeniedException("You can only cancel your own reservations");
        }

        reservation.setStatus(ReservationStatus.CANCELLED);
        reservationRepository.save(reservation);
    }

    @Override
    @Transactional
    public List<Reservation> listReservations() {
        reservationRepository.markAllExpiredAsPast(LocalDateTime.now());
        return reservationRepository.findAllByType(ReservationType.BOOKING);
    }

    @Override
    @Transactional
    public List<Reservation> listMyReservations(String username) {
        reservationRepository.markExpiredAsPastForUser(LocalDateTime.now(), username);
        return reservationRepository.findAllByTypeAndBookerName(ReservationType.BOOKING, username);
    }

    @Override
    @Transactional
    public Reservation getReservation(UUID reservationId) {
        Reservation reservation = reservationRepository.findByIdAndType(reservationId, ReservationType.BOOKING)
                .orElseThrow(() -> new ReservationNotFoundException(reservationId));

        if (reservation.getStatus() == ReservationStatus.ACTIVE
                && reservation.getEndTime().isBefore(LocalDateTime.now())) {
            reservation.setStatus(ReservationStatus.PAST);
            reservationRepository.save(reservation);
        }

        return reservation;
    }
}

