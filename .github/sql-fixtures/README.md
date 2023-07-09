## Database fixtures backup

At some point the fixtures may have become obsolete due to changes in the database model, requiring the database to be regenerated again.

### Steps

To regenerate the `fixtures.sql` file:

1. Add this variable to your python .env
   ```
   TAIGA_SECRET_KEY="secret"
   ```
2. Follow the python guide and regenerate the database.
   For example, go to `taiga/python/apps/taiga` and run:
   ```
   ./scripts/regenerate_devel_env.sh -yt
   ```
3. Change to the GitHub fixtures directory `taiga/.github/sql-fixtures`
4. Then, finally make the dump
   ```
   pg_dump -Fc -Z 9 --file=fixtures.sql taiga
   ```
