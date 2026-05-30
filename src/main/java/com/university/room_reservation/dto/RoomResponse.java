package com.university.room_reservation.dto;

import com.university.room_reservation.model.Room;

public record RoomResponse(
        Long id,
        String name,
        int capacity,
        String roomType,
        boolean available
) {
    public static RoomResponse from(Room room) {
        return new RoomResponse(
                room.getId(),
                room.getName(),
                room.getCapacity(),
                room.getRoomType().name(),
                room.isAvailable()
        );
    }
}
