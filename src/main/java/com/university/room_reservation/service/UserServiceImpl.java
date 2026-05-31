package com.university.room_reservation.service;

import com.university.room_reservation.dto.UpdateUserProfileRequest;
import com.university.room_reservation.exception.EmailAlreadyInUseException;
import com.university.room_reservation.exception.UserNotFoundException;
import com.university.room_reservation.model.User;
import com.university.room_reservation.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    public UserServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public User getByUsername(String username) {
        return userRepository.findByUsername(username).orElseThrow(() -> new UserNotFoundException(username));
    }

    @Override
    public User getById(UUID id) {
        return userRepository.findById(id).orElseThrow(() -> new UserNotFoundException(id));
    }

    @Override
    public List<User> listUsers() {
        return userRepository.findAll();
    }

    @Override
    @Transactional
    public User updateProfile(String username, UpdateUserProfileRequest request) {
        User user = getByUsername(username);

        if (request.email() != null) {
            if (userRepository.existsByEmailAndIdNot(request.email(), user.getId())) {
                throw new EmailAlreadyInUseException(request.email());
            }
            user.setEmail(request.email());
        }
        if (request.name() != null) {
            user.setName(request.name());
        }
        if (request.surname() != null) {
            user.setSurname(request.surname());
        }

        return userRepository.save(user);
    }
}
