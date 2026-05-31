package com.university.room_reservation.model;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(length = 36)
    private UUID id;

    @ManyToOne
    private Room room;

    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String bookerName;
    private String purpose;

    @Enumerated(EnumType.STRING)
    private ReservationType type;

    public Reservation() {}

    public Reservation(Room room, LocalDateTime startTime, LocalDateTime endTime, String bookerName, ReservationType type, String purpose) {
        this.room = room;
        this.startTime = startTime;
        this.endTime = endTime;
        this.bookerName = bookerName;
        this.type = type;
        this.purpose = purpose;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public Room getRoom() { return room; }
    public void setRoom(Room room) { this.room = room; }
    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }
    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }
    public String getBookerName() { return bookerName; }
    public void setBookerName(String bookerName) { this.bookerName = bookerName; }
    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }
    public ReservationType getType() { return type; }
    public void setType(ReservationType type) { this.type = type; }
}
