package com.university.room_reservation.service;

import com.university.room_reservation.model.Room;
import com.university.room_reservation.repository.RoomRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class RoomService {

    private final RoomRepository roomRepository;

    public RoomService(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    public Room addRoom(Room room) {
        throw new UnsupportedOperationException("Method addRoom is not yet implemented!");
    }

    public List<Room> getAllRooms() {
        throw new UnsupportedOperationException("Method getAllRooms is not yet implemented!");
    }
}
