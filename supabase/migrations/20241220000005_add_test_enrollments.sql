-- Add test course enrollments for users
INSERT INTO user_courses (user_id, course_id, enrolled_at, status) VALUES 
('ccb1b0d3-9574-4728-9cac-0b9fee9f9c4b', '0c65a1fa-2dd9-4432-b28f-72350c8b356e', NOW(), 'active'),
('8e5df6a8-c8e3-482f-908a-ea138809f73a', '0c65a1fa-2dd9-4432-b28f-72350c8b356e', NOW(), 'active'),
('081a90a1-19e8-4c4c-8a51-5a31450a39b5', '0c65a1fa-2dd9-4432-b28f-72350c8b356e', NOW(), 'active');
