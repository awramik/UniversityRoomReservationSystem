package com.university.room_reservation.service;

import com.university.room_reservation.dto.RoomRequest;
import com.university.room_reservation.dto.UpdateRoomRequest;
import com.university.room_reservation.exception.RoomNotFoundException;
import com.university.room_reservation.model.Room;
import com.university.room_reservation.model.RoomType;
import com.university.room_reservation.repository.ReservationRepository;
import com.university.room_reservation.repository.RoomRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Serwis sal - testy jednostkowe Mockito")
class RoomServiceTest {

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private ReservationRepository reservationRepository;

    @InjectMocks
    private RoomServiceImpl roomService;

    @Nested
    @DisplayName("Dodawanie sali")
    class DodawanieSali {

        @Test
        @DisplayName("Sukces: Pomyślne dodanie sali z opisem")
        void shouldAddRoomSuccessfully() {
            RoomRequest request = new RoomRequest("Room 101", "Main Building", 40, RoomType.COMPUTER, "Lab room");
            Room savedRoom = new Room("Room 101", 40, RoomType.COMPUTER, "Main Building");
            savedRoom.setDescription("Lab room");

            when(roomRepository.save(any(Room.class))).thenReturn(savedRoom);

            Room result = roomService.addRoom(request);

            assertThat(result.getName()).isEqualTo("Room 101");
            assertThat(result.getCapacity()).isEqualTo(40);
            assertThat(result.getRoomType()).isEqualTo(RoomType.COMPUTER);
            assertThat(result.getBuildingName()).isEqualTo("Main Building");
            assertThat(result.getDescription()).isEqualTo("Lab room");

            verify(roomRepository, times(1)).save(any(Room.class));
        }
    }

    @Nested
    @DisplayName("Usuwanie sali")
    class UsuwanieSali {

        @Test
        @DisplayName("Sukces: Pomyślne usunięcie sali oraz anulowanie powiązanych z nią rezerwacji")
        void shouldRemoveRoomSuccessfully() {
            UUID roomId = UUID.randomUUID();
            when(roomRepository.existsById(roomId)).thenReturn(true);

            roomService.removeRoom(roomId);

            verify(reservationRepository, times(1)).cancelAndDetachByRoomId(roomId);
            verify(roomRepository, times(1)).deleteById(roomId);
        }

        @Test
        @DisplayName("Błąd: Rzucenie wyjątku RoomNotFoundException przy próbie usunięcia nieistniejącej sali")
        void shouldThrowRoomNotFoundWhenRemovingNonExistentRoom() {
            UUID roomId = UUID.randomUUID();
            when(roomRepository.existsById(roomId)).thenReturn(false);

            assertThatThrownBy(() -> roomService.removeRoom(roomId))
                    .isInstanceOf(RoomNotFoundException.class)
                    .hasMessage("Room not found: " + roomId);

            verify(reservationRepository, never()).cancelAndDetachByRoomId(any());
            verify(roomRepository, never()).deleteById(any());
        }
    }

    @Nested
    @DisplayName("Aktualizowanie sali")
    class AktualizowanieSali {

        @Test
        @DisplayName("Sukces: Pomyślna pełna aktualizacja wszystkich pól sali")
        void shouldUpdateRoomFieldsSuccessfully() {
            UUID roomId = UUID.randomUUID();
            Room existingRoom = new Room("Old Name", 10, RoomType.COMPUTER, "Old Building");
            existingRoom.setDescription("Old Desc");

            when(roomRepository.findById(roomId)).thenReturn(Optional.of(existingRoom));
            when(roomRepository.save(any(Room.class))).thenAnswer(invocation -> invocation.getArgument(0));

            UpdateRoomRequest request = new UpdateRoomRequest("New Name", "New Building", 20, "New Desc");
            Room result = roomService.updateRoom(roomId, request);

            assertThat(result.getName()).isEqualTo("New Name");
            assertThat(result.getBuildingName()).isEqualTo("New Building");
            assertThat(result.getCapacity()).isEqualTo(20);
            assertThat(result.getDescription()).isEqualTo("New Desc");
        }

        @Test
        @DisplayName("Sukces: Częściowa aktualizacja (wartości null w żądaniu nie nadpisują istniejących wartości)")
        void shouldOnlyUpdateNonNullFields() {
            UUID roomId = UUID.randomUUID();
            Room existingRoom = new Room("Old Name", 10, RoomType.COMPUTER, "Old Building");
            existingRoom.setDescription("Old Desc");

            when(roomRepository.findById(roomId)).thenReturn(Optional.of(existingRoom));
            when(roomRepository.save(any(Room.class))).thenAnswer(invocation -> invocation.getArgument(0));

            UpdateRoomRequest request = new UpdateRoomRequest(null, null, 15, null);
            Room result = roomService.updateRoom(roomId, request);

            assertThat(result.getName()).isEqualTo("Old Name");
            assertThat(result.getBuildingName()).isEqualTo("Old Building");
            assertThat(result.getCapacity()).isEqualTo(15);
            assertThat(result.getDescription()).isEqualTo("Old Desc");
        }

        @Test
        @DisplayName("Błąd: Rzucenie wyjątku RoomNotFoundException przy próbie aktualizacji nieistniejącej sali")
        void shouldThrowRoomNotFoundWhenUpdatingNonExistentRoom() {
            UUID roomId = UUID.randomUUID();
            when(roomRepository.findById(roomId)).thenReturn(Optional.empty());

            UpdateRoomRequest request = new UpdateRoomRequest("New Name", "New Building", 20, "New Desc");

            assertThatThrownBy(() -> roomService.updateRoom(roomId, request))
                    .isInstanceOf(RoomNotFoundException.class)
                    .hasMessage("Room not found: " + roomId);
        }
    }

    @Nested
    @DisplayName("Pobieranie i listowanie sal")
    class PobieranieIListowanieSali {

        @Test
        @DisplayName("Sukces: Pomyślne pobranie sali po ID")
        void shouldGetRoomByIdSuccessfully() {
            UUID roomId = UUID.randomUUID();
            Room room = new Room("Room A", 30, RoomType.LECTURE, "Building 1");
            when(roomRepository.findById(roomId)).thenReturn(Optional.of(room));

            Room result = roomService.getRoom(roomId);

            assertThat(result.getName()).isEqualTo("Room A");
            assertThat(result.getCapacity()).isEqualTo(30);
        }

        @Test
        @DisplayName("Błąd: Rzucenie wyjątku RoomNotFoundException przy próbie pobrania nieistniejącej sali")
        void shouldThrowRoomNotFoundWhenGettingNonExistentRoom() {
            UUID roomId = UUID.randomUUID();
            when(roomRepository.findById(roomId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> roomService.getRoom(roomId))
                    .isInstanceOf(RoomNotFoundException.class)
                    .hasMessage("Room not found: " + roomId);
        }

        @Test
        @SuppressWarnings("unchecked")
        @DisplayName("Sukces: Pomyślne listowanie sal na podstawie zadanych filtrów")
        void shouldListRoomsSuccessfully() {
            Room room1 = new Room("Room 1", 10, RoomType.LECTURE, "Building 1");
            Room room2 = new Room("Room 2", 20, RoomType.COMPUTER, "Building 2");

            when(roomRepository.findAll(any(Specification.class))).thenReturn(List.of(room1, room2));

            List<Room> result = roomService.listRooms(RoomType.LECTURE, "Building 1", 10, 20);

            assertThat(result).hasSize(2);
            verify(roomRepository, times(1)).findAll(any(Specification.class));
        }
    }
}
