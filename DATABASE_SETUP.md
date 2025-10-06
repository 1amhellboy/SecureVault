# PostgreSQL Database Setup for SecureVault

This document provides comprehensive instructions for setting up and configuring PostgreSQL database for the SecureVault application.

## Prerequisites

- PostgreSQL 12+ installed and running
- Node.js 18+ with TypeScript support
- Access to create databases and users in PostgreSQL

## Quick Start

### 1. Environment Configuration

Create a `.env.local` file in the project root with the following variables:

```env
# PostgreSQL Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/secure_vault

# Alternative individual connection parameters (if not using DATABASE_URL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=secure_vault
DB_USER=username
DB_PASSWORD=password

# JWT Secret for authentication
SESSION_SECRET=your-super-secret-jwt-key-change-in-production

# Environment
NODE_ENV=development
```

### 2. Database Setup

#### Option A: Using the Setup Script (Recommended)

```bash
# Install dependencies
npm install

# Run the database setup script
npx tsx scripts/setup-db.ts
```

#### Option B: Manual Setup

1. **Create Database and User:**
   ```sql
   -- Connect to PostgreSQL as superuser
   psql -U postgres
   
   -- Create database
   CREATE DATABASE secure_vault;
   
   -- Create user (optional, you can use existing user)
   CREATE USER vault_user WITH PASSWORD 'your_secure_password';
   
   -- Grant privileges
   GRANT ALL PRIVILEGES ON DATABASE secure_vault TO vault_user;
   ```

2. **Initialize Database:**
   ```bash
   # Start the application to trigger database initialization
   npm run dev
   
   # Or call the init endpoint directly
   curl http://localhost:5000/api/init
   ```

### 3. Verify Installation

Check database health:
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": {
    "connected": true,
    "tables": ["migrations", "user_sessions", "users", "vault_items"],
    "lastCheck": "2024-01-01T00:00:00.000Z"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Database Schema

### Tables

#### `users`
- `id` (SERIAL PRIMARY KEY)
- `email` (VARCHAR(255) UNIQUE NOT NULL)
- `password_hash` (VARCHAR(255) NOT NULL)
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- `last_login` (TIMESTAMP)
- `is_active` (BOOLEAN DEFAULT TRUE)

#### `vault_items`
- `id` (SERIAL PRIMARY KEY)
- `user_id` (INTEGER REFERENCES users(id) ON DELETE CASCADE)
- `encrypted_title` (TEXT NOT NULL)
- `encrypted_username` (TEXT)
- `encrypted_password` (TEXT NOT NULL)
- `encrypted_url` (TEXT)
- `encrypted_notes` (TEXT)
- `category` (VARCHAR(100) DEFAULT 'General')
- `is_favorite` (BOOLEAN DEFAULT FALSE)
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

#### `user_sessions`
- `id` (SERIAL PRIMARY KEY)
- `user_id` (INTEGER REFERENCES users(id) ON DELETE CASCADE)
- `token_hash` (VARCHAR(255) NOT NULL)
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- `expires_at` (TIMESTAMP NOT NULL)
- `is_active` (BOOLEAN DEFAULT TRUE)

#### `migrations`
- `version` (INTEGER PRIMARY KEY)
- `name` (VARCHAR(255) NOT NULL)
- `executed_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

### Indexes

- `idx_vault_items_user_id` - For fast user vault queries
- `idx_vault_items_category` - For category filtering
- `idx_vault_items_created_at` - For sorting by creation date
- `idx_user_sessions_user_id` - For user session queries
- `idx_user_sessions_token_hash` - For token validation
- `idx_user_sessions_expires_at` - For session cleanup

## API Endpoints

### Database Management

- `GET /api/health` - Database health check
- `GET /api/init` - Initialize database schema
- `GET /api/migrations` - Get migration status
- `POST /api/migrations` - Run migrations or rollback

### Authentication

- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Vault Operations

- `GET /api/vault` - Get user's vault items (supports ?category= and ?search=)
- `POST /api/vault` - Create new vault item
- `GET /api/vault/[id]` - Get specific vault item
- `PUT /api/vault/[id]` - Update vault item
- `DELETE /api/vault/[id]` - Delete vault item
- `GET /api/vault/categories` - Get user's categories

## Migration Management

### Running Migrations

```bash
# Run all pending migrations
curl -X POST http://localhost:5000/api/migrations \
  -H "Content-Type: application/json" \
  -d '{"action": "migrate"}'
```

### Rolling Back Migrations

```bash
# Rollback to specific version
curl -X POST http://localhost:5000/api/migrations \
  -H "Content-Type: application/json" \
  -d '{"action": "rollback", "targetVersion": 1}'
```

### Check Migration Status

```bash
curl http://localhost:5000/api/migrations
```

## Database Utilities

The application includes comprehensive database utilities in `lib/db-utils.ts`:

- `UserDB` - User management operations
- `VaultItemDB` - Vault item operations with search and filtering
- `SessionDB` - Session management
- `DatabaseError` - Custom error handling

## Connection Pooling

The application uses PostgreSQL connection pooling with the following configuration:

- **Max connections**: 20
- **Idle timeout**: 30 seconds
- **Connection timeout**: 2 seconds
- **SSL**: Enabled in production

## Security Considerations

1. **Environment Variables**: Never commit `.env.local` to version control
2. **Database Credentials**: Use strong passwords and limit user privileges
3. **SSL**: Enable SSL in production environments
4. **Connection String**: Use `DATABASE_URL` for production deployments
5. **Session Management**: Tokens are hashed before storage

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Verify PostgreSQL is running
   - Check host and port configuration
   - Ensure database exists

2. **Authentication Failed**
   - Verify username and password
   - Check user privileges
   - Ensure user can connect to the database

3. **Migration Errors**
   - Check database permissions
   - Verify migration files are valid
   - Check for conflicting schema changes

### Debug Mode

Enable detailed logging by setting:
```env
NODE_ENV=development
```

### Health Check

Monitor database health:
```bash
# Check connection
curl http://localhost:5000/api/health

# Check migrations
curl http://localhost:5000/api/migrations
```

## Production Deployment

### Environment Variables

```env
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
NODE_ENV=production
SESSION_SECRET=your-super-secure-jwt-secret
```

### Database Setup

1. Create production database
2. Set up SSL certificates
3. Configure connection pooling
4. Set up monitoring and backups
5. Run migrations

### Monitoring

- Monitor connection pool usage
- Set up database performance monitoring
- Configure alerts for connection failures
- Regular backup verification

## Support

For issues related to database setup or configuration, please check:

1. This documentation
2. Application logs
3. Database logs
4. Health check endpoints

The database implementation follows PostgreSQL best practices and includes comprehensive error handling and logging.
