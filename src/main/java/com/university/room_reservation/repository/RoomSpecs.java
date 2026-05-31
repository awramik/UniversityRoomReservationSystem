package com.university.room_reservation.repository;

import com.university.room_reservation.model.Room;
import com.university.room_reservation.model.RoomType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class RoomSpecs {

    private RoomSpecs() {}

    public static Specification<Room> matching(RoomType type, String building, Integer minCapacity, Integer maxCapacity) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (type != null) predicates.add(cb.equal(root.get("roomType"), type));
            if (building != null) predicates.add(cb.equal(root.get("buildingName"), building));
            if (minCapacity != null) predicates.add(cb.greaterThanOrEqualTo(root.get("capacity"), minCapacity));
            if (maxCapacity != null) predicates.add(cb.lessThanOrEqualTo(root.get("capacity"), maxCapacity));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
