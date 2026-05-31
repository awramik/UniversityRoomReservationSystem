package com.university.room_reservation.service;

import com.university.room_reservation.exception.*;
import com.university.room_reservation.model.Reservation;
import com.university.room_reservation.model.ReservationType;
import com.university.room_reservation.repository.ReservationRepository;
import com.university.room_reservation.repository.RoomRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
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
        if (!end.isAfter(start)) {
            throw new InvalidTimeRangeException("End time must be after start time");
        }
        var room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RoomNotFoundException(roomId));

        if (reservationRepository.existsByRoomIdAndTypeAndStartTimeLessThanAndEndTimeGreaterThan(
                roomId, ReservationType.BOOKING, end, start)) {
            throw new ReservationConflictException();
        }
        if (reservationRepository.existsByRoomIdAndTypeAndStartTimeLessThanAndEndTimeGreaterThan(
                roomId, ReservationType.ADMIN_BLOCK, end, start)) {
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

        return reservationRepository.save(new Reservation(room, start, end, adminUsername, ReservationType.ADMIN_BLOCK, purpose));
    }

    @Override
    @Transactional
    public void deleteAdminBlock(UUID blockId) {
        Reservation block = reservationRepository.findByIdAndType(blockId, ReservationType.ADMIN_BLOCK)
                .orElseThrow(() -> new ReservationNotFoundException(blockId));
        reservationRepository.delete(block);
    }
}
