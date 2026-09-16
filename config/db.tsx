import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

const dbUrl = process.env.DATABASE_URL || "postgresql://placeholder:placeholder@localhost:5432/indiedev_db";
const sql = neon(dbUrl);
export const db = drizzle(sql);
