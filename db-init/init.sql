CREATE DATABASE IF NOT EXISTS joke_db;
USE joke_db;

-- create table of joke categories
CREATE TABLE IF NOT EXISTS types (
    id INT AUTO_INCREMENT PRIMARY KEY, -- auto id system
    name VARCHAR(50) NOT NULL UNIQUE
);

-- create jokes table
CREATE TABLE IF NOT EXISTS jokes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type_id INT NOT NULL,
    setup TEXT NOT NULL,
    punchline TEXT NOT NULL,
    FOREIGN KEY (type_id) REFERENCES types(id) ON DELETE CASCADE -- connect to category table
);

-- make some default classes
INSERT IGNORE INTO types (name) VALUES 
('dad'), 
('programming'), 
('general'), 
('knock-knock');

-- makes an example joke
INSERT INTO jokes (type_id, setup, punchline) 
VALUES (
    (SELECT id FROM types WHERE name = 'programming'), 
    'Why do programmers prefer dark mode?', 
    'Because light attracts bugs.'
);