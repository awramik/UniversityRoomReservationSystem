CREATE TABLE users (
    id           CHAR(36)     NOT NULL,
    username     VARCHAR(100) NOT NULL,
    password     VARCHAR(255) NOT NULL,
    role         VARCHAR(20)  NOT NULL,
    name         VARCHAR(100),
    surname      VARCHAR(100),
    email        VARCHAR(255) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_users_username (username),
    UNIQUE KEY uk_users_email (email)
);

CREATE TABLE room (
    id            CHAR(36)     NOT NULL,
    name          VARCHAR(100) NOT NULL,
    capacity      INT          NOT NULL,
    room_type     VARCHAR(50)  NOT NULL,
    building_name VARCHAR(100) NOT NULL,
    description   TEXT,
    PRIMARY KEY (id)
);

CREATE TABLE reservation (
    id           CHAR(36)    NOT NULL,
    room_id      CHAR(36),
    start_time   DATETIME(6),
    end_time     DATETIME(6),
    booker_name  VARCHAR(255),
    purpose      VARCHAR(255),
    type         VARCHAR(255),
    status       VARCHAR(20)  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_reservation_room FOREIGN KEY (room_id) REFERENCES room (id)
);
