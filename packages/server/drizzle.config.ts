import "dotenv/config";
import type { Config } from "drizzle-kit";

const URL = process.env.DATABASE_URL!;

export default {
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: URL,
  },
  verbose: true,
  strict: true,
} satisfies Config;
