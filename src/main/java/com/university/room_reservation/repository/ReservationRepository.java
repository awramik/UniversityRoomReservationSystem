package com.university.room_reservation.repository;

import com.university.room_reservation.model.Reservation;
import com.university.room_reservation.model.ReservationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, UUID> {

    boolean existsByRoomIdAndTypeAndStartTimeLessThanAndEndTimeGreaterThan(
            UUID roomId, ReservationType type, LocalDateTime end, LocalDateTime start);

    Optional<Reservation> findByIdAndType(UUID id, ReservationType type);

    List<Reservation> findAllByType(ReservationType type);
}
