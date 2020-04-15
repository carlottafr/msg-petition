DROP TABLE IF EXISTS signatures;

CREATE TABLE signatures (
    id SERIAL PRIMARY KEY,
    signature TEXT NOT NULL CHECK (signature != ''),
    user_id INTEGER NOT NULL REFERENCES users(id),
    ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- How to return values with INSERT:
-- INSERT INTO signatures (first, last, signature)
-- VALUES ($1, $2, $3)
-- RETURNING id;