INSERT INTO users (id, username, password, role, email)
VALUES
    (UUID(), 'admin',   '$2a$10$gYdpIrtjswuKLbRK/ikqz.fzDi7wlDFvAdBcRHCMKnuN98llHvtF2', 'ADMIN',   'admin@university.edu'),
    (UUID(), 'student', '$2a$10$ue33g.BL4IUawfbYwSF50.39D0YdusiqtEH4jIjKaSw6GWzcKKvum', 'STUDENT', 'student@university.edu'),
    (UUID(), 'teacher', '$2a$10$IWMR9M1j7lbakeXvoMy7C.xUUy2wh5ndT1d7b/3oT4Ou4IgJq8E5S', 'LECTURER', 'teacher@university.edu');
