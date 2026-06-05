package com.university.room_reservation.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.university.room_reservation.BaseIntegrationTest;
import com.university.room_reservation.dto.RoomRequest;
import com.university.room_reservation.dto.UpdateRoomRequest;
import com.university.room_reservation.model.Reservation;
import com.university.room_reservation.model.ReservationStatus;
import com.university.room_reservation.model.ReservationType;
import com.university.room_reservation.model.Room;
import com.university.room_reservation.model.RoomType;
import com.university.room_reservation.repository.ReservationRepository;
import com.university.room_reservation.repository.RoomRepository;
import com.university.room_reservation.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.User;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@AutoConfigureMockMvc
@DisplayName("Kontroler sal - testy integracyjne")
class RoomControllerIntegrationTest extends BaseIntegrationTest {

    private static final String ADMIN_USERNAME = "admin_user";
    private static final String STUDENT_USERNAME = "student_user";
    private static final String LECTURER_USERNAME = "lecturer_user";
    private static final String DEFAULT_PASSWORD = "password";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private JwtService jwtService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private String adminToken;
    private String studentToken;
    private String lecturerToken;

    @BeforeEach
    void setUp() {
        reservationRepository.deleteAll();
        roomRepository.deleteAll();

        // Generate ADMIN token
        var adminDetails = User.builder()
                .username(ADMIN_USERNAME)
                .password(DEFAULT_PASSWORD)
                .authorities("ROLE_ADMIN")
                .build();
        adminToken = "Bearer " + jwtService.generateToken(adminDetails);

        // Generate STUDENT token
        var studentDetails = User.builder()
                .username(STUDENT_USERNAME)
                .password(DEFAULT_PASSWORD)
                .authorities("ROLE_STUDENT")
                .build();
        studentToken = "Bearer " + jwtService.generateToken(studentDetails);

        // Generate LECTURER token
        var lecturerDetails = User.builder()
                .username(LECTURER_USERNAME)
                .password(DEFAULT_PASSWORD)
                .authorities("ROLE_LECTURER")
                .build();
        lecturerToken = "Bearer " + jwtService.generateToken(lecturerDetails);
    }

    @Nested
    @DisplayName("Dodawanie nowych sal")
    class DodawanieSal {

        @Test
        @DisplayName("Dodawanie: Pomyślne utworzenie sali przez administratora")
        void shouldAllowAdminToAddRoom() throws Exception {
            // Sprawdza, czy ADMIN może dodać nową salę (status 201 Created) oraz czy zapisze się ona w bazie.
            RoomRequest request = new RoomRequest("Room 101", "Main Building", 40, RoomType.COMPUTER, "Lab");

            mockMvc.perform(post("/rooms")
                            .header("Authorization", adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").exists())
                    .andExpect(jsonPath("$.name").value("Room 101"))
                    .andExpect(jsonPath("$.capacity").value(40));

            List<Room> rooms = roomRepository.findAll();
            assertThat(rooms).hasSize(1);
            assertThat(rooms.get(0).getName()).isEqualTo("Room 101");
        }

        @Test
        @DisplayName("Dodawanie: Zablokowanie studenta przed dodaniem sali")
        void shouldRejectStudentFromAddingRoom() throws Exception {
            // Sprawdza, czy STUDENT otrzyma status 403 Forbidden przy próbie utworzenia nowej sali.
            RoomRequest request = new RoomRequest("Room 102", "Main Building", 30, RoomType.LECTURE, "Lecture Hall");

            mockMvc.perform(post("/rooms")
                            .header("Authorization", studentToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden());

            assertThat(roomRepository.count()).isZero();
        }

        @Test
        @DisplayName("Dodawanie: Zablokowanie wykładowcy przed dodaniem sali")
        void shouldRejectLecturerFromAddingRoom() throws Exception {
            // Sprawdza, czy LECTURER otrzyma status 403 Forbidden przy próbie utworzenia nowej sali.
            RoomRequest request = new RoomRequest("Room 103", "Main Building", 30, RoomType.LECTURE, "Lecture Hall");

            mockMvc.perform(post("/rooms")
                            .header("Authorization", lecturerToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden());

            assertThat(roomRepository.count()).isZero();
        }

        @Test
        @DisplayName("Dodawanie: Odrzucenie zapytania w przypadku błędnej walidacji pól")
        void shouldRejectAddRoomWhenValidationFails() throws Exception {
            // Sprawdza, czy ujemna pojemność oraz pusta nazwa skutkują statusem 400 Bad Request.
            RoomRequest request = new RoomRequest("", "Main Building", -5, RoomType.COMPUTER, "Lab");

            mockMvc.perform(post("/rooms")
                            .header("Authorization", adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value(400))
                    .andExpect(jsonPath("$.error").exists());
        }
    }

    @Nested
    @DisplayName("Pobieranie i filtrowanie sal")
    class PobieranieIFiltrowanie {

        @Test
        @DisplayName("Listowanie: Pobranie sal z filtrem minimalnej pojemności")
        void shouldListRoomsWithFilters() throws Exception {
            // Sprawdza, czy filtr minCapacity działa prawidłowo i zwraca tylko pasujące sale (status 200 OK).
            Room r1 = new Room("Room 10", 10, RoomType.COMPUTER, "Main");
            Room r2 = new Room("Room 50", 50, RoomType.LECTURE, "Main");
            Room r3 = new Room("Room 100", 100, RoomType.CONFERENCE, "Main");
            roomRepository.saveAll(List.of(r1, r2, r3));

            mockMvc.perform(get("/rooms")
                            .header("Authorization", studentToken)
                            .param("minCapacity", "50"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$.length()").value(2))
                    .andExpect(jsonPath("$[?(@.capacity < 50)]").doesNotExist());
        }

        @Test
        @DisplayName("Listowanie: Filtrowanie sal po typie, budynku i zakresie pojemności")
        void shouldFilterRoomsByMultipleCriteria() throws Exception {
            // Sprawdza, czy łączenie filtrów (typ, budynek, zakres capacity) działa poprawnie i zwraca pasujące sale.
            Room r1 = new Room("Room 10", 10, RoomType.COMPUTER, "Building A");
            Room r2 = new Room("Room 50", 50, RoomType.LECTURE, "Building A");
            Room r3 = new Room("Room 100", 100, RoomType.CONFERENCE, "Building B");
            roomRepository.saveAll(List.of(r1, r2, r3));

            // Filtrowanie po typie
            mockMvc.perform(get("/rooms")
                            .header("Authorization", studentToken)
                            .param("type", "LECTURE"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(1))
                    .andExpect(jsonPath("$[0].name").value("Room 50"));

            // Filtrowanie po budynku
            mockMvc.perform(get("/rooms")
                            .header("Authorization", studentToken)
                            .param("building", "Building A"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(2));

            // Filtrowanie po zakresie capacity
            mockMvc.perform(get("/rooms")
                            .header("Authorization", studentToken)
                            .param("minCapacity", "15")
                            .param("maxCapacity", "80"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(1))
                    .andExpect(jsonPath("$[0].name").value("Room 50"));
        }

        @Test
        @DisplayName("Pobieranie: Pomyślne pobranie szczegółów sali po ID")
        void shouldReturnRoomByIdSuccessfully() throws Exception {
            // Sprawdza, czy wysłanie GET na /rooms/{id} zwraca dane konkretnej sali ze statusem 200 OK.
            Room room = new Room("Room Search", 12, RoomType.CONFERENCE, "Annex");
            room = roomRepository.save(room);
            UUID roomId = room.getId();

            mockMvc.perform(get("/rooms/" + roomId)
                            .header("Authorization", studentToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(roomId.toString()))
                    .andExpect(jsonPath("$.name").value("Room Search"))
                    .andExpect(jsonPath("$.buildingName").value("Annex"))
                    .andExpect(jsonPath("$.capacity").value(12))
                    .andExpect(jsonPath("$.roomType").value("CONFERENCE"));
        }

        @Test
        @DisplayName("Pobieranie: Zwrot statusu 404 w przypadku nieistniejącego ID sali")
        void shouldReturn404WhenRoomNotFound() throws Exception {
            // Sprawdza, czy zapytanie o nieistniejącą salę kończy się statusem 404 Not Found.
            UUID randomId = UUID.randomUUID();
            mockMvc.perform(get("/rooms/" + randomId)
                            .header("Authorization", studentToken))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.status").value(404))
                    .andExpect(jsonPath("$.error").value("Room not found: " + randomId));
        }
    }

    @Nested
    @DisplayName("Aktualizowanie danych sal")
    class AktualizacjaSal {

        @Test
        @DisplayName("Aktualizacja: Pomyślna modyfikacja danych sali przez administratora")
        void shouldAllowAdminToUpdateRoom() throws Exception {
            // Sprawdza, czy ADMIN może zaktualizować nazwę, budynek i pojemność sali (status 200 OK).
            Room room = new Room("Old Name", 10, RoomType.LECTURE, "Old Building");
            room = roomRepository.save(room);
            UUID roomId = room.getId();

            UpdateRoomRequest updateRequest = new UpdateRoomRequest("New Name", "New Building", 50, "Updated lab");

            mockMvc.perform(patch("/rooms/" + roomId)
                            .header("Authorization", adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(updateRequest)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(roomId.toString()))
                    .andExpect(jsonPath("$.name").value("New Name"))
                    .andExpect(jsonPath("$.capacity").value(50));

            Room updated = roomRepository.findById(roomId).orElse(null);
            assertThat(updated).isNotNull();
            assertThat(updated.getName()).isEqualTo("New Name");
            assertThat(updated.getCapacity()).isEqualTo(50);
            assertThat(updated.getBuildingName()).isEqualTo("New Building");
        }

        @Test
        @DisplayName("Aktualizacja: Zwrot statusu 404 przy próbie zmiany nieistniejącej sali")
        void shouldReturn404WhenAdminUpdatesNonExistentRoom() throws Exception {
            // Sprawdza, czy próba aktualizacji nieistniejącego ID sali zwraca status 404 Not Found.
            UUID nonExistentId = UUID.randomUUID();
            UpdateRoomRequest updateRequest = new UpdateRoomRequest("New Name", "New Building", 50, "Updated lab");

            mockMvc.perform(patch("/rooms/" + nonExistentId)
                            .header("Authorization", adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(updateRequest)))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.status").value(404))
                    .andExpect(jsonPath("$.error").value("Room not found: " + nonExistentId));
        }

        @Test
        @DisplayName("Aktualizacja: Częściowa aktualizacja pól sali (pola o wartości null nie są nadpisywane)")
        void shouldPerformPartialRoomUpdateSuccessfully() throws Exception {
            // Sprawdza, czy wysłanie wartości null dla niektórych pól w obiekcie żądania zachowa ich aktualny stan w bazie.
            Room room = new Room("Original Room", 30, RoomType.COMPUTER, "Original Building");
            room.setDescription("Original Description");
            room = roomRepository.save(room);
            UUID roomId = room.getId();

            UpdateRoomRequest updateRequest = new UpdateRoomRequest("Updated Room Name", null, null, null);

            mockMvc.perform(patch("/rooms/" + roomId)
                            .header("Authorization", adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(updateRequest)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.name").value("Updated Room Name"))
                    .andExpect(jsonPath("$.buildingName").value("Original Building"))
                    .andExpect(jsonPath("$.capacity").value(30))
                    .andExpect(jsonPath("$.description").value("Original Description"));

            Room updated = roomRepository.findById(roomId).orElseThrow();
            assertThat(updated.getName()).isEqualTo("Updated Room Name");
            assertThat(updated.getBuildingName()).isEqualTo("Original Building");
            assertThat(updated.getCapacity()).isEqualTo(30);
            assertThat(updated.getDescription()).isEqualTo("Original Description");
        }

        @Test
        @DisplayName("Aktualizacja: Odrzucenie modyfikacji sali przy błędnej walidacji pól")
        void shouldRejectUpdateRoomWhenValidationFails() throws Exception {
            // Sprawdza, czy ujemna pojemność w UpdateRoomRequest powoduje rzucenie błędu walidacji (status 400 Bad Request).
            Room room = new Room("Original Room", 30, RoomType.COMPUTER, "Original Building");
            room = roomRepository.save(room);
            UUID roomId = room.getId();

            UpdateRoomRequest updateRequest = new UpdateRoomRequest(null, null, -5, null);

            mockMvc.perform(patch("/rooms/" + roomId)
                            .header("Authorization", adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(updateRequest)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value(400))
                    .andExpect(jsonPath("$.error").exists());
        }
    }

    @Nested
    @DisplayName("Usuwanie sal")
    class UsuwanieSal {

        @Test
        @DisplayName("Usuwanie: Pomyślne usunięcie sali przez administratora")
        void shouldAllowAdminToDeleteRoom() throws Exception {
            // Sprawdza, czy ADMIN może trwale usunąć salę (status 204 No Content) z bazy danych.
            Room room = new Room("Room To Delete", 15, RoomType.CONFERENCE, "Old Building");
            room = roomRepository.save(room);
            UUID roomId = room.getId();

            mockMvc.perform(delete("/rooms/" + roomId)
                            .header("Authorization", adminToken))
                    .andExpect(status().isNoContent());

            assertThat(roomRepository.findById(roomId)).isEmpty();
        }

        @Test
        @DisplayName("Usuwanie: Usunięcie sali anuluje powiązane rezerwacje i zachowuje je w bazie")
        void shouldCancelAndKeepReservationsWhenDeletingRoom() throws Exception {
            Room room = new Room("Room With Reservations", 20, RoomType.LECTURE, "Building A");
            room = roomRepository.save(room);
            UUID roomId = room.getId();

            Reservation reservation = new Reservation(
                    room,
                    LocalDateTime.now().plusDays(1),
                    LocalDateTime.now().plusDays(1).plusHours(2),
                    STUDENT_USERNAME,
                    ReservationType.BOOKING,
                    "Lecture"
            );
            Reservation savedReservation = reservationRepository.save(reservation);

            mockMvc.perform(delete("/rooms/" + roomId)
                            .header("Authorization", adminToken))
                    .andExpect(status().isNoContent());

            assertThat(roomRepository.findById(roomId)).isEmpty();

            Reservation updatedReservation = reservationRepository.findById(savedReservation.getId()).orElseThrow();
            assertThat(updatedReservation.getStatus()).isEqualTo(ReservationStatus.CANCELLED);
            assertThat(updatedReservation.getRoom()).isNull();
        }

        @Test
        @DisplayName("Usuwanie: Zwrot statusu 404 przy próbie usunięcia nieistniejącej sali")
        void shouldReturn404WhenAdminDeletesNonExistentRoom() throws Exception {
            // Sprawdza, czy próba usunięcia nieistniejącego ID sali zwraca status 404 Not Found.
            UUID nonExistentId = UUID.randomUUID();
            mockMvc.perform(delete("/rooms/" + nonExistentId)
                            .header("Authorization", adminToken))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.status").value(404))
                    .andExpect(jsonPath("$.error").value("Room not found: " + nonExistentId));
        }
    }

    @Nested
    @DisplayName("Autoryzacja dostępu ról")
    class AutoryzacjaDostepu {

        @Test
        @DisplayName("Modyfikacje: Odrzucenie prób zmiany i usuwania sal przez nie-adminów (student/wykładowca)")
        void shouldRejectNonAdminsFromUpdatingOrDeletingRooms() throws Exception {
            // Sprawdza, czy role STUDENT oraz LECTURER otrzymują status 403 Forbidden przy próbie wykonania PATCH oraz DELETE na /rooms/{id}.
            Room room = new Room("Original Room", 30, RoomType.COMPUTER, "Original Building");
            room = roomRepository.save(room);
            UUID roomId = room.getId();

            UpdateRoomRequest updateRequest = new UpdateRoomRequest("Updated Room Name", null, null, null);

            // Student próbuje modyfikacji
            mockMvc.perform(patch("/rooms/" + roomId)
                            .header("Authorization", studentToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(updateRequest)))
                    .andExpect(status().isForbidden());

            // Wykładowca próbuje modyfikacji
            mockMvc.perform(patch("/rooms/" + roomId)
                            .header("Authorization", lecturerToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(updateRequest)))
                    .andExpect(status().isForbidden());

            // Student próbuje usunięcia
            mockMvc.perform(delete("/rooms/" + roomId)
                            .header("Authorization", studentToken))
                    .andExpect(status().isForbidden());

            // Wykładowca próbuje usunięcia
            mockMvc.perform(delete("/rooms/" + roomId)
                            .header("Authorization", lecturerToken))
                    .andExpect(status().isForbidden());
        }
    }
}
