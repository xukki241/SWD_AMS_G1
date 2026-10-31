-- Lower the paid-class registration fee from 5,000,000 to 50,000 VND so the
-- demo is cheaper to test. Free classes (fee = 0) and the 2.5M/1.5M/2.5M
-- classes are intentionally left untouched.

UPDATE subject_classes
SET registration_fee = 50000
WHERE registration_fee = 5000000;

-- Keep the system default in sync with the new fee
-- (column names follow the schema: configuration_name / business_value).
UPDATE system_configurations
SET business_value = '50000'
WHERE configuration_name = 'registration.fee.default';
