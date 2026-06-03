package com.university.room_reservation.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.university.room_reservation.BaseIntegrationTest;
import com.university.room_reservation.dto.UpdateUserProfileRequest;
import com.university.room_reservation.model.Role;
import com.university.room_reservation.model.User;
import com.university.room_reservation.repository.ReservationRepository;
import com.university.room_reservation.repository.RoomRepository;
import com.university.room_reservation.repository.UserRepository;
import com.university.room_reservation.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@AutoConfigureMockMvc
@DisplayName("Kontroler użytkowników - testy integracyjne")
class UserControllerIntegrationTest extends BaseIntegrationTest {

    private static final String DEFAULT_PASSWORD = "password";
    private static final String ADMIN_USERNAME = "admin_user";
    private static final String STUDENT_USERNAME = "student_user";
    private static final String LECTURER_USERNAME = "lecturer_user";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private JwtService jwtService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        reservationRepository.deleteAll();
        roomRepository.deleteAll();
        userRepository.deleteAll();
    }

    private String getBearerToken(String username, Role role) {
        var userDetails = org.springframework.security.core.userdetails.User.builder()
                .username(username)
                .password(DEFAULT_PASSWORD)
                .authorities("ROLE_" + role.name())
                .build();
        return "Bearer " + jwtService.generateToken(userDetails);
    }

    @Nested
    @DisplayName("Zarządzanie profilem użytkownika")
    class ZarzadzanieProfilem {

        @Test
        @DisplayName("Profil: Pobranie własnego profilu zalogowanego użytkownika")
        void shouldReturnCurrentUserProfile() throws Exception {
            // Sprawdza, czy zalogowany użytkownik otrzyma swoje poprawne dane profilowe (status 200 OK).
            User user = new User();
            user.setUsername("profile_user");
            user.setPassword(DEFAULT_PASSWORD);
            user.setEmail("profile@university.com");
            user.setRole(Role.STUDENT);
            user.setName("Alice");
            user.setSurname("Smith");
            userRepository.save(user);

            String token = getBearerToken("profile_user", Role.STUDENT);

            mockMvc.perform(get("/users/me")
                            .header("Authorization", token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.username").value("profile_user"))
                    .andExpect(jsonPath("$.email").value("profile@university.com"))
                    .andExpect(jsonPath("$.name").value("Alice"))
                    .andExpect(jsonPath("$.surname").value("Smith"))
                    .andExpect(jsonPath("$.role").value("STUDENT"));
        }

        @Test
        @DisplayName("Profil: Pomyślna aktualizacja profilu (imię, nazwisko, e-mail)")
        void shouldUpdateCurrentUserProfileSuccessfully() throws Exception {
            // Sprawdza, czy poprawny obiekt UpdateUserProfileRequest modyfikuje dane użytkownika w bazie (status 200 OK).
            User user = new User();
            user.setUsername("update_user");
            user.setPassword(DEFAULT_PASSWORD);
            user.setEmail("update@university.com");
            user.setRole(Role.STUDENT);
            user.setName("OldName");
            user.setSurname("OldSurname");
            userRepository.save(user);

            String token = getBearerToken("update_user", Role.STUDENT);
            UpdateUserProfileRequest request = new UpdateUserProfileRequest("new_email@university.com", "NewName", "NewSurname");

            mockMvc.perform(patch("/users/me")
                            .header("Authorization", token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.username").value("update_user"))
                    .andExpect(jsonPath("$.email").value("new_email@university.com"))
                    .andExpect(jsonPath("$.name").value("NewName"))
                    .andExpect(jsonPath("$.surname").value("NewSurname"));

            User updated = userRepository.findByUsername("update_user").orElse(null);
            assertThat(updated).isNotNull();
            assertThat(updated.getName()).isEqualTo("NewName");
            assertThat(updated.getSurname()).isEqualTo("NewSurname");
            assertThat(updated.getEmail()).isEqualTo("new_email@university.com");
        }

        @Test
        @DisplayName("Profil: Odrzucenie aktualizacji przy niepoprawnym formacie adresu e-mail")
        void shouldRejectUpdateProfileWhenEmailIsInvalid() throws Exception {
            // Sprawdza, czy zły format adresu e-mail w obiekcie żądania zostanie odrzucony jako błąd walidacji (status 400 Bad Request).
            User student = new User();
            student.setUsername(STUDENT_USERNAME);
            student.setPassword(DEFAULT_PASSWORD);
            student.setEmail("student@university.com");
            student.setRole(Role.STUDENT);
            userRepository.save(student);

            String token = getBearerToken(STUDENT_USERNAME, Role.STUDENT);
            UpdateUserProfileRequest request = new UpdateUserProfileRequest("zly_email_bez_małpy", "Bob", "Saget");

            mockMvc.perform(patch("/users/me")
                            .header("Authorization", token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value(400))
                    .andExpect(jsonPath("$.error").exists());
        }

        @Test
        @DisplayName("Profil: Odrzucenie aktualizacji, gdy e-mail jest już zajęty przez innego użytkownika")
        void shouldRejectEmailUpdateIfAlreadyInUseByAnotherUser() throws Exception {
            // Sprawdza, czy próba zmiany adresu e-mail na zajęty przez inną osobę kończy się statusem 409 Conflict.
            User user1 = new User();
            user1.setUsername("user_one");
            user1.setPassword(DEFAULT_PASSWORD);
            user1.setEmail("one@university.com");
            user1.setRole(Role.STUDENT);
            userRepository.save(user1);

            User user2 = new User();
            user2.setUsername("user_two");
            user2.setPassword(DEFAULT_PASSWORD);
            user2.setEmail("two@university.com");
            user2.setRole(Role.STUDENT);
            userRepository.save(user2);

            String token2 = getBearerToken("user_two", Role.STUDENT);
            UpdateUserProfileRequest request = new UpdateUserProfileRequest("one@university.com", "Bob", "Smith");

            mockMvc.perform(patch("/users/me")
                            .header("Authorization", token2)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.status").value(409))
                    .andExpect(jsonPath("$.error").value("Email already in use: one@university.com"));
        }

        @Test
        @DisplayName("Profil: Zezwolenie na aktualizację, gdy e-mail nie ulega zmianie")
        void shouldAllowEmailUpdateToSameEmailAddress() throws Exception {
            // Sprawdza, czy ponowne wysłanie tego samego adresu e-mail pozwala na pomyślną aktualizację profilu.
            User user = new User();
            user.setUsername("same_email_user");
            user.setPassword(DEFAULT_PASSWORD);
            user.setEmail("same@university.com");
            user.setRole(Role.STUDENT);
            user.setName("John");
            user.setSurname("Doe");
            userRepository.save(user);

            String token = getBearerToken("same_email_user", Role.STUDENT);
            UpdateUserProfileRequest request = new UpdateUserProfileRequest("same@university.com", "John", "Doe");

            mockMvc.perform(patch("/users/me")
                            .header("Authorization", token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.email").value("same@university.com"));
        }
    }

    @Nested
    @DisplayName("Listowanie i wyszukiwanie użytkowników")
    class ListowanieIWyszukiwanie {

        @Test
        @DisplayName("Wyszukiwanie: Pomyślne pobranie listy wszystkich użytkowników przez administratora")
        void shouldAllowAdminToListUsers() throws Exception {
            // Sprawdza, czy ADMIN może listować wszystkich zarejestrowanych użytkowników (status 200 OK).
            User admin = new User();
            admin.setUsername(ADMIN_USERNAME);
            admin.setPassword(DEFAULT_PASSWORD);
            admin.setEmail("admin@university.com");
            admin.setRole(Role.ADMIN);
            userRepository.save(admin);

            User student = new User();
            student.setUsername(STUDENT_USERNAME);
            student.setPassword(DEFAULT_PASSWORD);
            student.setEmail("student@university.com");
            student.setRole(Role.STUDENT);
            userRepository.save(student);

            String token = getBearerToken(ADMIN_USERNAME, Role.ADMIN);

            mockMvc.perform(get("/users")
                            .header("Authorization", token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$.length()").value(2));
        }

        @Test
        @DisplayName("Wyszukiwanie: Zablokowanie studenta przed pobraniem listy użytkowników")
        void shouldRejectStudentFromListingUsers() throws Exception {
            // Sprawdza, czy próba pobrania listy użytkowników przez studenta skończy się statusem 403 Forbidden.
            User student = new User();
            student.setUsername(STUDENT_USERNAME);
            student.setPassword(DEFAULT_PASSWORD);
            student.setEmail("student@university.com");
            student.setRole(Role.STUDENT);
            userRepository.save(student);

            String token = getBearerToken(STUDENT_USERNAME, Role.STUDENT);

            mockMvc.perform(get("/users")
                            .header("Authorization", token))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Wyszukiwanie: Zablokowanie wykładowcy przed pobraniem listy użytkowników")
        void shouldRejectLecturerFromListingUsers() throws Exception {
            // Sprawdza, czy próba pobrania listy użytkowników przez wykładowcę skończy się statusem 403 Forbidden.
            String token = getBearerToken(LECTURER_USERNAME, Role.LECTURER);

            mockMvc.perform(get("/users")
                            .header("Authorization", token))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Wyszukiwanie: Pobranie szczegółów użytkownika po ID przez administratora")
        void shouldAllowAdminToGetUserByIdSuccessfully() throws Exception {
            // Sprawdza, czy ADMIN może pobrać dane profilowe wybranego użytkownika po jego ID (status 200 OK).
            User user = new User();
            user.setUsername("alice_smith");
            user.setPassword(DEFAULT_PASSWORD);
            user.setEmail("alice@university.com");
            user.setRole(Role.STUDENT);
            user.setName("Alice");
            user.setSurname("Smith");
            user = userRepository.save(user);

            String adminToken = getBearerToken(ADMIN_USERNAME, Role.ADMIN);

            mockMvc.perform(get("/users/" + user.getId())
                            .header("Authorization", adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(user.getId().toString()))
                    .andExpect(jsonPath("$.username").value("alice_smith"))
                    .andExpect(jsonPath("$.email").value("alice@university.com"));
        }

        @Test
        @DisplayName("Wyszukiwanie: Zwrot statusu 404 w przypadku nieistniejącego ID użytkownika")
        void shouldReturn404WhenAdminGetsNonExistentUserById() throws Exception {
            // Sprawdza, czy wysłanie żądania o dane nieistniejącego ID użytkownika kończy się statusem 404 Not Found.
            UUID nonExistentId = UUID.randomUUID();
            String adminToken = getBearerToken(ADMIN_USERNAME, Role.ADMIN);

            mockMvc.perform(get("/users/" + nonExistentId)
                            .header("Authorization", adminToken))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.status").value(404))
                    .andExpect(jsonPath("$.error").value("User not found: " + nonExistentId));
        }

        @Test
        @DisplayName("Wyszukiwanie: Zablokowanie nie-adminów przed pobraniem danych użytkownika po ID")
        void shouldRejectNonAdminFromGettingUserById() throws Exception {
            // Sprawdza, czy próby pobrania szczegółów użytkownika po ID przez studenta i wykładowcę kończą się statusem 403 Forbidden.
            User user = new User();
            user.setUsername("alice_smith");
            user.setPassword(DEFAULT_PASSWORD);
            user.setEmail("alice@university.com");
            user.setRole(Role.STUDENT);
            user = userRepository.save(user);

            String studentToken = getBearerToken(STUDENT_USERNAME, Role.STUDENT);
            String lecturerToken = getBearerToken(LECTURER_USERNAME, Role.LECTURER);

            // Student próbuje wyszukać
            mockMvc.perform(get("/users/" + user.getId())
                            .header("Authorization", studentToken))
                    .andExpect(status().isForbidden());

            // Wykładowca próbuje wyszukać
            mockMvc.perform(get("/users/" + user.getId())
                            .header("Authorization", lecturerToken))
                    .andExpect(status().isForbidden());
        }
    }
}
