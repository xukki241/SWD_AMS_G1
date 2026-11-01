-- Google Classroom parity: optional room on class offerings
ALTER TABLE subject_classes
    ADD COLUMN room VARCHAR(100);
