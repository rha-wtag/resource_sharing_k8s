
-- Create the 'user' table
CREATE TABLE IF NOT EXISTS "user" (
    user_id VARCHAR PRIMARY KEY,
    name VARCHAR,
    resources_uploaded VARCHAR,  -- This should ideally be normalized into a separate table
    password VARCHAR
);

-- Create the 'resources_details' table
CREATE TABLE IF NOT EXISTS "resources_details" (
    resource_id SERIAL PRIMARY KEY,
    name VARCHAR,
    mime_type VARCHAR,
    user_id VARCHAR REFERENCES "user"(user_id),
    created_at VARCHAR,
    attachment BYTEA  -- This field is used to store PDF files as binary data
);

-- Create the 'resources' table
CREATE TABLE IF NOT EXISTS "resources" (
    id SERIAL PRIMARY KEY,
    resource_id INT REFERENCES "resources_details"(resource_id),
    name VARCHAR
);