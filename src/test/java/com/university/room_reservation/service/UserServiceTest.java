package com.university.room_reservation.service;

import com.university.room_reservation.dto.UpdateUserProfileRequest;
import com.university.room_reservation.exception.EmailAlreadyInUseException;
import com.university.room_reservation.exception.UserNotFoundException;
import com.university.room_reservation.model.Role;
import com.university.room_reservation.model.User;
import com.university.room_reservation.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Serwis użytkowników - testy jednostkowe Mockito")
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserServiceImpl userService;

    @Nested
    @DisplayName("Pobieranie i listowanie użytkowników")
    class PobieranieIListowanieUzytkownikow {

        @Test
        @DisplayName("Sukces: Pomyślne pobranie użytkownika po nazwie użytkownika")
        void shouldGetUserByUsernameSuccessfully() {
            User user = new User();
            user.setUsername("test_user");
            user.setEmail("test@university.com");

            when(userRepository.findByUsername("test_user")).thenReturn(Optional.of(user));

            User result = userService.getByUsername("test_user");

            assertThat(result.getUsername()).isEqualTo("test_user");
            assertThat(result.getEmail()).isEqualTo("test@university.com");
        }

        @Test
        @DisplayName("Błąd: Rzucenie wyjątku UserNotFoundException przy braku użytkownika o danej nazwie")
        void shouldThrowUserNotFoundWhenUsernameDoesNotExist() {
            when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userService.getByUsername("unknown"))
                    .isInstanceOf(UserNotFoundException.class)
                    .hasMessage("User not found: unknown");
        }

        @Test
        @DisplayName("Sukces: Pomyślne pobranie użytkownika po ID")
        void shouldGetUserByIdSuccessfully() {
            UUID userId = UUID.randomUUID();
            User user = new User();
            user.setId(userId);
            user.setUsername("test_user");

            when(userRepository.findById(userId)).thenReturn(Optional.of(user));

            User result = userService.getById(userId);

            assertThat(result.getId()).isEqualTo(userId);
            assertThat(result.getUsername()).isEqualTo("test_user");
        }

        @Test
        @DisplayName("Błąd: Rzucenie wyjątku UserNotFoundException przy braku użytkownika o danym ID")
        void shouldThrowUserNotFoundWhenIdDoesNotExist() {
            UUID userId = UUID.randomUUID();
            when(userRepository.findById(userId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userService.getById(userId))
                    .isInstanceOf(UserNotFoundException.class)
                    .hasMessage("User not found: " + userId);
        }

        @Test
        @DisplayName("Sukces: Pomyślne pobranie listy wszystkich użytkowników")
        void shouldListAllUsersSuccessfully() {
            User u1 = new User();
            u1.setUsername("user1");
            User u2 = new User();
            u2.setUsername("user2");

            when(userRepository.findAll()).thenReturn(List.of(u1, u2));

            List<User> result = userService.listUsers();

            assertThat(result).hasSize(2);
            assertThat(result.get(0).getUsername()).isEqualTo("user1");
            assertThat(result.get(1).getUsername()).isEqualTo("user2");
        }
    }

    @Nested
    @DisplayName("Aktualizacja profilu użytkownika")
    class AktualizacjaProfilu {

        @Test
        @DisplayName("Sukces: Pomyślna pełna aktualizacja profilu")
        void shouldUpdateUserProfileSuccessfully() {
            User user = new User();
            user.setId(UUID.randomUUID());
            user.setUsername("test_user");
            user.setEmail("old@university.com");
            user.setName("OldName");
            user.setSurname("OldSurname");

            when(userRepository.findByUsername("test_user")).thenReturn(Optional.of(user));
            when(userRepository.existsByEmailAndIdNot("new@university.com", user.getId())).thenReturn(false);
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

            UpdateUserProfileRequest request = new UpdateUserProfileRequest("new@university.com", "NewName", "NewSurname");
            User result = userService.updateProfile("test_user", request);

            assertThat(result.getEmail()).isEqualTo("new@university.com");
            assertThat(result.getName()).isEqualTo("NewName");
            assertThat(result.getSurname()).isEqualTo("NewSurname");
        }

        @Test
        @DisplayName("Sukces: Częściowa aktualizacja profilu (wartości null są ignorowane)")
        void shouldUpdateOnlyNonNullProfileFields() {
            User user = new User();
            user.setId(UUID.randomUUID());
            user.setUsername("test_user");
            user.setEmail("old@university.com");
            user.setName("OldName");
            user.setSurname("OldSurname");

            when(userRepository.findByUsername("test_user")).thenReturn(Optional.of(user));
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

            UpdateUserProfileRequest request = new UpdateUserProfileRequest(null, "NewName", null);
            User result = userService.updateProfile("test_user", request);

            assertThat(result.getEmail()).isEqualTo("old@university.com");
            assertThat(result.getName()).isEqualTo("NewName");
            assertThat(result.getSurname()).isEqualTo("OldSurname");
        }

        @Test
        @DisplayName("Błąd: Rzucenie wyjątku EmailAlreadyInUseException, gdy nowy e-mail jest już przypisany do innego użytkownika")
        void shouldThrowEmailAlreadyInUseWhenEmailBelongsToAnotherUser() {
            User user = new User();
            user.setId(UUID.randomUUID());
            user.setUsername("test_user");
            user.setEmail("old@university.com");

            when(userRepository.findByUsername("test_user")).thenReturn(Optional.of(user));
            when(userRepository.existsByEmailAndIdNot("occupied@university.com", user.getId())).thenReturn(true);

            UpdateUserProfileRequest request = new UpdateUserProfileRequest("occupied@university.com", "NewName", "NewSurname");

            assertThatThrownBy(() -> userService.updateProfile("test_user", request))
                    .isInstanceOf(EmailAlreadyInUseException.class)
                    .hasMessage("Email already in use: occupied@university.com");

            verify(userRepository, never()).save(any());
        }
    }
}
