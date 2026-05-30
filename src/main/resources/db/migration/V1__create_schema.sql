CREATE TABLE users (
    id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100)  NOT NULL UNIQUE,
    password VARCHAR(255)  NOT NULL,
    role     VARCHAR(20)   NOT NULL
);

CREATE TABLE room (
    id        BIGINT AUTO_INCREMENT PRIMARY KEY,
    name      VARCHAR(100) NOT NULL,
    capacity  INT          NOT NULL,
    room_type VARCHAR(50)  NOT NULL,
    available BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE TABLE reservation (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    room_id     BIGINT       NOT NULL,
    user_id     BIGINT       NULL,
    start_time  DATETIME(6)  NOT NULL,
    end_time    DATETIME(6)  NOT NULL,
    booker_name VARCHAR(100) NOT NULL,
    CONSTRAINT fk_reservation_room FOREIGN KEY (room_id) REFERENCES room (id),
    CONSTRAINT fk_reservation_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT chk_reservation_times CHECK (end_time > start_time),
    INDEX idx_reservation_overlap (room_id, start_time, end_time)
);
