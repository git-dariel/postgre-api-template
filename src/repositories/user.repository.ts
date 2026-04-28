import { pool } from "../database/connection";
import type { User, CreateUserDTO, UpdateUserDTO } from "../models/user.model";

export class UserRepository {
  async findAll(): Promise<User[]> {
    const result = await pool.query<User>(
      `SELECT id, name, email, password, created_at, updated_at 
             FROM users
             ORDER BY created_at DESC`,
    );
    return result.rows;
  }

  async findById(id: string): Promise<User | null> {
    const result = await pool.query<User>(
      `SELECT id, name, email, password, created_at, updated_at 
             FROM users
             WHERE id = $1`,
      [id],
    );

    return result.rows[0] || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await pool.query<User>(
      `SELECT id, name, email, password, created_at, updated_at 
             FROM users
             WHERE email = $1`,
      [email],
    );

    return result.rows[0] || null;
  }

  async create(data: CreateUserDTO): Promise<User> {
    const result = await pool.query<User>(
      `INSERT INTO users (name, email, password)
        VALUES ($1, $2, $3)
        RETURNING id, name, email, password, created_at, updated_at`,
      [data.name, data.email, data.password],
    );

    return result.rows[0];
  }

  async update(id: string, data: UpdateUserDTO): Promise<User | null> {
    const existingUser = await this.findById(id);

    if (!existingUser) {
      return null;
    }

    const result = await pool.query<User>(
      `UPDATE users
        SET
         name = $1,
         email = $2,
         password = $3,
         updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING id, name, email, password, created_at, updated_at`,
      [
        data.name ?? existingUser.name,
        data.email ?? existingUser.email,
        data.password ?? existingUser.password,
        id,
      ],
    );

    return result.rows[0];
  }

  async delete(id: string): Promise<boolean> {
    const result = await pool.query(
      `DELETE users 
        WHERE id = $1`,
      [id],
    );

    return result.rowCount !== null && result.rowCount > 0;
  }
}
