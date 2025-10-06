import { QueryResult, PoolClient } from 'pg';
import getPool from './db';

// Database error types
export class DatabaseError extends Error {
  constructor(message: string, public code?: string, public detail?: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

// User-related database operations
export class UserDB {
  static async create(
    email: string, 
    passwordHash: string, 
    client?: PoolClient
  ): Promise<{ id: number; email: string; created_at: Date }> {
    const queryText = `
      INSERT INTO users (email, password_hash) 
      VALUES ($1, $2) 
      RETURNING id, email, created_at
    `;
    
    try {
      const result = await (client || getPool()).query(queryText, [email, passwordHash]);
      return result.rows[0];
    } catch (error: any) {
      if (error.code === '23505') { // Unique violation
        throw new DatabaseError('Email already exists', 'EMAIL_EXISTS');
      }
      throw new DatabaseError('Failed to create user', error.code, error.detail);
    }
  }

  static async findByEmail(email: string, client?: PoolClient): Promise<{
    id: number;
    email: string;
    password_hash: string;
    created_at: Date;
    last_login: Date | null;
    is_active: boolean;
  } | null> {
    const queryText = `
      SELECT id, email, password_hash, created_at, last_login, is_active 
      FROM users 
      WHERE email = $1
    `;
    
    const result = await (client || getPool()).query(queryText, [email]);
    return result.rows[0] || null;
  }

  static async findById(id: number, client?: PoolClient): Promise<{
    id: number;
    email: string;
    created_at: Date;
    last_login: Date | null;
    is_active: boolean;
  } | null> {
    const queryText = `
      SELECT id, email, created_at, last_login, is_active 
      FROM users 
      WHERE id = $1
    `;
    
    const result = await (client || getPool()).query(queryText, [id]);
    return result.rows[0] || null;
  }

  static async updateLastLogin(userId: number, client?: PoolClient): Promise<void> {
    const queryText = `
      UPDATE users 
      SET last_login = CURRENT_TIMESTAMP 
      WHERE id = $1
    `;
    
    await (client || getPool()).query(queryText, [userId]);
  }

  static async deactivate(userId: number, client?: PoolClient): Promise<void> {
    const queryText = `
      UPDATE users 
      SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1
    `;
    
    await (client || getPool()).query(queryText, [userId]);
  }
}

// Vault item database operations
export class VaultItemDB {
  static async create(
    userId: number,
    encryptedTitle: string,
    encryptedPassword: string,
    encryptedUsername?: string,
    encryptedUrl?: string,
    encryptedNotes?: string,
    category: string = 'General',
    client?: PoolClient
  ): Promise<{
    id: number;
    user_id: number;
    encrypted_title: string;
    encrypted_username: string | null;
    encrypted_password: string;
    encrypted_url: string | null;
    encrypted_notes: string | null;
    category: string;
    is_favorite: boolean;
    created_at: Date;
    updated_at: Date;
  }> {
    const queryText = `
      INSERT INTO vault_items (
        user_id, encrypted_title, encrypted_username, encrypted_password, 
        encrypted_url, encrypted_notes, category
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *
    `;
    
    const result = await (client || getPool()).query(queryText, [
      userId, encryptedTitle, encryptedUsername, encryptedPassword,
      encryptedUrl, encryptedNotes, category
    ]);
    
    return result.rows[0];
  }

  static async findByUserId(
    userId: number, 
    category?: string,
    client?: PoolClient
  ): Promise<Array<{
    id: number;
    encrypted_title: string;
    encrypted_username: string | null;
    encrypted_password: string;
    encrypted_url: string | null;
    encrypted_notes: string | null;
    category: string;
    is_favorite: boolean;
    created_at: Date;
    updated_at: Date;
  }>> {
    let queryText = `
      SELECT * FROM vault_items 
      WHERE user_id = $1
    `;
    const params: any[] = [userId];
    
    if (category) {
      queryText += ' AND category = $2';
      params.push(category);
    }
    
    queryText += ' ORDER BY created_at DESC';
    
    const result = await (client || getPool()).query(queryText, params);
    return result.rows;
  }

  static async findByIdAndUserId(
    id: number, 
    userId: number, 
    client?: PoolClient
  ): Promise<{
    id: number;
    user_id: number;
    encrypted_title: string;
    encrypted_username: string | null;
    encrypted_password: string;
    encrypted_url: string | null;
    encrypted_notes: string | null;
    category: string;
    is_favorite: boolean;
    created_at: Date;
    updated_at: Date;
  } | null> {
    const queryText = `
      SELECT * FROM vault_items 
      WHERE id = $1 AND user_id = $2
    `;
    
    const result = await (client || getPool()).query(queryText, [id, userId]);
    return result.rows[0] || null;
  }

  static async update(
    id: number,
    userId: number,
    updates: {
      encryptedTitle?: string;
      encryptedUsername?: string;
      encryptedPassword?: string;
      encryptedUrl?: string;
      encryptedNotes?: string;
      category?: string;
      isFavorite?: boolean;
    },
    client?: PoolClient
  ): Promise<{
    id: number;
    user_id: number;
    encrypted_title: string;
    encrypted_username: string | null;
    encrypted_password: string;
    encrypted_url: string | null;
    encrypted_notes: string | null;
    category: string;
    is_favorite: boolean;
    created_at: Date;
    updated_at: Date;
  } | null> {
    const setClause: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        setClause.push(`${dbKey} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (setClause.length === 0) {
      throw new DatabaseError('No fields to update');
    }

    setClause.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id, userId);

    const queryText = `
      UPDATE vault_items 
      SET ${setClause.join(', ')} 
      WHERE id = $${paramCount} AND user_id = $${paramCount + 1} 
      RETURNING *
    `;

    const result = await (client || getPool()).query(queryText, values);
    return result.rows[0] || null;
  }

  static async delete(id: number, userId: number, client?: PoolClient): Promise<boolean> {
    const queryText = `
      DELETE FROM vault_items 
      WHERE id = $1 AND user_id = $2
    `;
    
    const result = await (client || getPool()).query(queryText, [id, userId]);
    return result.rowCount > 0;
  }

  static async getCategories(userId: number, client?: PoolClient): Promise<string[]> {
    const queryText = `
      SELECT DISTINCT category 
      FROM vault_items 
      WHERE user_id = $1 AND category IS NOT NULL
      ORDER BY category
    `;
    
    const result = await (client || getPool()).query(queryText, [userId]);
    return result.rows.map(row => row.category);
  }

  static async search(
    userId: number, 
    searchTerm: string, 
    client?: PoolClient
  ): Promise<Array<{
    id: number;
    encrypted_title: string;
    encrypted_username: string | null;
    encrypted_password: string;
    encrypted_url: string | null;
    encrypted_notes: string | null;
    category: string;
    is_favorite: boolean;
    created_at: Date;
    updated_at: Date;
  }>> {
    const queryText = `
      SELECT * FROM vault_items 
      WHERE user_id = $1 
      AND (
        encrypted_title ILIKE $2 
        OR encrypted_username ILIKE $2 
        OR encrypted_url ILIKE $2 
        OR encrypted_notes ILIKE $2
      )
      ORDER BY created_at DESC
    `;
    
    const result = await (client || getPool()).query(queryText, [userId, `%${searchTerm}%`]);
    return result.rows;
  }
}

// Session management
export class SessionDB {
  static async create(
    userId: number,
    tokenHash: string,
    expiresAt: Date,
    client?: PoolClient
  ): Promise<void> {
    const queryText = `
      INSERT INTO user_sessions (user_id, token_hash, expires_at) 
      VALUES ($1, $2, $3)
    `;
    
    await (client || getPool()).query(queryText, [userId, tokenHash, expiresAt]);
  }

  static async findByTokenHash(
    tokenHash: string, 
    client?: PoolClient
  ): Promise<{
    id: number;
    user_id: number;
    created_at: Date;
    expires_at: Date;
    is_active: boolean;
  } | null> {
    const queryText = `
      SELECT * FROM user_sessions 
      WHERE token_hash = $1 AND is_active = TRUE AND expires_at > CURRENT_TIMESTAMP
    `;
    
    const result = await (client || getPool()).query(queryText, [tokenHash]);
    return result.rows[0] || null;
  }

  static async deactivateByTokenHash(tokenHash: string, client?: PoolClient): Promise<void> {
    const queryText = `
      UPDATE user_sessions 
      SET is_active = FALSE 
      WHERE token_hash = $1
    `;
    
    await (client || getPool()).query(queryText, [tokenHash]);
  }

  static async deactivateByUserId(userId: number, client?: PoolClient): Promise<void> {
    const queryText = `
      UPDATE user_sessions 
      SET is_active = FALSE 
      WHERE user_id = $1
    `;
    
    await (client || getPool()).query(queryText, [userId]);
  }

  static async cleanupExpired(client?: PoolClient): Promise<number> {
    const queryText = `
      DELETE FROM user_sessions 
      WHERE expires_at < CURRENT_TIMESTAMP
    `;
    
    const result = await (client || getPool()).query(queryText);
    return result.rowCount;
  }
}

// Database health check
export async function getDatabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  details: {
    connection: boolean;
    tables: string[];
    lastCheck: Date;
  };
}> {
  const client = await getPool().connect();
  try {
    // Test connection
    await client.query('SELECT NOW()');
    
    // Check if tables exist
    const tableResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'vault_items', 'user_sessions', 'migrations')
      ORDER BY table_name
    `);
    
    const tables = tableResult.rows.map(row => row.table_name);
    
    return {
      status: 'healthy',
      details: {
        connection: true,
        tables,
        lastCheck: new Date()
      }
    };
  } catch (error) {
    console.error('Health check error:', error);
    return {
      status: 'unhealthy',
      details: {
        connection: false,
        tables: [],
        lastCheck: new Date()
      }
    };
  } finally {
    client.release();
  }
}
