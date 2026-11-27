-- Local runtime identity is deliberately separate from the migration owner.
CREATE ROLE lumie_app LOGIN PASSWORD 'lumie_local_password' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
GRANT CONNECT ON DATABASE lumie_local TO lumie_app;
GRANT USAGE ON SCHEMA public TO lumie_app;
GRANT SELECT, INSERT, UPDATE ON profiles TO lumie_app;
GRANT SELECT, INSERT, UPDATE ON creations TO lumie_app;
GRANT SELECT, INSERT ON creation_revisions TO lumie_app;
GRANT SELECT, INSERT, UPDATE ON assets TO lumie_app;

GRANT SELECT, INSERT, UPDATE ON correspondence_threads TO lumie_app;
GRANT SELECT, INSERT, UPDATE ON correspondence_participants TO lumie_app;
GRANT SELECT, INSERT ON correspondence_messages TO lumie_app;
GRANT SELECT, INSERT ON asset_thread_grants TO lumie_app;
