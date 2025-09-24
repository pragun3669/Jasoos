-- Drop the table if it exists to ensure a clean start
DROP TABLE IF EXISTS teachers;

-- Recreate the table to match the Teacher entity
CREATE TABLE teachers (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;