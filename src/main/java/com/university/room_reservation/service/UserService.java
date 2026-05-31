package com.university.room_reservation.service;

import com.university.room_reservation.model.User;

import java.util.List;
import java.util.UUID;

public interface UserService {

    User getByUsername(String username);

    User getById(UUID id);

    List<User> listUsers();
}
