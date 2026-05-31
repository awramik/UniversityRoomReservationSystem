-- Passwords:
--   admin    → "admin"
--   lecturers → "teacher"
--   students  → "student"

INSERT INTO users (id, username, password, role, name, surname, email) VALUES
    ('aaaaaaaa-0000-0000-0000-000000000001', 'admin',    '$2a$10$gYdpIrtjswuKLbRK/ikqz.fzDi7wlDFvAdBcRHCMKnuN98llHvtF2', 'ADMIN',    NULL,      NULL,       'admin@university.edu'),
    ('aaaaaaaa-0000-0000-0000-000000000002', 'jsmith',   '$2a$10$IWMR9M1j7lbakeXvoMy7C.xUUy2wh5ndT1d7b/3oT4Ou4IgJq8E5S', 'LECTURER', 'John',    'Smith',    'john.smith@university.edu'),
    ('aaaaaaaa-0000-0000-0000-000000000003', 'awilson',  '$2a$10$IWMR9M1j7lbakeXvoMy7C.xUUy2wh5ndT1d7b/3oT4Ou4IgJq8E5S', 'LECTURER', 'Alice',   'Wilson',   'alice.wilson@university.edu'),
    ('aaaaaaaa-0000-0000-0000-000000000004', 'bkowalski','$2a$10$ue33g.BL4IUawfbYwSF50.39D0YdusiqtEH4jIjKaSw6GWzcKKvum', 'STUDENT',  'Bartosz', 'Kowalski', 'b.kowalski@university.edu'),
    ('aaaaaaaa-0000-0000-0000-000000000005', 'mnovak',   '$2a$10$ue33g.BL4IUawfbYwSF50.39D0YdusiqtEH4jIjKaSw6GWzcKKvum', 'STUDENT',  'Martin',  'Novak',    'm.novak@university.edu'),
    ('aaaaaaaa-0000-0000-0000-000000000006', 'student',  '$2a$10$ue33g.BL4IUawfbYwSF50.39D0YdusiqtEH4jIjKaSw6GWzcKKvum', 'STUDENT',  NULL,      NULL,       'student@university.edu');

INSERT INTO room (id, name, capacity, room_type, building_name, description) VALUES
    ('bbbbbbbb-0000-0000-0000-000000000001', 'A-101', 120, 'LECTURE',    'Building A', 'Large lecture hall with projector and whiteboard'),
    ('bbbbbbbb-0000-0000-0000-000000000002', 'A-201',  80, 'LECTURE',    'Building A', 'Medium lecture room with audio system'),
    ('bbbbbbbb-0000-0000-0000-000000000003', 'A-301', 200, 'LECTURE',    'Building A', 'Main auditorium, fixed seating'),
    ('bbbbbbbb-0000-0000-0000-000000000004', 'B-102',  30, 'LABORATORY', 'Building B', 'Chemistry lab with fume hoods and safety equipment'),
    ('bbbbbbbb-0000-0000-0000-000000000005', 'B-202',  25, 'LABORATORY', 'Building B', 'Physics lab with experimental apparatus'),
    ('bbbbbbbb-0000-0000-0000-000000000006', 'C-101',  40, 'COMPUTER',   'Building C', 'Computer lab with 40 Linux workstations'),
    ('bbbbbbbb-0000-0000-0000-000000000007', 'C-201',  35, 'COMPUTER',   'Building C', 'Computer lab with Windows workstations'),
    ('bbbbbbbb-0000-0000-0000-000000000008', 'D-100',  20, 'CONFERENCE', 'Building D', 'Conference room with projector and video conferencing');

INSERT INTO reservation (id, room_id, start_time, end_time, booker_name, purpose, type, status) VALUES
    -- Past reservations
    ('cccccccc-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', '2026-05-20 09:00:00', '2026-05-20 11:00:00', 'bkowalski', 'Mathematics lecture review',    'BOOKING',     'PAST'),
    ('cccccccc-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000006', '2026-05-22 10:00:00', '2026-05-22 12:00:00', 'mnovak',    'Programming project session',   'BOOKING',     'PAST'),
    ('cccccccc-0000-0000-0000-000000000003', 'bbbbbbbb-0000-0000-0000-000000000004', '2026-05-25 14:00:00', '2026-05-25 16:00:00', 'jsmith',    'Chemistry experiment',           'BOOKING',     'PAST'),
    ('cccccccc-0000-0000-0000-000000000004', 'bbbbbbbb-0000-0000-0000-000000000008', '2026-05-28 13:00:00', '2026-05-28 15:00:00', 'awilson',   'Department meeting',            'BOOKING',     'PAST'),
    -- Active (upcoming) reservations
    ('cccccccc-0000-0000-0000-000000000005', 'bbbbbbbb-0000-0000-0000-000000000001', '2026-06-02 09:00:00', '2026-06-02 11:00:00', 'bkowalski', 'Mathematics exam preparation',  'BOOKING',     'ACTIVE'),
    ('cccccccc-0000-0000-0000-000000000006', 'bbbbbbbb-0000-0000-0000-000000000004', '2026-06-05 10:00:00', '2026-06-05 14:00:00', 'jsmith',    'Advanced chemistry lab',        'BOOKING',     'ACTIVE'),
    ('cccccccc-0000-0000-0000-000000000007', 'bbbbbbbb-0000-0000-0000-000000000007', '2026-06-10 08:00:00', '2026-06-10 10:00:00', 'mnovak',    'Final project development',     'BOOKING',     'ACTIVE'),
    ('cccccccc-0000-0000-0000-000000000008', 'bbbbbbbb-0000-0000-0000-000000000008', '2026-06-12 15:00:00', '2026-06-12 17:00:00', 'awilson',   'Faculty meeting',               'BOOKING',     'ACTIVE'),
    ('cccccccc-0000-0000-0000-000000000009', 'bbbbbbbb-0000-0000-0000-000000000002', '2026-06-15 11:00:00', '2026-06-15 13:00:00', 'bkowalski', 'Physics lecture attendance',    'BOOKING',     'ACTIVE'),
    ('cccccccc-0000-0000-0000-000000000010', 'bbbbbbbb-0000-0000-0000-000000000003', '2026-06-20 09:00:00', '2026-06-20 12:00:00', 'admin',     'Exam period hall block',        'ADMIN_BLOCK', 'ACTIVE'),
    -- Cancelled reservations
    ('cccccccc-0000-0000-0000-000000000011', 'bbbbbbbb-0000-0000-0000-000000000006', '2026-06-08 14:00:00', '2026-06-08 16:00:00', 'student',   'Study session',                 'BOOKING',     'CANCELLED'),
    ('cccccccc-0000-0000-0000-000000000012', 'bbbbbbbb-0000-0000-0000-000000000005', '2026-05-30 10:00:00', '2026-05-30 12:00:00', 'mnovak',    'Physics lab practical',         'BOOKING',     'CANCELLED');
