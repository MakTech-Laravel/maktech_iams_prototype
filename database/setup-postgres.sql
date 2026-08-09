-- One-time PostgreSQL setup for MakTech IAMS.
--
-- Creates a dedicated least-privilege role for the application instead of using the `postgres`
-- superuser, so a compromised app credential cannot administer the cluster.
--
-- Usage (from a terminal; psql will prompt for your postgres superuser password):
--
--   & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -v app_password="'YOUR_PASSWORD_HERE'" -f database/setup-postgres.sql
--
-- Then put the same password into .env as DB_PASSWORD.
-- Choose something long and random; it is never needed interactively.

-- The role the Laravel app connects as. LOGIN only — no CREATEDB, no SUPERUSER.
CREATE ROLE iams WITH LOGIN PASSWORD :app_password;

-- Application database, owned by that role so migrations can create and drop tables freely.
CREATE DATABASE iams WITH OWNER = iams ENCODING = 'UTF8';

-- Keep the role out of every other database's public schema.
REVOKE ALL ON DATABASE postgres FROM iams;

\connect iams

-- Postgres 15+ no longer grants CREATE on public to everyone; the owner needs it explicitly.
GRANT ALL ON SCHEMA public TO iams;
ALTER SCHEMA public OWNER TO iams;
