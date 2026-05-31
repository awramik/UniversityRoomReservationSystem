package com.university.room_reservation.service;

import com.university.room_reservation.dto.RoomRequest;
import com.university.room_reservation.dto.UpdateRoomRequest;
import com.university.room_reservation.model.Room;

import java.util.List;
import java.util.UUID;

public interface RoomService {

    Room addRoom(RoomRequest request);

    void removeRoom(UUID id);

    Room updateRoom(UUID id, UpdateRoomRequest request);

    List<Room> listRooms();

    Room getRoom(UUID id);
}
