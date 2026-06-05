package com.university.room_reservation.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.university.room_reservation.BaseIntegrationTest;
import com.university.room_reservation.dto.ReservationRequest;
import com.university.room_reservation.model.Reservation;
import com.university.room_reservation.model.ReservationStatus;
import com.university.room_reservation.model.ReservationType;
import com.university.room_reservation.model.Role;
import com.university.room_reservation.model.Room;
import com.university.room_reservation.model.RoomType;
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
import org.springframework.security.core.userdetails.User;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.university.room_reservation.dto.AdminBlockRequest;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@AutoConfigureMockMvc
@DisplayName("Kontroler rezerwacji - testy integracyjne")
class ReservationControllerIntegrationTest extends BaseIntegrationTest {

    private static final String DEFAULT_PASSWORD = "password";
    private static final String STUDENT_USERNAME = "student_user";
    private static final String ADMIN_USERNAME = "admin_user";
    private static final String LECTURER_USERNAME = "lecturer_user";

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    private String token;
    private String adminToken;
    private String lecturerToken;

    @BeforeEach
    void setUp() {
        reservationRepository.deleteAll();
        roomRepository.deleteAll();
        userRepository.deleteAll();

        // Generate token for a student
        var userDetails = User.builder()
                .username(STUDENT_USERNAME)
                .password(DEFAULT_PASSWORD)
                .authorities("ROLE_STUDENT")
                .build();
        token = "Bearer " + jwtService.generateToken(userDetails);

        // Generate token for an admin
        var adminDetails = User.builder()
                .username(ADMIN_USERNAME)
                .password(DEFAULT_PASSWORD)
                .authorities("ROLE_ADMIN")
                .build();
        adminToken = "Bearer " + jwtService.generateToken(adminDetails);

        // Generate token for a lecturer
        var lecturerDetails = User.builder()
                .username(LECTURER_USERNAME)
                .password(DEFAULT_PASSWORD)
                .authorities("ROLE_LECTURER")
                .build();
        lecturerToken = "Bearer " + jwtService.generateToken(lecturerDetails);
    }

    @Nested
    @DisplayName("Tworzenie rezerwacji")
    class TworzenieRezerwacji {

        @Test
        @DisplayName("Dodawanie: Pomyślne utworzenie rezerwacji przez studenta")
        void shouldCreateReservationSuccessfully() throws Exception {
            // Sprawdza, czy poprawny ReservationRequest od studenta tworzy rezerwację ze statusem 201 Created.
            Room room = new Room("Room C", 25, RoomType.COMPUTER, "Building C");
            room = roomRepository.save(room);

            LocalDateTime start = LocalDateTime.now().plusDays(1).withHour(10).withMinute(0).withSecond(0).withNano(0);
            LocalDateTime end = start.plusHours(2);

            ReservationRequest request = new ReservationRequest(room.getId(), start, end, "Exam Study");

            mockMvc.perform(post("/reservations")
                            .header("Authorization", token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").exists())
                    .andExpect(jsonPath("$.roomId").value(room.getId().toString()))
                    .andExpect(jsonPath("$.roomName").value("Room C"))
                    .andExpect(jsonPath("$.purpose").value("Exam Study"));

            assertThat(reservationRepository.count()).isEqualTo(1);
        }

        @Test
        @DisplayName("Dodawanie: Odrzucenie rezerwacji w przypadku daty zakończenia wcześniejszej niż rozpoczęcia")
        void shouldHandleDateTimeValidationError() throws Exception {
            // Sprawdza, czy wysłanie daty zakończenia przed rozpoczęciem skutkuje statusem 400 Bad Request.
            Room room = new Room("Room C", 25, RoomType.COMPUTER, "Building C");
            room = roomRepository.save(room);

            LocalDateTime start = LocalDateTime.now().plusDays(1).withHour(12).withMinute(0).withSecond(0).withNano(0);
            LocalDateTime end = start.minusHours(2);

            ReservationRequest request = new ReservationRequest(room.getId(), start, end, "Error study");

            mockMvc.perform(post("/reservations")
                            .header("Authorization", token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value(400))
                    .andExpect(jsonPath("$.error").value("End time must be after start time"));
        }

        @Test
        @DisplayName("Dodawanie: Odrzucenie rezerwacji z czasem rozpoczęcia w przeszłości")
        void shouldRejectReservationInThePast() throws Exception {
            // Sprawdza, czy próba rezerwacji z czasem w przeszłości skutkuje błędem 400 Bad Request.
            Room room = new Room("Room C", 25, RoomType.COMPUTER, "Building C");
            room = roomRepository.save(room);

            LocalDateTime start = LocalDateTime.now().minusDays(1);
            LocalDateTime end = start.plusHours(2);

            ReservationRequest request = new ReservationRequest(room.getId(), start, end, "Past Reservation");

            mockMvc.perform(post("/reservations")
                            .header("Authorization", token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value(400))
                    .andExpect(jsonPath("$.error").value("Reservation start time must be in the future"));
        }

        @Test
        @DisplayName("Dodawanie: Odrzucenie rezerwacji o zerowym czasie trwania")
        void shouldRejectZeroDurationReservation() throws Exception {
            // Sprawdza, czy rezerwacja o zerowym czasie trwania zwraca błąd 400 Bad Request.
            Room room = new Room("Room C", 25, RoomType.COMPUTER, "Building C");
            room = roomRepository.save(room);

            LocalDateTime start = LocalDateTime.now().plusDays(1).withHour(10).withMinute(0).withSecond(0).withNano(0);
            LocalDateTime end = start;

            ReservationRequest request = new ReservationRequest(room.getId(), start, end, "Zero Duration");

            mockMvc.perform(post("/reservations")
                            .header("Authorization", token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value(400))
                    .andExpect(jsonPath("$.error").value("End time must be after start time"));
        }

        @Test
        @DisplayName("Dodawanie: Pozwolenie na rezerwacje stykające się i odrzucenie nachodzących czasowo")
        void shouldAllowAdjoiningReservationsAndRejectOverlaps() throws Exception {
            // Sprawdza, czy nowa rezerwacja może zaczynać się dokładnie w minucie zakończenia poprzedniej, a nachodząca o minutę zostanie odrzucona (409 Conflict).
            Room room = new Room("Room C", 25, RoomType.COMPUTER, "Building C");
            room = roomRepository.save(room);

            LocalDateTime start1 = LocalDateTime.now().plusDays(1).withHour(10).withMinute(0).withSecond(0).withNano(0);
            LocalDateTime end1 = start1.plusHours(2);

            Reservation r1 = new Reservation(room, start1, end1, STUDENT_USERNAME, ReservationType.BOOKING, "First booking");
            r1.setStatus(ReservationStatus.ACTIVE);
            reservationRepository.save(r1);

            ReservationRequest requestAllowed = new ReservationRequest(room.getId(), end1, end1.plusHours(2), "Adjoining booking");
            mockMvc.perform(post("/reservations")
                            .header("Authorization", token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(requestAllowed)))
                    .andExpect(status().isCreated());

            ReservationRequest requestOverlapping = new ReservationRequest(room.getId(), end1.minusMinutes(1), end1.plusHours(2), "Overlapping booking");
            mockMvc.perform(post("/reservations")
                            .header("Authorization", token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(requestOverlapping)))
                    .andExpect(status().isConflict());
        }

        @Test
        @DisplayName("Dodawanie: Blokowanie studenta przed rezerwacją sal wykładowych/laboratoryjnych")
        void shouldRejectStudentBookingLecturerRooms() throws Exception {
            // Sprawdza, czy próba rezerwacji sali typu LECTURE przez studenta zostanie odrzucona ze statusem 403 Forbidden.
            Room roomLecture = new Room("Room Lecture", 50, RoomType.LECTURE, "Building C");
            roomLecture = roomRepository.save(roomLecture);

            LocalDateTime start = LocalDateTime.now().plusDays(1).withHour(10).withMinute(0).withSecond(0).withNano(0);
            LocalDateTime end = start.plusHours(2);

            ReservationRequest request = new ReservationRequest(roomLecture.getId(), start, end, "Student Study");

            mockMvc.perform(post("/reservations")
                            .header("Authorization", token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.status").value(403))
                    .andExpect(jsonPath("$.error").value("Role STUDENT is not allowed to book rooms of type: LECTURE"));
        }

        @Test
        @DisplayName("Dodawanie: Ograniczenie maksymalnego czasu trwania rezerwacji dla wykładowcy")
        void shouldEnforceLecturerDurationLimit() throws Exception {
            // Sprawdza, czy wykładowca otrzyma status 422 przy próbie rezerwacji na okres dłuższy niż 4 godziny.
            Room room = new Room("Room C", 25, RoomType.COMPUTER, "Building C");
            room = roomRepository.save(room);

            LocalDateTime start = LocalDateTime.now().plusDays(1).withHour(10).withMinute(0).withSecond(0).withNano(0);
            LocalDateTime end = start.plusHours(5);

            ReservationRequest request = new ReservationRequest(room.getId(), start, end, "Long lecture");

            mockMvc.perform(post("/reservations")
                            .header("Authorization", lecturerToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnprocessableEntity())
                    .andExpect(jsonPath("$.status").value(422))
                    .andExpect(jsonPath("$.error").value("Reservation exceeds maximum allowed duration of 4 hours"));
        }

        @Test
        @DisplayName("Dodawanie: Ograniczenie tygodniowej liczby rezerwacji dla wykładowcy")
        void shouldEnforceLecturerWeeklyLimit() throws Exception {
            // Sprawdza, czy wykładowca otrzyma status 422 przy próbie wykonania 11 rezerwacji w jednym tygodniu (limit wynosi 10).
            Room room = new Room("Room C", 25, RoomType.COMPUTER, "Building C");
            room = roomRepository.save(room);

            java.time.LocalDateTime nextMonday = java.time.LocalDateTime.now()
                    .plusWeeks(1)
                    .with(java.time.temporal.TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY))
                    .toLocalDate()
                    .atStartOfDay();

            for (int i = 0; i < 10; i++) {
                LocalDateTime bookingStart = nextMonday.plusHours(i * 2);
                LocalDateTime bookingEnd = bookingStart.plusHours(1);
                Reservation reservation = new Reservation(room, bookingStart, bookingEnd, LECTURER_USERNAME, ReservationType.BOOKING, "Lecture " + i);
                reservation.setStatus(ReservationStatus.ACTIVE);
                reservationRepository.save(reservation);
            }

            LocalDateTime targetStart = nextMonday.plusDays(1);
            LocalDateTime targetEnd = targetStart.plusHours(1);

            ReservationRequest request = new ReservationRequest(room.getId(), targetStart, targetEnd, "11th Lecture");

            mockMvc.perform(post("/reservations")
                            .header("Authorization", lecturerToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnprocessableEntity())
                    .andExpect(jsonPath("$.status").value(422))
                    .andExpect(jsonPath("$.error").value("Weekly reservation limit of 10 reached"));
        }

        @Test
        @DisplayName("Dodawanie: Ograniczenie tygodniowej liczby rezerwacji dla studenta")
        void shouldEnforceWeeklyLimitForStudent() throws Exception {
            // Sprawdza, czy student otrzyma status 422 przy próbie wykonania 6 rezerwacji w jednym tygodniu (limit wynosi 5).
            Room room = new Room("Room C", 25, RoomType.COMPUTER, "Building C");
            room = roomRepository.save(room);

            java.time.LocalDateTime nextMonday = java.time.LocalDateTime.now()
                    .plusWeeks(1)
                    .with(java.time.temporal.TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY))
                    .toLocalDate()
                    .atStartOfDay();

            for (int i = 0; i < 5; i++) {
                LocalDateTime bookingStart = nextMonday.plusHours(i * 2);
                LocalDateTime bookingEnd = bookingStart.plusHours(1);
                Reservation reservation = new Reservation(room, bookingStart, bookingEnd, STUDENT_USERNAME, ReservationType.BOOKING, "Study " + i);
                reservation.setStatus(ReservationStatus.ACTIVE);
                reservationRepository.save(reservation);
            }

            LocalDateTime targetStart = nextMonday.plusDays(1);
            LocalDateTime targetEnd = targetStart.plusHours(1);

            ReservationRequest request = new ReservationRequest(room.getId(), targetStart, targetEnd, "6th Study");

            mockMvc.perform(post("/reservations")
                            .header("Authorization", token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnprocessableEntity())
                    .andExpect(jsonPath("$.status").value(422))
                    .andExpect(jsonPath("$.error").value("Weekly reservation limit of 5 reached"));
        }

        @Test
        @DisplayName("Dodawanie: Odrzucenie rezerwacji przy braku wymaganych pól (null)")
        void shouldRejectCreateReservationWhenFieldsAreNull() throws Exception {
            // Sprawdza, czy brak podania roomId lub dat rozpoczęcia/zakończenia zwraca status 400 Bad Request.
            ReservationRequest request = new ReservationRequest(null, null, null, "Null study");

            mockMvc.perform(post("/reservations")
                            .header("Authorization", token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value(400));
        }
    }

    @Nested
    @DisplayName("Listowanie i szczegóły rezerwacji")
    class ListowanieISzczegoly {

        @Test
        @DisplayName("Listowanie: Maskowanie danych rezerwującego dla zapytań studenta")
        void shouldMaskBookerNameWhenStudentListsReservations() throws Exception {
            // Sprawdza, czy w odpowiedzi dla roli STUDENT pole bookerName nie jest zwracane w JSON-ie (status 200 OK).
            Room room = new Room("Room C", 25, RoomType.COMPUTER, "Building C");
            room = roomRepository.save(room);

            LocalDateTime start = LocalDateTime.now().plusDays(1).withHour(10).withMinute(0).withSecond(0).withNano(0);
            LocalDateTime end = start.plusHours(2);

            Reservation res = new Reservation(room, start, end, "jan_kowalski", ReservationType.BOOKING, "Exam Study");
            res.setStatus(ReservationStatus.ACTIVE);
            reservationRepository.save(res);

            mockMvc.perform(get("/reservations")
                            .header("Authorization", token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$.length()").value(1))
                    .andExpect(jsonPath("$[0].bookerName").doesNotExist());
        }

        @Test
        @DisplayName("Listowanie: Wyświetlenie pełnych danych rezerwującego dla zapytań administratora")
        void shouldShowFullDataWhenAdminListsReservations() throws Exception {
            // Sprawdza, czy w odpowiedzi dla roli ADMIN pole bookerName zawiera prawdziwą nazwę rezerwującego.
            Room room = new Room("Room C", 25, RoomType.COMPUTER, "Building C");
            room = roomRepository.save(room);

            LocalDateTime start = LocalDateTime.now().plusDays(1).withHour(10).withMinute(0).withSecond(0).withNano(0);
            LocalDateTime end = start.plusHours(2);

            Reservation res = new Reservation(room, start, end, "jan_kowalski", ReservationType.BOOKING, "Exam Study");
            res.setStatus(ReservationStatus.ACTIVE);
            reservationRepository.save(res);

            mockMvc.perform(get("/reservations")
                            .header("Authorization", adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$.length()").value(1))
                    .andExpect(jsonPath("$[0].bookerName").value("jan_kowalski"));
        }

        @Test
        @DisplayName("Listowanie: Zablokowanie studenta przed filtrowaniem po nazwie użytkownika")
        void shouldRejectStudentFromFilteringByUsername() throws Exception {
            // Sprawdza, czy próba filtrowania rezerwacji po konkretnym użytkowniku przez studenta zwróci status 403 Forbidden.
            mockMvc.perform(get("/reservations")
                            .header("Authorization", token)
                            .param("username", STUDENT_USERNAME))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Listowanie: Pobranie własnych rezerwacji zalogowanego użytkownika")
        void shouldListCurrentUsersOwnReservations() throws Exception {
            // Sprawdza, czy endpoint /reservations/my zwraca tylko rezerwacje powiązane z zalogowanym studentem (status 200 OK).
            Room room = new Room("Room C", 25, RoomType.COMPUTER, "Building C");
            room = roomRepository.save(room);

            LocalDateTime start = LocalDateTime.now().plusDays(1).withHour(10).withMinute(0).withSecond(0).withNano(0);
            LocalDateTime end = start.plusHours(2);

            Reservation r1 = new Reservation(room, start, end, STUDENT_USERNAME, ReservationType.BOOKING, "My Study");
            r1.setStatus(ReservationStatus.ACTIVE);
            reservationRepository.save(r1);

            Reservation r2 = new Reservation(room, start.plusDays(1), end.plusDays(1), "ktos_inny", ReservationType.BOOKING, "Other Study");
            r2.setStatus(ReservationStatus.ACTIVE);
            reservationRepository.save(r2);

            mockMvc.perform(get("/reservations/my")
                            .header("Authorization", token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$.length()").value(1))
                    .andExpect(jsonPath("$[0].bookerName").value(STUDENT_USERNAME));
        }

        @Test
        @DisplayName("Szczegóły: Pobranie szczegółowych danych rezerwacji przez administratora wraz z profilem rezerwującego")
        void shouldAdminGetReservationDetailsSuccessfully() throws Exception {
            // Sprawdza, czy ADMIN otrzymuje pełne szczegóły rezerwacji włącznie z obiektem booker (status 200 OK).
            Room room = new Room("Room C", 25, RoomType.COMPUTER, "Building C");
            room = roomRepository.save(room);

            com.university.room_reservation.model.User user = new com.university.room_reservation.model.User();
            user.setUsername(STUDENT_USERNAME);
            user.setPassword(DEFAULT_PASSWORD);
            user.setEmail("student@university.com");
            user.setRole(Role.STUDENT);
            user.setName("Alice");
            user.setSurname("Smith");
            userRepository.save(user);

            LocalDateTime start = LocalDateTime.now().plusDays(1).withHour(10).withMinute(0).withSecond(0).withNano(0);
            LocalDateTime end = start.plusHours(2);

            Reservation res = new Reservation(room, start, end, STUDENT_USERNAME, ReservationType.BOOKING, "Project");
            res.setStatus(ReservationStatus.ACTIVE);
            res = reservationRepository.save(res);

            mockMvc.perform(get("/reservations/" + res.getId())
                            .header("Authorization", adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(res.getId().toString()))
                    .andExpect(jsonPath("$.booker.username").value(STUDENT_USERNAME))
                    .andExpect(jsonPath("$.booker.email").value("student@university.com"));
        }

        @Test
        @DisplayName("Szczegóły: Zwrot statusu 404 dla administratora, gdy profil rezerwującego nie istnieje w bazie")
        void shouldReturn404WhenAdminGetsReservationWithDeletedBooker() throws Exception {
            // Sprawdza, czy brak profilu rezerwującego w bazie (np. usunięty użytkownik) zwraca status 404 Not Found przy żądaniu szczegółów przez ADMIN-a.
            Room room = new Room("Room C", 25, RoomType.COMPUTER, "Building C");
            room = roomRepository.save(room);

            LocalDateTime start = LocalDateTime.now().plusDays(1).withHour(10).withMinute(0).withSecond(0).withNano(0);
            LocalDateTime end = start.plusHours(2);

            Reservation res = new Reservation(room, start, end, "deleted_user", ReservationType.BOOKING, "Ghost booking");
            res.setStatus(ReservationStatus.ACTIVE);
            res = reservationRepository.save(res);

            mockMvc.perform(get("/reservations/" + res.getId())
                            .header("Authorization", adminToken))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.status").value(404))
                    .andExpect(jsonPath("$.error").value("User not found: deleted_user"));
        }

        @Test
        @DisplayName("Szczegóły: Pomyślne pobranie własnych szczegółów rezerwacji przez studenta (uproszczony widok publiczny)")
        void shouldAllowStudentToGetOwnReservationDetails() throws Exception {
            // Sprawdza, czy student może pobrać szczegóły własnej rezerwacji. Widok powinien być uproszczony (brak bookera).
            Room room = new Room("Room C", 25, RoomType.COMPUTER, "Building C");
            room = roomRepository.save(room);

            LocalDateTime start = LocalDateTime.now().plusDays(1).withHour(10).withMinute(0).withSecond(0).withNano(0);
            LocalDateTime end = start.plusHours(2);

            Reservation res = new Reservation(room, start, end, STUDENT_USERNAME, ReservationType.BOOKING, "Own booking");
            res.setStatus(ReservationStatus.ACTIVE);
            res = reservationRepository.save(res);

            mockMvc.perform(get("/reservations/" + res.getId())
                            .header("Authorization", token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(res.getId().toString()))
                    .andExpect(jsonPath("$.purpose").value("Own booking"))
                    .andExpect(jsonPath("$.booker").doesNotExist());
        }

        @Test
        @DisplayName("Szczegóły: Zwrot statusu 404 (ReservationNotFound) przy próbie pobrania cudzej rezerwacji przez studenta")
        void shouldReturn404WhenStudentGetsSomeoneElsesReservationDetails() throws Exception {
            // Sprawdza, czy próba pobrania szczegółów cudzej rezerwacji przez studenta kończy się statusem 404.
            Room room = new Room("Room C", 25, RoomType.COMPUTER, "Building C");
            room = roomRepository.save(room);

            LocalDateTime start = LocalDateTime.now().plusDays(1).withHour(10).withMinute(0).withSecond(0).withNano(0);
            LocalDateTime end = start.plusHours(2);

            Reservation res = new Reservation(room, start, end, "someone_else", ReservationType.BOOKING, "Someone else's booking");
            res.setStatus(ReservationStatus.ACTIVE);
            res = reservationRepository.save(res);

            mockMvc.perform(get("/reservations/" + res.getId())
                            .header("Authorization", token))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.status").value(404))
                    .andExpect(jsonPath("$.error").value("Rezerwacja nie znaleziona: " + res.getId()));
        }

        @Test
        @DisplayName("Szczegóły: Zwrot statusu 404 (ReservationNotFound) przy próbie pobrania nieistniejącej rezerwacji")
        void shouldReturn404WhenGettingNonExistentReservationDetails() throws Exception {
            // Sprawdza, czy żądanie o szczegóły nieistniejącej rezerwacji zwraca status 404.
            UUID nonExistentId = UUID.randomUUID();

            mockMvc.perform(get("/reservations/" + nonExistentId)
                            .header("Authorization", token))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.status").value(404))
                    .andExpect(jsonPath("$.error").value("Rezerwacja nie znaleziona: " + nonExistentId));
        }
    }

    @Nested
    @DisplayName("Anulowanie rezerwacji")
    class AnulowanieRezerwacji {

        @Test
        @DisplayName("Anulowanie: Pomyślne anulowanie własnej rezerwacji przez studenta")
        void shouldCancelOwnReservationSuccessfully() throws Exception {
            // Sprawdza, czy student może anulować swoją własną rezerwację (status 204 No Content) zmieniając jej status w bazie na CANCELLED.
            Room room = new Room("Room C", 25, RoomType.COMPUTER, "Building C");
            room = roomRepository.save(room);

            LocalDateTime start = LocalDateTime.now().plusDays(1).withHour(10).withMinute(0).withSecond(0).withNano(0);
            LocalDateTime end = start.plusHours(2);

            Reservation res = new Reservation(room, start, end, STUDENT_USERNAME, ReservationType.BOOKING, "Exam Study");
            res.setStatus(ReservationStatus.ACTIVE);
            res = reservationRepository.save(res);

            mockMvc.perform(delete("/reservations/" + res.getId())
                            .header("Authorization", token))
                    .andExpect(status().isNoContent());

            Reservation cancelled = reservationRepository.findById(res.getId()).orElse(null);
            assertThat(cancelled).isNotNull();
            assertThat(cancelled.getStatus()).isEqualTo(ReservationStatus.CANCELLED);
        }

        @Test
        @DisplayName("Anulowanie: Zablokowanie próby anulowania cudzej rezerwacji")
        void shouldRejectCancelingSomeoneElsesReservation() throws Exception {
            // Sprawdza, czy próba anulowania rezerwacji innego studenta zwraca status 403 Forbidden.
            Room room = new Room("Room C", 25, RoomType.COMPUTER, "Building C");
            room = roomRepository.save(room);

            LocalDateTime start = LocalDateTime.now().plusDays(1).withHour(10).withMinute(0).withSecond(0).withNano(0);
            LocalDateTime end = start.plusHours(2);

            Reservation res = new Reservation(room, start, end, "ktos_inny", ReservationType.BOOKING, "Other Study");
            res.setStatus(ReservationStatus.ACTIVE);
            res = reservationRepository.save(res);

            mockMvc.perform(delete("/reservations/" + res.getId())
                            .header("Authorization", token))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Anulowanie: Zwrot statusu 404 przy próbie anulowania rezerwacji o statusie CANCELLED")
        void shouldReturn404WhenCancelingAlreadyCancelledReservation() throws Exception {
            // Sprawdza, czy ponowna próba anulowania już wcześniej anulowanej rezerwacji zwraca status 404 Not Found.
            Room room = new Room("Room C", 25, RoomType.COMPUTER, "Building C");
            room = roomRepository.save(room);

            LocalDateTime start = LocalDateTime.now().plusDays(1).withHour(10).withMinute(0).withSecond(0).withNano(0);
            LocalDateTime end = start.plusHours(2);

            Reservation res = new Reservation(room, start, end, STUDENT_USERNAME, ReservationType.BOOKING, "Cancelled booking");
            res.setStatus(ReservationStatus.CANCELLED);
            res = reservationRepository.save(res);

            mockMvc.perform(delete("/reservations/" + res.getId())
                            .header("Authorization", token))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.status").value(404));
        }

        @Test
        @DisplayName("Anulowanie: Pomyślne anulowanie rezerwacji studenta przez administratora")
        void shouldAllowAdminToCancelOtherUserReservations() throws Exception {
            // Sprawdza, czy ADMIN może bez problemu anulować aktywną rezerwację studenta (status 204 No Content).
            Room room = new Room("Room C", 25, RoomType.COMPUTER, "Building C");
            room = roomRepository.save(room);

            LocalDateTime start = LocalDateTime.now().plusDays(1).withHour(10).withMinute(0).withSecond(0).withNano(0);
            LocalDateTime end = start.plusHours(2);

            Reservation res = new Reservation(room, start, end, STUDENT_USERNAME, ReservationType.BOOKING, "Student study");
            res.setStatus(ReservationStatus.ACTIVE);
            res = reservationRepository.save(res);

            mockMvc.perform(delete("/reservations/" + res.getId())
                            .header("Authorization", adminToken))
                    .andExpect(status().isNoContent());

            Reservation cancelled = reservationRepository.findById(res.getId()).orElseThrow();
            assertThat(cancelled.getStatus()).isEqualTo(ReservationStatus.CANCELLED);
        }
    }

    @Nested
    @DisplayName("Blokady administracyjne")
    class BlokadyAdministracyjne {

        @Test
        @DisplayName("Blokada: Pomyślne utworzenie blokady wyłączenia sali przez administratora")
        void shouldAllowAdminToCreateUnavailabilityBlock() throws Exception {
            // Sprawdza, czy ADMIN może utworzyć blokadę sali (ADMIN_BLOCK) ze statusem 201 Created.
            Room room = new Room("Room C", 25, RoomType.COMPUTER, "Building C");
            room = roomRepository.save(room);

            LocalDateTime start = LocalDateTime.now().plusDays(1).withHour(10).withMinute(0).withSecond(0).withNano(0);
            LocalDateTime end = start.plusHours(2);

            AdminBlockRequest blockRequest = new AdminBlockRequest(room.getId(), start, end, "Maintenance");

            mockMvc.perform(post("/reservations/blocks")
                            .header("Authorization", adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(blockRequest)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").exists());

            List<Reservation> blocks = reservationRepository.findAll().stream()
                    .filter(r -> r.getType() == ReservationType.ADMIN_BLOCK)
                    .toList();
            assertThat(blocks).hasSize(1);
            assertThat(blocks.get(0).getPurpose()).isEqualTo("Maintenance");
        }

        @Test
        @DisplayName("Blokada: Pomyślne usunięcie blokady przez administratora")
        void shouldAllowAdminToDeleteAdminBlock() throws Exception {
            // Sprawdza, czy ADMIN może usunąć wcześniej zapisaną blokadę (status 204 No Content) usuwając ją trwale z bazy.
            Room room = new Room("Room C", 25, RoomType.COMPUTER, "Building C");
            room = roomRepository.save(room);

            LocalDateTime start = LocalDateTime.now().plusDays(1).withHour(10).withMinute(0).withSecond(0).withNano(0);
            LocalDateTime end = start.plusHours(2);

            Reservation block = new Reservation(room, start, end, ADMIN_USERNAME, ReservationType.ADMIN_BLOCK, "Maintenance");
            block.setStatus(ReservationStatus.ACTIVE);
            block = reservationRepository.save(block);

            mockMvc.perform(delete("/reservations/blocks/" + block.getId())
                            .header("Authorization", adminToken))
                    .andExpect(status().isNoContent());

            assertThat(reservationRepository.findById(block.getId())).isEmpty();
        }

        @Test
        @DisplayName("Blokada: Zwrot statusu 404 przy próbie usunięcia nieistniejącej blokady")
        void shouldReturn404WhenDeletingNonExistentAdminBlock() throws Exception {
            // Sprawdza, czy usuwanie nieistniejącego ID blokady zwraca status 404 Not Found.
            UUID nonExistentId = UUID.randomUUID();

            mockMvc.perform(delete("/reservations/blocks/" + nonExistentId)
                            .header("Authorization", adminToken))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.status").value(404))
                    .andExpect(jsonPath("$.error").value("Rezerwacja nie znaleziona: " + nonExistentId));
        }

        @Test
        @DisplayName("Blokada: Odrzucenie próby usunięcia rezerwacji studenta przez endpoint usuwania blokad")
        void shouldRejectDeletingBookingAsAdminBlock() throws Exception {
            // Sprawdza, czy próba wywołania DELETE /reservations/blocks/{id} dla zwykłej rezerwacji zwróci status 404 Not Found.
            Room room = new Room("Room C", 25, RoomType.COMPUTER, "Building C");
            room = roomRepository.save(room);

            LocalDateTime start = LocalDateTime.now().plusDays(1).withHour(10).withMinute(0).withSecond(0).withNano(0);
            LocalDateTime end = start.plusHours(2);

            Reservation res = new Reservation(room, start, end, STUDENT_USERNAME, ReservationType.BOOKING, "Study group");
            res.setStatus(ReservationStatus.ACTIVE);
            res = reservationRepository.save(res);

            mockMvc.perform(delete("/reservations/blocks/" + res.getId())
                            .header("Authorization", adminToken))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("Blokada: Stykanie się czasowe blokady i rezerwacji nie powinno powodować anulowania rezerwacji")
        void shouldNotCancelAdjoiningStudentBookingWhenAdminBlockCreated() throws Exception {
            // Sprawdza, czy dodanie blokady stykającej się z rezerwacją studenta (np. blokada od 12:00 do 14:00, rezerwacja do 12:00) nie anuluje jej.
            Room room = new Room("Room C", 25, RoomType.COMPUTER, "Building C");
            room = roomRepository.save(room);

            LocalDateTime studentStart = LocalDateTime.now().plusDays(1).withHour(10).withMinute(0).withSecond(0).withNano(0);
            LocalDateTime studentEnd = studentStart.plusHours(2);

            Reservation studentRes = new Reservation(room, studentStart, studentEnd, STUDENT_USERNAME, ReservationType.BOOKING, "Project");
            studentRes.setStatus(ReservationStatus.ACTIVE);
            studentRes = reservationRepository.save(studentRes);

            AdminBlockRequest blockRequest = new AdminBlockRequest(room.getId(), studentEnd, studentEnd.plusHours(2), "Maintenance");

            mockMvc.perform(post("/reservations/blocks")
                            .header("Authorization", adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(blockRequest)))
                    .andExpect(status().isCreated());

            Reservation checkRes = reservationRepository.findById(studentRes.getId()).orElseThrow();
            assertThat(checkRes.getStatus()).isEqualTo(ReservationStatus.ACTIVE);
        }

        @Test
        @DisplayName("Blokada: Odrzucenie utworzenia blokady przy braku wymaganych pól (null)")
        void shouldRejectCreateAdminBlockWhenFieldsAreNull() throws Exception {
            // Sprawdza, czy brak podania roomId lub dat rozpoczęcia/zakończenia przy tworzeniu blokady zwraca status 400 Bad Request.
            AdminBlockRequest blockRequest = new AdminBlockRequest(null, null, null, "Null block");

            mockMvc.perform(post("/reservations/blocks")
                            .header("Authorization", adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(blockRequest)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value(400));
        }

        @Test
        @DisplayName("Blokada: Zablokowanie nie-adminów przed utworzeniem blokady")
        void shouldRejectNonAdminsFromCreatingAdminBlock() throws Exception {
            // Sprawdza, czy student oraz wykładowca otrzymują status 403 Forbidden przy próbie utworzenia blokady.
            Room room = new Room("Room C", 25, RoomType.COMPUTER, "Building C");
            room = roomRepository.save(room);

            LocalDateTime start = LocalDateTime.now().plusDays(1).withHour(10).withMinute(0).withSecond(0).withNano(0);
            LocalDateTime end = start.plusHours(2);

            AdminBlockRequest blockRequest = new AdminBlockRequest(room.getId(), start, end, "Maintenance");

            // Student próbuje
            mockMvc.perform(post("/reservations/blocks")
                            .header("Authorization", token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(blockRequest)))
                    .andExpect(status().isForbidden());

            // Wykładowca próbuje
            mockMvc.perform(post("/reservations/blocks")
                            .header("Authorization", lecturerToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(blockRequest)))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Blokada: Zablokowanie nie-adminów przed usunięciem blokady")
        void shouldRejectNonAdminsFromDeletingAdminBlock() throws Exception {
            // Sprawdza, czy student oraz wykładowca otrzymują status 403 Forbidden przy próbie usunięcia blokady.
            Room room = new Room("Room C", 25, RoomType.COMPUTER, "Building C");
            room = roomRepository.save(room);

            LocalDateTime start = LocalDateTime.now().plusDays(1).withHour(10).withMinute(0).withSecond(0).withNano(0);
            LocalDateTime end = start.plusHours(2);

            Reservation block = new Reservation(room, start, end, ADMIN_USERNAME, ReservationType.ADMIN_BLOCK, "Maintenance");
            block.setStatus(ReservationStatus.ACTIVE);
            block = reservationRepository.save(block);

            // Student próbuje
            mockMvc.perform(delete("/reservations/blocks/" + block.getId())
                            .header("Authorization", token))
                    .andExpect(status().isForbidden());

            // Wykładowca próbuje
            mockMvc.perform(delete("/reservations/blocks/" + block.getId())
                            .header("Authorization", lecturerToken))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("Sprawdzanie dostępności sal")
    class SprawdzanieDostepnosci {

        @Test
        @DisplayName("Dostępność: Pomyślne sprawdzenie dostępności dla wolnego przedziału czasu")
        void shouldCheckAvailabilitySuccessfully() throws Exception {
            // Sprawdza, czy dla pustego przedziału czasowego system poprawnie zwraca status 200 OK i flagę available: true.
            Room room = new Room("Room C", 25, RoomType.COMPUTER, "Building C");
            room = roomRepository.save(room);

            LocalDateTime start = LocalDateTime.now().plusDays(1).withHour(14).withMinute(0).withSecond(0).withNano(0);
            LocalDateTime end = start.plusHours(2);

            mockMvc.perform(get("/rooms/" + room.getId() + "/availability")
                            .header("Authorization", token)
                            .param("startTime", start.toString())
                            .param("endTime", end.toString()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.available").value(true))
                    .andExpect(jsonPath("$.conflicts").doesNotExist());
        }

        @Test
        @DisplayName("Dostępność: Ignorowanie anulowanych rezerwacji przy określaniu konfliktów")
        void shouldIgnoreCancelledReservationsInAvailabilityCheck() throws Exception {
            // Sprawdza, czy rezerwacje o statusie CANCELLED w wybranym przedziale czasowym są ignorowane i nie generują konfliktów.
            Room room = new Room("Room C", 25, RoomType.COMPUTER, "Building C");
            room = roomRepository.save(room);

            LocalDateTime start = LocalDateTime.now().plusDays(1).withHour(10).withMinute(0).withSecond(0).withNano(0);
            LocalDateTime end = start.plusHours(2);

            Reservation cancelledRes = new Reservation(room, start, end, STUDENT_USERNAME, ReservationType.BOOKING, "Cancelled Study");
            cancelledRes.setStatus(ReservationStatus.CANCELLED);
            reservationRepository.save(cancelledRes);

            mockMvc.perform(get("/rooms/" + room.getId() + "/availability")
                            .header("Authorization", token)
                            .param("startTime", start.toString())
                            .param("endTime", end.toString()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.available").value(true))
                    .andExpect(jsonPath("$.conflicts").doesNotExist());
        }

        @Test
        @DisplayName("Dostępność: Zwrot statusu 400 przy niepoprawnym zakresie czasu (zakończenie przed rozpoczęciem)")
        void shouldReturn400WhenCheckingAvailabilityWithInvalidTimeRange() throws Exception {
            // Sprawdza, czy nieprawidłowe daty wejścia (koniec przed rozpoczęciem) w zapytaniu o dostępność skutkują statusem 400 Bad Request.
            Room room = new Room("Room C", 25, RoomType.COMPUTER, "Building C");
            room = roomRepository.save(room);

            LocalDateTime start = LocalDateTime.now().plusDays(1).withHour(10).withMinute(0).withSecond(0).withNano(0);
            LocalDateTime end = start.minusHours(1);

            mockMvc.perform(get("/rooms/" + room.getId() + "/availability")
                            .header("Authorization", token)
                            .param("startTime", start.toString())
                            .param("endTime", end.toString()))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value(400))
                    .andExpect(jsonPath("$.error").value("End time must be after start time"));
        }

        @Test
        @DisplayName("Dostępność: Zwrot statusu 404 dla nieistniejącego ID sali")
        void shouldReturn404WhenCheckingAvailabilityForNonExistentRoom() throws Exception {
            // Sprawdza, czy zapytanie o dostępność sali, która nie istnieje w bazie, zwraca status 404 Not Found.
            UUID nonExistentId = UUID.randomUUID();
            LocalDateTime start = LocalDateTime.now().plusDays(1).withHour(10).withMinute(0).withSecond(0).withNano(0);
            LocalDateTime end = start.plusHours(2);

            mockMvc.perform(get("/rooms/" + nonExistentId + "/availability")
                            .header("Authorization", token)
                            .param("startTime", start.toString())
                            .param("endTime", end.toString()))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.status").value(404))
                    .andExpect(jsonPath("$.error").value("Room not found: " + nonExistentId));
        }
    }
}
