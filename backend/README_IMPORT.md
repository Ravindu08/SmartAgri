# Importing the database and restoring from dump

This file explains how to restore the provided Postgres dump and how to export/import to/from MySQL if needed.

Postgres restore (from `backend/exports/smartagri.dump`):

1. Ensure Postgres is running on the target machine.
2. Create the database and user if necessary:

```bash
# create DB and user (adjust as needed)
psql -U postgres -c "CREATE DATABASE smartagri;"
psql -U postgres -c "CREATE USER smartagri_user WITH PASSWORD 'yourpassword';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE smartagri TO smartagri_user;"
```

3. Restore the custom-format dump:

```bash
# from the repo root
cd backend
export PGPASSWORD="<db_password>"   # Linux/macOS
# or on Windows PowerShell: $env:PGPASSWORD = "<db_password>"
pg_restore -h <host> -p <port> -U <user> -d smartagri -v exports/smartagri.dump
```

4. Update `backend/.env` or environment variables on the target with the correct `DATABASE_URL`.

Exporting to MySQL (migration):

- Direct binary-compatible export from Postgres to MySQL is not available. To migrate, you can:
  - Use `pg_dump --data-only --inserts` and transform SQL, or
  - Use tools like `pgloader` (`pgloader postgresql://... mysql://...`) which automates schema and data conversion, or
  - Export CSVs per-table and import into MySQL.

Quick `pgloader` example:

```bash
pgloader postgresql://postgres:123456@localhost:5432/smartagri mysql://root:rootpassword@127.0.0.1/smartagri
```

Notes:
- Keep `SECRET_KEY` and admin passwords out of repo when sharing publicly. Use `.env.example` as a guide.
- If you hand this repo ZIP to someone, include `backend/exports/smartagri.dump` and instruct them to follow the steps above.
