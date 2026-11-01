-- Optional topic for Google Classroom-style classwork grouping
ALTER TABLE assignments
    ADD COLUMN topic VARCHAR(120);

-- Seed demo topics for existing assignments
UPDATE assignments SET topic = 'Đồ án môn học' WHERE id IN (1, 2, 3, 4);
UPDATE assignments SET topic = 'Chuyên đề 1' WHERE id IN (5, 6, 7);
UPDATE assignments SET topic = 'Bài tập thực hành' WHERE id IN (8, 9, 10);
