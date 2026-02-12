import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as authSchema from './auth-schema';
const connectionString = process.env.DATABASE_URL || 'postgres://easymeal:easymeal_dev@localhost:5433/easymeal';
// For query purposes
const queryClient = postgres(connectionString);
export const db = drizzle(queryClient, { schema: { ...schema, ...authSchema } });
// Export schema for use in other modules
export * from './schema';
export * from './auth-schema';
