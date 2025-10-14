    -- This script runs after the container starts and 'teacherdb' is created.
    -- It creates the second database we need.
    CREATE DATABASE IF NOT EXISTS admindb;
    CREATE DATABASE IF NOT EXISTS teacherdb;

