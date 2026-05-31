SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS reservation;
DROP TABLE IF EXISTS room;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
    id       CHAR(36)      NOT NULL PRIMARY KEY,
    username VARCHAR(100)  NOT NULL UNIQUE,
    password VARCHAR(255)  NOT NULL,
    role     VARCHAR(20)   NOT NULL,
    name     VARCHAR(100)  NULL,
    surname  VARCHAR(100)  NULL,
    email    VARCHAR(255)  NOT NULL UNIQUE
);

CREATE TABLE room (
    id            CHAR(36)      NOT NULL PRIMARY KEY,
    name          VARCHAR(100)  NOT NULL,
    capacity      INT           NOT NULL,
    room_type     VARCHAR(50)   NOT NULL,
    building_name VARCHAR(100)  NOT NULL,
    description   TEXT          NULL
);

CREATE TABLE reservation (
    id          CHAR(36)      NOT NULL PRIMARY KEY,
    room_id     CHAR(36)      NOT NULL,
    start_time  DATETIME(6)   NOT NULL,
    end_time    DATETIME(6)   NOT NULL,
    booker_name VARCHAR(100)  NOT NULL,
    type        VARCHAR(20)   NOT NULL DEFAULT 'BOOKING',
    purpose     VARCHAR(255)  NULL,
    CONSTRAINT fk_reservation_room FOREIGN KEY (room_id) REFERENCES room (id),
    CONSTRAINT chk_reservation_times CHECK (end_time > start_time),
    INDEX idx_reservation_overlap (room_id, start_time, end_time)
);
