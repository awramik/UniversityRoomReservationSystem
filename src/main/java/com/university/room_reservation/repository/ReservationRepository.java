package com.university.room_reservation.repository;

import com.university.room_reservation.model.Reservation;
import com.university.room_reservation.model.ReservationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    boolean existsByRoomIdAndTypeAndStartTimeLessThanAndEndTimeGreaterThan(
            Long roomId, ReservationType type, LocalDateTime end, LocalDateTime start);

    Optional<Reservation> findByIdAndType(Long id, ReservationType type);
}
