package com.university.room_reservation.service;

import com.university.room_reservation.BaseIntegrationTest;
import com.university.room_reservation.config.BookingLimitsProperties;
import com.university.room_reservation.exception.BookingLimitExceededException;
import com.university.room_reservation.exception.InvalidTimeRangeException;
import com.university.room_reservation.model.*;
import com.university.room_reservation.repository.ReservationRepository;
import com.university.room_reservation.repository.RoomRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("Serwis rezerwacji - testy integracyjne")
class ReservationServiceIntegrationTest extends BaseIntegrationTest {

    private static final String STUDENT_USERNAME = "limit_student";
    private static final String ADMIN_USERNAME = "admin1";

    @Autowired
    private ReservationService reservationService;

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private BookingLimitsProperties bookingLimitsProperties;

    @BeforeEach
    void setUp() {
        reservationRepository.deleteAll();
        roomRepository.deleteAll();
    }

    @Nested
    @DisplayName("Walidacja i limity rezerwacji")
    class WalidacjaILimity {

        @Test
        @DisplayName("Limit: Rzucenie wyjątku przy dacie zakończenia przed datą rozpoczęcia")
        void shouldThrowExceptionWhenEndTimeIsBeforeStartTime() {
            // Sprawdza, czy próba zapisu rezerwacji z datą wsteczną rzuca wyjątek InvalidTimeRangeException.
            Room room = new Room("Room A", 30, RoomType.COMPUTER, "Building B");
            room = roomRepository.save(room);

            LocalDateTime start = LocalDateTime.now().plusDays(1);
            LocalDateTime end = start.minusHours(1);

            UUID roomId = room.getId();

            assertThatThrownBy(() -> reservationService.createReservation(
                    roomId, start, end, STUDENT_USERNAME, Role.STUDENT, "Group project"
            )).isInstanceOf(InvalidTimeRangeException.class);
        }
    }

    @Nested
    @DisplayName("Blokady oraz współbieżność")
    class BlokadyIWspolbieznosc {

        @Test
        @DisplayName("Blokada: Anulowanie nakładających się rezerwacji studentów przy nałożeniu blokady admina")
        void shouldCancelOverlappingReservationsWhenAdminCreatesBlock() {
            // Sprawdza, czy rezerwacje studenta nakładające się na czas nowej blokady admina zmieniają status na CANCELLED.
            Room room = new Room("Room A", 30, RoomType.COMPUTER, "Building B");
            room = roomRepository.save(room);

            LocalDateTime studentStart = LocalDateTime.now().plusDays(2).withHour(10).withMinute(0).withSecond(0).withNano(0);
            LocalDateTime studentEnd = studentStart.plusHours(2);

            Reservation studentReservation = new Reservation(room, studentStart, studentEnd, STUDENT_USERNAME, ReservationType.BOOKING, "Project work");
            studentReservation.setStatus(ReservationStatus.ACTIVE);
            studentReservation = reservationRepository.save(studentReservation);

            LocalDateTime adminStart = studentStart.plusHours(1);
            LocalDateTime adminEnd = studentEnd.plusHours(1);

            reservationService.createAdminBlock(room.getId(), adminStart, adminEnd, ADMIN_USERNAME, "Maintenance");

            Reservation updatedReservation = reservationRepository.findById(studentReservation.getId()).orElse(null);
            assertThat(updatedReservation).isNotNull();
            assertThat(updatedReservation.getStatus()).isEqualTo(ReservationStatus.CANCELLED);
        }

        @Test
        @DisplayName("Współbieżność: Zapobieganie podwójnej rezerwacji tej samej sali na ten sam czas")
        void shouldPreventDoubleBookingWithConcurrency() throws InterruptedException {
            // Uruchamia 10 wątków próbujących zarezerwować tę samą salę w tym samym czasie. Tylko jedna próba może się udać.
            Room room = new Room("Room Concurrency", 30, RoomType.COMPUTER, "Building B");
            room = roomRepository.save(room);
            UUID roomId = room.getId();

            LocalDateTime start = LocalDateTime.now().plusDays(3).withHour(10).withMinute(0).withSecond(0).withNano(0);
            LocalDateTime end = start.plusHours(2);

            int threadCount = 10;
            ExecutorService executorService = Executors.newFixedThreadPool(threadCount);
            CountDownLatch startLatch = new CountDownLatch(1);
            CountDownLatch endLatch = new CountDownLatch(threadCount);

            List<Exception> exceptions = Collections.synchronizedList(new ArrayList<>());
            List<Reservation> successfulReservations = Collections.synchronizedList(new ArrayList<>());

            for (int i = 0; i < threadCount; i++) {
                final String studentName = "student_concurrent_" + i;
                executorService.submit(() -> {
                    try {
                        startLatch.await();
                        Reservation res = reservationService.createReservation(
                                roomId, start, end, studentName, Role.STUDENT, "Exam Study"
                        );
                        successfulReservations.add(res);
                    } catch (Exception e) {
                        exceptions.add(e);
                    } finally {
                        endLatch.countDown();
                    }
                });
            }

            startLatch.countDown();
            endLatch.await();
            executorService.shutdown();

            assertThat(successfulReservations).hasSize(1);
            assertThat(exceptions).hasSize(threadCount - 1);
            for (Exception e : exceptions) {
                assertThat(e).isInstanceOf(com.university.room_reservation.exception.ReservationConflictException.class);
            }

            List<Reservation> reservationsInDb = reservationRepository.findAll();
            assertThat(reservationsInDb).hasSize(1);
            assertThat(reservationsInDb.get(0).getRoom().getId()).isEqualTo(roomId);
        }
    }
}
