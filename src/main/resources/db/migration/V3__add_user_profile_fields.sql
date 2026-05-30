ALTER TABLE users
    ADD COLUMN name    VARCHAR(100)  NULL,
    ADD COLUMN surname VARCHAR(100)  NULL,
    ADD COLUMN email   VARCHAR(255)  NULL;

UPDATE users SET email = 'admin@university.edu'   WHERE username = 'admin';
UPDATE users SET email = 'student@university.edu' WHERE username = 'student';
UPDATE users SET email = 'teacher@university.edu' WHERE username = 'teacher';

ALTER TABLE users
    MODIFY COLUMN email VARCHAR(255) NOT NULL,
    ADD UNIQUE KEY uk_users_email (email);
