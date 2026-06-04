package com.university.room_reservation.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.university.room_reservation.BaseIntegrationTest;
import com.university.room_reservation.dto.LoginRequest;
import com.university.room_reservation.model.Role;
import com.university.room_reservation.model.User;
import com.university.room_reservation.repository.ReservationRepository;
import com.university.room_reservation.repository.RoomRepository;
import com.university.room_reservation.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@AutoConfigureMockMvc
@DisplayName("Kontroler uwierzytelniania - testy integracyjne")
class AuthControllerIntegrationTest extends BaseIntegrationTest {

    private static final String USERNAME = "test_user";
    private static final String PASSWORD = "secret123";
    private static final String WRONG_PASSWORD = "wrong_password";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        reservationRepository.deleteAll();
        roomRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Nested
    @DisplayName("Proces logowania")
    class ProcesLogowania {

        @Test
        @DisplayName("Logowanie: Pomyślne uwierzytelnienie i zwrot tokenu JWT")
        void shouldLoginSuccessfullyAndReturnJwt() throws Exception {
            // Sprawdza, czy po podaniu prawidłowych danych logowania zwracany jest status 200 OK oraz token JWT.
            User user = new User();
            user.setUsername(USERNAME);
            user.setPassword(passwordEncoder.encode(PASSWORD));
            user.setEmail("test_user@university.com");
            user.setRole(Role.STUDENT);
            user.setName("John");
            user.setSurname("Doe");
            userRepository.save(user);

            LoginRequest request = new LoginRequest(USERNAME, PASSWORD);

            mockMvc.perform(post("/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.token").exists());
        }

        @Test
        @DisplayName("Logowanie: Odrzucenie uwierzytelnienia w przypadku błędnego hasła")
        void shouldRejectLoginWithInvalidCredentials() throws Exception {
            // Sprawdza, czy podanie błędnego hasła skutkuje statusem 401 Unauthorized.
            User user = new User();
            user.setUsername(USERNAME);
            user.setPassword(passwordEncoder.encode(PASSWORD));
            user.setEmail("test_user@university.com");
            user.setRole(Role.STUDENT);
            userRepository.save(user);

            LoginRequest request = new LoginRequest(USERNAME, WRONG_PASSWORD);

            mockMvc.perform(post("/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("Zabezpieczenia API")
    class ZabezpieczeniaApi {

        @Test
        @DisplayName("Zabezpieczenia: Odrzucenie anonimowego zapytania do chronionej ścieżki")
        void shouldReturn401WhenAccessingSecuredEndpointsAnonymously() throws Exception {
            // Sprawdza, czy próba wywołania zabezpieczonego endpointu bez nagłówka Authorization zwraca status 401 Unauthorized.
            mockMvc.perform(post("/rooms")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.status").value(401))
                    .andExpect(jsonPath("$.message").value("Unauthorized"));
        }
    }
}
