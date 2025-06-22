# Database Setup and Management

This directory contains the database configuration, models, and migration scripts for the TrinetraSec application.

## Database Configuration

The database configuration is managed through environment variables. Copy `.env.example` to `.env` and update the following variables:

```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/trinetra
DATABASE_TEST_URL=postgresql+asyncpg://user:password@localhost:5432/trinetra_test
DB_POOL_SIZE=5
DB_MAX_OVERFLOW=10
```

## Models

The database models are defined in `core/database/models.py`. The main models include:

- `User`: User accounts with authentication details
- `Session`: Active user sessions
- `AuditLog`: System audit trail

## Migrations

Database migrations are managed using Alembic. To create and apply migrations:

1. Install the development dependencies:
   ```bash
   pip install -r requirements-dev.txt
   ```

2. Create a new migration:
   ```bash
   python -m scripts.migrate create "Your migration message"
   ```

3. Apply pending migrations:
   ```bash
   python -m scripts.migrate upgrade
   ```

4. Rollback the last migration:
   ```bash
   python -m scripts.migrate downgrade
   ```

5. Check migration status:
   ```bash
   python -m scripts.migrate status
   ```

## Initial Setup

To initialize the database and create the first admin user:

```bash
python -m scripts.init_db
```

This will:
1. Create all database tables
2. Prompt you to create an admin user
3. Set up the initial database schema

## Development Workflow

1. Make changes to the models in `core/database/models.py`
2. Generate a new migration:
   ```bash
   python -m scripts.migrate create "Your migration message"
   ```
3. Review the generated migration file in `migrations/versions/`
4. Apply the migration:
   ```bash
   python -m scripts.migrate upgrade
   ```
5. Test your changes

## Testing

To run the test suite:

```bash
pytest tests/
```

## Production Deployment

In production, make sure to:

1. Set appropriate connection pool sizes
2. Enable SQL query logging in development only
3. Use SSL for database connections
4. Regularly back up your database
5. Monitor database performance

## Troubleshooting

### Database Connection Issues

- Verify the database server is running
- Check connection string in `.env`
- Ensure the database user has the correct permissions
- Check for firewall rules blocking the connection

### Migration Issues

- If migrations fail, check the logs for specific errors
- You may need to manually fix the migration or rollback
- Never delete migration files from the `migrations/versions/` directory

## Backup and Restore

### Backup

```bash
pg_dump -U username -d dbname > backup.sql
```

### Restore

```bash
psql -U username -d dbname < backup.sql
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
