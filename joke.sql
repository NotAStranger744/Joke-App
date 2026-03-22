-- 1. Create and use the database
CREATE DATABASE IF NOT EXISTS joke_db;
USE joke_db;

-- 2. Create the 'types' table
-- The UNIQUE constraint satisfies the brief's requirement: "types’ table should not allow duplicate entries"
CREATE TABLE IF NOT EXISTS types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- 3. Create the 'jokes' table
-- The FOREIGN KEY establishes the relationship between jokes and types
CREATE TABLE IF NOT EXISTS jokes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type_id INT NOT NULL,
    setup TEXT NOT NULL,
    punchline TEXT NOT NULL,
    FOREIGN KEY (type_id) REFERENCES types(id) ON DELETE CASCADE
);

-- 4. Insert starter types
INSERT IGNORE INTO types (name) VALUES 
('dad'), 
('programming'), 
('general'), 
('knock-knock');

-- 5. Insert a starter joke
-- This finds the ID for 'programming' and inserts the joke under that ID
INSERT INTO jokes (type_id, setup, punchline) 
VALUES (
    (SELECT id FROM types WHERE name = 'programming'), 
    'Why do programmers prefer dark mode?', 
    'Because light attracts bugs.'
);