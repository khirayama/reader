-- RSS Reader Database Initialization
-- This file is executed when the PostgreSQL container starts for the first time

-- Create the main database (already created by POSTGRES_DB, but just in case)
-- CREATE DATABASE rss_reader;

-- Connect to the database
\c rss_reader;

-- Enable extensions if needed
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Note: Prisma will handle all table creation through migrations
-- This file is mainly for any initial setup or extensions