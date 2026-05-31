package com.university.room_reservation.repository;

import com.university.room_reservation.model.Reservation;
import com.university.room_reservation.model.ReservationStatus;
import com.university.room_reservation.model.ReservationType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class ReservationSpecs {

    private ReservationSpecs() {}

    public static Specification<Reservation> bookingsMatching(
            LocalDate startDate, LocalDate endDate, UUID roomId, ReservationStatus status, String username) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("type"), ReservationType.BOOKING));
            if (startDate != null)
                predicates.add(cb.greaterThanOrEqualTo(root.get("startTime"), startDate.atStartOfDay()));
            if (endDate != null)
                predicates.add(cb.lessThanOrEqualTo(root.get("endTime"), endDate.plusDays(1).atStartOfDay()));
            if (roomId != null)
                predicates.add(cb.equal(root.get("room").get("id"), roomId));
            if (status != null)
                predicates.add(cb.equal(root.get("status"), status));
            if (username != null)
                predicates.add(cb.equal(root.get("bookerName"), username));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
